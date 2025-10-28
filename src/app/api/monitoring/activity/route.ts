import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'
import { z } from 'zod'

const activityQuerySchema = z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  user_id: z.string().uuid().optional(),
  action_type: z.string().optional(),
  resource_type: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50)
})

export async function GET(request: NextRequest) {
  try {
    // Require admin or compliance role to view activity monitoring
    const user = await authServer.requireRole(['admin', 'compliance'])
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const query = activityQuerySchema.parse({
      timeframe: searchParams.get('timeframe'),
      user_id: searchParams.get('user_id'),
      action_type: searchParams.get('action_type'),
      resource_type: searchParams.get('resource_type'),
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
    
    // Build activity query
    let activityQuery = supabase
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
      .order('created_at', { ascending: false })
      .limit(query.limit)
    
    // Apply filters
    if (query.user_id) {
      activityQuery = activityQuery.eq('user_id', query.user_id)
    }
    
    if (query.action_type) {
      activityQuery = activityQuery.ilike('action', `%${query.action_type}%`)
    }
    
    if (query.resource_type) {
      activityQuery = activityQuery.eq('resource_type', query.resource_type)
    }
    
    const { data: activities, error: activitiesError } = await activityQuery
    
    if (activitiesError) {
      console.error('Activity fetch error:', activitiesError)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }
    
    // Get activity statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_activity_stats', {
      start_time: startTime.toISOString(),
      end_time: now.toISOString()
    })
    
    // If the RPC doesn't exist, calculate stats manually
    let activityStats = {}
    if (statsError) {
      // Calculate basic stats from the activities
      const totalActivities = activities?.length || 0
      const uniqueUsers = new Set(activities?.map(a => a.user_id) || []).size
      const uniqueActions = new Set(activities?.map(a => a.action) || []).size
      
      // Group by action type
      const actionCounts = activities?.reduce((acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      // Group by resource type
      const resourceCounts = activities?.reduce((acc, activity) => {
        acc[activity.resource_type] = (acc[activity.resource_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      // Group by user
      const userCounts = activities?.reduce((acc, activity) => {
        const userProfile = Array.isArray(activity.user_profiles) ? activity.user_profiles[0] : activity.user_profiles
        const userName = userProfile?.full_name || activity.user_id
        acc[userName] = (acc[userName] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      activityStats = {
        total_activities: totalActivities,
        unique_users: uniqueUsers,
        unique_actions: uniqueActions,
        top_actions: Object.entries(actionCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([action, count]) => ({ action, count })),
        top_resources: Object.entries(resourceCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([resource_type, count]) => ({ resource_type, count })),
        top_users: Object.entries(userCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([user, count]) => ({ user, count }))
      }
    } else {
      activityStats = stats
    }
    
    // Detect suspicious patterns
    const suspiciousActivities = detectSuspiciousActivity(activities || [])
    
    // Calculate activity timeline
    const timeline = calculateActivityTimeline(activities || [], query.timeframe)
    
    return NextResponse.json({
      activities,
      statistics: activityStats,
      suspicious_activities: suspiciousActivities,
      timeline,
      timeframe: query.timeframe,
      time_range: {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    })
  } catch (error) {
    console.error('Activity monitoring API error:', error)
    
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

// Helper function to detect suspicious activity patterns
function detectSuspiciousActivity(activities: any[]): any[] {
  const suspicious: any[] = []
  
  // Group activities by user and IP
  const userActivities = activities.reduce((acc, activity) => {
    const key = `${activity.user_id}-${activity.ip_address}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(activity)
    return acc
  }, {} as Record<string, any[]>)
  
  // Check for suspicious patterns
  Object.entries(userActivities).forEach(([key, activities]) => {
    const [userId, ipAddress] = key.split('-')
    
    // Pattern 1: Too many failed login attempts
    const failedLogins = (activities as any[]).filter(a => a.action === 'login_failed')
    if (failedLogins.length >= 5) {
      suspicious.push({
        type: 'multiple_failed_logins',
        user_id: userId,
        ip_address: ipAddress,
        count: failedLogins.length,
        severity: 'high',
        description: `${failedLogins.length} failed login attempts detected`,
        activities: failedLogins.slice(0, 5) // Include first 5 attempts
      })
    }
    
    // Pattern 2: Rapid successive actions (potential bot activity)
    const sortedActivities = (activities as any[]).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    let rapidActions = 0
    for (let i = 1; i < sortedActivities.length; i++) {
      const timeDiff = new Date(sortedActivities[i].created_at).getTime() - 
                      new Date(sortedActivities[i-1].created_at).getTime()
      if (timeDiff < 1000) { // Less than 1 second between actions
        rapidActions++
      }
    }
    
    if (rapidActions >= 10) {
      suspicious.push({
        type: 'rapid_successive_actions',
        user_id: userId,
        ip_address: ipAddress,
        count: rapidActions,
        severity: 'medium',
        description: `${rapidActions} rapid successive actions detected (potential bot activity)`,
        activities: sortedActivities.slice(0, 5)
      })
    }
    
    // Pattern 3: Unusual access patterns (accessing many different resource types quickly)
    const resourceTypes = new Set((activities as any[]).map(a => a.resource_type))
    const timeSpan = Math.max(...(activities as any[]).map(a => new Date(a.created_at).getTime())) - 
                    Math.min(...(activities as any[]).map(a => new Date(a.created_at).getTime()))
    
    if (resourceTypes.size >= 5 && timeSpan < 5 * 60 * 1000) { // 5+ resource types in 5 minutes
      suspicious.push({
        type: 'unusual_access_pattern',
        user_id: userId,
        ip_address: ipAddress,
        resource_types: Array.from(resourceTypes),
        severity: 'medium',
        description: `Accessed ${resourceTypes.size} different resource types in ${Math.round(timeSpan / 60000)} minutes`,
        activities: (activities as any[]).slice(0, 5)
      })
    }
    
    // Pattern 4: Off-hours activity (outside 9 AM - 6 PM)
    const offHoursActivities = (activities as any[]).filter(a => {
      const hour = new Date(a.created_at).getHours()
      return hour < 9 || hour > 18
    })
    
    if (offHoursActivities.length >= 10) {
      suspicious.push({
        type: 'off_hours_activity',
        user_id: userId,
        ip_address: ipAddress,
        count: offHoursActivities.length,
        severity: 'low',
        description: `${offHoursActivities.length} activities detected outside business hours`,
        activities: offHoursActivities.slice(0, 5)
      })
    }
  })
  
  return suspicious.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity as keyof typeof severityOrder] - 
           severityOrder[a.severity as keyof typeof severityOrder]
  })
}

// Helper function to calculate activity timeline
function calculateActivityTimeline(activities: any[], timeframe: string): any[] {
  const timeline: Record<string, number> = {}
  
  activities.forEach(activity => {
    const date = new Date(activity.created_at)
    let key: string
    
    switch (timeframe) {
      case 'hour':
        key = `${date.getHours().toString().padStart(2, '0')}:00`
        break
      case 'day':
        key = `${date.getHours().toString().padStart(2, '0')}:00`
        break
      case 'week':
        key = date.toLocaleDateString('en-US', { weekday: 'short' })
        break
      case 'month':
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    
    timeline[key] = (timeline[key] || 0) + 1
  })
  
  return Object.entries(timeline)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time))
}
