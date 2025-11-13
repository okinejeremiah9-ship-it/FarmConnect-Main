// supabase/functions/get-user-profile/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Normalize any DB array field
function normalizeArrayField(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  // Handle Postgres text[] e.g. {"Tractor","Mechanic"}
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

    const { data: user, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !user) throw new Error("User not found");

    const normalized = {
      ...user,
      crop_types: normalizeArrayField(user.crop_types),
      service_categories: normalizeArrayField(user.service_categories),
      equipment_list: normalizeArrayField(user.equipment_list),
      services_offered: normalizeArrayField(user.services_offered),
      latitude: user.latitude ? parseFloat(String(user.latitude)) : null,
      longitude: user.longitude ? parseFloat(String(user.longitude)) : null,
    };

    return new Response(
      JSON.stringify({ success: true, user: normalized }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


