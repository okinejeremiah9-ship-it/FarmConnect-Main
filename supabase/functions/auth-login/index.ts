import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ----------------------------------------------------------
// EMAIL-BASED LOGIN VALIDATION (NOT SESSION CREATION)
// ----------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // ------------------------------------------------------
    // 1. Validate email exists in Auth
    // ------------------------------------------------------
    const { data: authUserData, error: authUserError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authUserError) throw new Error("Auth lookup failed.");

    const match = authUserData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!match) throw new Error("Incorrect email or password.");

    // ------------------------------------------------------
    // 2. Try Supabase Auth login
    // ------------------------------------------------------
    const supabaseClientForLogin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: loginData, error: loginError } =
      await supabaseClientForLogin.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) throw new Error("Incorrect email or password.");

    const authUser = loginData.user;
    if (!authUser) throw new Error("Login failed.");

    // ------------------------------------------------------
    // 3. Fetch profile from users table
    // ------------------------------------------------------
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      throw new Error("Failed to load user profile.");
    }

    if (!profile) {
      throw new Error("User profile not found.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Login verified",
        user: profile,
        // session: loginData.session, // CAN be returned but NOT set automatically on frontend
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err: any) {
    console.error("Login error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Login failed",
      }),
      { status: 400, headers: corsHeaders }
    );
  }
});
