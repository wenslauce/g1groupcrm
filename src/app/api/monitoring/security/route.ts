import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const securityQuerySchema = z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  event_type: z.enum(['authentication', 'authorization', 'data_access', 'system']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50)
})

export async function GET(request: NextRequest) {
  try {
    // Require admin role to view security monitoring
    const user = await authServer.requireRole(['admin'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const query = securityQuerySchema.parse({
      timeframe: searchParams.get('timeframe'),
      severity: searchParams.get('severity'),
      event_type: searchParams.get('event_type'),
      limit: searchParams.get('limit')
    })
    
    // Calculate time range based on timeframe
    const now = new Date()
    let startTime: Date
    
    switch (query.timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }
    
    // Get security-related audit logs
    let securityQuery = supabase
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
      .gte('created_at', startTime.toISOString())
      .in('action', [
        'login_success',
        'login_failed',
        'logout',
        'password_changed',
        'role_changed',
        'account_locked',
        'suspicious_activity',
        'permission_denied',
        'unauthorized_access',
        'data_exported',
        'sensitive_data_accessed'
      ])
      .order('created_at', { ascending: false })
      .limit(query.limit)
    
    const { data: securityEvents, error: eventsError } = await securityQuery
    
    if (eventsError) {
      console.error('Security events fetch error:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch security events' }, { status: 500 })
    }
    
    // Analyze security events
    const analysis = analyzeSecurityEvents(securityEvents || [])
    
    // Get failed login attempts by IP
    const { data: failedLogins, error: failedLoginsError } = await supabase
      .from('audit_logs')
      .select('ip_address, user_agent, created_at, details')
      .eq('action', 'login_failed')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
    
    // Group failed logins by IP
    const failedLoginsByIP = groupFailedLoginsByIP(failedLogins || [])
    
    // Get recent role changes
    const { data: roleChanges, error: roleChangesError } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        details,
        created_at,
        user_profiles(full_name, email)
      `)
      .eq('action', 'role_changed')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Get permission denied events
    const { data: permissionDenied, error: permissionError } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        resource_type,
        resource_id,
        details,
        created_at,
        user_profiles(full_name, email, role)
      `)
      .eq('action', 'permission_denied')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Calculate security metrics
    const metrics = calculateSecurityMetrics(securityEvents || [], startTime, now)
    
    // Generate security alerts
    const alerts = generateSecurityAlerts(securityEvents || [], failedLoginsByIP, analysis)
    
    return NextResponse.json({
      events: securityEvents,
      analysis,
      metrics,
      alerts,
      failed_logins_by_ip: failedLoginsByIP,
      role_changes: roleChanges || [],
      permission_denied: permissionDenied || [],
      timeframe: query.timeframe,
      time_range: {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    })
  } catch (error) {
    console.error('Security monitoring API error:', error)
    
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

// Helper function to analyze security events
function analyzeSecurityEvents(events: any[]) {
  const analysis = {
    total_events: events.length,
    event_types: {} as Record<string, number>,
    risk_levels: {} as Record<string, number>,
    top_users: [] as Array<{ user: string; count: number; risk_score: number }>,
    top_ips: [] as Array<{ ip: string; count: number; events: string[] }>,
    time_distribution: {} as Record<string, number>
  }
  
  // Count event types
  events.forEach(event => {
    analysis.event_types[event.action] = (analysis.event_types[event.action] || 0) + 1
    
    // Categorize risk levels
    const riskLevel = getRiskLevel(event.action)
    analysis.risk_levels[riskLevel] = (analysis.risk_levels[riskLevel] || 0) + 1
    
    // Time distribution (by hour)
    const hour = new Date(event.created_at).getHours()
    const hourKey = `${hour.toString().padStart(2, '0')}:00`
    analysis.time_distribution[hourKey] = (analysis.time_distribution[hourKey] || 0) + 1
  })
  
  // Analyze top users
  const userCounts = events.reduce((acc, event) => {
    const userName = event.user_profiles?.full_name || event.user_id || 'Unknown'
    if (!acc[userName]) {
      acc[userName] = { count: 0, events: [] }
    }
    acc[userName].count++
    acc[userName].events.push(event.action)
    return acc
  }, {} as Record<string, { count: number; events: string[] }>)
  
  analysis.top_users = Object.entries(userCounts)
    .map(([user, data]) => ({
      user,
      count: (data as { count: number; events: string[] }).count,
      risk_score: calculateUserRiskScore((data as { count: number; events: string[] }).events)
    }))
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 10)
  
  // Analyze top IPs
  const ipCounts = events.reduce((acc, event) => {
    const ip = event.ip_address || 'Unknown'
    if (!acc[ip]) {
      acc[ip] = { count: 0, events: [] }
    }
    acc[ip].count++
    acc[ip].events.push(event.action)
    return acc
  }, {} as Record<string, { count: number; events: string[] }>)
  
  analysis.top_ips = Object.entries(ipCounts)
    .map(([ip, data]) => ({
      ip,
      count: (data as { count: number; events: string[] }).count,
      events: Array.from(new Set((data as { count: number; events: string[] }).events))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  return analysis
}

// Helper function to get risk level for an action
function getRiskLevel(action: string): string {
  const highRiskActions = ['login_failed', 'account_locked', 'suspicious_activity', 'unauthorized_access']
  const mediumRiskActions = ['role_changed', 'permission_denied', 'sensitive_data_accessed']
  const lowRiskActions = ['login_success', 'logout', 'password_changed']
  
  if (highRiskActions.includes(action)) return 'high'
  if (mediumRiskActions.includes(action)) return 'medium'
  if (lowRiskActions.includes(action)) return 'low'
  return 'medium'
}

// Helper function to calculate user risk score
function calculateUserRiskScore(events: string[]): number {
  let score = 0
  const eventCounts = events.reduce((acc, event) => {
    acc[event] = (acc[event] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Add points based on event types
  Object.entries(eventCounts).forEach(([event, count]) => {
    switch (getRiskLevel(event)) {
      case 'high':
        score += count * 10
        break
      case 'medium':
        score += count * 5
        break
      case 'low':
        score += count * 1
        break
    }
  })
  
  return score
}

// Helper function to group failed logins by IP
function groupFailedLoginsByIP(failedLogins: any[]) {
  const grouped = failedLogins.reduce((acc, login) => {
    const ip = login.ip_address || 'Unknown'
    if (!acc[ip]) {
      acc[ip] = {
        ip,
        count: 0,
        attempts: [],
        first_attempt: login.created_at,
        last_attempt: login.created_at,
        user_agents: new Set()
      }
    }
    
    acc[ip].count++
    acc[ip].attempts.push({
      timestamp: login.created_at,
      user_agent: login.user_agent,
      details: login.details
    })
    
    if (new Date(login.created_at) < new Date(acc[ip].first_attempt)) {
      acc[ip].first_attempt = login.created_at
    }
    if (new Date(login.created_at) > new Date(acc[ip].last_attempt)) {
      acc[ip].last_attempt = login.created_at
    }
    
    if (login.user_agent) {
      acc[ip].user_agents.add(login.user_agent)
    }
    
    return acc
  }, {} as Record<string, any>)
  
  // Convert sets to arrays and sort by count
  return Object.values(grouped)
    .map(group => ({
      ...(group as any),
      user_agents: Array.from((group as any).user_agents),
      attempts: (group as any).attempts.slice(0, 10) // Limit to last 10 attempts
    }))
    .sort((a: any, b: any) => b.count - a.count)
}

// Helper function to calculate security metrics
function calculateSecurityMetrics(events: any[], startTime: Date, endTime: Date) {
  const timeSpanHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  
  const metrics = {
    events_per_hour: events.length / timeSpanHours,
    failed_login_rate: events.filter(e => e.action === 'login_failed').length / Math.max(events.filter(e => e.action.includes('login')).length, 1),
    unique_users: new Set(events.map(e => e.user_id)).size,
    unique_ips: new Set(events.map(e => e.ip_address)).size,
    high_risk_events: events.filter(e => getRiskLevel(e.action) === 'high').length,
    permission_denials: events.filter(e => e.action === 'permission_denied').length,
    role_changes: events.filter(e => e.action === 'role_changed').length
  }
  
  return metrics
}

// Helper function to generate security alerts
function generateSecurityAlerts(events: any[], failedLoginsByIP: any[], analysis: any) {
  const alerts = []
  
  // Alert for high number of failed logins from single IP
  failedLoginsByIP.forEach(ipData => {
    if (ipData.count >= 10) {
      alerts.push({
        type: 'multiple_failed_logins',
        severity: ipData.count >= 20 ? 'critical' : 'high',
        title: `Multiple Failed Login Attempts from ${ipData.ip}`,
        description: `${ipData.count} failed login attempts detected from IP ${ipData.ip}`,
        details: {
          ip_address: ipData.ip,
          attempt_count: ipData.count,
          time_span: `${ipData.first_attempt} to ${ipData.last_attempt}`,
          user_agents: ipData.user_agents
        },
        created_at: new Date().toISOString()
      })
    }
  })
  
  // Alert for high-risk users
  analysis.top_users.forEach((user: any) => {
    if (user.risk_score >= 50) {
      alerts.push({
        type: 'high_risk_user_activity',
        severity: user.risk_score >= 100 ? 'critical' : 'high',
        title: `High-Risk Activity from ${user.user}`,
        description: `User ${user.user} has a risk score of ${user.risk_score}`,
        details: {
          user: user.user,
          risk_score: user.risk_score,
          event_count: user.count
        },
        created_at: new Date().toISOString()
      })
    }
  })
  
  // Alert for unusual activity patterns
  const offHoursEvents = events.filter(e => {
    const hour = new Date(e.created_at).getHours()
    return hour < 6 || hour > 22 // Outside 6 AM - 10 PM
  })
  
  if (offHoursEvents.length >= 20) {
    alerts.push({
      type: 'off_hours_activity',
      severity: 'medium',
      title: 'Unusual Off-Hours Activity',
      description: `${offHoursEvents.length} security events detected outside normal business hours`,
      details: {
        event_count: offHoursEvents.length,
        unique_users: new Set(offHoursEvents.map(e => e.user_id)).size
      },
      created_at: new Date().toISOString()
    })
  }
  
  // Alert for rapid role changes
  const roleChanges = events.filter(e => e.action === 'role_changed')
  if (roleChanges.length >= 5) {
    alerts.push({
      type: 'multiple_role_changes',
      severity: 'medium',
      title: 'Multiple Role Changes Detected',
      description: `${roleChanges.length} role changes detected in the monitoring period`,
      details: {
        change_count: roleChanges.length,
        affected_users: new Set(roleChanges.map(e => e.user_id)).size
      },
      created_at: new Date().toISOString()
    })
  }
  
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity as keyof typeof severityOrder] - 
           severityOrder[a.severity as keyof typeof severityOrder]
  })
}
