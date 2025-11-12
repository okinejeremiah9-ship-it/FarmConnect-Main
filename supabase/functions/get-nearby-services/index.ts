import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": 
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") 
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);

    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lng = parseFloat(url.searchParams.get("lng") || "0");
    const radius = parseFloat(url.searchParams.get("radius") || "50");
    const category = url.searchParams.get("category") || "";
    const minRating = parseFloat(url.searchParams.get("min_rating") || "0");

    if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid coordinates");

    // 🟩 Correct SELECT (no full_name!)
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
        address
      `)
      .eq("role", "provider")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) 
      throw new Error(`Failed to fetch providers: ${error.message}`);

    const nearby = (providers || [])
      .map((p: any) => {
        const distance = calculateDistance(
          lat, lng,
          Number(p.latitude), Number(p.longitude)
        );

        const categories = Array.isArray(p.service_categories)
          ? p.service_categories
          : typeof p.service_categories === "string"
            ? p.service_categories.split(",").map((x: string) => x.trim())
            : [];

        return {
          ...p,
          distance_km: Math.round(distance * 10) / 10,
          categories,
        };
      })
      .filter(p => p.distance_km <= radius)
      .filter(p => 
        category === "" ||
        category === "all" ||
        p.categories.some((c: string) => 
          c.toLowerCase() === category.toLowerCase()
        )
      )
      .filter(p => 
        minRating <= 0 || 
        (Number(p.rating) || 0) >= minRating
      )
      .sort((a, b) => a.distance_km - b.distance_km);

    return new Response(JSON.stringify({
      success: true,
      providers: nearby,
      center: { lat, lng },
      radius
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
