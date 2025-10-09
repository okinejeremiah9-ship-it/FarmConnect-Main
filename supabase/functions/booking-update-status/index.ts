import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id, user_id, status } = await req.json();

    if (!booking_id || !user_id || !status) {
      throw new Error('Missing required fields');
    }

    const validStatuses = ['pending', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Get booking and verify user is involved
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      throw new Error('Invalid booking');
    }

    // Check if user is farmer or provider
    if (booking.farmer_id !== user_id && booking.provider_id !== user_id) {
      throw new Error('Unauthorized: You are not part of this booking');
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update({ status })
      .eq('id', booking_id)
      .select()
      .maybeSingle();

    if (updateError || !updatedBooking) {
      throw new Error('Failed to update booking status');
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Booking update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});