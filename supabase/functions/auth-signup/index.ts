import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

// --------------------
// Convert frontend 0XXXXXXXXX → +233XXXXXXXXX
// --------------------
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Already 0XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+233" + digits.slice(1);
  }

  // +233XXXXXXXXX
  if (phone.startsWith("+233") && digits.length === 12) {
    return "+" + digits;
  }

  // 233XXXXXXXXX
  if (digits.startsWith("233") && digits.length === 12) {
    return "+" + digits;
  }

  throw new Error("Invalid Ghana phone number format (use 0XXXXXXXXX)");
}

// --------------------
async function hashPassword(password: string): Promise<string> {
  const salt = "farmconnect_salt_2025";
  const data = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toIntOrNull(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(String).map((v) => v.trim()).filter(Boolean);

  if (typeof value === "string")
    return value.split(",").map((v) => v.trim()).filter(Boolean);

  return [];
}

// --------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();

    const {
      name,
      phone,
      password,
      role,
      admin_invite_token,
      email,
      address,
      latitude,
      longitude,
      ...roleSpecificFields
    } = body;

    if (!phone || !password || !role)
      throw new Error("Missing required fields: phone, password, role");

    if (!["farmer", "provider", "admin"].includes(role))
      throw new Error("Invalid role");

    const normalizedPhone = normalizePhoneNumber(phone);

    // ✔ Correct regex
    if (!/^\+233\d{9}$/.test(normalizedPhone)) {
      throw new Error("Invalid Ghana phone number format");
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, phone")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingUser)
      throw new Error("Phone number already registered. Please log in instead.");

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        phone: normalizedPhone,
        email: email || undefined,
        password,
        phone_confirm: true,
        email_confirm: true,
      });

    if (authError) throw new Error("Auth creation failed: " + authError.message);

    const userId = authData.user?.id;

    const insertData: Record<string, any> = {
      id: userId,
      name: name || "User",
      phone: normalizedPhone,
      email: email ?? null,
      role,
      address: address ?? null,
      password_hash: await hashPassword(password),
      is_verified: true,
      rating: 0.0,
      total_reviews: 0,
      latitude: toNumberOrNull(latitude),
      longitude: toNumberOrNull(longitude),
      profile_completed: false,
      created_at: new Date().toISOString(),
    };

    if (role === "farmer") {
      insertData.farm_size = roleSpecificFields.farm_size || null;
      insertData.crop_types = toStringArray(roleSpecificFields.crop_types);
      insertData.num_workers = toIntOrNull(roleSpecificFields.num_workers);
    }

    if (role === "provider") {
      insertData.business_name = roleSpecificFields.business_name || null;
      insertData.contact_person =
        roleSpecificFields.contact_person || name || null;
      insertData.service_categories = toStringArray(
        roleSpecificFields.service_categories
      );
      insertData.service_description =
        roleSpecificFields.service_description || null;
      insertData.pricing_info = roleSpecificFields.pricing_info ?? null;
      insertData.years_experience = toIntOrNull(
        roleSpecificFields.years_experience
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert(insertData)
      .select("id, name, phone, role, created_at")
      .single();

    if (userError) throw new Error(userError.message);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully",
        user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Signup error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      { status: 400, headers: corsHeaders }
    );
  }
});
