import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { skrFormSchema } from '@/lib/validations/skr'
import { generateSKRNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    // Require permission to view SKRs
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const client_id = searchParams.get('client_id') || ''
    const asset_id = searchParams.get('asset_id') || ''
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('skrs')
      .select(`
        *,
        client:clients(*),
        asset:assets(*),
        tracking:tracking(*),
        invoices:invoices(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`skr_number.ilike.%${search}%,remarks.ilike.%${search}%`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    
    if (asset_id) {
      query = query.eq('asset_id', asset_id)
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to)
    }
    
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Calculate stats from the data
    const stats = {
      total: count || 0,
      draft: data?.filter(skr => skr.status === 'draft').length || 0,
      approved: data?.filter(skr => skr.status === 'approved').length || 0,
      issued: data?.filter(skr => skr.status === 'issued').length || 0,
      in_transit: data?.filter(skr => skr.status === 'in_transit').length || 0,
      delivered: data?.filter(skr => skr.status === 'delivered').length || 0,
      closed: data?.filter(skr => skr.status === 'closed').length || 0
    }

    // Map data to expected format
    const skrs = data?.map(skr => ({
      id: skr.id,
      skr_number: skr.skr_number,
      client_id: skr.client_id,
      client_name: skr.client?.name || 'Unknown Client',
      asset_id: skr.asset_id,
      asset_description: skr.asset?.asset_name || 'Unknown Asset',
      status: skr.status,
      issue_date: skr.issue_date,
      created_at: skr.created_at,
      hash: skr.hash
    })) || []

    return NextResponse.json({
      skrs,
      stats,
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
    // Require permission to create SKRs
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = skrFormSchema.parse(body)
    
    const supabase = createClient()
    
    // Generate SKR number
    const skrNumber = generateSKRNumber()
    
    // Verify client and asset exist
    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', validatedData.client_id)
      .single()
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    const { data: asset } = await supabase
      .from('assets')
      .select('id, asset_name, client_id')
      .eq('id', validatedData.asset_id)
      .single()
    
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    
    // Verify asset belongs to the specified client
    if (asset.client_id !== validatedData.client_id) {
      return NextResponse.json({ error: 'Asset does not belong to the specified client' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('skrs')
      .insert({
        skr_number: skrNumber,
        client_id: validatedData.client_id,
        asset_id: validatedData.asset_id,
        status: 'draft',
        remarks: validatedData.remarks,
        metadata: validatedData.metadata || {}
      })
      .select(`
        *,
        client:clients(*),
        asset:assets(*)
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
