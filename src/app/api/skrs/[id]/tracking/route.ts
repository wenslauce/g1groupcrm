import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view SKRs
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || ''
    const location = searchParams.get('location') || ''
    
    let query = supabase
      .from('tracking')
      .select(`
        *
      `)
      .eq('skr_id', params.id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (location) {
      query = query.ilike('current_location', `%${location}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Fetch user profiles for all unique updated_by IDs
    const userIds = [...new Set(data?.map(r => r.updated_by).filter(Boolean))]
    const userProfiles: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds)
      
      profiles?.forEach(profile => {
        userProfiles[profile.id] = profile
      })
    }
    
    // Transform tracking data to match TrackingRecord type
    const transformedData = data?.map(record => {
      // Parse coordinates from POINT to lat/lng
      let latitude, longitude
      if (record.coordinates) {
        const coords = record.coordinates.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/)
        if (coords) {
          longitude = parseFloat(coords[1])
          latitude = parseFloat(coords[2])
        }
      }
      
      const userProfile = record.updated_by ? userProfiles[record.updated_by] : null
      
      return {
        ...record,
        latitude,
        longitude,
        location: record.current_location, // Alias for component compatibility
        recorded_by_user: userProfile ? {
          id: userProfile.id,
          name: userProfile.full_name
        } : undefined,
        isLatest: record.is_latest || false
      }
    }) || []
    
    return NextResponse.json({ data: transformedData })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to update tracking
    const user = await authServer.requireRole(['admin', 'operations'])
    
    const body = await request.json()
    const supabase = createClient()
    
    // Verify SKR exists
    const { data: skr } = await supabase
      .from('skrs')
      .select('id, skr_number')
      .eq('id', params.id)
      .single()
    
    if (!skr) {
      return NextResponse.json({ error: 'SKR not found' }, { status: 404 })
    }
    
    const insertResult = await supabase
      .from('tracking')
      .insert({
        skr_id: params.id,
        current_location: body.current_location,
        status: body.status,
        coordinates: body.coordinates ? `(${body.coordinates.lng},${body.coordinates.lat})` : null,
        notes: body.notes,
        updated_by: user.id
      })
      .select('*')
      .single()
    
    if (insertResult.error) {
      return NextResponse.json({ error: insertResult.error.message }, { status: 400 })
    }
    
    // Mark all other records as not latest
    await supabase
      .from('tracking')
      .update({ is_latest: false })
      .eq('skr_id', params.id)
      .neq('id', insertResult.data.id)
    
    // Mark this record as latest
    const { data, error } = await supabase
      .from('tracking')
      .update({ is_latest: true })
      .eq('id', insertResult.data.id)
      .select('*')
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single()
    
    // Transform the data
    let latitude, longitude
    if (data.coordinates) {
      const coords = data.coordinates.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/)
      if (coords) {
        longitude = parseFloat(coords[1])
        latitude = parseFloat(coords[2])
      }
    }
    
    const transformedData = {
      ...data,
      latitude,
      longitude,
      location: data.current_location,
      recorded_by_user: userProfile ? {
        id: userProfile.id,
        name: userProfile.full_name
      } : undefined,
      isLatest: data.is_latest || false
    }
    
    return NextResponse.json({ data: transformedData }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}