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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { escrow_id, user_id, reason, details, audio_url } = await req.json();

    if (!escrow_id || !user_id || !reason || !details) {
      throw new Error('Missing required fields');
    }

    // Validate escrow exists and user is involved
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_wallet')
      .select('*')
      .eq('id', escrow_id)
      .maybeSingle();

    if (escrowError || !escrow) {
      throw new Error('Escrow not found');
    }

    // Check user is either farmer or provider
    if (escrow.farmer_id !== user_id && escrow.provider_id !== user_id) {
      throw new Error('Unauthorized: You are not part of this transaction');
    }

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id')
      .eq('escrow_id', escrow_id)
      .in('status', ['open', 'investigating'])
      .maybeSingle();

    if (existingDispute) {
      throw new Error('An open dispute already exists for this escrow');
    }

    if (escrow.status === 'released' || escrow.status === 'refunded') {
      throw new Error('Cannot dispute completed transactions');
    }

    // Create dispute record
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .insert({
        escrow_id,
        raised_by: user_id,
        reason,
        details,
        audio_url,
        status: 'open',
      })
      .select()
      .maybeSingle();

    if (disputeError || !dispute) {
      throw new Error('Failed to create dispute');
    }

    // Update escrow status to disputed
    await supabase
      .from('escrow_wallet')
      .update({
        status: 'disputed',
        dispute_reason: reason,
        dispute_details: details,
      })
      .eq('id', escrow_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dispute created successfully',
        dispute_id: dispute.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Escrow dispute error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
