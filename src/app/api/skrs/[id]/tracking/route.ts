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
        *,
        updated_by_profile:user_profiles!tracking_updated_by_fkey(full_name)
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
    
    return NextResponse.json({ data })
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
    
    const { data, error } = await supabase
      .from('tracking')
      .insert({
        skr_id: params.id,
        current_location: body.current_location,
        status: body.status,
        coordinates: body.coordinates ? `(${body.coordinates.lat},${body.coordinates.lng})` : null,
        notes: body.notes,
        updated_by: user.id
      })
      .select(`
        *,
        updated_by_profile:user_profiles!tracking_updated_by_fkey(full_name)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}