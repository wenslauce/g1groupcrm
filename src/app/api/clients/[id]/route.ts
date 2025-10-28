import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: z.enum(['individual', 'corporate', 'institutional']).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required').optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postal_code: z.string(),
    country: z.string()
  }).optional(),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  compliance_status: z.enum(['pending', 'approved', 'rejected', 'under_review']).optional(),
  kyc_documents: z.array(z.any()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require permission to view clients
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        assets:assets(*),
        skrs:skrs(*),
        invoices:invoices(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
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
    // Require permission to manage clients
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = clientUpdateSchema.parse(body)
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
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
    // Require admin permission to delete clients
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    
    // Check if client has associated SKRs or invoices
    const { data: associations } = await supabase
      .from('clients')
      .select(`
        skrs:skrs(count),
        invoices:invoices(count)
      `)
      .eq('id', params.id)
      .single()
    
    const skrCount = Array.isArray(associations?.skrs) ? (associations?.skrs?.[0]?.count ?? 0) : 0
    const invoiceCount = Array.isArray(associations?.invoices) ? (associations?.invoices?.[0]?.count ?? 0) : 0
    if (skrCount > 0 || invoiceCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing SKRs or invoices' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}