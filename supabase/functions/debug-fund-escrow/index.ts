import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {

  // --- ALWAYS return OK for OPTIONS ---
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ---- FIX: safe JSON parse ----
    let body = {};
    try { body = await req.json(); } catch (e) {}

    const { booking_id } = body as any;
    if (!booking_id) throw new Error("booking_id is required");

    // Lookup booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, total_price, farmer_id, provider_id, escrow_wallet(*)")
      .eq("id", booking_id)
      .maybeSingle();

    if (!booking) throw new Error("Booking not found");

    let escrow = booking.escrow_wallet?.[0];

    if (!escrow) {
      // Create new escrow
      const { data: newEscrow } = await supabase
        .from("escrow_wallet")
        .insert({
          booking_id,
          farmer_id: booking.farmer_id,
          provider_id: booking.provider_id,
          amount: booking.total_price,
          status: "funded",
        })
        .select()
        .maybeSingle();

      escrow = newEscrow;
    } else {
      await supabase
        .from("escrow_wallet")
        .update({ status: "funded" })
        .eq("id", escrow.id);
      escrow.status = "funded";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Escrow funded for testing",
        escrow,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
