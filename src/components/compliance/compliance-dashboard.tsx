'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Download,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  User,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { kycUtils } from '@/lib/kyc-utils'
import { formatDateTime } from '@/lib/utils'
import { usePermissions } from '@/contexts/auth-context'

interface ComplianceDashboardProps {
  clientId?: string
}

export function ComplianceDashboard({ clientId }: ComplianceDashboardProps) {
  const [kycDocuments, setKYCDocuments] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [riskLevelFilter, setRiskLevelFilter] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [complianceStats, setComplianceStats] = useState({
    totalDocuments: 0,
    approvedDocuments: 0,
    rejectedDocuments: 0,
    pendingDocuments: 0,
    approvalRate: 0,
    averageRiskScore: 0,
    riskDistribution: { low: 0, medium: 0, high: 0 }
  })
  
  const router = useRouter()
  const permissions = usePermissions()
  const limit = 10

  useEffect(() => {
    fetchComplianceData()
  }, [page, searchTerm, statusFilter, riskLevelFilter, activeTab, clientId])

  const fetchComplianceData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(riskLevelFilter && { risk_level: riskLevelFilter }),
        ...(clientId && { client_id: clientId })
      })
      
      let endpoint = '/api/kyc/documents'
      if (activeTab === 'assessments') endpoint = '/api/compliance/assessments'
      
      const response = await fetch(`${endpoint}?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch compliance data')
      }
      
      if (activeTab === 'documents' || activeTab === 'overview') {
        setKYCDocuments(result.data)
      } else if (activeTab === 'assessments') {
        setAssessments(result.data)
      }
      
      setTotalPages(result.total_pages)
      
      // Fetch overview stats
      if (activeTab === 'overview') {
        await fetchComplianceStats()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchComplianceStats = async () => {
    try {
      const [docsRes, assessmentsRes] = await Promise.all([
        fetch(`/api/kyc/documents?limit=1000${clientId ? `&client_id=${clientId}` : ''}`),
        fetch(`/api/compliance/assessments?limit=1000${clientId ? `&client_id=${clientId}` : ''}`)
      ])
      
      const [docsData, assessmentsData] = await Promise.all([
        docsRes.json(),
        assessmentsRes.json()
      ])
      
      if (docsRes.ok && assessmentsRes.ok) {
        const stats = kycUtils.generateComplianceReport(docsData.data, assessmentsData.data)
        setComplianceStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch compliance stats:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value)
    setPage(1)
  }

  const handleRiskLevelFilter = (value: string) => {
    setRiskLevelFilter(value === 'all' ? '' : value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setRiskLevelFilter('')
    setPage(1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    setStatusFilter('')
    setRiskLevelFilter('')
  }

  const handleViewDocument = (id: string) => {
    router.push(`/dashboard/compliance/documents/${id}`)
  }

  const handleCreateAssessment = () => {
    router.push('/dashboard/compliance/assessments/create')
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button onClick={fetchComplianceData} className="mt-4">
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
          <h2 className="text-2xl font-bold tracking-tight">Compliance Management</h2>
          <p className="text-muted-foreground">
            Monitor KYC documents, risk assessments, and compliance status
          </p>
        </div>
        {permissions.canViewCompliance() && (
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateAssessment}
              className="bg-g1-primary hover:bg-g1-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </div>
        )}
      </div>

      {/* Compliance Overview Stats */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{complianceStats.totalDocuments}</div>
                  <div className="text-sm text-muted-foreground">Total Documents</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{complianceStats.approvalRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Approval Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{complianceStats.averageRiskScore}</div>
                  <div className="text-sm text-muted-foreground">Avg Risk Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{complianceStats.pendingDocuments}</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Distribution */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{complianceStats.riskDistribution.low}</div>
                <div className="text-sm text-muted-foreground">Low Risk</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{complianceStats.riskDistribution.medium}</div>
                <div className="text-sm text-muted-foreground">Medium Risk</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{complianceStats.riskDistribution.high}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {kycUtils.getAllKYCStatuses().map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Risk Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level</label>
              <Select value={riskLevelFilter || 'all'} onValueChange={handleRiskLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {(searchTerm || statusFilter || riskLevelFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">KYC Documents</TabsTrigger>
          <TabsTrigger value="assessments">Risk Assessments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest KYC documents and compliance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : kycDocuments.length === 0 ? (
                <div className="text-center p-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">
                    No recent compliance activities to display
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycDocuments.slice(0, 5).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="font-medium">
                            {kycUtils.getDocumentTypeDisplayName(doc.document_type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.client?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={kycUtils.getKYCStatusColor(doc.status)}>
                            {kycUtils.getKYCStatusDisplayName(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(doc.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc.id)}
                          >
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
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : kycDocuments.length === 0 ? (
                <div className="text-center p-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No KYC Documents Found</h3>
                  <p className="text-muted-foreground">
                    No KYC documents match your current filters
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reviewed By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="font-medium">
                            {kycUtils.getDocumentTypeDisplayName(doc.document_type)}
                          </div>
                          {doc.document_number && (
                            <div className="text-xs text-muted-foreground">
                              {doc.document_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{doc.client?.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {doc.client?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={kycUtils.getKYCStatusColor(doc.status)}>
                            {kycUtils.getKYCStatusDisplayName(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span>{doc.issuing_country}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(doc.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {doc.reviewed_by_user?.name || 'Not reviewed'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(doc.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assessments" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center p-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Risk Assessments Found</h3>
                  <p className="text-muted-foreground">
                    No risk assessments match your current filters
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Assessment Type</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Next Review</TableHead>
                      <TableHead>Assessed By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{assessment.client?.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {assessment.client?.country}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {assessment.assessment_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{assessment.overall_risk_score}/100</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={kycUtils.getRiskLevelColor(assessment.risk_level)}>
                            {assessment.risk_level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDateTime(assessment.next_review_date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {assessment.assessed_by_user?.name}
                          </div>
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
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, kycDocuments.length)} items
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