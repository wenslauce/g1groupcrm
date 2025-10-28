import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { skrUpdateSchema } from '@/lib/validations/skr'
import { skrUtils } from '@/lib/skr-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view SKRs
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('skrs')
      .select(`
        *,
        client:clients(*),
        asset:assets(*),
        tracking:tracking(*),
        invoices:invoices(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'SKR not found' }, { status: 404 })
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
    // Require permission to manage SKRs
    const user = await authServer.requireRole(['admin', 'finance', 'operations'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = skrUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    // Get current SKR to validate status transitions
    const { data: currentSKR } = await supabase
      .from('skrs')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!currentSKR) {
      return NextResponse.json({ error: 'SKR not found' }, { status: 404 })
    }
    
    // Validate status transition if status is being updated
    if (validatedData.status && validatedData.status !== currentSKR.status) {
      if (!skrUtils.canTransitionTo(currentSKR.status, validatedData.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentSKR.status} to ${validatedData.status}` },
          { status: 400 }
        )
      }
    }
    
    // If transitioning to 'issued', generate hash and set issue date
    const updateData: any = { ...validatedData }
    
    if (validatedData.status === 'issued' && currentSKR.status !== 'issued') {
      const issueDate = new Date().toISOString()
      const hash = skrUtils.generateSKRHash({
        skr_number: currentSKR.skr_number,
        client_id: currentSKR.client_id,
        asset_id: currentSKR.asset_id,
        issue_date: issueDate
      })
      
      updateData.issue_date = issueDate
      updateData.issued_by = user.id
      updateData.hash = hash
    }
    
    const { data, error } = await supabase
      .from('skrs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        client:clients(*),
        asset:assets(*),
        tracking:tracking(*)
      `)
      .single()
    
    if (error) {
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
    // Require admin permission to delete SKRs
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Check if SKR can be deleted (only drafts can be deleted)
    const { data: skr } = await supabase
      .from('skrs')
      .select('status')
      .eq('id', params.id)
      .single()
    
    if (!skr) {
      return NextResponse.json({ error: 'SKR not found' }, { status: 404 })
    }
    
    if (skr.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft SKRs can be deleted' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('skrs')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'SKR deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}