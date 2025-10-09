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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { 
      farmer_id, 
      service_id, 
      provider_id, 
      scheduled_date, 
      duration, 
      total_price, 
      service_location, 
      notes 
    } = await req.json()

    // Validate required fields
    if (!farmer_id || !service_id || !provider_id || !scheduled_date || !duration || !total_price || !service_location) {
      throw new Error('Missing required booking fields')
    }

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        farmer_id,
        service_id,
        provider_id,
        status: 'pending',
        scheduled_date,
        duration,
        total_price,
        service_location,
        notes: notes || null,
      })
      .select()
      .single()

    if (bookingError) {
      throw new Error('Failed to create booking: ' + bookingError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        booking,
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