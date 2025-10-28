import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const auditReportSchema = z.object({
  report_type: z.enum([
    'user_activity',
    'compliance_actions',
    'security_events',
    'data_changes',
    'system_access',
    'custom'
  ]),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  user_ids: z.array(z.string().uuid()).optional(),
  actions: z.array(z.string()).optional(),
  resource_types: z.array(z.string()).optional(),
  include_details: z.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json'),
  group_by: z.enum(['user', 'action', 'resource_type', 'date', 'hour']).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Require admin or compliance role to generate audit reports
    const user = await authServer.requireRole(['admin', 'compliance'])
    
    const body = await request.json()
    const validatedData = auditReportSchema.parse(body)
    
    const supabase = createClient()
    
    // Build base query
    let query = supabase
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
        user_profiles(full_name, email, role)
      `)
      .gte('created_at', validatedData.start_date)
      .lte('created_at', validatedData.end_date)
      .order('created_at', { ascending: false })
    
    // Apply report type specific filters
    switch (validatedData.report_type) {
      case 'user_activity':
        // All user actions
        break
      case 'compliance_actions':
        query = query.in('action', [
          'kyc_document_uploaded',
          'kyc_document_approved',
          'kyc_document_rejected',
          'compliance_status_changed',
          'risk_assessment_created'
        ])
        break
      case 'security_events':
        query = query.in('action', [
          'login_success',
          'login_failed',
          'logout',
          'password_changed',
          'role_changed',
          'permission_denied',
          'suspicious_activity'
        ])
        break
      case 'data_changes':
        query = query.in('action', [
          'client_created',
          'client_updated',
          'client_deleted',
          'skr_created',
          'skr_updated',
          'skr_deleted',
          'asset_created',
          'asset_updated'
        ])
        break
      case 'system_access':
        query = query.in('action', [
          'page_accessed',
          'api_called',
          'file_downloaded',
          'report_generated'
        ])
        break
    }
    
    // Apply additional filters
    if (validatedData.user_ids && validatedData.user_ids.length > 0) {
      query = query.in('user_id', validatedData.user_ids)
    }
    
    if (validatedData.actions && validatedData.actions.length > 0) {
      query = query.in('action', validatedData.actions)
    }
    
    if (validatedData.resource_types && validatedData.resource_types.length > 0) {
      query = query.in('resource_type', validatedData.resource_types)
    }
    
    const { data: auditLogs, error } = await query
    
    if (error) {
      console.error('Audit report query error:', error)
      return NextResponse.json({ error: 'Failed to generate audit report' }, { status: 500 })
    }
    
    // Process data based on grouping
    let processedData = auditLogs || []
    let summary = {}
    
    if (validatedData.group_by) {
      const grouped = processedData.reduce((acc, log) => {
        let key: string
        
        switch (validatedData.group_by) {
          case 'user':
            key = log.user_profiles?.full_name || log.user_id
            break
          case 'action':
            key = log.action
            break
          case 'resource_type':
            key = log.resource_type
            break
          case 'date':
            key = new Date(log.created_at).toISOString().split('T')[0]
            break
          case 'hour':
            const date = new Date(log.created_at)
            key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`
            break
          default:
            key = 'unknown'
        }
        
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(log)
        return acc
      }, {} as Record<string, any[]>)
      
      // Create summary statistics
      summary = Object.entries(grouped).reduce((acc, [key, logs]) => {
        acc[key] = {
          count: logs.length,
          unique_users: new Set(logs.map(l => l.user_id)).size,
          actions: [...new Set(logs.map(l => l.action))],
          resource_types: [...new Set(logs.map(l => l.resource_type))],
          date_range: {
            start: logs.reduce((min, log) => log.created_at < min ? log.created_at : min, logs[0].created_at),
            end: logs.reduce((max, log) => log.created_at > max ? log.created_at : max, logs[0].created_at)
          }
        }
        return acc
      }, {} as Record<string, any>)
      
      processedData = grouped
    }
    
    // Generate overall statistics
    const stats = {
      total_entries: auditLogs?.length || 0,
      unique_users: new Set(auditLogs?.map(l => l.user_id) || []).size,
      unique_actions: new Set(auditLogs?.map(l => l.action) || []).size,
      unique_resource_types: new Set(auditLogs?.map(l => l.resource_type) || []).size,
      date_range: {
        start: validatedData.start_date,
        end: validatedData.end_date
      },
      most_active_users: getMostActiveUsers(auditLogs || []),
      most_common_actions: getMostCommonActions(auditLogs || []),
      activity_by_hour: getActivityByHour(auditLogs || [])
    }
    
    // Prepare response data
    const reportData = {
      report_type: validatedData.report_type,
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      parameters: validatedData,
      statistics: stats,
      summary: validatedData.group_by ? summary : undefined,
      data: validatedData.include_details ? processedData : undefined
    }
    
    // Handle CSV format
    if (validatedData.format === 'csv') {
      const csvData = auditLogs?.map(log => ({
        timestamp: log.created_at,
        user: log.user_profiles?.full_name || log.user_id,
        email: log.user_profiles?.email || '',
        role: log.user_profiles?.role || '',
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id || '',
        ip_address: log.ip_address || '',
        details: JSON.stringify(log.details || {})
      })) || []
      
      const csv = convertToCSV(csvData)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-report-${validatedData.report_type}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }
    
    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Audit report API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid report parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getMostActiveUsers(logs: any[]): Array<{ user_id: string; name: string; count: number }> {
  const userCounts = logs.reduce((acc, log) => {
    const userId = log.user_id
    const userName = log.user_profiles?.full_name || userId
    
    if (!acc[userId]) {
      acc[userId] = { user_id: userId, name: userName, count: 0 }
    }
    acc[userId].count++
    return acc
  }, {} as Record<string, any>)
  
  return Object.values(userCounts)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10)
}

function getMostCommonActions(logs: any[]): Array<{ action: string; count: number }> {
  const actionCounts = logs.reduce((acc, log) => {
    const action = log.action
    if (!acc[action]) {
      acc[action] = { action, count: 0 }
    }
    acc[action].count++
    return acc
  }, {} as Record<string, any>)
  
  return Object.values(actionCounts)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10)
}

function getActivityByHour(logs: any[]): Record<string, number> {
  const hourCounts = logs.reduce((acc, log) => {
    const hour = new Date(log.created_at).getHours()
    const hourKey = `${hour.toString().padStart(2, '0')}:00`
    
    if (!acc[hourKey]) {
      acc[hourKey] = 0
    }
    acc[hourKey]++
    return acc
  }, {} as Record<string, number>)
  
  // Fill in missing hours with 0
  for (let i = 0; i < 24; i++) {
    const hourKey = `${i.toString().padStart(2, '0')}:00`
    if (!hourCounts[hourKey]) {
      hourCounts[hourKey] = 0
    }
  }
  
  return hourCounts
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}
