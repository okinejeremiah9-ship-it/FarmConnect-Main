export const config = {
  runtime: "edge",
  regions: ["eu-west-1"],
  security: { enabled: false },
};

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Normalize array-type DB fields
function normalizeArrayField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim());
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 🔥 FIXED — correct env vars + correct syntax
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) throw new Error("User ID is required");

    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) throw new Error("User not found");

    // Normalize fields
    const normalizedUser = {
      ...user,
      crop_types: normalizeArrayField(user.crop_types),
      service_categories: normalizeArrayField(user.service_categories),
      equipment_list: normalizeArrayField(user.equipment_list),
      services_offered: normalizeArrayField(user.services_offered),
    };

    return new Response(JSON.stringify({ success: true, user: normalizedUser }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("❌ Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

