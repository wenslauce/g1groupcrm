import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const trackingRecordSchema = z.object({
  skr_id: z.string().uuid(),
  location: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require permission to view tracking data
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skrId = searchParams.get('skr_id') || ''
    const location = searchParams.get('location') || ''
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('tracking')
      .select(`
        *,
        skr:skrs(
          id,
          skr_number,
          status,
          client:clients(id, name),
          asset:assets(id, asset_name, asset_type)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (skrId) {
      query = query.eq('skr_id', skrId)
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({
      data,
      count,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require permission to create tracking records
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = trackingRecordSchema.parse(body)
    
    const supabase = createClient()
    
    // Verify SKR exists and is accessible
    const { data: skr, error: skrError } = await supabase
      .from('skrs')
      .select('id, skr_number, status')
      .eq('id', validatedData.skr_id)
      .single()
    
    if (skrError || !skr) {
      return NextResponse.json({ error: 'SKR not found or not accessible' }, { status: 404 })
    }
    
    // Validate coordinates if provided
    if (validatedData.latitude !== undefined && validatedData.longitude !== undefined) {
      if (validatedData.latitude < -90 || validatedData.latitude > 90 ||
          validatedData.longitude < -180 || validatedData.longitude > 180) {
        return NextResponse.json({ error: 'Invalid coordinates provided' }, { status: 400 })
      }
    }
    
    // Create tracking record
    const { data, error } = await supabase
      .from('tracking')
      .insert({
        skr_id: validatedData.skr_id,
        current_location: validatedData.location,
        status: 'in_transit', // Set appropriate status
        coordinates: validatedData.latitude && validatedData.longitude 
          ? `(${validatedData.longitude},${validatedData.latitude})` 
          : null,
        notes: validatedData.notes,
        updated_by: user.id
      })
      .select(`
        *,
        skr:skrs(
          id,
          skr_number,
          status,
          client:clients(id, name),
          asset:assets(id, asset_name)
        )
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
