import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const creditNoteUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.enum(['return', 'discount', 'error', 'cancellation', 'other']).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view credit notes
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('credit_notes')
      .select(`
        *,
        invoice:invoices(
          id,
          invoice_number,
          amount,
          currency,
          status,
          clients(id, name, email)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
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
    // Require permission to manage credit notes
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = creditNoteUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    // Get current credit note
    const { data: currentCreditNote, error: fetchError } = await supabase
      .from('credit_notes')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !currentCreditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }
    
    // If amount is being changed, validate against invoice
    if (validatedData.amount && validatedData.amount !== currentCreditNote.amount) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('amount')
        .eq('id', currentCreditNote.reference_invoice)
        .single()
      
      if (invoice) {
        const { data: otherCreditNotes } = await supabase
          .from('credit_notes')
          .select('amount')
          .eq('reference_invoice', currentCreditNote.reference_invoice)
          .neq('id', params.id)
        
        const otherCreditsTotal = (otherCreditNotes || []).reduce((sum, cn) => sum + parseFloat(cn.amount.toString()), 0)
        const maxAmount = parseFloat(invoice.amount.toString()) - otherCreditsTotal
        
        if (validatedData.amount > maxAmount) {
          return NextResponse.json(
            { error: `Credit amount cannot exceed ${maxAmount.toFixed(2)}` },
            { status: 400 }
          )
        }
      }
    }
    
    const { data, error } = await supabase
      .from('credit_notes')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
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
    // Require admin permission to delete credit notes
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Check if credit note exists
    const { data: creditNote, error: fetchError } = await supabase
      .from('credit_notes')
      .select('id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }
    
    const { error } = await supabase
      .from('credit_notes')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Credit note deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}