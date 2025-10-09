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

    const { dispute_id, admin_id, resolution, action } = await req.json();

    if (!dispute_id || !admin_id || !resolution || !action) {
      throw new Error('Missing required fields');
    }

    // Verify admin role
    const { data: admin } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', admin_id)
      .maybeSingle();

    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get dispute and escrow info
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('disputes')
      .select('*, escrow_wallet(*)')
      .eq('id', dispute_id)
      .maybeSingle();

    if (disputeError || !dispute) {
      throw new Error('Invalid dispute');
    }

    // Update dispute status
    await supabaseClient
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: admin_id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', dispute_id);

    const escrow = dispute.escrow_wallet;

    if (action === 'refund_farmer') {
      // Refund to farmer
      await supabaseClient
        .from('escrow_wallet')
        .update({ status: 'refunded' })
        .eq('id', escrow.id);

      const { data: farmerWallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', escrow.farmer_id)
        .maybeSingle();

      if (farmerWallet) {
        await supabaseClient
          .from('wallets')
          .update({
            balance: parseFloat(farmerWallet.balance) + parseFloat(escrow.amount),
          })
          .eq('user_id', escrow.farmer_id);
      }

      await supabaseClient
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', escrow.booking_id);

    } else if (action === 'release_provider') {
      // Release to provider
      await supabaseClient
        .from('escrow_wallet')
        .update({ status: 'released' })
        .eq('id', escrow.id);

      const { data: providerWallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', escrow.provider_id)
        .maybeSingle();

      if (providerWallet) {
        await supabaseClient
          .from('wallets')
          .update({
            balance: parseFloat(providerWallet.balance) + parseFloat(escrow.amount),
            total_earned: parseFloat(providerWallet.total_earned) + parseFloat(escrow.amount),
          })
          .eq('user_id', escrow.provider_id);
      }

      await supabaseClient
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', escrow.booking_id);

    } else if (action === 'split') {
      // Split payment (50/50)
      const halfAmount = parseFloat(escrow.amount) / 2;

      await supabaseClient
        .from('escrow_wallet')
        .update({ status: 'released' })
        .eq('id', escrow.id);

      // Farmer gets half back
      const { data: farmerWallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', escrow.farmer_id)
        .maybeSingle();

      if (farmerWallet) {
        await supabaseClient
          .from('wallets')
          .update({
            balance: parseFloat(farmerWallet.balance) + halfAmount,
          })
          .eq('user_id', escrow.farmer_id);
      }

      // Provider gets half
      const { data: providerWallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', escrow.provider_id)
        .maybeSingle();

      if (providerWallet) {
        await supabaseClient
          .from('wallets')
          .update({
            balance: parseFloat(providerWallet.balance) + halfAmount,
            total_earned: parseFloat(providerWallet.total_earned) + halfAmount,
          })
          .eq('user_id', escrow.provider_id);
      }

      await supabaseClient
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', escrow.booking_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dispute resolved',
        action,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Dispute resolve error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});