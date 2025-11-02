'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MapPin, 
  Search, 
  Loader2, 
  Eye,
  Route,
  Clock,
  Navigation,
  Filter
} from 'lucide-react'
import { skrUtils } from '@/lib/skr-utils'
import { formatDateTime } from '@/lib/utils'

interface SKRTrackingItem {
  id: string
  skr_number: string
  status: string
  client_name: string
  asset_name: string
  issue_date: string | null
  created_at: string
  tracking_count: number
  last_location: string | null
  last_update: string | null
  in_transit: boolean
}

export default function SKRTrackingPage() {
  const [skrs, setSkrs] = useState<SKRTrackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  })
  const { user } = useAuth()
  
  // Use ref to track if fetch is in progress to prevent duplicate calls
  const fetchingRef = useRef(false)

  const fetchSKRs = async () => {
    // Prevent duplicate simultaneous calls
    if (fetchingRef.current) return
    fetchingRef.current = true
    
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`/api/skrs?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch SKRs')
      }

      // Fetch tracking data for each SKR
      const skrsWithTracking = await Promise.all(
        (result.skrs || []).map(async (skr: any) => {
          try {
            const trackingResponse = await fetch(`/api/skrs/${skr.id}/tracking`)
            const trackingResult = await trackingResponse.json()
            
            const trackingRecords = trackingResult.data || []
            const lastRecord = trackingRecords.length > 0 ? trackingRecords[0] : null
            
            return {
              id: skr.id,
              skr_number: skr.skr_number,
              status: skr.status,
              client_name: skr.client_name || 'Unknown Client',
              asset_name: skr.asset_description || 'Unknown Asset',
              issue_date: skr.issue_date,
              created_at: skr.created_at,
              tracking_count: trackingRecords.length,
              last_location: lastRecord?.location || null,
              last_update: lastRecord?.created_at || null,
              in_transit: skr.status === 'in_transit'
            }
          } catch {
            return {
              id: skr.id,
              skr_number: skr.skr_number,
              status: skr.status,
              client_name: skr.client_name || 'Unknown Client',
              asset_name: skr.asset_description || 'Unknown Asset',
              issue_date: skr.issue_date,
              created_at: skr.created_at,
              tracking_count: 0,
              last_location: null,
              last_update: null,
              in_transit: skr.status === 'in_transit'
            }
          }
        })
      )
      
      setSkrs(skrsWithTracking)
    } catch (error) {
      console.error('Error fetching SKRs:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchSKRs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status])

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: ''
    })
  }

  const trackingStats = useMemo(() => {
    const total = skrs.length
    const withTracking = skrs.filter(s => s.tracking_count > 0).length
    const inTransit = skrs.filter(s => s.in_transit).length
    const needsUpdate = skrs.filter(s => {
      if (!s.last_update || !s.in_transit) return false
      const lastUpdate = new Date(s.last_update)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
      return hoursSinceUpdate > 24 // Needs update if last update was more than 24 hours ago
    }).length

    return { total, withTracking, inTransit, needsUpdate }
  }, [skrs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SKR Tracking</h1>
        <p className="text-muted-foreground">
          Monitor and track the location and status of SKRs in real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKRs</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Tracking</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingStats.withTracking}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackingStats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{trackingStats.needsUpdate}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>SKR Tracking List</CardTitle>
          <CardDescription>
            View and manage tracking for all SKRs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKRs by number..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={clearFilters}
                className="whitespace-nowrap"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKR Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking Updates</TableHead>
                    <TableHead>Last Location</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skrs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No SKRs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    skrs.map((skr) => (
                      <TableRow key={skr.id}>
                        <TableCell className="font-medium">{skr.skr_number}</TableCell>
                        <TableCell>{skr.client_name}</TableCell>
                        <TableCell>{skr.asset_name}</TableCell>
                        <TableCell>
                          <Badge className={skrUtils.getStatusColor(skr.status as any)}>
                            {skrUtils.getStatusDisplayName(skr.status as any)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{skr.tracking_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {skr.last_location ? (
                            <span className="font-medium">{skr.last_location}</span>
                          ) : (
                            <span className="text-muted-foreground">No location data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {skr.last_update ? (
                            formatDateTime(skr.last_update)
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/skrs/${skr.id}/tracking`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}