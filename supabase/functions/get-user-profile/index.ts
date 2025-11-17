// supabase/functions/get-user-profile/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Allow browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Normalize any DB array field (supports text[] and comma-separated strings)
function normalizeArrayField(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean);
  }

  // For Postgres text[] format: {"Tractor","Mechanic"}
  return String(value)
    .replace(/[{}"]/g, "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) throw new Error("User ID is required");

    // Fetch user
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select(`
        id,
        name,
        phone,
        email,
        role,
        bio,
        profile_pic,
        farm_size,
        crop_types,
        num_workers,
        services_offered,
        business_name,
        contact_person,
        service_categories,
        service_description,
        service_availability,
        pricing_info,
        equipment_list,
        years_experience,
        latitude,
        longitude,
        address,
        rating,
        total_reviews,
        is_verified,
        profile_completed,
        created_at,
        updated_at
      `)
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) throw new Error("User not found");

    // If provider, also fetch their service listings
    let services: any[] = [];
    if (user.role === "provider") {
      const { data: servicesData } = await supabaseClient
        .from("services")
        .select("*")
        .eq("provider_id", userId);

      services = servicesData || [];
    }

    // Fetch recent reviews
    const { data: reviews } = await supabaseClient
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:reviewer_id(id, name),
        booking:booking_id(id)
      `)
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Normalize arrays & convert coordinates
    const normalizedUser = {
      ...user,
      crop_types: normalizeArrayField(user.crop_types),
      services_offered: normalizeArrayField(user.services_offered),
      service_categories: normalizeArrayField(user.service_categories),
      equipment_list: normalizeArrayField(user.equipment_list),
      latitude: user.latitude ? parseFloat(String(user.latitude)) : null,
      longitude: user.longitude ? parseFloat(String(user.longitude)) : null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        user: normalizedUser,
        services,
        reviews: reviews || [],
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
