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
    const admin_id = url.searchParams.get('admin_id');

    if (!admin_id) {
      throw new Error('admin_id is required');
    }

    // Verify admin role
    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('id', admin_id)
      .maybeSingle();

    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get active bookings count
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'accepted', 'in-progress']);

    // Get completed bookings count
    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get total revenue (sum of completed escrow)
    const { data: revenueData } = await supabase
      .from('escrow_wallet')
      .select('amount')
      .in('status', ['released', 'completed']);

    const totalRevenue = revenueData?.reduce((sum, row) => sum + parseFloat(row.amount), 0) || 0;

    // Get open disputes count
    const { count: openDisputes } = await supabase
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'investigating']);

    // Get total users by role
    const { count: totalFarmers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'farmer');

    const { count: totalProviders } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'provider');

    // Get recent activities (last 10 bookings)
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, status, created_at, farmer:farmer_id(name), provider:provider_id(name), services(title)')
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          activeBookings: activeBookings || 0,
          completedBookings: completedBookings || 0,
          totalRevenue: totalRevenue.toFixed(2),
          openDisputes: openDisputes || 0,
          totalFarmers: totalFarmers || 0,
          totalProviders: totalProviders || 0,
        },
        recentBookings: recentBookings || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
