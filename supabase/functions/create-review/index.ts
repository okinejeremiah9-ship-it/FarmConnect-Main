import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { reviewer_id, reviewee_id, booking_id, service_id, rating, comment } = body;

    if (!reviewer_id || !reviewee_id || !booking_id || !service_id || !rating) {
      throw new Error("Missing required fields");
    }

    if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({ reviewer_id, reviewee_id, booking_id, service_id, rating, comment })
      .select(`
        *,
        reviewer:reviewer_id(id, name),
        reviewee:reviewee_id(id, name)
      `)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true, review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
