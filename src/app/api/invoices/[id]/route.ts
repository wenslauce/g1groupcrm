import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const invoiceUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  due_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view invoices
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
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
        receipts(*),
        credit_notes(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
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
    // Require permission to manage invoices
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = invoiceUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    // Get current invoice to validate status transitions
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    
    // Validate status transition if status is being updated
    if (validatedData.status && validatedData.status !== currentInvoice.status) {
      if (!canTransitionInvoiceStatus(currentInvoice.status, validatedData.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentInvoice.status} to ${validatedData.status}` },
          { status: 400 }
        )
      }
    }
    
    // Prevent editing of paid or cancelled invoices (except specific fields)
    if (['paid', 'cancelled'].includes(currentInvoice.status)) {
      const allowedFields = ['status', 'notes', 'metadata']
      const updateFields = Object.keys(validatedData)
      const restrictedFields = updateFields.filter(field => !allowedFields.includes(field))
      
      if (restrictedFields.length > 0) {
        return NextResponse.json(
          { error: `Cannot modify ${restrictedFields.join(', ')} - invoice is ${currentInvoice.status}` },
          { status: 400 }
        )
      }
    }
    
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        clients(id, name, email),
        skrs(
          id,
          skr_number,
          assets(id, asset_name)
        ),
        receipts(*)
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
    // Require admin permission to delete invoices
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Check if invoice can be deleted (only drafts should be deletable)
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status, receipts(id), credit_notes(id)')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      )
    }
    
    if (invoice.receipts && invoice.receipts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoice with associated receipts' },
        { status: 400 }
      )
    }
    
    if (invoice.credit_notes && invoice.credit_notes.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoice with associated credit notes' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate invoice status transitions
function canTransitionInvoiceStatus(from: string, to: string): boolean {
  const validTransitions: Record<string, string[]> = {
    draft: ['sent', 'cancelled'],
    sent: ['paid', 'overdue', 'cancelled'],
    overdue: ['paid', 'cancelled'],
    paid: [], // Cannot transition from paid
    cancelled: [] // Cannot transition from cancelled
  }
  
  return validTransitions[from]?.includes(to) || false
}
