'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  Loader2,
  AlertTriangle,
  User,
  Shield,
  Eye,
  BarChart3
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { usePermissions } from '@/contexts/auth-context'

interface AuditLog {
  id: string
  action: string
  table_name: string
  record_id: string
  old_values: any
  new_values: any
  user_id: string
  created_at: string
  metadata: any
  user?: {
    id: string
    name: string
    email: string
  }
}

export function ComplianceReports() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const permissions = usePermissions()
  const limit = 20

  useEffect(() => {
    fetchAuditLogs()
  }, [page, actionFilter, tableFilter, userFilter, dateFromFilter, dateToFilter])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(actionFilter && { action: actionFilter }),
        ...(tableFilter && { table_name: tableFilter }),
        ...(userFilter && { user_id: userFilter }),
        ...(dateFromFilter && { date_from: dateFromFilter }),
        ...(dateToFilter && { date_to: dateToFilter })
      })
      
      const response = await fetch(`/api/audit/logs?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch audit logs')
      }
      
      setAuditLogs(result.data || [])
      setTotalPages(result.total_pages || 1)
      setTotalCount(result.count || 0)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setActionFilter('')
    setTableFilter('')
    setUserFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setPage(1)
  }

  const exportAuditReport = async () => {
    try {
      const params = new URLSearchParams({
        ...(actionFilter && { action: actionFilter }),
        ...(tableFilter && { table_name: tableFilter }),
        ...(userFilter && { user_id: userFilter }),
        ...(dateFromFilter && { date_from: dateFromFilter }),
        ...(dateToFilter && { date_to: dateToFilter }),
        format: 'csv'
      })
      
      const response = await fetch(`/api/audit/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export audit report:', error)
    }
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      clients: 'Clients',
      skrs: 'SKRs',
      assets: 'Assets',
      invoices: 'Invoices',
      receipts: 'Receipts',
      credit_notes: 'Credit Notes',
      kyc_documents: 'KYC Documents',
      compliance_assessments: 'Risk Assessments',
      user_profiles: 'User Profiles'
    }
    return names[tableName] || tableName
  }

  if (!permissions?.canViewAuditLogs()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to view audit logs and compliance reports
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button onClick={fetchAuditLogs} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Trail & Reports</h2>
          <p className="text-muted-foreground">
            Monitor system activities and generate compliance reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAuditReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Total Activities</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(auditLogs.map(log => log.user_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {auditLogs.filter(log => ['CREATE', 'UPDATE', 'DELETE'].includes(log.action)).length}
                </div>
                <div className="text-sm text-muted-foreground">Data Changes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {auditLogs.filter(log => {
                    const logDate = new Date(log.created_at)
                    const today = new Date()
                    return logDate.toDateString() === today.toDateString()
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Today's Activities</div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter || 'all'} onValueChange={(value) => setActionFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Table</label>
              <Select value={tableFilter || 'all'} onValueChange={(value) => setTableFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="skrs">SKRs</SelectItem>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="kyc_documents">KYC Documents</SelectItem>
                  <SelectItem value="compliance_assessments">Risk Assessments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="datetime-local"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="datetime-local"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {(actionFilter || tableFilter || userFilter || dateFromFilter || dateToFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Comprehensive log of all system activities and changes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center p-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
              <p className="text-muted-foreground">
                No audit logs match your current filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {getTableDisplayName(log.table_name)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.user?.name || 'System'}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.record_id.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={pageNum === page ? "bg-g1-primary hover:bg-g1-primary/90" : ""}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}