import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// DEV MODE: Wallet simulation enabled
// Set to false and configure Paystack for production
const USE_WALLET_SIMULATION = true;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id, farmer_id, amount } = await req.json();

    if (!booking_id || !farmer_id || !amount) {
      throw new Error('Missing required fields');
    }

    // Validate booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(title, provider_id)')
      .eq('id', booking_id)
      .eq('farmer_id', farmer_id)
      .maybeSingle();

    if (bookingError || !booking) {
      throw new Error('Invalid booking');
    }

    // Check if escrow already exists
    const { data: existingEscrow } = await supabase
      .from('escrow_wallet')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle();

    if (existingEscrow) {
      throw new Error('Escrow already exists for this booking');
    }

    const reference = `escrow_${booking_id}_${Date.now()}`;

    if (USE_WALLET_SIMULATION) {
      // SIMULATION MODE: Use wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', farmer_id)
        .maybeSingle();

      if (!wallet || parseFloat(wallet.balance) < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from wallet
      await supabase
        .from('wallets')
        .update({
          balance: parseFloat(wallet.balance) - amount,
          total_spent: parseFloat(wallet.total_spent) + amount,
        })
        .eq('user_id', farmer_id);

      // Create escrow record
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_wallet')
        .insert({
          booking_id,
          farmer_id,
          provider_id: booking.services.provider_id,
          amount,
          status: 'funded',
          paystack_reference: reference,
        })
        .select()
        .maybeSingle();

      if (escrowError || !escrow) {
        throw new Error('Failed to create escrow');
      }

      return new Response(
        JSON.stringify({
          success: true,
          escrow_id: escrow.id,
          reference,
          message: 'Funds deposited to escrow from wallet',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // PRODUCTION MODE: Use Paystack
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_wallet')
        .insert({
          booking_id,
          farmer_id,
          provider_id: booking.services.provider_id,
          amount,
          status: 'pending',
          paystack_reference: reference,
        })
        .select()
        .maybeSingle();

      if (escrowError || !escrow) {
        throw new Error('Failed to create escrow');
      }

      // Initialize Paystack payment
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'farmer@farmconnect.com',
          amount: Math.round(amount * 100),
          reference,
          callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/escrow-webhook`,
          metadata: { booking_id, farmer_id, escrow_id: escrow.id },
        }),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackData.status) {
        throw new Error('Failed to initialize payment');
      }

      return new Response(
        JSON.stringify({
          success: true,
          escrow_id: escrow.id,
          payment_url: paystackData.data.authorization_url,
          reference,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Escrow deposit error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
