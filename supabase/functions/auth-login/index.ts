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

// ------------------------
// Normalize phone → +233XXX
// ------------------------
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+233" + digits.slice(1);
  if (digits.startsWith("233")) return "+" + digits;
  if (phone.startsWith("+233")) return phone;
  return "+233" + digits;
}

// ------------------------
// SHA256 password hashing
// ------------------------
async function hashPassword(password: string) {
  const salt = "farmconnect_salt_2025";
  const enc = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);

  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ------------------------
// Normalize PG arrays
// Handles: text[], "{a,b}", ["a","b"], "a,b"
// ------------------------
function normalizeArray(v: any): string[] {
  if (!v) return [];

  if (Array.isArray(v)) {
    return v.map(String).map((x) => x.trim()).filter(Boolean);
  }

  if (typeof v === "string") {
    return v
      .replace(/[{}\"]/g, "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

// ------------------------
// MAIN HANDLER
// ------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, password, fetch_user_only } = body;

    if (!phone || (!password && !fetch_user_only)) {
      throw new Error("Phone number and password required");
    }

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone.match(/^\+233\\d{9}$/)) {
      throw new Error("Invalid phone number format");
    }

    // ------------------------
    // Supabase client (admin)
    // ------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ------------------------
    // Fetch user from users table
    // ------------------------
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (error || !user) throw new Error("Invalid phone number");

    // ------------------------
    // IMPORTANT:
    // OPTION A — NO ACCOUNT VERIFICATION REQUIRED
    // We skip the is_verified check completely.
    // ------------------------
    // (Removed the blocker)

    // ------------------------
    // Validate password ONLY if not fetching for UI
    // ------------------------
    if (!fetch_user_only) {
      const hashed = await hashPassword(password);
      if (hashed !== user.password_hash) {
        throw new Error("Incorrect password");
      }
    }

    // Remove private field
    const { password_hash, ...cleanUser } = user;

    const normalizedUser = {
      ...cleanUser,
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
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

