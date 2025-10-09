import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { phone, otp } = await req.json()

    if (!phone || !otp) {
      throw new Error('Phone and OTP are required')
    }

    // Use the database function to verify OTP
    const { data, error } = await supabaseClient
      .rpc('verify_user_otp', {
        user_phone: phone,
        provided_otp: otp,
      })

    if (error) {
      throw new Error('Verification failed: ' + error.message)
    }

    const result = data as { success: boolean; error?: string; message?: string }

    if (!result.success) {
      throw new Error(result.error || 'OTP verification failed')
    }

    // Get the verified user
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, phone, role, is_verified')
      .eq('phone', phone)
      .single()

    if (userError || !user) {
      throw new Error('User not found after verification')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP verified successfully',
        user,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})