'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Shield, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  Globe,
  TrendingUp,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ComplianceAnalytics {
  performance_metrics: {
    total_clients: number
    approved_clients: number
    pending_clients: number
    rejected_clients: number
    under_review_clients: number
    compliance_rate: number
    avg_approval_time: number
    total_compliance_activities: number
    kyc_approval_rate: number
    risk_assessment_count: number
  }
  distributions: {
    compliance_status: Record<string, number>
    risk_levels: Record<string, number>
    client_types: Record<string, any>
    countries: Record<string, any>
    kyc_status: {
      no_documents: number
      incomplete: number
      complete: number
    }
  }
  time_series: Array<{
    date: string
    new_clients: number
    approved_clients: number
    compliance_activities: number
    kyc_approvals: number
    kyc_rejections: number
  }>
  team_activity: Array<{
    user_name: string
    user_role: string
    total_activities: number
    approvals: number
    rejections: number
    assessments: number
  }>
  compliance_issues: {
    high_risk_clients: number
    pending_reviews: number
    rejected_applications: number
    incomplete_kyc: number
    overdue_reviews: number
  }
  recent_activities: Array<{
    id: string
    action: string
    resource_type: string
    resource_id: string
    user_name: string
    user_role: string
    details: Record<string, any>
    created_at: string
  }>
  date_range: {
    start_date: string
    end_date: string
  }
  generated_at: string
}

interface ComplianceAnalyticsProps {
  className?: string
}

export function ComplianceAnalytics({ className }: ComplianceAnalyticsProps) {
  const [data, setData] = useState<ComplianceAnalytics | null>(null)
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

      const response = await fetch(`/api/analytics/compliance?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch compliance analytics')
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
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('approved')) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (action.includes('rejected')) return <XCircle className="h-4 w-4 text-red-500" />
    if (action.includes('uploaded')) return <FileText className="h-4 w-4 text-blue-500" />
    if (action.includes('assessment')) return <Activity className="h-4 w-4 text-purple-500" />
    return <Shield className="h-4 w-4 text-gray-500" />
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

  const { performance_metrics, distributions, time_series, team_activity, compliance_issues, recent_activities } = data

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive compliance performance and risk management analysis
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

      {/* Key Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold">{performance_metrics.compliance_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {performance_metrics.approved_clients} of {performance_metrics.total_clients} approved
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">{performance_metrics.pending_clients + performance_metrics.under_review_clients}</p>
                <p className="text-xs text-gray-500">
                  {performance_metrics.pending_clients} pending, {performance_metrics.under_review_clients} in review
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">KYC Approval Rate</p>
                <p className="text-2xl font-bold">{performance_metrics.kyc_approval_rate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Approval Time</p>
                <p className="text-2xl font-bold">{performance_metrics.avg_approval_time.toFixed(1)}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Issues Alert */}
      {(compliance_issues.high_risk_clients > 0 || compliance_issues.overdue_reviews > 0 || compliance_issues.incomplete_kyc > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Compliance Issues Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compliance_issues.high_risk_clients > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">High Risk Clients</p>
                    <p className="text-sm text-red-600">{compliance_issues.high_risk_clients} clients</p>
                  </div>
                </div>
              )}
              
              {compliance_issues.overdue_reviews > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-800">Overdue Reviews</p>
                    <p className="text-sm text-orange-600">{compliance_issues.overdue_reviews} reviews</p>
                  </div>
                </div>
              )}
              
              {compliance_issues.incomplete_kyc > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <FileText className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-800">Incomplete KYC</p>
                    <p className="text-sm text-yellow-600">{compliance_issues.incomplete_kyc} clients</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Compliance Status Distribution
            </CardTitle>
            <CardDescription>Current status of all clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.compliance_status).map(([status, count]) => {
                const total = Object.values(distributions.compliance_status).reduce((sum, val) => sum + val, 0)
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

        {/* Risk Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Level Distribution
            </CardTitle>
            <CardDescription>Client risk assessment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(distributions.risk_levels).map(([level, count]) => {
                const total = Object.values(distributions.risk_levels).reduce((sum, val) => sum + val, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        level === 'high' ? 'bg-red-500' :
                        level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{level} Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            level === 'high' ? 'bg-red-500' :
                            level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
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

      {/* KYC Status and Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              KYC Documentation Status
            </CardTitle>
            <CardDescription>Client KYC completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Complete KYC</span>
                </div>
                <span className="font-bold text-green-600">
                  {distributions.kyc_status.complete}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Incomplete KYC</span>
                </div>
                <span className="font-bold text-yellow-600">
                  {distributions.kyc_status.incomplete}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">No Documents</span>
                </div>
                <span className="font-bold text-red-600">
                  {distributions.kyc_status.no_documents}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Team Members
            </CardTitle>
            <CardDescription>Most active compliance team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team_activity.slice(0, 5).map((member, index) => (
                <div key={member.user_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.user_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{member.user_role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{member.total_activities}</p>
                    <p className="text-xs text-gray-500">
                      {member.approvals}A / {member.rejections}R
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activities</CardTitle>
          <CardDescription>
            Latest compliance-related actions and decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_activities.slice(0, 15).map((activity) => (
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
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.action)}
                        <span className="text-sm">
                          {activity.action.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{activity.resource_type}</div>
                        <div className="text-gray-500 font-mono text-xs">
                          {activity.resource_id}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">{activity.user_name}</span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {activity.user_role}
                      </Badge>
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