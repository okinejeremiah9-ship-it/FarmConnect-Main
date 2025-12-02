// supabase/functions/get-user-reviews/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) throw new Error("User ID required");

    // Fetch profile summary
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, rating, total_reviews")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) throw new Error("User not found");

    // Fetch reviews for user
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:reviewer_id(id, name),
        booking:booking_id(id)
      `)
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (reviewsError) throw new Error(reviewsError.message);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          averageRating: user.rating || 0,
          totalReviews: user.total_reviews || 0,
        },
        reviews,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
