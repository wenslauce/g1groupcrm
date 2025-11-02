import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { skrNumber: string } }
) {
  try {
    const supabase = createClient()
    
    // Decode SKR number
    const skrNumber = decodeURIComponent(params.skrNumber)
    
    // First, verify the SKR exists
    const { data: skr, error: skrError } = await supabase
      .from('skrs')
      .select('id, skr_number, status')
      .eq('skr_number', skrNumber)
      .single()
    
    if (skrError || !skr) {
      return NextResponse.json(
        { 
          success: false,
          error: 'SKR not found',
          skr_number: skrNumber
        },
        { status: 404 }
      )
    }

    // Fetch tracking data for this SKR
    const { data: trackingData, error: trackingError } = await supabase
      .from('tracking')
      .select(`
        id,
        tracking_number,
        status,
        current_location,
        current_country,
        estimated_delivery,
        actual_delivery,
        notes,
        created_at,
        updated_at
      `)
      .eq('skr_id', skr.id)
      .order('created_at', { ascending: false })

    if (trackingError) {
      console.error('Tracking fetch error:', trackingError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tracking data'
        },
        { status: 500 }
      )
    }

    // Fetch tracking events/history
    const { data: trackingEvents, error: eventsError } = await supabase
      .from('tracking_events')
      .select(`
        id,
        event_type,
        event_date,
        location,
        country,
        description,
        created_at
      `)
      .eq('skr_id', skr.id)
      .order('event_date', { ascending: false })

    if (eventsError) {
      console.error('Tracking events fetch error:', eventsError)
    }

    // Return combined tracking information
    return NextResponse.json(
      {
        success: true,
        skr_number: skr.skr_number,
        skr_status: skr.status,
        tracking: trackingData || [],
        events: trackingEvents || [],
        last_updated: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    )
  } catch (error) {
    console.error('Tracking API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Tracking service temporarily unavailable'
      },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

