import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {

    // Correct client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const farmerId = url.searchParams.get("farmer_id");
    let lat = parseFloat(url.searchParams.get("lat") || "0");
    let lng = parseFloat(url.searchParams.get("lng") || "0");
    const radius = parseFloat(url.searchParams.get("radius") || "50");
    const category = url.searchParams.get("category");
    const minRating = parseFloat(url.searchParams.get("min_rating") || "0");

    // If lat/lng not provided → get farmer location
    if ((!lat || !lng) && farmerId) {
      const { data: farmer } = await supabase
        .from("users")
        .select("latitude, longitude")
        .eq("id", farmerId)
        .maybeSingle();

      if (farmer?.latitude && farmer?.longitude) {
        lat = Number(farmer.latitude);
        lng = Number(farmer.longitude);
      } else {
        throw new Error("Farmer location not available");
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid coordinates");
    }

    // ✅ CORRECT PROVIDER QUERY
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
        rating
      `)
      .eq("role", "provider")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    // Filter providers by distance & category
    const nearby = (providers || [])
      .map((p: any) => {
        const distance = calculateDistance(lat, lng, Number(p.latitude), Number(p.longitude));

        const categories = Array.isArray(p.service_categories)
          ? p.service_categories
          : typeof p.service_categories === "string"
          ? p.service_categories.split(",").map((x: string) => x.trim())
          : [];

        return { ...p, distance_km: Math.round(distance * 10) / 10, categories };
      })
      .filter((p) => {
        if (p.distance_km > radius) return false;
        if (category && category !== "all") {
          if (!p.categories.some((c: string) => c.toLowerCase() === category.toLowerCase()))
            return false;
        }
        if (minRating > 0 && (Number(p.rating) || 0) < minRating) return false;
        return true;
      })
      .sort((a, b) => a.distance_km - b.distance_km);

    return new Response(
      JSON.stringify({
        success: true,
        providers: nearby,
        farmer_location: { lat, lng },
        radius_km: radius,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
