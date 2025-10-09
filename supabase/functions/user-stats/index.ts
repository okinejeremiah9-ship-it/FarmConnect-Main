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

    const url = new URL(req.url)
    const userId = url.pathname.split('/').pop()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Verify user exists and get role
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    let stats = {
      activeRequests: 0,
      completedServices: 0,
      totalSpent: 0,
      servicesUsed: 0
    }

    if (user.role === 'farmer') {
      // Active Requests: count of bookings with status pending or accepted
      const { count: activeRequestsCount, error: activeError } = await supabaseClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', userId)
        .in('status', ['pending', 'accepted'])

      if (activeError) {
        console.error('Error fetching active requests:', activeError)
      } else {
        stats.activeRequests = activeRequestsCount || 0
      }

      // Completed Services: count of bookings with status completed
      const { count: completedCount, error: completedError } = await supabaseClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', userId)
        .eq('status', 'completed')

      if (completedError) {
        console.error('Error fetching completed services:', completedError)
      } else {
        stats.completedServices = completedCount || 0
      }

      // Total Spent: sum of escrow_wallet amounts with status released
      const { data: escrowData, error: escrowError } = await supabaseClient
        .from('escrow_wallet')
        .select('amount')
        .eq('farmer_id', userId)
        .eq('status', 'released')

      if (escrowError) {
        console.error('Error fetching escrow data:', escrowError)
      } else {
        stats.totalSpent = escrowData?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0
      }

      // Services Used: count of distinct service categories from completed bookings
      const { data: servicesData, error: servicesError } = await supabaseClient
        .from('bookings')
        .select(`
          services!inner(category)
        `)
        .eq('farmer_id', userId)
        .eq('status', 'completed')

      if (servicesError) {
        console.error('Error fetching services data:', servicesError)
      } else {
        const uniqueCategories = new Set(servicesData?.map(booking => booking.services.category) || [])
        stats.servicesUsed = uniqueCategories.size
      }
    } else if (user.role === 'provider') {
      // For providers, show different stats
      
      // Active Requests: count of bookings with status pending (incoming requests)
      const { count: activeRequestsCount, error: activeError } = await supabaseClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', userId)
        .eq('status', 'pending')

      if (activeError) {
        console.error('Error fetching active requests:', activeError)
      } else {
        stats.activeRequests = activeRequestsCount || 0
      }

      // Completed Services: count of bookings with status completed
      const { count: completedCount, error: completedError } = await supabaseClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', userId)
        .eq('status', 'completed')

      if (completedError) {
        console.error('Error fetching completed services:', completedError)
      } else {
        stats.completedServices = completedCount || 0
      }

      // Total Earned: sum of escrow_wallet amounts with status released
      const { data: escrowData, error: escrowError } = await supabaseClient
        .from('escrow_wallet')
        .select('amount')
        .eq('provider_id', userId)
        .eq('status', 'released')

      if (escrowError) {
        console.error('Error fetching escrow data:', escrowError)
      } else {
        stats.totalSpent = escrowData?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0
      }

      // Services Offered: count of active services
      const { count: servicesCount, error: servicesError } = await supabaseClient
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', userId)

      if (servicesError) {
        console.error('Error fetching services count:', servicesError)
      } else {
        stats.servicesUsed = servicesCount || 0
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        user_role: user.role,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Stats API error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stats: {
          activeRequests: 0,
          completedServices: 0,
          totalSpent: 0,
          servicesUsed: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})