'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Clock, 
  Route, 
  Navigation, 
  Loader2, 
  Search,
  Eye,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { SKRWithRelations } from '@/types'
import { skrUtils } from '@/lib/skr-utils'

export default function SKRTrackingPage() {
  const [skrs, setSkrs] = useState<SKRWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchSKRs()
  }, [])

  const fetchSKRs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/skrs')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch SKRs')
      }
      
      setSkrs(result.data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredSKRs = skrs.filter(skr => {
    const matchesSearch = skr.skr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skr.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skr.asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || skr.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getTrackingStats = (skr: SKRWithRelations) => {
    // This would typically come from a tracking API call
    // For now, we'll show placeholder data
    return {
      totalUpdates: Math.floor(Math.random() * 10) + 1,
      lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      hasCoordinates: Math.random() > 0.3
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={fetchSKRs} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SKR Tracking</h1>
        <p className="text-muted-foreground">
          Monitor and track the location of all SKRs in real-time
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter SKRs for tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by SKR number, client, or asset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SKR List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSKRs.map((skr) => {
          const stats = getTrackingStats(skr)
          const client = Array.isArray(skr.client) ? skr.client[0] : skr.client
          const asset = Array.isArray(skr.asset) ? skr.asset[0] : skr.asset
          
          return (
            <Card key={skr.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{skr.skr_number}</CardTitle>
                    <CardDescription>
                      {client?.name || 'Unknown Client'}
                    </CardDescription>
                  </div>
                  <Badge className={skrUtils.getStatusColor(skr.status as any)}>
                    {skrUtils.getStatusDisplayName(skr.status as any)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Asset Info */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Asset:</span>
                  </div>
                  <p className="text-sm font-medium ml-6">
                    {asset?.asset_name || 'Unknown Asset'}
                  </p>
                </div>

                {/* Tracking Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{stats.totalUpdates}</div>
                      <div className="text-muted-foreground">Updates</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">
                        {stats.lastUpdate.toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground">Last Update</div>
                    </div>
                  </div>
                </div>

                {/* GPS Status */}
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className={`h-4 w-4 ${stats.hasCoordinates ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={stats.hasCoordinates ? 'text-green-600' : 'text-muted-foreground'}>
                    {stats.hasCoordinates ? 'GPS Enabled' : 'No GPS Data'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Link href={`/dashboard/skrs/${skr.id}/tracking`}>
                    <Button className="w-full" variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Tracking
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredSKRs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No SKRs Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter 
                ? 'No SKRs match your current filters. Try adjusting your search criteria.'
                : 'No SKRs are available for tracking at the moment.'
              }
            </p>
            {(searchTerm || statusFilter) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}