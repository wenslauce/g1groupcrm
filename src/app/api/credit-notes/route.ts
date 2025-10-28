import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const creditNoteSchema = z.object({
  invoice_id: z.string().uuid(),
  client_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  reason: z.enum(['return', 'discount', 'error', 'cancellation', 'other']),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number(),
    total: z.number()
  })).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require permission to view credit notes
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const clientId = searchParams.get('client_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('credit_notes')
      .select(`
        *,
        invoice:invoices(
          id,
          invoice_number,
          amount,
          status
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`credit_note_number.ilike.%${search}%,reason.ilike.%${search}%`)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo)
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
    // Require permission to create credit notes
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = creditNoteSchema.parse(body)
    
    const supabase = createClient()
    
    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber(supabase)
    
    // Verify invoice exists and is accessible
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, currency, status')
      .eq('id', validatedData.invoice_id)
      .single()
    
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found or not accessible' }, { status: 404 })
    }
    
    // Check if invoice can receive credit notes
    if (invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot create credit note for cancelled invoice' }, { status: 400 })
    }
    
    // Verify currency matches
    if (invoice.currency !== validatedData.currency) {
      return NextResponse.json({ error: 'Currency must match invoice currency' }, { status: 400 })
    }
    
    // Check existing credit notes
    const { data: existingCreditNotes } = await supabase
      .from('credit_notes')
      .select('amount')
      .eq('invoice_id', validatedData.invoice_id)
    
    const totalCredited = (existingCreditNotes || []).reduce((sum, cn) => sum + parseFloat(cn.amount.toString()), 0)
    const maxCreditAmount = parseFloat(invoice.amount.toString()) - totalCredited
    
    if (validatedData.amount > maxCreditAmount) {
      return NextResponse.json(
        { error: `Credit amount exceeds maximum creditable amount of ${maxCreditAmount.toFixed(2)}` },
        { status: 400 }
      )
    }
    
    // Create credit note
    const { data, error } = await supabase
      .from('credit_notes')
      .insert({
        credit_note_number: creditNoteNumber,
        reference_invoice: validatedData.invoice_id,
        amount: validatedData.amount,
        reason: validatedData.reason,
        issue_date: new Date().toISOString()
      })
      .select(`
        *,
        invoice:invoices(
          id,
          invoice_number,
          amount
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

async function generateCreditNoteNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('credit_notes')
    .select('*', { count: 'exact', head: true })
    .like('credit_note_number', `CN-${year}-%`)
  
  const nextNumber = (count || 0) + 1
  return `CN-${year}-${nextNumber.toString().padStart(5, '0')}`
}
