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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
    const availability = url.searchParams.get('availability');

    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    let query = supabaseClient
      .from('users')
      .select(`
        id,
        name,
        full_name,
        profile_pic,
        bio,
        address,
        services_offered,
        latitude,
        longitude,
        rating,
        total_reviews
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
          return provider.services_offered?.includes(category);
        }
        
        return true;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});