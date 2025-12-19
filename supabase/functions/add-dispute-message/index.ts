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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { dispute_id, sender_id, message, audio_url, image_urls } =
      await req.json();

    if (!dispute_id || !sender_id) {
      throw new Error("Missing dispute_id or sender_id");
    }

    // Validate dispute exists
    const { data: dispute } = await supabase
      .from("disputes")
.select(`
  id,
  dispute_id,
  sender_id,
  message,
  audio_url,
  image_urls,
  created_at,
  sender:users!dispute_messages_sender_id_fkey (
    id, name, role
  )
`)

      .eq("id", dispute_id)
      .maybeSingle();

    if (!dispute) {
      throw new Error("Invalid dispute");
    }

    // Check user is relevant (farmer/provider/admin)
    const isInvolved =
      dispute.escrow.farmer_id === sender_id ||
      dispute.escrow.provider_id === sender_id;

    if (!isInvolved) {
      throw new Error("Unauthorized: You are not part of this dispute");
    }

    // Insert message
    const { data: saved, error: insertError } = await supabase
      .from("dispute_messages")
      .insert({
        dispute_id,
        sender_id,
        message: message ?? null,
        audio_url: audio_url ?? null,
        image_urls: image_urls ?? null,
      })
      .select(
        `
        id,
        dispute_id,
        sender_id,
        message,
        audio_url,
        image_urls,
        created_at,
        sender:sender_id(id, name, role)
      `
      )
      .maybeSingle();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: saved,
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
    console.error("Add dispute message error:", err);

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
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
