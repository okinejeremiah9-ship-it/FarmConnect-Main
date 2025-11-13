import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// -------------------------------
// Utility Functions
// -------------------------------

// Haversine distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Normalize Postgres text[] OR CSV OR stringified arrays
function normalizeCategories(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }

  if (!raw || typeof raw !== "string") return [];

  let str = raw.trim();

  // Strip braces: "{A,B}"
  if (str.startsWith("{") && str.endsWith("}")) {
    str = str.slice(1, -1);
  }

  // Remove quotes inside: "{\"Tractor\", \"Operator\"}"
  str = str.replace(/"/g, "");

  return str
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Rating normalization
function normalizeRating(r: any) {
  if (r == null) return 0;
  if (typeof r === "number") return r;
  const parsed = parseFloat(r);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Safe coordinate parser
const parseCoord = (value: any) => {
  if (value === null || value === undefined) return null;
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

// -------------------------------
// Main Handler
// -------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);

    const farmerId = url.searchParams.get("farmer_id");

    let lat = parseCoord(url.searchParams.get("lat"));
    let lng = parseCoord(url.searchParams.get("lng"));

    const radius = parseFloat(url.searchParams.get("radius") || "50");
    const category = url.searchParams.get("category");
    const minRating = parseFloat(url.searchParams.get("min_rating") || "0");

    // -------------------------
    // Fallback: use farmer profile
    // -------------------------
    if ((lat == null || lng == null) && farmerId) {
      const { data: farmer } = await supabase
        .from("users")
        .select("latitude, longitude")
        .eq("id", farmerId)
        .maybeSingle();

      if (farmer?.latitude && farmer?.longitude) {
        lat = parseCoord(farmer.latitude);
        lng = parseCoord(farmer.longitude);
      }
    }

    // -------------------------
    // Fail if still invalid
    // -------------------------
    if (lat == null || lng == null) {
      throw new Error("Latitude and longitude are required");
    }

    // -------------------------
    // Fetch nearby providers
    // -------------------------
    const { data: rawProviders, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        business_name,
        contact_person,
        phone,
        email,
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

    const list = (rawProviders || []).map((p: any) => {
      const providerLat = parseCoord(p.latitude);
      const providerLng = parseCoord(p.longitude);

      const dist = calculateDistance(lat!, lng!, providerLat!, providerLng!);

      return {
        ...p,
        distance_km: Math.round(dist * 10) / 10,
        categories: normalizeCategories(p.service_categories),
        rating_value: normalizeRating(p.rating),
      };
    });

    // -------------------------
    // Apply filters
    // -------------------------
    const results = list
      .filter((p: any) => {
        if (p.distance_km > radius) return false;

        if (category && category !== "all") {
          if (
            !p.categories.some(
              (c: string) => c.toLowerCase() === category.toLowerCase()
            )
          ) {
            return false;
          }
        }

        if (minRating > 0 && p.rating_value < minRating) return false;

        return true;
      })
      .sort((a: any, b: any) => a.distance_km - b.distance_km);

    return new Response(
      JSON.stringify({
        success: true,
        providers: results,
        center: { lat, lng },
        radius,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || String(err),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
