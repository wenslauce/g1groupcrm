'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Users, 
  Activity,
  TrendingUp,
  RefreshCw,
  Loader2,
  Eye,
  UserX,
  Key,
  Globe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SecurityData {
  events: Array<{
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
  analysis: {
    total_events: number
    event_types: Record<string, number>
    risk_levels: Record<string, number>
    top_users: Array<{ user: string; count: number; risk_score: number }>
    top_ips: Array<{ ip: string; count: number; events: string[] }>
    time_distribution: Record<string, number>
  }
  metrics: {
    events_per_hour: number
    failed_login_rate: number
    unique_users: number
    unique_ips: number
    high_risk_events: number
    permission_denials: number
    role_changes: number
  }
  alerts: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    details: Record<string, any>
    created_at: string
  }>
  failed_logins_by_ip: Array<{
    ip: string
    count: number
    attempts: Array<{
      timestamp: string
      user_agent?: string
      details: Record<string, any>
    }>
    first_attempt: string
    last_attempt: string
    user_agents: string[]
  }>
  role_changes: Array<{
    id: string
    user_id: string
    details: Record<string, any>
    created_at: string
    user_profiles?: {
      full_name: string
      email: string
    }
  }>
  permission_denied: Array<{
    id: string
    user_id: string
    resource_type: string
    resource_id?: string
    details: Record<string, any>
    created_at: string
    user_profiles?: {
      full_name: string
      email: string
      role: string
    }
  }>
  timeframe: string
  time_range: {
    start: string
    end: string
  }
}

interface SecurityMonitorProps {
  className?: string
}

export function SecurityMonitor({ className }: SecurityMonitorProps) {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('day')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchSecurityData()
  }, [timeframe])

  const fetchSecurityData = async () => {
    if (!refreshing) setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        timeframe,
        limit: '100'
      })

      const response = await fetch(`/api/monitoring/security?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch security data')
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
    fetchSecurityData()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEventIcon = (action: string) => {
    if (action.includes('login_failed')) return <UserX className="h-4 w-4 text-red-500" />
    if (action.includes('login_success')) return <Shield className="h-4 w-4 text-green-500" />
    if (action.includes('role_changed')) return <Key className="h-4 w-4 text-purple-500" />
    if (action.includes('permission_denied')) return <Lock className="h-4 w-4 text-orange-500" />
    if (action.includes('suspicious')) return <AlertTriangle className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-blue-500" />
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 100) return 'text-red-600'
    if (score >= 50) return 'text-orange-600'
    if (score >= 20) return 'text-yellow-600'
    return 'text-green-600'
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
            <Button onClick={fetchSecurityData} className="mt-4">
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
          <h1 className="text-3xl font-bold tracking-tight">Security Monitor</h1>
          <p className="text-muted-foreground">
            Security events, threats, and system protection monitoring
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

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold">{data?.analysis?.total_events?.toLocaleString() || '0'}</p>
                <p className="text-xs text-gray-500">
                  {data.metrics.events_per_hour.toFixed(1)}/hour
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                <p className="text-2xl font-bold">{data.analysis.event_types.login_failed || 0}</p>
                <p className="text-xs text-gray-500">
                  {(data.metrics.failed_login_rate * 100).toFixed(1)}% failure rate
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Events</p>
                <p className="text-2xl font-bold">{data.metrics.high_risk_events}</p>
                <p className="text-xs text-gray-500">
                  Requires attention
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{data.alerts.length}</p>
                <p className="text-xs text-gray-500">
                  {data.alerts.filter(a => a.severity === 'critical').length} critical
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {data.alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Security Alerts
            </CardTitle>
            <CardDescription className="text-red-700">
              {data.alerts.length} active security alert(s) requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Investigate
                    </Button>
                    <Button variant="outline" size="sm">
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risk Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              High Risk Users
            </CardTitle>
            <CardDescription>Users with highest security risk scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.analysis.top_users.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {user.user.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.user}</p>
                      <p className="text-sm text-gray-600">{user.count} events</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getRiskScoreColor(user.risk_score)}`}>
                      {user.risk_score}
                    </p>
                    <p className="text-xs text-gray-500">Risk Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Failed Logins by IP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Failed Logins by IP
            </CardTitle>
            <CardDescription>IP addresses with multiple failed login attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.failed_logins_by_ip.slice(0, 5).map((ipData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium font-mono">{ipData.ip}</p>
                    <p className="text-sm text-gray-600">
                      {ipData.count} attempts • {ipData.user_agents.length} user agent(s)
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(ipData.last_attempt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={ipData.count >= 10 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                      {ipData.count >= 10 ? 'HIGH RISK' : 'MEDIUM RISK'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Latest security-related activities and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.slice(0, 20).map((event) => {
                  const riskLevel = event.action.includes('failed') || event.action.includes('suspicious') ? 'high' :
                                   event.action.includes('denied') || event.action.includes('role') ? 'medium' : 'low'
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(event.created_at).toLocaleString()}</div>
                          <div className="text-gray-500">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.action)}
                          <span className="text-sm font-medium">
                            {event.action.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {event.user_profiles?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-gray-500">
                            {event.user_profiles?.email}
                          </div>
                          {event.user_profiles?.role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {event.user_profiles.role}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-mono">
                          {event.ip_address || 'N/A'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getSeverityColor(riskLevel)}>
                          {riskLevel.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Security Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Role Changes */}
        {data.role_changes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Recent Role Changes
              </CardTitle>
              <CardDescription>User role modifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.role_changes.slice(0, 5).map((change) => (
                  <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {change.user_profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {change.user_profiles?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Role Changed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permission Denied Events */}
        {data.permission_denied.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Permission Denied
              </CardTitle>
              <CardDescription>Unauthorized access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.permission_denied.slice(0, 5).map((denial) => (
                  <div key={denial.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {denial.user_profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Attempted to access {denial.resource_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(denial.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-orange-100 text-orange-800">
                        {denial.user_profiles?.role || 'Unknown Role'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}