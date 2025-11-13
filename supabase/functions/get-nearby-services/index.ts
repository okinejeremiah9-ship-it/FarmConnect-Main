import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Distance calculator
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Normalize service_categories (handles text[], string, null)
function normalizeCategories(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string")
    return raw.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

// Normalize rating (string or number)
function normalizeRating(r) {
  if (r == null) return 0;
  if (typeof r === "number") return r;
  const parsed = parseFloat(r);
  return Number.isNaN(parsed) ? 0 : parsed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);

    let lat = parseFloat(url.searchParams.get("lat") || "0");
    let lng = parseFloat(url.searchParams.get("lng") || "0");
    const radius = parseFloat(url.searchParams.get("radius") || "50");
    const category = url.searchParams.get("category");
    const minRating = parseFloat(url.searchParams.get("min_rating") || "0");

    // Fetch providers
    const { data: providers, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        business_name,
        contact_person,
        phone,
        latitude,
        longitude,
        service_categories,
        service_description,
        pricing_info,
        years_experience,
        rating,
        address,
        profile_pic
      `)
      .eq("role", "provider")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) throw new Error(error.message);

    const results = providers
      .map((p) => {
        const dist = calculateDistance(lat, lng, Number(p.latitude), Number(p.longitude));

        return {
          ...p,
          distance_km: Math.round(dist * 10) / 10,
          categories: normalizeCategories(p.service_categories),
          rating_value: normalizeRating(p.rating),
        };
      })
      .filter((p) => {
        if (p.distance_km > radius) return false;

        if (category && category !== "all") {
          const match = p.categories.some(
            (c) => c.toLowerCase() === category.toLowerCase()
          );
          if (!match) return false;
        }

        if (minRating > 0 && p.rating_value < minRating) return false;

        return true;
      })
      .sort((a, b) => a.distance_km - b.distance_km);

    return new Response(
      JSON.stringify({
        success: true,
        providers: results,
        center: { lat, lng },
        radius,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || String(err),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

