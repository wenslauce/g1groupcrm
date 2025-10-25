import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { assetFormSchema } from '@/lib/validations/skr'

export async function GET(request: NextRequest) {
  try {
    // Require permission to view assets
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const client_id = searchParams.get('client_id') || ''
    const asset_type = searchParams.get('asset_type') || ''
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('assets')
      .select(`
        *,
        client:clients(*),
        skrs:skrs(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`asset_name.ilike.%${search}%,asset_type.ilike.%${search}%`)
    }
    
    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    
    if (asset_type) {
      query = query.eq('asset_type', asset_type)
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
    // Require permission to manage assets
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = assetFormSchema.parse(body)
    
    const supabase = createClient()
    
    // Verify client exists
    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', validatedData.client_id)
      .single()
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    const { data, error } = await supabase
      .from('assets')
      .insert(validatedData)
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data }, { status: 201 })
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
