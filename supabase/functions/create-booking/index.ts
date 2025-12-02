// supabase/functions/create-booking/index.ts
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
    // ----------------------------------------------------
    // Extract JWT from Authorization header
    // ----------------------------------------------------
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!jwt) {
      throw new Error("Missing Authorization Bearer token");
    }

    // ----------------------------------------------------
    // Use ANON KEY but forward JWT for RLS
    // ----------------------------------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,   // NOT SERVICE ROLE
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      }
    );

    const body = await req.json();

    const {
      farmer_id,
      provider_id,
      service_id,
      scheduled_date,
      duration,
      total_price,
      service_location,
      notes,
      service_category,
    } = body;

    // ----------------------------------------------------
    // Validate required fields
    // ----------------------------------------------------
    if (!farmer_id) throw new Error("Missing farmer_id");
    if (!provider_id) throw new Error("Missing provider_id");
    if (!service_id) throw new Error("Missing service_id");
    if (!scheduled_date) throw new Error("Missing scheduled_date");
    if (!service_location) throw new Error("Missing service_location");

    // ----------------------------------------------------
    // Insert booking
    // ----------------------------------------------------
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        farmer_id,
        provider_id,
        service_id,
        scheduled_date,
        duration: duration ?? 1,
        total_price: total_price ?? 0,
        service_location,
        notes: notes ?? null,
        service_category: service_category ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ Booking insert error:", error);
      throw new Error(
        "Failed to create booking: " + (error.message || "Unknown error")
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: data.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("❌ Create booking failed:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message ?? "Unknown error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
