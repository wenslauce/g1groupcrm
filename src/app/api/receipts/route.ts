import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const receiptSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.string(),
  payment_reference: z.string().optional(),
  notes: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require permission to view receipts
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const invoiceId = searchParams.get('invoice_id') || ''
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('receipts')
      .select(`
        *,
        invoices(
          id,
          invoice_number,
          amount,
          status,
          clients(id, name, email),
          skrs(id, skr_number)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`receipt_number.ilike.%${search}%,payment_reference.ilike.%${search}%`)
    }
    
    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
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
    // Require permission to create receipts
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = receiptSchema.parse(body)
    
    const supabase = createClient()
    
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(supabase)
    
    // Verify invoice exists and is accessible
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, currency, status')
      .eq('id', validatedData.invoice_id)
      .single()
    
    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found or not accessible' }, { status: 404 })
    }
    
    // Check if invoice can receive payments
    if (['paid', 'cancelled'].includes(invoice.status)) {
      return NextResponse.json({ error: `Cannot add payment to ${invoice.status} invoice` }, { status: 400 })
    }
    
    // Check existing payments
    const { data: existingReceipts } = await supabase
      .from('receipts')
      .select('amount')
      .eq('invoice_id', validatedData.invoice_id)
    
    const totalPaid = (existingReceipts || []).reduce((sum, receipt) => sum + parseFloat(receipt.amount.toString()), 0)
    const remainingAmount = parseFloat(invoice.amount.toString()) - totalPaid
    
    if (validatedData.amount > remainingAmount) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining balance of ${remainingAmount.toFixed(2)}` },
        { status: 400 }
      )
    }
    
    // Create receipt
    const { data, error } = await supabase
      .from('receipts')
      .insert({
        receipt_number: receiptNumber,
        invoice_id: validatedData.invoice_id,
        amount: validatedData.amount,
        payment_method: validatedData.payment_method,
        payment_reference: validatedData.payment_reference,
        issue_date: new Date().toISOString()
      })
      .select(`
        *,
        invoices(
          id,
          invoice_number,
          amount,
          skrs(id, skr_number)
        )
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + validatedData.amount
    if (newTotalPaid >= parseFloat(invoice.amount.toString())) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', validatedData.invoice_id)
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

async function generateReceiptNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .like('receipt_number', `REC-${year}-%`)
  
  const nextNumber = (count || 0) + 1
  return `REC-${year}-${nextNumber.toString().padStart(5, '0')}`
}
