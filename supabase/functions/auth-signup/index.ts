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

    const { name, phone, password, role, admin_invite_token } = await req.json();

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

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .insert({
        name: name || 'User',
        phone: normalizedPhone,
        email: null,
        role,
        password_hash: hashedPassword,
        is_verified: true,
        rating: 0.00,
        total_reviews: 0,
      })
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