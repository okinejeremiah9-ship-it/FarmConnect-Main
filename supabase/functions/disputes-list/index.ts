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

    const { user_id, admin_id } = await req.json();

    if (!user_id && !admin_id) {
      throw new Error('user_id or admin_id is required');
    }

    // Check if this is an admin request
    if (admin_id) {
      const { data: admin } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', admin_id)
        .maybeSingle();

      if (!admin || admin.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get all disputes for admin
      const { data: disputes, error: disputesError } = await supabaseClient
        .from('disputes')
        .select(`
          *,
          escrow:escrow_wallet(
            id,
            amount,
            status,
            booking:booking_id(
              id,
              service:service_id(title),
              scheduled_date
            ),
            farmer:farmer_id(id, name, phone),
            provider:provider_id(id, name, phone)
          ),
          raised_by_user:raised_by(id, name, phone, role),
          resolved_by_user:resolved_by(id, name)
        `)
        .order('created_at', { ascending: false });

      if (disputesError) {
        throw new Error('Failed to fetch disputes: ' + disputesError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          disputes: disputes || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get disputes for regular user (farmer or provider)
    // Find disputes where user is either the raiser or involved in the escrow
    const { data: disputes, error: disputesError } = await supabaseClient
      .from('disputes')
      .select(`
        *,
        escrow:escrow_wallet(
          id,
          amount,
          status,
          farmer_id,
          provider_id,
          booking:booking_id(
            id,
            service:service_id(title),
            scheduled_date
          ),
          farmer:farmer_id(id, name, phone),
          provider:provider_id(id, name, phone)
        ),
        raised_by_user:raised_by(id, name, phone, role),
        resolved_by_user:resolved_by(id, name)
      `)
      .or(`raised_by.eq.${user_id},escrow_wallet.farmer_id.eq.${user_id},escrow_wallet.provider_id.eq.${user_id}`)
      .order('created_at', { ascending: false });

    if (disputesError) {
      throw new Error('Failed to fetch disputes: ' + disputesError.message);
    }

    // Filter disputes where user is involved
    const userDisputes = disputes?.filter(dispute => {
      const escrow = dispute.escrow as any;
      return dispute.raised_by === user_id || 
             escrow?.farmer_id === user_id || 
             escrow?.provider_id === user_id;
    }) || [];

    return new Response(
      JSON.stringify({
        success: true,
        disputes: userDisputes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Disputes list error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});