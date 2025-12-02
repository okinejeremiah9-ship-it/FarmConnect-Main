import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, admin_id } = await req.json();

    if (!user_id && !admin_id) {
      throw new Error("user_id or admin_id is required");
    }

    // -------------------------------------
    // 🔹 ADMIN MODE
    // -------------------------------------
    if (admin_id) {
      const { data: admin } = await supabase
        .from("users")
        .select("role")
        .eq("id", admin_id)
        .maybeSingle();

      if (!admin || admin.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const { data: disputes, error: disputesError } = await supabase
        .from("disputes")
        .select(`
          *,
          escrow:escrow_wallet(
            id,
            amount,
            status,
            booking:booking_id(
              id,
              service:service_id(title),
              scheduled_date
            ),
            farmer:farmer_id(id, name, phone),
            provider:provider_id(id, name, phone)
          ),
          raised_by_user:raised_by(id, name, phone, role),
          resolved_by_user:resolved_by(id, name)
        `)
        .order("created_at", { ascending: false });

      if (disputesError) {
        throw new Error("Failed to fetch disputes: " + disputesError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          disputes: disputes || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------
    // 🔹 USER MODE (farmer or provider)
    // -------------------------------------
    const { data: disputes, error: disputesError } = await supabase
      .from("disputes")
      .select(`
        *,
        escrow:escrow_wallet(
          id,
          amount,
          status,
          farmer_id,
          provider_id,
          booking:booking_id(
            id,
            service:service_id(title),
            scheduled_date
          ),
          farmer:farmer_id(id, name, phone),
          provider:provider_id(id, name, phone)
        ),
        raised_by_user:raised_by(id, name, phone, role),
        resolved_by_user:resolved_by(id, name)
      `)
      -- no .or() here
      .order("created_at", { ascending: false });

    if (disputesError) {
      throw new Error("Failed to fetch disputes: " + disputesError.message);
    }

    const userDisputes =
      disputes?.filter((dispute) => {
        const escrow = dispute.escrow as any;
        return (
          dispute.raised_by === user_id ||
          escrow?.farmer_id === user_id ||
          escrow?.provider_id === user_id
        );
      }) || [];

    return new Response(
      JSON.stringify({
        success: true,
        disputes: userDisputes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Disputes list error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
