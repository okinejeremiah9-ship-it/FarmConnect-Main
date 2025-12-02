import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

function toNumberOrNull(v: any) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toIntOrNull(v: any) {
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

function toStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .replace(/[{}"]/g, "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Extract all fields including NEW one
    const {
      name,
      email,
      password,
      role,
      admin_invite_token,

      // Location
      location,
      address,
      latitude,
      longitude,

      // Farmer
      farm_size,
      crop_types,
      num_workers,

      // Provider
      business_name,
      contact_person,
      service_categories,
      service_description,
      service_availability,
      pricing_info,
      equipment_list,
      years_experience,

      profile_completed,

      // NEW FIELD
      initial_services,   // <<--- array of services to insert
    } = body;

    // VALIDATION
    if (!email || !password || !role) {
      throw new Error("Missing required fields: email, password, role");
    }

    if (!["farmer", "provider", "admin"].includes(role)) {
      throw new Error("Invalid role");
    }

    // Duplicate check
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      throw new Error("Email already registered. Please log in instead.");
    }

    // CREATE AUTH USER
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { role },
      });

    if (authError) throw new Error("Authentication creation failed: " + authError.message);

    const userId = authData?.user?.id;
    if (!userId) throw new Error("Auth user created but ID missing.");

    // INSERT INTO users TABLE
    const insertData: any = {
      id: userId,
      name: name || "User",
      email: email.toLowerCase(),
      role,
      location: location || null,
      address: address || null,
      latitude: toNumberOrNull(latitude),
      longitude: toNumberOrNull(longitude),
      is_verified: true,
      rating: 0.0,
      total_reviews: 0,
      profile_completed: !!profile_completed,
      created_at: new Date().toISOString(),
    };

    if (role === "farmer") {
      insertData.farm_size = farm_size || null;
      insertData.crop_types = toStringArray(crop_types);
      insertData.num_workers = toIntOrNull(num_workers);
    }

    if (role === "provider") {
      insertData.business_name = business_name || null;
      insertData.contact_person = contact_person || name || null;
      insertData.service_categories = toStringArray(service_categories);
      insertData.service_description = service_description || null;
      insertData.service_availability = service_availability || null;
      insertData.pricing_info = pricing_info || null;
      insertData.equipment_list = toStringArray(equipment_list);
      insertData.years_experience = toIntOrNull(years_experience);
    }

    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .insert(insertData)
      .select()
      .single();

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Failed to create user profile: " + userError.message);
    }

    // -------------------------------------------------------------
    // ⭐⭐⭐ NEW — AUTO-INSERT PROVIDER SERVICES INTO services TABLE
    // -------------------------------------------------------------
    if (role === "provider" && Array.isArray(initial_services)) {
      const servicesToInsert = initial_services.map((svc: any) => ({
        ...svc,
        provider_id: userId, // REQUIRED for FK
      }));

      const { error: svcError } = await supabaseAdmin
        .from("services")
        .insert(servicesToInsert);

      if (svcError) {
        console.error("SERVICE INSERT ERROR:", svcError);

        // rollback both service rows AND user account
        await supabaseAdmin.from("users").delete().eq("id", userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);

        throw new Error(
          "Provider created but service creation failed: " + svcError.message
        );
      }
    }

    // SUCCESS
    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully",
        user: userRow,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("SIGNUP ERROR:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: corsHeaders }
    );
  }
});
