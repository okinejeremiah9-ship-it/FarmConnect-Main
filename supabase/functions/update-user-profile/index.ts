import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function normalizeArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

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

    const normalizedUser = {
      ...updatedUser,
      crop_types: normalizeArrayField(updatedUser?.crop_types),
      services_offered: normalizeArrayField(updatedUser?.services_offered),
      service_categories: normalizeArrayField(updatedUser?.service_categories),
      equipment_list: normalizeArrayField(updatedUser?.equipment_list),
    };

    return new Response(
      JSON.stringify({
        success: true,
        user: normalizedUser,
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