import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const locationUpdateSchema = z.object({
  location: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view tracking data
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    // Get all tracking records for this SKR
    const { data, error } = await supabase
      .from('tracking')
      .select(`
        *,
        recorded_by_user:user_profiles!recorded_by(id, full_name)
      `)
      .eq('skr_id', params.id)
      .order('created_at', { ascending: false })
    
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
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = locationUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    // Verify SKR exists and is accessible
    const { data: skr, error: skrError } = await supabase
      .from('skrs')
      .select('id, skr_number, status')
      .eq('id', params.id)
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
        skr_id: params.id,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        notes: validatedData.notes,
        recorded_by: user.id
      })
      .select(`
        *,
        recorded_by_user:user_profiles!recorded_by(id, full_name)
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
