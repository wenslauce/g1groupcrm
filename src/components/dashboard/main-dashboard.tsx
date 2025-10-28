'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Loader2,
  Package,
  Shield,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface DashboardData {
  summary: {
    total_clients: number
    new_clients: number
    approved_clients?: number
    compliant_clients?: number
    total_skrs: number
    active_skrs?: number
    issued_skrs?: number
    in_transit_skrs?: number
    delivered_skrs?: number
    total_asset_value?: number
    total_invoice_amount?: number
    total_revenue?: number
    total_paid_amount?: number
    collected_revenue?: number
    outstanding_amount?: number
    compliance_rate: number
  }
  growth?: {
    client_growth: number
    skr_growth: number
    revenue_growth: number
    asset_value_growth?: number
  }
  trends?: {
    client_growth: number
    skr_growth: number
    asset_value_growth: number
  }
  distributions: {
    client_types: Record<string, number>
    skr_status: Record<string, number>
    asset_types?: Record<string, number>
  }
  recent_activities: Array<{
    id: string
    action: string
    resource_type: string
    resource_id: string
    user_profiles?: {
      full_name: string
    }
    created_at: string
  }>
}

interface MainDashboardProps {
  className?: string
}

export function MainDashboard({ className }: MainDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('month')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeframe])

  const fetchDashboardData = async () => {
    if (!refreshing) setLoading(true)
    setError('')

    try {
      // Fetch analytics overview
      const analyticsResponse = await fetch(`/api/analytics/overview?timeframe=${timeframe}`)
      
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const analyticsData = await analyticsResponse.json()

      // Fetch recent activities from audit logs
      const activitiesResponse = await fetch('/api/audit/logs?limit=10')
      let recentActivities = []
      
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        recentActivities = activitiesData.logs || []
      }

      setData({
        ...analyticsData,
        recent_activities: recentActivities
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <TrendingUp className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('created')) return <Plus className="h-4 w-4 text-blue-500" />
    if (action.includes('approved')) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (action.includes('updated')) return <Activity className="h-4 w-4 text-purple-500" />
    if (action.includes('failed') || action.includes('rejected')) return <AlertTriangle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-gray-500" />
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
            <Button onClick={fetchDashboardData} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { summary: apiSummary, growth: trends, distributions, recent_activities } = data
  
  // Map API response to expected format
  const summary = {
    total_clients: apiSummary?.total_clients || 0,
    new_clients: apiSummary?.new_clients || 0,
    approved_clients: apiSummary?.compliant_clients || apiSummary?.approved_clients || 0,
    total_skrs: apiSummary?.total_skrs || 0,
    active_skrs: (apiSummary?.issued_skrs || 0) + (apiSummary?.in_transit_skrs || 0),
    issued_skrs: apiSummary?.issued_skrs || 0,
    total_asset_value: 0, // Not available in current API
    total_invoice_amount: apiSummary?.total_revenue || apiSummary?.total_invoice_amount || 0,
    total_paid_amount: apiSummary?.collected_revenue || apiSummary?.total_paid_amount || 0,
    outstanding_amount: (apiSummary?.total_revenue || apiSummary?.total_invoice_amount || 0) - (apiSummary?.collected_revenue || apiSummary?.total_paid_amount || 0),
    compliance_rate: apiSummary?.compliance_rate || 0
  }
  
  // Map trends to expected format - handle case where trends might not exist
  const mappedTrends = {
    client_growth: trends?.client_growth || data?.growth?.client_growth || 0,
    skr_growth: trends?.skr_growth || data?.growth?.skr_growth || 0,
    asset_value_growth: trends?.revenue_growth || data?.growth?.revenue_growth || 0 // Map revenue growth to asset value growth
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your G1 Holdings command center
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
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
          
          <Link href="/dashboard/skrs/create">
            <Button className="bg-g1-primary hover:bg-g1-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create SKR
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKRs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_skrs?.toLocaleString() || '0'}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(mappedTrends.skr_growth)}
              <span className={`ml-1 ${getTrendColor(mappedTrends.skr_growth)}`}>
                {mappedTrends.skr_growth > 0 ? '+' : ''}{mappedTrends.skr_growth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SKRs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active_skrs}</div>
            <p className="text-xs text-muted-foreground">
              {summary.issued_skrs} issued this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_clients}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(mappedTrends.client_growth)}
              <span className={`ml-1 ${getTrendColor(mappedTrends.client_growth)}`}>
                {mappedTrends.client_growth > 0 ? '+' : ''}{mappedTrends.client_growth.toFixed(1)}%
              </span>
              <span className="ml-1">growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.total_asset_value, 'USD')}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(mappedTrends.asset_value_growth)}
              <span className={`ml-1 ${getTrendColor(mappedTrends.asset_value_growth)}`}>
                {mappedTrends.asset_value_growth > 0 ? '+' : ''}{mappedTrends.asset_value_growth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.outstanding_amount, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              From {summary.total_invoice_amount > 0 ? 
                ((summary.outstanding_amount / summary.total_invoice_amount) * 100).toFixed(1) : 0
              }% of total invoiced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.compliance_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.approved_clients} of {summary.total_clients} clients approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.new_clients}</div>
            <p className="text-xs text-muted-foreground">
              This {timeframe}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest actions and updates in your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent_activities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.action.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.resource_type} {activity.resource_id} • by {activity.user_profiles?.full_name || 'System'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/skrs/create">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create New SKR
              </Button>
            </Link>
            <Link href="/dashboard/clients/create">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </Link>
            <Link href="/dashboard/finance/invoices">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            </Link>
            <Link href="/dashboard/compliance">
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Review Compliance
                {summary.total_clients - summary.approved_clients > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {summary.total_clients - summary.approved_clients}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/dashboard/audit">
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View Audit Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Status Distributions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              SKR Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.skr_status).map(([status, count]) => {
                const total = Object.values(distributions.skr_status).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.client_types).map(([type, count]) => {
                const total = Object.values(distributions.client_types).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Invoiced</span>
                <span className="font-semibold">
                  {formatCurrency(summary.total_invoice_amount, 'USD')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(summary.total_paid_amount, 'USD')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Outstanding</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(summary.outstanding_amount, 'USD')}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Collection Rate</span>
                  <span className="font-bold">
                    {summary.total_invoice_amount > 0 
                      ? ((summary.total_paid_amount / summary.total_invoice_amount) * 100).toFixed(1)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Current system status and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">System Status</p>
                <p className="text-xs text-gray-500">Operational</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-gray-500">Healthy</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">API Services</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-gray-500">Processing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}