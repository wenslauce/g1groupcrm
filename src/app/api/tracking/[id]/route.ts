import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const trackingUpdateSchema = z.object({
  location: z.string().optional(),
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
    
    const { data, error } = await supabase
      .from('tracking')
      .select(`
        *,
        skr:skrs(
          id,
          skr_number,
          status,
          client:clients(id, name),
          asset:assets(id, asset_name, asset_type)
        ),
        recorded_by_user:user_profiles!recorded_by(id, full_name)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tracking record not found' }, { status: 404 })
      }
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to update tracking records
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = trackingUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    // Get current tracking record
    const { data: currentRecord, error: fetchError } = await supabase
      .from('tracking')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !currentRecord) {
      return NextResponse.json({ error: 'Tracking record not found' }, { status: 404 })
    }
    
    // Validate coordinates if provided
    if (validatedData.latitude !== undefined && validatedData.longitude !== undefined) {
      if (validatedData.latitude < -90 || validatedData.latitude > 90 ||
          validatedData.longitude < -180 || validatedData.longitude > 180) {
        return NextResponse.json({ error: 'Invalid coordinates provided' }, { status: 400 })
      }
    }
    
    const { data, error } = await supabase
      .from('tracking')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        skr:skrs(
          id,
          skr_number,
          status,
          client:clients(id, name),
          asset:assets(id, asset_name)
        ),
        recorded_by_user:user_profiles!recorded_by(id, full_name)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin permission to delete tracking records
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('tracking')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Tracking record deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
