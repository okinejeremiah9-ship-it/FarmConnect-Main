import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Distance calculator (Haversine)
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

// Normalize service_categories (handles text[], Postgres '{...}', CSV)
function normalizeCategories(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof raw !== "string") return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Remove surrounding braces for Postgres array strings: {"A","B"}
  const withoutBraces =
    trimmed.startsWith("{") && trimmed.endsWith("}")
      ? trimmed.slice(1, -1)
      : trimmed;

  return withoutBraces
    .split(",")
    .map((segment) =>
      segment
        .replace(/^"/, "") // leading "
        .replace(/"$/, "") // trailing "
        .trim()
    )
    .filter(Boolean);
}

// Normalize rating (string or number)
function normalizeRating(r: unknown): number {
  if (r == null) return 0;
  if (typeof r === "number") return r;
  const parsed = parseFloat(String(r));
  return Number.isNaN(parsed) ? 0 : parsed;
}

Deno.serve(async (req: Request) => {
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

    const farmerId = url.searchParams.get("farmer_id") || null;

    const parseCoord = (value: string | null): number | null => {
      if (!value) return null;
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    let lat = parseCoord(url.searchParams.get("lat"));
    let lng = parseCoord(url.searchParams.get("lng"));
    const radius = parseFloat(url.searchParams.get("radius") || "50");
    const category = url.searchParams.get("category");
    const minRating = parseFloat(url.searchParams.get("min_rating") || "0");

    // Fallback: if lat/lng missing, try farmer profile
    if ((lat == null || lng == null) && farmerId) {
      const { data: farmer, error: farmerError } = await supabase
        .from("users")
        .select("latitude, longitude")
        .eq("id", farmerId)
        .maybeSingle();

      if (!farmerError && farmer?.latitude != null && farmer?.longitude != null) {
        lat = parseCoord(String(farmer.latitude));
        lng = parseCoord(String(farmer.longitude));
      }
    }

    if (lat == null || lng == null) {
      throw new Error("Latitude and longitude are required to search nearby services");
    }

    // Fetch providers
    const { data: providersRaw, error } = await supabase
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

    const providers = Array.isArray(providersRaw) ? providersRaw : [];

    const results = providers
      .map((p: any) => {
        const providerLat = parseFloat(String(p.latitude));
        const providerLng = parseFloat(String(p.longitude));
        const dist = calculateDistance(lat!, lng!, providerLat, providerLng);

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
            (c: string) => c.toLowerCase() === category.toLowerCase()
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
  } catch (err: any) {
    console.error("get-nearby-services error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || String(err),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
