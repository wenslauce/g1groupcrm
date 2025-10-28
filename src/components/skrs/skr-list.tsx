'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { Search, Download, Plus, Eye, Edit, Trash2, MapPin, Clock } from 'lucide-react'

interface SKR {
  id: string
  skr_number: string
  client_id: string
  client_name: string
  asset_id: string
  asset_description: string
  status: 'draft' | 'issued' | 'in_transit' | 'delivered' | 'cancelled'
  issue_date: string
  created_at: string
  hash?: string
  tracking_updates?: Array<{
    id: string
    status: string
    location: string
    timestamp: string
    notes?: string
  }>
}

interface SKRStats {
  total: number
  draft: number
  issued: number
  in_transit: number
  delivered: number
  cancelled: number
}

export function SKRList() {
  const [skrs, setSkrs] = useState<SKR[]>([])
  const [stats, setStats] = useState<SKRStats>({
    total: 0,
    draft: 0,
    issued: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchSKRs()
  }, [searchTerm, statusFilter, dateFilter, currentPage])

  const fetchSKRs = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',

        date_range: dateFilter !== 'all' ? dateFilter : ''
      })
      
      const response = await fetch(`/api/skrs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSkrs(data.skrs || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching SKRs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />
      case 'issued':
        return <Download className="h-4 w-4" />
      case 'in_transit':
        return <MapPin className="h-4 w-4" />
      case 'delivered':
        return <Eye className="h-4 w-4" />
      case 'cancelled':
        return <Trash2 className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleViewSKR = (skrId: string) => {
    window.open(`/dashboard/skrs/${skrId}`, '_blank')
  }

  const handleEditSKR = (skrId: string) => {
    window.open(`/dashboard/skrs/${skrId}/edit`, '_blank')
  }

  const handleDeleteSKR = async (skrId: string) => {
    if (confirm('Are you sure you want to delete this SKR?')) {
      try {
        const response = await fetch(`/api/skrs/${skrId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchSKRs()
        } else {
          alert('Failed to delete SKR')
        }
      } catch (error) {
        console.error('Error deleting SKR:', error)
        alert('Error deleting SKR')
      }
    }
  }

  const handleGeneratePDF = async (skrId: string) => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_type: 'skr',
          document_id: skrId
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `skr-${skrId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF')
    }
  }

  const handleVerifySKR = (skrNumber: string) => {
    window.open(`/verify/skr/${skrNumber}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SKRs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SKR Management</h1>
          <p className="text-gray-600">Manage Secure Keeper Receipts</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => window.open('/dashboard/skrs/create', '_blank')}>
            <Plus className="h-4 w-4 mr-2" />
            Create SKR
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.issued}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_transit}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search SKRs, clients, assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SKR Table */}
      <Card>
        <CardHeader>
          <CardTitle>SKR List</CardTitle>
          <CardDescription>View and manage all SKRs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKR Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skrs.map((skr) => (
                <TableRow key={skr.id}>
                  <TableCell className="font-medium">{skr.skr_number}</TableCell>
                  <TableCell>{skr.client_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {skr.asset_description}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(skr.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(skr.status)}
                        <span>{skr.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(skr.issue_date)}</TableCell>
                  <TableCell>
                    {skr.hash ? (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {skr.hash.substring(0, 8)}...
                      </code>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSKR(skr.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSKR(skr.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeneratePDF(skr.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifySKR(skr.skr_number)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSKR(skr.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {skrs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No SKRs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}