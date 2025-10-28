'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Search, 
  Filter, 
  RefreshCw, 
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Settings,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NotificationStats {
  total_notifications: number
  pending_notifications: number
  sent_notifications: number
  failed_notifications: number
  email_stats: {
    total_sent: number
    total_delivered: number
    total_failed: number
    delivery_rate: number
  }
  sms_stats: {
    total_sent: number
    total_delivered: number
    total_failed: number
    delivery_rate: number
  }
}

interface ProcessorStatus {
  isRunning: boolean
  isProcessing: boolean
  hasInterval: boolean
}

interface NotificationManagementProps {
  className?: string
}

export function NotificationManagement({ className }: NotificationManagementProps) {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [processorStatus, setProcessorStatus] = useState<ProcessorStatus | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      // Fetch notification stats, processor status, and recent notifications
      const [statsResponse, statusResponse, notificationsResponse] = await Promise.all([
        fetch('/api/notifications/stats'),
        fetch('/api/notifications/process'),
        fetch('/api/notifications?limit=50')
      ])

      // Handle stats (might not exist yet)
      let statsData = null
      if (statsResponse.ok) {
        statsData = await statsResponse.json()
      }

      // Handle processor status
      let statusData = null
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json()
        statusData = statusResult.status
      }

      // Handle notifications
      let notificationsData = []
      if (notificationsResponse.ok) {
        const notificationsResult = await notificationsResponse.json()
        notificationsData = notificationsResult.notifications || []
      }

      setStats(statsData)
      setProcessorStatus(statusData)
      setNotifications(notificationsData)
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessorAction = async (action: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/notifications/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh data after action
        await fetchData()
      } else {
        setError(result.error || 'Failed to perform action')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'in_app':
        return <Bell className="h-4 w-4" />
      case 'push':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || notification.status === statusFilter
    const matchesChannel = !channelFilter || channelFilter === 'all' || notification.channel === channelFilter

    return matchesSearch && matchesStatus && matchesChannel
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage notification delivery across all channels
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleProcessorAction('process_once')}
            disabled={processing}
          >
            <Send className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processor Status */}
      {processorStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Processor Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    processorStatus.isRunning ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">
                    {processorStatus.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
                
                {processorStatus.isProcessing && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Processing...
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProcessorAction(processorStatus.isRunning ? 'stop' : 'start')}
                  disabled={processing}
                >
                  {processorStatus.isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold">{stats?.total_notifications?.toLocaleString() || '0'}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pending_notifications || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold">{stats?.sent_notifications || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold">{stats?.failed_notifications || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Channel Statistics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Sent</span>
                  <span className="font-semibold">{stats?.email_stats?.total_sent || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivered</span>
                  <span className="font-semibold text-green-600">{stats?.email_stats?.total_delivered || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="font-semibold text-red-600">{stats?.email_stats?.total_failed || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Delivery Rate</span>
                    <span className="font-bold">{stats?.email_stats?.delivery_rate?.toFixed(1) || '0.0'}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Sent</span>
                  <span className="font-semibold">{stats?.sms_stats?.total_sent || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivered</span>
                  <span className="font-semibold text-green-600">{stats?.sms_stats?.total_delivered || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="font-semibold text-red-600">{stats?.sms_stats?.total_failed || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Delivery Rate</span>
                    <span className="font-bold">{stats?.sms_stats?.delivery_rate?.toFixed(1) || '0.0'}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setChannelFilter('')
              }}
            >
              Clear
            </Button>
          </div>

          {/* Notifications Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.slice(0, 20).map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(notification.created_at).toLocaleString()}</div>
                        <div className="text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(notification.channel)}
                        <span className="capitalize">{notification.channel}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">
                        {notification.type.replace('_', ' ')}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="max-w-xs">
                        {notification.subject && (
                          <div className="font-medium text-sm truncate">
                            {notification.subject}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 truncate">
                          {notification.message}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(notification.status)}>
                        {notification.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={
                        notification.priority === 'critical' ? 'border-red-200 text-red-800' :
                        notification.priority === 'high' ? 'border-orange-200 text-orange-800' :
                        notification.priority === 'medium' ? 'border-blue-200 text-blue-800' :
                        'border-gray-200 text-gray-800'
                      }>
                        {notification.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No notifications found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}