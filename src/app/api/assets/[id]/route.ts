import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth'
import { assetUpdateSchema } from '@/lib/validations/skr'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view assets
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        client:clients(*),
        skrs:skrs(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
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
    // Require permission to manage assets
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = assetUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('assets')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: (error as any).errors },
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
    // Require admin permission to delete assets
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Check if asset has associated SKRs
    const { data: skrs } = await supabase
      .from('skrs')
      .select('id')
      .eq('asset_id', params.id)
      .limit(1)
    
    if (skrs && skrs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete asset with existing SKRs' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}