import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, full_name, rating, total_reviews')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const { data: reviews, error: reviewsError } = await supabaseClient
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:reviewer_id(id, name, full_name),
        booking:booking_id(id)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      throw new Error('Failed to fetch reviews: ' + reviewsError.message);
    }

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews?.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          full_name: user.full_name,
          averageRating: user.rating || 0,
          totalReviews: user.total_reviews || 0,
        },
        reviews: reviews || [],
        ratingDistribution,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});