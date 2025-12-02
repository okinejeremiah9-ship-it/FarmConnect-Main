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

    const { escrow_id, farmer_id } = await req.json();

    if (!escrow_id || !farmer_id) {
      throw new Error('Missing required fields');
    }

    // Validate escrow belongs to farmer and is funded
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_wallet')
      .select('*')
      .eq('id', escrow_id)
      .eq('farmer_id', farmer_id)
      .maybeSingle();

    if (escrowError || !escrow) {
      throw new Error('Invalid escrow');
    }

    if (escrow.status !== 'funded') {
      throw new Error('Escrow must be funded to release');
    }

    // Update escrow status
    await supabase
      .from('escrow_wallet')
      .update({ status: 'released' })
      .eq('id', escrow_id);

    // Add funds to provider wallet
    const { data: providerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', escrow.provider_id)
      .maybeSingle();

    if (providerWallet) {
      await supabase
        .from('wallets')
        .update({
          balance: parseFloat(providerWallet.balance) + parseFloat(escrow.amount),
          total_earned: parseFloat(providerWallet.total_earned) + parseFloat(escrow.amount),
        })
        .eq('user_id', escrow.provider_id);
    } else {
      // Create wallet if doesn't exist
      await supabase
        .from('wallets')
        .insert({
          user_id: escrow.provider_id,
          balance: parseFloat(escrow.amount),
          total_earned: parseFloat(escrow.amount),
          total_spent: 0,
        });
    }

    // Update booking status to completed
    await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', escrow.booking_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Funds released to provider',
        escrow_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Escrow release error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
