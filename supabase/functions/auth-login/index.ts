import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalize Ghana phone numbers
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +233
  if (digitsOnly.startsWith('0')) {
    return '+233' + digitsOnly.substring(1);
  }
  
  // If starts with 233, add +
  if (digitsOnly.startsWith('233')) {
    return '+' + digitsOnly;
  }
  
  // If already has +233, return as is
  if (phone.startsWith('+233')) {
    return phone;
  }
  
  // Default: assume it's a local number and add +233
  return '+233' + digitsOnly;
}

// Simple bcrypt-like hash function for demo (use proper bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const salt = 'farmconnect_salt_2025';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    const { phone, password, fetch_user_only } = await req.json()

    // Validate required fields
    if (!phone || (!password && !fetch_user_only)) {
      throw new Error('Phone number and password are required')
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Validate Ghana phone number format
    if (!normalizedPhone.match(/^\+233\d{9}$/)) {
      throw new Error('Invalid phone number format. Please use format: 0XXXXXXXXX or +233XXXXXXXXX')
    }

    // Find user by phone
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, phone, role, password_hash, is_verified, created_at')
      .eq('phone', normalizedPhone)
      .single()

    if (userError || !user) {
      throw new Error('Invalid phone number')
    }

    // Check if account is verified
    if (!user.is_verified) {
      throw new Error('Account not verified')
    }

    // Skip password verification if fetch_user_only is true
    if (!fetch_user_only) {
      // Hash provided password and compare
      const hashedPassword = await hashPassword(password);
      
      if (hashedPassword !== user.password_hash) {
        throw new Error('Incorrect password')
      }
    }

    // Return user data (excluding password hash)
    const userData = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified,
      created_at: user.created_at,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login successful',
        user: userData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})