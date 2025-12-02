import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const booking_id = url.searchParams.get('booking_id');
    const user_id = url.searchParams.get('user_id');

    if (!booking_id || !user_id) {
      throw new Error('booking_id and user_id are required');
    }

    // Get messages for booking where user is sender or receiver
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, name, profile_pic), receiver:receiver_id(id, name, profile_pic)')
      .eq('booking_id', booking_id)
      .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Failed to fetch messages');
    }

    return new Response(
      JSON.stringify({
        success: true,
        messages: messages || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Messages list error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
