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
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { clientUtils } from '@/lib/client-utils'
import { formatDateTime } from '@/lib/utils'

interface ClientListProps {
  onEditClient?: (client: ClientWithRelations) => void
}

export function ClientList({ onEditClient }: ClientListProps) {
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    risk_level: '',
    compliance_status: '',
    country: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  const permissions = usePermissions()

  const fetchClients = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.risk_level && { risk_level: filters.risk_level }),
        ...(filters.compliance_status && { compliance_status: filters.compliance_status }),
        ...(filters.country && { country: filters.country })
      })

      const response = await fetch(`/api/clients?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch clients')
      }

      setClients(result.data)
      setPagination(prev => ({
        ...prev,
        total: result.count,
        totalPages: result.total_pages
      }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (permissions.canViewClients()) {
      fetchClients()
    }
  }, [pagination.page, filters, permissions])

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete client')
      }

      // Refresh the list
      fetchClients()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for filtering logic
    const filterValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      risk_level: '',
      compliance_status: '',
      country: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  if (!permissions.canViewClients()) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">You don't have permission to view clients.</p>
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
              <Users className="h-5 w-5" />
              Client Management
            </CardTitle>
            <CardDescription>
              Manage client profiles, compliance status, and relationships
            </CardDescription>
          </div>
          {permissions.canManageClients() && (
            <Link href="/dashboard/clients/create">
              <Button className="bg-g1-primary hover:bg-g1-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name or email..."
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <Select
              value={filters.compliance_status || 'all'}
              onValueChange={(value) => handleFilterChange('compliance_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {clientUtils.getAllComplianceStatuses().map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.country || 'all'}
              onValueChange={(value) => handleFilterChange('country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {clientUtils.getCountryList().slice(0, 20).map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <Badge className={clientUtils.getTypeColor(client.type)}>
                            {clientUtils.getTypeDisplayName(client.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.country}</TableCell>
                        <TableCell>
                          <Badge className={clientUtils.getRiskLevelColor(client.risk_level)}>
                            {clientUtils.getRiskLevelDisplayName(client.risk_level)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={clientUtils.getComplianceStatusColor(client.compliance_status)}>
                            {clientUtils.getComplianceStatusDisplayName(client.compliance_status)}
                          </Badge>
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
                                {onEditClient ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEditClient(client)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Link href={`/dashboard/clients/${client.id}/edit`}>
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} clients
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}