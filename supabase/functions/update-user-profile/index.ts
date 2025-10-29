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

    const { user_id, ...updates } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Validate user exists
    const { data: existingUser, error: userError } = await supabaseClient
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .maybeSingle();

    if (userError || !existingUser) {
      throw new Error('User not found');
    }

    // Prepare update object with all allowed profile fields
    const allowedFields = [
      'name', 'email', 'bio', 'profile_pic', 'address',
      'latitude', 'longitude',
      // Farmer fields
      'farm_size', 'crop_types', 'num_workers',
      // Provider fields
      'business_name', 'contact_person', 'service_categories', 'services_offered',
      'service_description', 'service_availability', 'pricing_info',
      'equipment_list', 'years_experience',
      // Profile completion
      'profile_completed'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseClient
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      throw new Error('Failed to update profile: ' + updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: updatedUser,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});