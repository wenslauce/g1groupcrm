import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view receipts
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        invoices(
          id,
          invoice_number,
          amount,
          currency,
          status,
          clients(id, name, email),
          skrs(id, skr_number)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin permission to delete receipts
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Get receipt details first
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('id, invoice_id, amount')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }
    
    // Delete the receipt
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Update invoice status if needed (check remaining payments)
    const { data: remainingReceipts } = await supabase
      .from('receipts')
      .select('amount')
      .eq('invoice_id', receipt.invoice_id)
    
    const { data: invoice } = await supabase
      .from('invoices')
      .select('amount, status')
      .eq('id', receipt.invoice_id)
      .single()
    
    if (invoice && remainingReceipts) {
      const totalPaid = remainingReceipts.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0)
      const invoiceAmount = parseFloat(invoice.amount.toString())
      
      // If invoice was paid but now has less payments, update status
      if (invoice.status === 'paid' && totalPaid < invoiceAmount) {
        await supabase
          .from('invoices')
          .update({ status: 'sent' })
          .eq('id', receipt.invoice_id)
      }
    }
    
    return NextResponse.json({ message: 'Receipt deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}