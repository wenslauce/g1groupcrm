'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MapPin, 
  Clock, 
  User, 
  Navigation, 
  Filter, 
  Loader2, 
  AlertTriangle, 
  Plus, 
  Eye, 
  Route
} from 'lucide-react'
import { SKRWithRelations, TrackingRecord } from '@/types'
import { trackingUtils } from '@/lib/tracking-utils'
import { formatDateTime } from '@/lib/utils'
import { LocationUpdateForm } from './location-update-form'

interface TrackingTimelineProps { 
  skr: SKRWithRelations
  showAddButton?: boolean
}

export function TrackingTimeline({ skr, showAddButton = true }: TrackingTimelineProps) { 
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]) 
  const [loading, setLoading] = useState(true) 
  const [error, setError] = useState('') 
  const [showAddForm, setShowAddForm] = useState(false) 
  const [statusFilter, setStatusFilter] = useState('') 
  const [locationFilter, setLocationFilter] = useState('')
  
  // Use ref to track if fetch is in progress to prevent duplicate calls
  const fetchingRef = useRef(false)

  const fetchTrackingHistory = async () => {
    // Prevent duplicate simultaneous calls
    if (fetchingRef.current) return
    fetchingRef.current = true
    
    setLoading(true) 
    try { 
      const params = new URLSearchParams({ 
        ...(statusFilter && { status: statusFilter }), 
        ...(locationFilter && { location: locationFilter }) 
      }) 
      
      const response = await fetch(`/api/skrs/${skr.id}/tracking?${params}`) 
      const result = await response.json() 
      
      if (!response.ok) { 
        throw new Error(result.error || 'Failed to fetch tracking history') 
      } 
      
      setTrackingRecords(result.data || []) 
    } catch (error) { 
      setError(error instanceof Error ? error.message : 'An error occurred') 
    } finally { 
      setLoading(false)
      fetchingRef.current = false
    } 
  }

  useEffect(() => {
    fetchTrackingHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skr.id, statusFilter, locationFilter])

  const handleUpdate = () => { 
    setShowAddForm(false) 
    fetchTrackingHistory() 
  }

  const clearFilters = () => { 
    setStatusFilter('') 
    setLocationFilter('') 
  }

  if (error) { 
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button onClick={fetchTrackingHistory} className="mt-4">
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
          <h3 className="text-lg font-semibold">Tracking History</h3>
          <p className="text-sm text-muted-foreground">
            {trackingRecords.length} location update{trackingRecords.length !== 1 ? 's' : ''}
          </p>
        </div>
        {showAddButton && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-g1-primary hover:bg-g1-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        )}
      </div>

      {/* Add Location Form */}
      {showAddForm && (
        <LocationUpdateForm
          skr={skr}
          onUpdate={handleUpdate}
          onCancel={() => setShowAddForm(false)}
        />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {trackingUtils.getAllStatuses().map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              {(statusFilter || locationFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : trackingRecords.length === 0 ? (
            <div className="text-center p-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Tracking Records</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter || locationFilter
                  ? 'No tracking records match your current filters'
                  : 'No location updates have been recorded for this SKR yet'
                }
              </p>
              {showAddButton && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-g1-primary hover:bg-g1-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Location
                </Button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Timeline items */}
                <div className="space-y-6">
                  {trackingRecords.map((record, index) => (
                    <div key={record.id} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                        record.isLatest 
                          ? 'bg-g1-primary border-g1-primary text-white' 
                          : 'bg-background border-border'
                      }`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{record.location}</h4>
                              {record.isLatest && (
                                <Badge variant="secondary">Current</Badge>
                              )}
                              <Badge className={trackingUtils.getStatusColor(record.status)}>
                                {trackingUtils.getStatusDisplayName(record.status)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDateTime(record.created_at)}
                              </div>
                              
                              {record.recorded_by_user && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {record.recorded_by_user.name}
                                </div>
                              )}
                              
                              {record.latitude && record.longitude && (
                                <div className="flex items-center gap-1">
                                  <Navigation className="h-4 w-4" />
                                  {trackingUtils.formatCoordinates(record.latitude, record.longitude)}
                                </div>
                              )}
                            </div>
                            
                            {record.notes && (
                              <div className="text-sm bg-muted p-3 rounded-lg">
                                {record.notes}
                              </div>
                            )}
                            
                            {record.distanceTraveled && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Route className="h-4 w-4" />
                                {record.distanceTraveled.toFixed(1)} km from previous location
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {record.latitude && record.longitude && (
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {trackingRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tracking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{trackingRecords.length}</div>
                <div className="text-sm text-muted-foreground">Total Updates</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Set(trackingRecords.map(r => r.location)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Locations</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {trackingRecords.filter(r => r.latitude && r.longitude).length}
                </div>
                <div className="text-sm text-muted-foreground">GPS Coordinates</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {trackingRecords.reduce((total, record) => 
                    total + (record.distanceTraveled || 0), 0
                  ).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Distance (km)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
