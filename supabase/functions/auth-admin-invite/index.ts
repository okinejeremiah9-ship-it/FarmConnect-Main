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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { admin_id } = await req.json()

    if (!admin_id) {
      throw new Error('Admin ID is required')
    }

    // Verify the requesting user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', admin_id)
      .eq('role', 'admin')
      .single()

    if (adminError || !admin) {
      throw new Error('Unauthorized: Admin access required')
    }

    // Generate secure invite token
    const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('admin_invites')
      .insert({
        invite_token: inviteToken,
        invited_by: admin_id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      throw new Error('Failed to create invite: ' + inviteError.message)
    }

    // Generate invite URL
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'http://localhost:5173'
    const inviteUrl = `${baseUrl}/admin-signup?token=${inviteToken}`

    return new Response(
      JSON.stringify({
        success: true,
        invite_token: inviteToken,
        invite_url: inviteUrl,
        expires_at: expiresAt.toISOString(),
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
