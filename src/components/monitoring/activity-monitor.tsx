'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock,
  TrendingUp,
  Eye,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityData {
  activities: Array<{
    id: string
    user_id: string
    action: string
    resource_type: string
    resource_id?: string
    details: Record<string, any>
    ip_address?: string
    user_agent?: string
    created_at: string
    user_profiles?: {
      full_name: string
      email: string
      role: string
    }
  }>
  statistics: {
    total_activities: number
    unique_users: number
    unique_actions: number
    top_actions: Array<{ action: string; count: number }>
    top_resources: Array<{ resource_type: string; count: number }>
    top_users: Array<{ user: string; count: number }>
  }
  suspicious_activities: Array<{
    type: string
    user_id: string
    ip_address: string
    count: number
    severity: 'low' | 'medium' | 'high'
    description: string
    activities: any[]
  }>
  timeline: Array<{ time: string; count: number }>
  timeframe: string
  time_range: {
    start: string
    end: string
  }
}

interface ActivityMonitorProps {
  className?: string
}

export function ActivityMonitor({ className }: ActivityMonitorProps) {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('day')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchActivityData()
  }, [timeframe])

  const fetchActivityData = async () => {
    if (!refreshing) setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        timeframe,
        limit: '100'
      })

      const response = await fetch(`/api/monitoring/activity?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch activity data')
      }

      setData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchActivityData()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return <Shield className="h-4 w-4" />
    if (action.includes('created') || action.includes('updated')) return <Activity className="h-4 w-4" />
    if (action.includes('viewed') || action.includes('accessed')) return <Eye className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button onClick={fetchActivityData} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Monitor</h1>
          <p className="text-muted-foreground">
            Real-time system activity and user behavior monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last Day</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold">{data?.statistics?.total_activities?.toLocaleString() || '0'}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{data.statistics.unique_users}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Actions</p>
                <p className="text-2xl font-bold">{data.statistics.unique_actions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspicious Events</p>
                <p className="text-2xl font-bold">{data.suspicious_activities.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activities Alert */}
      {data.suspicious_activities.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Suspicious Activities Detected
            </CardTitle>
            <CardDescription className="text-orange-700">
              {data.suspicious_activities.length} suspicious activity pattern(s) detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.suspicious_activities.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(activity.severity)}>
                      {activity.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-600">
                        IP: {activity.ip_address} • Count: {activity.count}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Actions
            </CardTitle>
            <CardDescription>Most frequent user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.statistics.top_actions.map((action, index) => {
                const percentage = (action.count / data.statistics.total_activities) * 100
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(action.action)}
                      <span className="text-sm font-medium">
                        {action.action.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{action.count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Most Active Users
            </CardTitle>
            <CardDescription>Users with highest activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.statistics.top_users.map((user, index) => {
                const percentage = (user.count / data.statistics.total_activities) * 100
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{user.user}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{user.count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Activity distribution over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.timeline.map((point, index) => {
              const maxCount = Math.max(...data.timeline.map(p => p.count))
              const height = (point.count / maxCount) * 100
              
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                    title={`${point.time}: ${point.count} activities`}
                  />
                  <span className="text-xs text-gray-500 transform -rotate-45 origin-center">
                    {point.time}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest {data.activities.length} activities in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activities.slice(0, 20).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(activity.created_at).toLocaleString()}</div>
                        <div className="text-gray-500">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {activity.user_profiles?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-gray-500">
                          {activity.user_profiles?.email}
                        </div>
                        {activity.user_profiles?.role && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {activity.user_profiles.role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.action)}
                        <span className="text-sm">
                          {activity.action.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{activity.resource_type}</div>
                        {activity.resource_id && (
                          <div className="text-gray-500 font-mono text-xs">
                            {activity.resource_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm font-mono">
                        {activity.ip_address || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}