import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function normalizeArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : String(item)))
      .filter(item => item.length > 0);
  }

  if (typeof value === 'string' && value.length > 0) {
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  return [];
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
Deno.env.get("PROJECT_URL")
Deno.env.get("SERVICE_ROLE_KEY")

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
      .select(`
        id,
        name,
        phone,
        email,
        role,
        email,
        bio,
        profile_pic,
        farm_size,
        crop_types,
        num_workers,
        services_offered,
        business_name,
        contact_person,
        service_categories,
        service_description,
        service_availability,
        pricing_info,
        equipment_list,
        years_experience,
        latitude,
        longitude,
        address,
        rating,
        total_reviews,
        is_verified,
        profile_completed,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      throw new Error('User not found');
    }

    let services = [];
    if (user.role === 'provider') {
      const { data: servicesData } = await supabaseClient
        .from('services')
        .select('*')
        .eq('provider_id', userId);

      services = servicesData || [];
    }

    const { data: reviews } = await supabaseClient
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
      .order('created_at', { ascending: false })
      .limit(10);

    const normalizedUser = {
      ...user,
      crop_types: normalizeArrayField(user.crop_types),
      services_offered: normalizeArrayField(user.services_offered),
      service_categories: normalizeArrayField(user.service_categories),
      equipment_list: normalizeArrayField(user.equipment_list),
    };

    return new Response(
      JSON.stringify({
        success: true,
        user: normalizedUser,
        services: services || [],
        reviews: reviews || [],
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
