import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Haversine formula to calculate distance in KM
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    const farmerId = url.searchParams.get("farmer_id"); // optional
    let lat = parseFloat(url.searchParams.get("lat") || "0");
    let lng = parseFloat(url.searchParams.get("lng") || "0");
    const radius = parseFloat(url.searchParams.get("radius") || "50");
    const category = url.searchParams.get("category");
    const minRating = parseFloat(url.searchParams.get("min_rating") || "0");

    // 🧭 If no lat/lng provided, try fetching farmer's saved location
    if ((!lat || !lng) && farmerId) {
      const { data: farmer, error: farmerError } = await supabase
        .from("users")
        .select("latitude, longitude")
        .eq("id", farmerId)
        .maybeSingle();

      if (farmerError) throw new Error("Failed to fetch farmer location: " + farmerError.message);
      if (farmer && farmer.latitude && farmer.longitude) {
        lat = Number(farmer.latitude);
        lng = Number(farmer.longitude);
      } else {
        throw new Error("Farmer location not available and no live GPS provided");
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Latitude and longitude must be valid numbers");
    }

    // ✅ Fetch provider data
    const { data: providers, error } = await supabase
      .from("users")
      .select(`
        id, name, business_name, contact_person, phone, email,
        service_categories, service_description, pricing_info,
        years_experience, latitude, longitude, rating, total_reviews,
        profile_completed, role
      `)
      .eq("role", "provider")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) throw new Error(`Failed to fetch providers: ${error.message}`);

    const nearby = (providers || [])
      .map((p: any) => {
        const distance = calculateDistance(lat, lng, Number(p.latitude), Number(p.longitude));

        const categories = Array.isArray(p.service_categories)
          ? p.service_categories
          : typeof p.service_categories === "string"
          ? p.service_categories.split(",").map((c: string) => c.trim())
          : [];

        return { ...p, distance_km: Math.round(distance * 10) / 10, categories };
      })
      .filter((p) => {
        if (p.distance_km > radius) return false;
        if (category && category.trim() && category !== "all") {
          const match = p.categories.some(
            (c: string) => c.toLowerCase() === category.trim().toLowerCase()
          );
          if (!match) return false;
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
    console.error("get-nearby-services error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
