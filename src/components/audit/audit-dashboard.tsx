'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AuditLog {
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
}

interface AuditDashboardProps {
  className?: string
}

export function AuditDashboard({ className }: AuditDashboardProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedResourceType, setSelectedResourceType] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  // Statistics
  const [stats, setStats] = useState({
    totalLogs: 0,
    uniqueUsers: 0,
    topActions: [] as Array<{ action: string; count: number }>,
    recentActivity: 0
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [currentPage, selectedAction, selectedResourceType, selectedUser, startDate, endDate])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1)
        fetchAuditLogs()
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const fetchAuditLogs = async () => {
    if (!refreshing) setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedAction && selectedAction !== 'all') params.append('action', selectedAction)
      if (selectedResourceType && selectedResourceType !== 'all') params.append('resource_type', selectedResourceType)
      if (selectedUser && selectedUser !== 'all') params.append('user_id', selectedUser)
      if (startDate) params.append('start_date', new Date(startDate).toISOString())
      if (endDate) params.append('end_date', new Date(endDate).toISOString())

      const response = await fetch(`/api/audit/logs?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch audit logs')
      }

      setLogs(result.logs)
      setTotalPages(result.pagination.totalPages)
      
      // Update stats
      setStats({
        totalLogs: result.pagination.total,
        uniqueUsers: new Set(result.logs.map((log: AuditLog) => log.user_id)).size,
        topActions: getTopActions(result.logs),
        recentActivity: result.logs.filter((log: AuditLog) => 
          new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAuditLogs()
  }

  const handleExportReport = async (format: 'json' | 'csv') => {
    try {
      const reportData = {
        report_type: 'custom' as const,
        start_date: startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
        actions: selectedAction && selectedAction !== 'all' ? [selectedAction] : undefined,
        resource_types: selectedResourceType && selectedResourceType !== 'all' ? [selectedResourceType] : undefined,
        user_ids: selectedUser && selectedUser !== 'all' ? [selectedUser] : undefined,
        include_details: true,
        format
      }

      const response = await fetch('/api/audit/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export report')
    }
  }

  const getTopActions = (logs: AuditLog[]): Array<{ action: string; count: number }> => {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return <Shield className="h-4 w-4" />
    if (action.includes('created') || action.includes('updated')) return <Activity className="h-4 w-4" />
    if (action.includes('viewed') || action.includes('accessed')) return <Eye className="h-4 w-4" />
    if (action.includes('failed') || action.includes('error')) return <AlertTriangle className="h-4 w-4" />
    if (action.includes('approved') || action.includes('success')) return <CheckCircle className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('failed') || action.includes('error') || action.includes('rejected')) return 'bg-red-100 text-red-800'
    if (action.includes('approved') || action.includes('success') || action.includes('completed')) return 'bg-green-100 text-green-800'
    if (action.includes('pending') || action.includes('review')) return 'bg-yellow-100 text-yellow-800'
    if (action.includes('login') || action.includes('auth')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAction('')
    setSelectedResourceType('')
    setSelectedUser('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  if (loading && logs.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system activity and security events
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Select onValueChange={(value) => handleExportReport(value as 'json' | 'csv')}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              Export
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold">{stats.recentActivity}</p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Action</p>
                <p className="text-lg font-bold">
                  {stats.topActions[0]?.action.replace('_', ' ') || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.topActions[0]?.count || 0} occurrences
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login_success">Login Success</SelectItem>
                <SelectItem value="login_failed">Login Failed</SelectItem>
                <SelectItem value="client_created">Client Created</SelectItem>
                <SelectItem value="skr_created">SKR Created</SelectItem>
                <SelectItem value="skr_approved">SKR Approved</SelectItem>
                <SelectItem value="invoice_created">Invoice Created</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="skr">SKR</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="financial_document">Financial</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            Showing {logs.length} of {stats.totalLogs} audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(log.created_at).toLocaleString()}</div>
                        <div className="text-gray-500">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {log.user_profiles?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-gray-500">
                          {log.user_profiles?.email}
                        </div>
                        {log.user_profiles?.role && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {log.user_profiles.role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge className={getActionColor(log.action)}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-gray-500 font-mono text-xs">
                            {log.resource_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm font-mono">
                        {log.ip_address || 'N/A'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm max-w-xs">
                        {Object.keys(log.details).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-500">No details</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}