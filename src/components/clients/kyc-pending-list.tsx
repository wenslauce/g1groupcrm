'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePermissions } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Eye, 
  FileText, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Filter
} from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { clientUtils } from '@/lib/client-utils'
import { formatDateTime } from '@/lib/utils'

export function KYCPendingList() {
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    risk_level: ''
  })
  
  const permissions = usePermissions()

  const fetchPendingClients = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        compliance_status: 'pending',
        limit: '50',
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.risk_level && { risk_level: filters.risk_level })
      })

      const response = await fetch(`/api/clients?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pending clients')
      }

      setClients(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (permissions.canViewClients()) {
      fetchPendingClients()
    }
  }, [filters, permissions])

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      risk_level: ''
    })
  }

  const handleApproveClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to approve this client?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          compliance_status: 'approved'
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to approve client')
      }

      // Refresh the list
      fetchPendingClients()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleRejectClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to reject this client?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          compliance_status: 'rejected'
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to reject client')
      }

      // Refresh the list
      fetchPendingClients()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  if (!permissions.canViewClients()) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">You don't have permission to view KYC pending clients.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              KYC Pending Clients
            </CardTitle>
            <CardDescription>
              Clients awaiting KYC review and compliance approval
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600">
              {clients.length} Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pending clients..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {clientUtils.getAllTypes().map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.risk_level || 'all'}
              onValueChange={(value) => handleFilterChange('risk_level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {clientUtils.getAllRiskLevels().map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending KYC Reviews</h3>
                <p className="text-muted-foreground">
                  All clients have completed their KYC review process.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>KYC Documents</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={clientUtils.getTypeColor(client.type)}>
                            {clientUtils.getTypeDisplayName(client.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{client.country}</TableCell>
                        <TableCell>
                          <Badge className={clientUtils.getRiskLevelColor(client.risk_level)}>
                            {clientUtils.getRiskLevelDisplayName(client.risk_level)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {Array.isArray(client.kyc_documents) ? client.kyc_documents.length : 0} document(s)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(client.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/clients/${client.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {permissions.canManageClients() && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApproveClient(client.id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Approve Client"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRejectClient(client.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Reject Client"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}