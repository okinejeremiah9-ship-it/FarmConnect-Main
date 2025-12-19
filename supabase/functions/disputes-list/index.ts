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

    const { user_id, admin_id, mode } = await req.json();

    if (!mode) {
      throw new Error("mode is required (admin | user)");
    }

    /* ============================================================
       🔹 ADMIN MODE
       ============================================================ */
    if (mode === "admin") {
      if (!admin_id) throw new Error("admin_id is required");

      const { data: admin } = await supabase
        .from("users")
        .select("role")
        .eq("id", admin_id)
        .maybeSingle();

      if (!admin || admin.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          escrow:escrow_id (
            id,
            amount,
            status,
            farmer:farmer_id (id, name, phone),
            provider:provider_id (id, name, phone),
            booking:booking_id (
              id,
              scheduled_date,
              service:service_id (title)
            )
          ),
          raised_by_user:raised_by (id, name, phone, role),
          messages:dispute_messages (
            id,
            message,
            audio_url,
            sender_id,
            created_at,
            sender:users!dispute_messages_sender_id_fkey (
              id,
              name,
              role
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, disputes: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* ============================================================
       🔹 USER MODE (FARMER / PROVIDER)
       ============================================================ */
    if (mode === "user") {
      if (!user_id) throw new Error("user_id is required");

      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          escrow:escrow_id (
            id,
            amount,
            status,
            farmer:farmer_id (id, name, phone),
            provider:provider_id (id, name, phone),
            booking:booking_id (
              id,
              scheduled_date,
              service:service_id (title)
            )
          ),
          raised_by_user:raised_by (id, name, phone, role),
          messages:dispute_messages (
            id,
            message,
            audio_url,
            sender_id,
            created_at,
            sender:users!dispute_messages_sender_id_fkey (
              id,
              name,
              role
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // ✅ SAFE JS FILTERING
      const filtered = (data || []).filter((d) => {
        const escrow = d.escrow;
        return (
          d.raised_by === user_id ||
          escrow?.farmer?.id === user_id ||
          escrow?.provider?.id === user_id
        );
      });

      return new Response(
        JSON.stringify({ success: true, disputes: filtered }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid mode");

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
