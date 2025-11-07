import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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

    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseFloat(url.searchParams.get('radius') || '50');
    const category = url.searchParams.get('category');
    const minRating = parseFloat(url.searchParams.get('min_rating') || '0');

    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    let query = supabaseClient
      .from('users')
      .select(`
        id,
        name,
        full_name,
        business_name,
        contact_person,
        profile_pic,
        bio,
        address,
        phone,
        email,
        service_categories,
        service_description,
        pricing_info,
        years_experience,
        latitude,
        longitude,
        rating,
        total_reviews,
        profile_completed
      `)
      .eq('role', 'provider')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    const { data: providers, error: providersError } = await query;

    if (providersError) {
      throw new Error('Failed to fetch providers: ' + providersError.message);
    }

    const nearbyProviders = providers
      ?.filter(provider => {
        if (!provider.latitude || !provider.longitude) {
          return false;
        }

        const distance = calculateDistance(
          lat, lng,
          parseFloat(provider.latitude),
          parseFloat(provider.longitude)
        );

        provider.distance = Math.round(distance * 10) / 10;

        if (distance > radius) {
          return false;
        }

        if (category && category !== 'all') {
          const categories = Array.isArray(provider.service_categories)
            ? provider.service_categories
            : typeof provider.service_categories === 'string'
              ? provider.service_categories.split(',').map((item: string) => item.trim()).filter(Boolean)
              : [];

          return categories.includes(category);
        }

        if (!Number.isNaN(minRating) && minRating > 0) {
          const ratingValue = typeof provider.rating === 'number'
            ? provider.rating
            : provider.rating
              ? parseFloat(provider.rating)
              : 0;

          if (!ratingValue || ratingValue < minRating) {
            return false;
          }
        }

        return true;
      })
      .map(provider => {
        const categories = Array.isArray(provider.service_categories)
          ? provider.service_categories
          : typeof provider.service_categories === 'string'
            ? provider.service_categories.split(',').map((item: string) => item.trim()).filter(Boolean)
            : [];

        return {
          id: provider.id,
          name: provider.name,
          full_name: provider.full_name,
          business_name: provider.business_name,
          contact_person: provider.contact_person,
          profile_pic: provider.profile_pic,
          bio: provider.bio,
          address: provider.address,
          phone: provider.phone,
          email: provider.email,
          service_categories: categories,
          service_description: provider.service_description,
          pricing_info: provider.pricing_info,
          years_experience: provider.years_experience,
          latitude: provider.latitude,
          longitude: provider.longitude,
          rating: provider.rating,
          total_reviews: provider.total_reviews,
          profile_completed: provider.profile_completed,
          distance_km: provider.distance,
        };
      })
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    return new Response(
      JSON.stringify({
        success: true,
        providers: nearbyProviders || [],
        center: { lat, lng },
        radius,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});