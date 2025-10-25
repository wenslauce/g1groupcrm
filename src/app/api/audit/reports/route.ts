import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'
import { analyticsUtils } from '@/lib/analytics-utils'

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
    
    // Apply filters based on report type
    switch (validatedData.report_type) {
      case 'user_activity':
        // No additional filters needed
        break
      
      case 'compliance_actions':
        query = query.in('action', [
          'kyc_document_uploaded',
          'kyc_document_approved',
          'kyc_document_rejected',
          'risk_assessment_created',
          'risk_assessment_updated',
          'compliance_status_changed',
          'audit_log_viewed'
        ])
        break
      
      case 'security_events':
        query = query.in('action', [
          'login_success',
          'login_failed',
          'logout',
          'password_changed',
          'role_changed',
          'account_locked',
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
          'skr_status_changed',
          'asset_created',
          'asset_updated',
          'invoice_created',
          'invoice_updated'
        ])
        break
      
      case 'system_access':
        query = query.in('action', [
          'login_success',
          'logout',
          'page_accessed',
          'api_called',
          'file_downloaded',
          'report_generated'
        ])
        break
    }\n    \n    // Apply additional filters\n    if (validatedData.user_ids && validatedData.user_ids.length > 0) {\n      query = query.in('user_id', validatedData.user_ids)\n    }\n    \n    if (validatedData.actions && validatedData.actions.length > 0) {\n      query = query.in('action', validatedData.actions)\n    }\n    \n    if (validatedData.resource_types && validatedData.resource_types.length > 0) {\n      query = query.in('resource_type', validatedData.resource_types)\n    }\n    \n    const { data: auditLogs, error } = await query\n    \n    if (error) {\n      console.error('Audit report query error:', error)\n      return NextResponse.json({ error: 'Failed to generate audit report' }, { status: 500 })\n    }\n    \n    // Process data based on grouping\n    let processedData = auditLogs || []\n    let summary = {}\n    \n    if (validatedData.group_by) {\n      const grouped = processedData.reduce((acc, log) => {\n        let key: string\n        \n        switch (validatedData.group_by) {\n          case 'user':\n            key = log.user_profiles?.full_name || log.user_id\n            break\n          case 'action':\n            key = log.action\n            break\n          case 'resource_type':\n            key = log.resource_type\n            break\n          case 'date':\n            key = new Date(log.created_at).toISOString().split('T')[0]\n            break\n          case 'hour':\n            const date = new Date(log.created_at)\n            key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`\n            break\n          default:\n            key = 'unknown'\n        }\n        \n        if (!acc[key]) {\n          acc[key] = []\n        }\n        acc[key].push(log)\n        return acc\n      }, {} as Record<string, any[]>)\n      \n      // Create summary statistics\n      summary = Object.entries(grouped).reduce((acc, [key, logs]) => {\n        acc[key] = {\n          count: logs.length,\n          unique_users: new Set(logs.map(l => l.user_id)).size,\n          actions: [...new Set(logs.map(l => l.action))],\n          resource_types: [...new Set(logs.map(l => l.resource_type))],\n          date_range: {\n            start: logs.reduce((min, log) => log.created_at < min ? log.created_at : min, logs[0].created_at),\n            end: logs.reduce((max, log) => log.created_at > max ? log.created_at : max, logs[0].created_at)\n          }\n        }\n        return acc\n      }, {} as Record<string, any>)\n      \n      processedData = grouped\n    }\n    \n    // Generate overall statistics\n    const stats = {\n      total_entries: auditLogs?.length || 0,\n      unique_users: new Set(auditLogs?.map(l => l.user_id) || []).size,\n      unique_actions: new Set(auditLogs?.map(l => l.action) || []).size,\n      unique_resource_types: new Set(auditLogs?.map(l => l.resource_type) || []).size,\n      date_range: {\n        start: validatedData.start_date,\n        end: validatedData.end_date\n      },\n      most_active_users: getMostActiveUsers(auditLogs || []),\n      most_common_actions: getMostCommonActions(auditLogs || []),\n      activity_by_hour: getActivityByHour(auditLogs || [])\n    }\n    \n    // Prepare response data\n    const reportData = {\n      report_type: validatedData.report_type,\n      generated_at: new Date().toISOString(),\n      generated_by: user.id,\n      parameters: validatedData,\n      statistics: stats,\n      summary: validatedData.group_by ? summary : undefined,\n      data: validatedData.include_details ? processedData : undefined\n    }\n    \n    // Handle CSV format\n    if (validatedData.format === 'csv') {\n      const csvData = auditLogs?.map(log => ({\n        timestamp: log.created_at,\n        user: log.user_profiles?.full_name || log.user_id,\n        email: log.user_profiles?.email || '',\n        role: log.user_profiles?.role || '',\n        action: log.action,\n        resource_type: log.resource_type,\n        resource_id: log.resource_id || '',\n        ip_address: log.ip_address || '',\n        details: JSON.stringify(log.details || {})\n      })) || []\n      \n      const csv = analyticsUtils.convertToCSV(csvData)\n      \n      return new NextResponse(csv, {\n        headers: {\n          'Content-Type': 'text/csv',\n          'Content-Disposition': `attachment; filename=\"audit-report-${validatedData.report_type}-${new Date().toISOString().split('T')[0]}.csv\"`\n        }\n      })\n    }\n    \n    return NextResponse.json(reportData)\n  } catch (error) {\n    console.error('Audit report API error:', error)\n    \n    if (error instanceof z.ZodError) {\n      return NextResponse.json(\n        { error: 'Invalid report parameters', details: error.errors },\n        { status: 400 }\n      )\n    }\n    \n    return NextResponse.json(\n      { error: error instanceof Error ? error.message : 'Internal server error' },\n      { status: 500 }\n    )\n  }\n}\n\n// Helper functions\nfunction getMostActiveUsers(logs: any[]): Array<{ user_id: string; name: string; count: number }> {\n  const userCounts = logs.reduce((acc, log) => {\n    const userId = log.user_id\n    const userName = log.user_profiles?.full_name || userId\n    \n    if (!acc[userId]) {\n      acc[userId] = { user_id: userId, name: userName, count: 0 }\n    }\n    acc[userId].count++\n    return acc\n  }, {} as Record<string, any>)\n  \n  return Object.values(userCounts)\n    .sort((a: any, b: any) => b.count - a.count)\n    .slice(0, 10)\n}\n\nfunction getMostCommonActions(logs: any[]): Array<{ action: string; count: number }> {\n  const actionCounts = logs.reduce((acc, log) => {\n    const action = log.action\n    if (!acc[action]) {\n      acc[action] = { action, count: 0 }\n    }\n    acc[action].count++\n    return acc\n  }, {} as Record<string, any>)\n  \n  return Object.values(actionCounts)\n    .sort((a: any, b: any) => b.count - a.count)\n    .slice(0, 10)\n}\n\nfunction getActivityByHour(logs: any[]): Record<string, number> {\n  const hourCounts = logs.reduce((acc, log) => {\n    const hour = new Date(log.created_at).getHours()\n    const hourKey = `${hour.toString().padStart(2, '0')}:00`\n    \n    if (!acc[hourKey]) {\n      acc[hourKey] = 0\n    }\n    acc[hourKey]++\n    return acc\n  }, {} as Record<string, number>)\n  \n  // Fill in missing hours with 0\n  for (let i = 0; i < 24; i++) {\n    const hourKey = `${i.toString().padStart(2, '0')}:00`\n    if (!hourCounts[hourKey]) {\n      hourCounts[hourKey] = 0\n    }\n  }\n  \n  return hourCounts\n}"
