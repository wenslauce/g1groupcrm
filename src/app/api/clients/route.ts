import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['individual', 'corporate', 'institutional']),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postal_code: z.string(),
    country: z.string()
  }).optional(),
  risk_level: z.enum(['low', 'medium', 'high']).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require permission to view clients
    const user = await authServer.requireRole(['admin', 'finance', 'operations', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const risk_level = searchParams.get('risk_level') || ''
    const compliance_status = searchParams.get('compliance_status') || ''
    const country = searchParams.get('country') || ''
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('clients')
      .select(`
        *,
        assets:assets(count),
        skrs:skrs(count),
        invoices:invoices(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    if (type) {
      query = query.eq('type', type)
    }
    
    if (risk_level) {
      query = query.eq('risk_level', risk_level)
    }
    
    if (compliance_status) {
      query = query.eq('compliance_status', compliance_status)
    }
    
    if (country) {
      query = query.eq('country', country)
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
    // Require permission to manage clients
    const user = await authServer.requireRole(['admin', 'finance'])
    
    const body = await request.json()
    
    // Validate request body
    const validatedData = clientSchema.parse(body)
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        risk_level: validatedData.risk_level || 'medium',
        compliance_status: 'pending'
      })
      .select()
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
