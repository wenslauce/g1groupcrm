import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const invoiceSchema = z.object({
  client_id: z.string().uuid(),
  skr_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  due_date: z.string().datetime().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require permission to view invoices
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const clientId = searchParams.get('client_id') || ''
    const skrId = searchParams.get('skr_id') || ''
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients(id, name, email, type, country),
        skrs(
          id,
          skr_number,
          status,
          assets(id, asset_name, asset_type)
        ),
        receipts(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (skrId) {
      query = query.eq('skr_id', skrId)
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
    // Require permission to create invoices
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = invoiceSchema.parse(body)
    
    const supabase = createClient()
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase)
    
    // Verify client exists and is accessible
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, compliance_status')
      .eq('id', validatedData.client_id)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found or not accessible' }, { status: 404 })
    }
    
    if (client.compliance_status !== 'approved') {
      return NextResponse.json({ error: 'Client must have approved compliance status' }, { status: 400 })
    }
    
    // Verify SKR if provided
    if (validatedData.skr_id) {
      const { data: skr, error: skrError } = await supabase
        .from('skrs')
        .select('id, skr_number, client_id')
        .eq('id', validatedData.skr_id)
        .eq('client_id', validatedData.client_id)
        .single()
      
      if (skrError || !skr) {
        return NextResponse.json({ error: 'SKR not found or does not belong to client' }, { status: 404 })
      }
    }
    
    // Set due date if not provided (30 days from now)
    const dueDate = validatedData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Create invoice
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: validatedData.client_id,
        skr_id: validatedData.skr_id,
        amount: validatedData.amount,
        currency: validatedData.currency,
        due_date: dueDate,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        clients(id, name, email),
        skrs(
          id,
          skr_number,
          assets(id, asset_name)
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

async function generateInvoiceNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `INV-${year}-%`)
  
  const nextNumber = (count || 0) + 1
  return `INV-${year}-${nextNumber.toString().padStart(5, '0')}`
}
