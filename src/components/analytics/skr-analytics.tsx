'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Users,
  Globe,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface SKRAnalytics {
  performance_metrics: {
    total_skrs: number
    issued_skrs: number
    active_skrs: number
    completed_skrs: number
    draft_skrs: number
    issuance_rate: number
    completion_rate: number
    avg_processing_time_days: number
    total_asset_value: number
  }
  distributions: {
    status: Record<string, number>
    client_types: Record<string, number>
    asset_types: Record<string, number>
    countries: Record<string, number>
  }
  time_series: Array<{
    date: string
    total: number
    issued: number
    in_transit: number
    delivered: number
    value: number
  }>
  top_clients: Array<{
    client_id: string
    client_name: string
    client_type: string
    skr_count: number
    total_value: number
  }>
  top_asset_types: Array<{
    asset_type: string
    skr_count: number
    total_value: number
  }>
  recent_skrs: Array<{
    id: string
    skr_number: string
    status: string
    client_name: string
    asset_name: string
    asset_value: number
    currency: string
    created_at: string
    issue_date?: string
  }>
  date_range: {
    start_date: string
    end_date: string
  }
  generated_at: string
}

interface SKRAnalyticsProps {
  className?: string
}

export function SKRAnalytics({ className }: SKRAnalyticsProps) {
  const [data, setData] = useState<SKRAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState('year')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    if (!refreshing) setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        group_by: timeframe === 'week' ? 'day' : timeframe === 'month' ? 'week' : 'month'
      })

      if (timeframe !== 'all') {
        const range = getDateRange(timeframe)
        params.append('start_date', range.start_date)
        params.append('end_date', range.end_date)
      }

      const response = await fetch(`/api/analytics/skrs?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch SKR analytics')
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
    fetchAnalytics()
  }

  const getDateRange = (period: string) => {
    const now = new Date()
    const start = new Date()

    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setFullYear(now.getFullYear() - 1)
    }

    return {
      start_date: start.toISOString(),
      end_date: now.toISOString()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-blue-100 text-blue-800'
      case 'in_transit':
        return 'bg-orange-100 text-orange-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'closed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
            <Button onClick={fetchAnalytics} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { performance_metrics, distributions, time_series, top_clients, top_asset_types, recent_skrs } = data

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SKR Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of SKR performance and trends
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
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total SKRs</p>
                <p className="text-2xl font-bold">{performance_metrics?.total_skrs?.toLocaleString() || '0'}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issuance Rate</p>
                <p className="text-2xl font-bold">{performance_metrics.issuance_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {performance_metrics.issued_skrs} issued
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{performance_metrics.completion_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {performance_metrics.completed_skrs} delivered
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold">{performance_metrics.avg_processing_time_days.toFixed(1)}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active SKRs</p>
                <p className="text-2xl font-bold">{performance_metrics.active_skrs}</p>
                <p className="text-xs text-gray-500">In transit or issued</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft SKRs</p>
                <p className="text-2xl font-bold">{performance_metrics.draft_skrs}</p>
                <p className="text-xs text-gray-500">Pending approval</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asset Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(performance_metrics.total_asset_value, 'USD')}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>Current status of all SKRs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.status).map(([status, count]) => {
                const total = Object.values(distributions.status).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Client Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Type Distribution
            </CardTitle>
            <CardDescription>SKRs by client category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.client_types).map(([type, count]) => {
                const total = Object.values(distributions.client_types).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients and Asset Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clients by SKR Count
            </CardTitle>
            <CardDescription>Clients with most SKRs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_clients.slice(0, 5).map((client, index) => (
                <div key={client.client_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{client.client_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{client.client_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{client.skr_count}</p>
                    <p className="text-xs text-gray-500">SKRs</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Asset Types by Value
            </CardTitle>
            <CardDescription>Asset types with highest total value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_asset_types.slice(0, 5).map((assetType, index) => (
                <div key={assetType.asset_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{assetType.asset_type}</p>
                      <p className="text-sm text-gray-600">{assetType.skr_count} SKRs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(assetType.total_value, 'USD')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent SKRs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SKRs</CardTitle>
          <CardDescription>
            Latest {recent_skrs.length} SKRs in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKR Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_skrs.slice(0, 10).map((skr) => (
                  <TableRow key={skr.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{skr.skr_number}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">{skr.client_name}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">{skr.asset_name}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(skr.asset_value, skr.currency)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(skr.status)}>
                        {skr.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(skr.created_at).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          {formatDistanceToNow(new Date(skr.created_at), { addSuffix: true })}
                        </div>
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