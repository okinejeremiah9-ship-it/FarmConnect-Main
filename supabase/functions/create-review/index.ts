import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { 
      reviewer_id, 
      reviewee_id, 
      booking_id, 
      service_id, 
      rating, 
      comment 
    } = await req.json();

    if (!reviewer_id || !reviewee_id || !booking_id || !service_id || !rating) {
      throw new Error('Missing required fields');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('status', 'completed')
      .maybeSingle();

    if (bookingError || !booking) {
      throw new Error('Booking not found or not completed');
    }

    if (booking.farmer_id !== reviewer_id && booking.provider_id !== reviewer_id) {
      throw new Error('Unauthorized: You can only review services you were involved in');
    }

    const expectedRevieweeId = booking.farmer_id === reviewer_id ? booking.provider_id : booking.farmer_id;
    if (reviewee_id !== expectedRevieweeId) {
      throw new Error('Invalid reviewee for this booking');
    }

    const { data: existingReview } = await supabaseClient
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('reviewer_id', reviewer_id)
      .maybeSingle();

    if (existingReview) {
      throw new Error('You have already reviewed this service');
    }

    const { data: review, error: reviewError } = await supabaseClient
      .from('reviews')
      .insert({
        reviewer_id,
        reviewee_id,
        booking_id,
        service_id,
        rating,
        comment: comment || null,
      })
      .select(`
        *,
        reviewer:reviewer_id(id, name, full_name),
        reviewee:reviewee_id(id, name, full_name)
      `)
      .maybeSingle();

    if (reviewError) {
      throw new Error('Failed to create review: ' + reviewError.message);
    }

    const { data: allReviews } = await supabaseClient
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', reviewee_id);

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await supabaseClient
        .from('users')
        .update({
          rating: Math.round(avgRating * 10) / 10,
          total_reviews: allReviews.length,
        })
        .eq('id', reviewee_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        review,
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