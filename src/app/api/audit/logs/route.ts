import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const auditLogSchema = z.object({
  action: z.string().min(1).max(100),
  resource_type: z.string().min(1).max(50),
  resource_id: z.string().optional(),
  details: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional()
})

const auditQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require admin or compliance role to view audit logs
    const user = await authServer.requireRole(['admin', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const query = auditQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      user_id: searchParams.get('user_id'),
      action: searchParams.get('action'),
      resource_type: searchParams.get('resource_type'),
      resource_id: searchParams.get('resource_id'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      search: searchParams.get('search')
    })
    
    // Build the query
    let auditQuery = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        user_profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (query.user_id) {
      auditQuery = auditQuery.eq('user_id', query.user_id)
    }
    
    if (query.action) {
      auditQuery = auditQuery.eq('action', query.action)
    }
    
    if (query.resource_type) {
      auditQuery = auditQuery.eq('resource_type', query.resource_type)
    }
    
    if (query.resource_id) {
      auditQuery = auditQuery.eq('resource_id', query.resource_id)
    }
    
    if (query.start_date) {
      auditQuery = auditQuery.gte('created_at', query.start_date)
    }
    
    if (query.end_date) {
      auditQuery = auditQuery.lte('created_at', query.end_date)
    }
    
    if (query.search) {
      auditQuery = auditQuery.or(`action.ilike.%${query.search}%,resource_type.ilike.%${query.search}%,details->>description.ilike.%${query.search}%`)
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
    
    // Apply pagination
    const offset = (query.page - 1) * query.limit
    auditQuery = auditQuery.range(offset, offset + query.limit - 1)
    
    const { data: logs, error } = await auditQuery
    
    if (error) {
      console.error('Audit logs fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }
    
    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / query.limit)
    const hasNextPage = query.page < totalPages
    const hasPreviousPage = query.page > 1
    
    return NextResponse.json({
      logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })
  } catch (error) {
    console.error('Audit logs API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user (any authenticated user can create audit logs)
    const user = await authServer.getCurrentUser()
    
    const body = await request.json()
    const validatedData = auditLogSchema.parse(body)
    
    const supabase = createClient()
    
    // Get client IP and user agent from headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create audit log entry
    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        action: validatedData.action,
        resource_type: validatedData.resource_type,
        resource_id: validatedData.resource_id,
        details: validatedData.details || {},
        ip_address: validatedData.ip_address || ip,
        user_agent: validatedData.user_agent || userAgent
      })
      .select()
      .single()
    
    if (error) {
      console.error('Audit log creation error:', error)
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
    }
    
    return NextResponse.json(auditLog, { status: 201 })
  } catch (error) {
    console.error('Audit log API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid audit log data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
