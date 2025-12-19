// admin-dashboard-stats/index.ts
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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 🔥 Accept POST body instead of GET query
    const { admin_id } = await req.json();

    if (!admin_id) {
      throw new Error("admin_id is required");
    }

    // Verify admin role
    const { data: admin } = await supabase
      .from("users")
      .select("role")
      .eq("id", admin_id)
      .maybeSingle();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // -------------------------------------------------------------------
    // 📊 COUNT ACTIVE BOOKINGS
    // -------------------------------------------------------------------
    const { count: activeBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "accepted", "in-progress"]);

    // 📊 COUNT COMPLETED BOOKINGS
    const { count: completedBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // -------------------------------------------------------------------
    // 💰 TOTAL REVENUE
    // -------------------------------------------------------------------
    const { data: revenueData } = await supabase
      .from("escrow_wallet")
      .select("amount")
      .in("status", ["released", "completed"]);

    const totalRevenue =
      revenueData?.reduce((sum, row) => sum + parseFloat(row.amount), 0) || 0;

    // -------------------------------------------------------------------
    // ⚠ OPEN DISPUTES
    // -------------------------------------------------------------------
    const { count: openDisputes } = await supabase
      .from("disputes")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "investigating"]);

    // -------------------------------------------------------------------
    // 👤 USER COUNT
    // -------------------------------------------------------------------
    const { count: totalFarmers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "farmer");

    const { count: totalProviders } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "provider");

    // -------------------------------------------------------------------
    // 🕒 RECENT BOOKINGS
    // -------------------------------------------------------------------
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        created_at,
        farmer:farmer_id(name),
        provider:provider_id(name),
        services:service_id(title)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          activeBookings,
          completedBookings,
          totalRevenue: totalRevenue.toFixed(2),
          openDisputes,
          totalFarmers,
          totalProviders,
        },
        recentBookings: recentBookings || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Admin dashboard stats error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
