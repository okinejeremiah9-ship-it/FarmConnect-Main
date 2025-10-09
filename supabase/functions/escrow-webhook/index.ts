import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
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

    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // Verify Paystack signature
    const hash = await crypto.subtle.digest(
      'SHA-512',
      new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY') + body)
    )
    const expectedSignature = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature')
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data

      // Update escrow status to funded
      const { error: updateError } = await supabaseClient
        .from('escrow_wallet')
        .update({
          status: 'funded',
          paystack_transaction_id: event.data.id,
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference)

      if (updateError) {
        throw new Error('Failed to update escrow status')
      }

      // Update booking status to accepted (auto-accept when payment is made)
      if (metadata.booking_id) {
        await supabaseClient
          .from('bookings')
          .update({
            status: 'accepted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', metadata.booking_id)
      }

      console.log(`Escrow funded for reference: ${reference}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})