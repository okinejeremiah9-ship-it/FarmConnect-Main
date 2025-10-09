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

    const { booking_id, sender_id, receiver_id, message_type, content, media_url } = await req.json();

    if (!sender_id || !receiver_id || !message_type) {
      throw new Error('Missing required fields');
    }

    if (message_type === 'text' && !content) {
      throw new Error('Text messages must have content');
    }

    if ((message_type === 'audio' || message_type === 'image') && !media_url) {
      throw new Error('Media messages must have media_url');
    }

    // Create message
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        booking_id,
        sender_id,
        receiver_id,
        message_type,
        content,
        media_url,
        is_read: false,
      })
      .select()
      .maybeSingle();

    if (messageError || !message) {
      throw new Error('Failed to send message');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Message send error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});