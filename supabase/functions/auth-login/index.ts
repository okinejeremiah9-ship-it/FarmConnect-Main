// supabase/functions/auth-login/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ----------- MATCH SIGNUP ----------
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  // 0XXXXXXXXX → +233XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+233" + digits.slice(1);
  }

  if (phone.startsWith("+233") && digits.length === 12) {
    return "+" + digits;
  }

  if (digits.startsWith("233") && digits.length === 12) {
    return "+" + digits;
  }

  throw new Error("Invalid phone format");
}

// -----------------------------------
async function hashPassword(password: string) {
  const salt = "farmconnect_salt_2025";
  const enc = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);

  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v))
    return v.map(String).map((x) => x.trim()).filter(Boolean);

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
    const body = await req.json();
    const { phone, password, fetch_user_only } = body;

    if (!phone || (!password && !fetch_user_only))
      throw new Error("Phone number and password required");

    const normalizedPhone = normalizePhone(phone);

    // FIXED REGEX
    if (!/^\+233\d{9}$/.test(normalizedPhone)) {
      throw new Error("Invalid phone number format");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (!user) throw new Error("Incorrect phone or password");

    if (!fetch_user_only) {
      const hashed = await hashPassword(password);

      if (hashed !== user.password_hash)
        throw new Error("Incorrect phone or password");
    }

    const { password_hash, ...clean } = user;

    const normalizedUser = {
      ...clean,
      crop_types: normalizeArray(user.crop_types),
      service_categories: normalizeArray(user.service_categories),
      equipment_list: normalizeArray(user.equipment_list),
      services_offered: normalizeArray(user.services_offered),
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful",
        user: normalizedUser,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: corsHeaders }
    );
  }
});
