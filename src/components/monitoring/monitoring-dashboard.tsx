'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Shield, 
  Server,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Eye,
  ArrowRight,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: string
  responseTime: number
  activeUsers: number
  systemLoad: number
}

interface SecurityEvent {
  id: string
  type: 'login' | 'access' | 'security' | 'system'
  description: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  user?: string
}

export function MonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoringData = async () => {
    try {
      // Mock data for demo - in real app, this would fetch from monitoring APIs
      setSystemHealth({
        status: 'healthy',
        uptime: '99.9%',
        responseTime: 245,
        activeUsers: 23,
        systemLoad: 45
      })

      setSecurityEvents([
        {
          id: '1',
          type: 'login',
          description: 'Successful admin login',
          timestamp: '2 minutes ago',
          severity: 'low',
          user: 'admin@g1group.com'
        },
        {
          id: '2',
          type: 'access',
          description: 'Unauthorized access attempt blocked',
          timestamp: '15 minutes ago',
          severity: 'high'
        },
        {
          id: '3',
          type: 'system',
          description: 'Database backup completed',
          timestamp: '1 hour ago',
          severity: 'low'
        },
        {
          id: '4',
          type: 'security',
          description: 'Failed login attempts detected',
          timestamp: '2 hours ago',
          severity: 'medium'
        }
      ])

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return Users
      case 'access': return Shield
      case 'security': return AlertTriangle
      case 'system': return Server
      default: return Activity
    }
  }

  const monitoringModules = [
    {
      title: 'Security Monitoring',
      description: 'Security events, threats, and access control',
      href: '/dashboard/monitoring/security',
      icon: Shield,
      status: 'active',
      alerts: 2
    },
    {
      title: 'Activity Monitoring',
      description: 'User activity and system usage tracking',
      href: '/dashboard/monitoring/activity',
      icon: Activity,
      status: 'active',
      alerts: 0
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              systemHealth?.status === 'healthy' ? 'bg-green-500' :
              systemHealth?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              System Status: {systemHealth?.status === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
            </span>
          </div>
          <Badge className={getStatusColor(systemHealth?.status || 'healthy')}>
            {systemHealth?.status?.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {lastUpdate.toLocaleTimeString()}
          <Button size="sm" variant="outline" onClick={fetchMonitoringData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{systemHealth?.uptime}</p>
                <p className="text-xs text-green-600">Last 30 days</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{systemHealth?.responseTime}ms</p>
                <p className="text-xs text-green-600">Average</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{systemHealth?.activeUsers}</p>
                <p className="text-xs text-blue-600">Currently online</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Load</p>
                <p className="text-2xl font-bold">{systemHealth?.systemLoad}%</p>
                <p className="text-xs text-yellow-600">CPU & Memory</p>
              </div>
              <Server className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Modules</CardTitle>
          <CardDescription>Detailed monitoring for different system areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monitoringModules.map((module) => (
              <Link key={module.title} href={module.href}>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          <module.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {module.alerts > 0 && (
                          <Badge variant="destructive">{module.alerts}</Badge>
                        )}
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        module.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-muted-foreground">
                        {module.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>Latest security events and system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.map((event) => {
              const IconComponent = getEventIcon(event.type)
              return (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      event.type === 'login' ? 'bg-blue-100' :
                      event.type === 'access' ? 'bg-purple-100' :
                      event.type === 'security' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        event.type === 'login' ? 'text-blue-600' :
                        event.type === 'access' ? 'text-purple-600' :
                        event.type === 'security' ? 'text-red-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{event.timestamp}</span>
                        {event.user && (
                          <>
                            <span>•</span>
                            <span>{event.user}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection Pool</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Query Performance</span>
                <Badge className="bg-green-100 text-green-800">Optimal</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Usage</span>
                <Badge className="bg-yellow-100 text-yellow-800">75%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Background Jobs</span>
                <Badge className="bg-green-100 text-green-800">Running</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">File Storage</span>
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">External APIs</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CDN Status</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SSL Certificate</span>
                <Badge className="bg-green-100 text-green-800">Valid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}