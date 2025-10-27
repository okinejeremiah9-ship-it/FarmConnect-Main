import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// DEV MODE: Set to false after initial admin setup
const DEV_MODE_ALLOW_ADMIN_SIGNUP = true;

function normalizePhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.startsWith('0')) {
    return '+233' + digitsOnly.substring(1);
  }
  
  if (digitsOnly.startsWith('233')) {
    return '+' + digitsOnly;
  }
  
  if (phone.startsWith('+233')) {
    return phone;
  }
  
  return '+233' + digitsOnly;
}

async function hashPassword(password: string): Promise<string> {
  const salt = 'farmconnect_salt_2025';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function toIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
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
      name,
      phone,
      password,
      role,
      admin_invite_token,
      email,
      address,
      latitude,
      longitude,
      profile_completed,
      ...roleSpecificFields
    } = await req.json();

    if (!phone || !password || !role) {
      throw new Error('Missing required fields: phone, password, and role are required');
    }

    if (!['farmer', 'provider', 'admin'].includes(role)) {
      throw new Error('Invalid role. Must be farmer, provider, or admin');
    }

    // Admin role validation
    if (role === 'admin') {
      // In DEV MODE, allow admin signup without invite token
      if (!DEV_MODE_ALLOW_ADMIN_SIGNUP && !admin_invite_token) {
        throw new Error('Admin registration requires a valid invite token');
      }
      
      // If invite token provided, validate it
      if (admin_invite_token) {
        const { data: invite, error: inviteError } = await supabaseClient
          .from('admin_invites')
          .select('*')
          .eq('invite_token', admin_invite_token)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (inviteError || !invite) {
          throw new Error('Invalid or expired admin invite token');
        }
      }
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone.match(/^\+233\d{9}$/)) {
      throw new Error('Invalid Ghana phone number format. Please use format: 0XXXXXXXXX or +233XXXXXXXXX');
    }

    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id, phone')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Phone number already registered. Please use a different number or try logging in.');
    }

    const hashedPassword = await hashPassword(password);

    const latitudeValue = toNumberOrNull(latitude);
    const longitudeValue = toNumberOrNull(longitude);

    const insertData: Record<string, any> = {
      name: name || 'User',
      phone: normalizedPhone,
      email: email ?? null,
      role,
      password_hash: hashedPassword,
      is_verified: true,
      rating: 0.0,
      total_reviews: 0,
      address: address ?? null,
      latitude: latitudeValue,
      longitude: longitudeValue,
    };

    if (typeof profile_completed === 'boolean') {
      insertData.profile_completed = profile_completed;
    } else if (role !== 'admin') {
      insertData.profile_completed = false;
    }

    if (role === 'farmer') {
      const cropTypes = toStringArray(roleSpecificFields.crop_types);
      const numWorkers = toIntOrNull(roleSpecificFields.num_workers);

      if (!roleSpecificFields.farm_size || cropTypes.length === 0) {
        throw new Error('Farmer registration requires farm size and crop types');
      }

      insertData.farm_size = roleSpecificFields.farm_size;
      insertData.crop_types = cropTypes.length > 0 ? cropTypes : null;
      insertData.num_workers = numWorkers;
    }

    if (role === 'provider') {
      const serviceCategories = toStringArray(roleSpecificFields.service_categories);
      const yearsExperience = toIntOrNull(roleSpecificFields.years_experience);

      if (!roleSpecificFields.business_name || serviceCategories.length === 0 || !roleSpecificFields.service_description) {
        throw new Error('Provider registration requires business details and service information');
      }

      insertData.name = roleSpecificFields.contact_person || name || 'User';
      insertData.business_name = roleSpecificFields.business_name;
      insertData.contact_person = roleSpecificFields.contact_person || name || null;
      insertData.service_categories = serviceCategories.length > 0 ? serviceCategories : null;
      insertData.service_description = roleSpecificFields.service_description;
      insertData.pricing_info = roleSpecificFields.pricing_info ?? null;
      insertData.years_experience = yearsExperience;
    }

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .insert(insertData)
      .select('id, name, phone, role, is_verified, created_at')
      .maybeSingle();

    if (userError || !user) {
      console.error('Database error:', userError);
      throw new Error('Failed to create user account: ' + userError?.message);
    }

    if (role === 'admin' && admin_invite_token) {
      await supabaseClient
        .from('admin_invites')
        .update({
          is_used: true,
          used_by: user.id,
        })
        .eq('invite_token', admin_invite_token);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified,
          created_at: user.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});