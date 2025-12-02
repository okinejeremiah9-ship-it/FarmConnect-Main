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
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get or create wallet for user
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError) {
      throw new Error('Failed to fetch wallet: ' + walletError.message);
    }

    // If wallet doesn't exist, create it
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .select()
        .maybeSingle();

      if (createError) {
        throw new Error('Failed to create wallet: ' + createError.message);
      }

      wallet = newWallet;
    }

    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          balance: parseFloat(wallet.balance),
          total_earned: parseFloat(wallet.total_earned),
          total_spent: parseFloat(wallet.total_spent),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Wallet balance error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
