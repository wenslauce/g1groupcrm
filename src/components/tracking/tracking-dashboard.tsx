'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Clock, 
  Route, 
  Navigation, 
  Loader2, 
  AlertTriangle, 
  Plus
} from 'lucide-react'
import { SKRWithRelations, TrackingRecord } from '@/types'
import { TrackingTimeline } from './tracking-timeline'
import { TrackingMap } from './tracking-map'
import { LocationUpdateForm } from './location-update-form'
import { usePermissions } from '@/contexts/auth-context'

interface TrackingDashboardProps {
  skr: SKRWithRelations
}

export function TrackingDashboard({ skr }: TrackingDashboardProps) {
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')
  
  const permissions = usePermissions()

  useEffect(() => {
    fetchTrackingData()
  }, [skr.id])

  const fetchTrackingData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/skrs/${skr.id}/tracking`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tracking data')
      }
      
      setTrackingRecords(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    setShowAddForm(false)
    fetchTrackingData()
  }

  const recordsWithCoordinates = trackingRecords.filter(
    record => record.latitude && record.longitude
  )

  const totalDistance = recordsWithCoordinates.reduce((total, record) => 
    total + (record.distanceTraveled || 0), 0
  )

  const uniqueLocations = new Set(trackingRecords.map(r => r.location)).size

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
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
            <Button onClick={fetchTrackingData} className="mt-4">
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
          <h2 className="text-2xl font-bold tracking-tight">Asset Tracking</h2>
          <p className="text-muted-foreground">
            Monitor the location and movement of {skr.skr_number}
          </p>
        </div>
        {permissions.canCreateSKRs() && (
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{trackingRecords.length}</div>
                <div className="text-sm text-muted-foreground">Total Updates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{uniqueLocations}</div>
                <div className="text-sm text-muted-foreground">Unique Locations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{totalDistance.toFixed(0)} km</div>
                <div className="text-sm text-muted-foreground">Distance Traveled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{recordsWithCoordinates.length}</div>
                <div className="text-sm text-muted-foreground">GPS Coordinates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Location */}
      {trackingRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{trackingRecords[0].location}</div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(trackingRecords[0].created_at).toLocaleString()}
                </div>
                {trackingRecords[0].latitude && trackingRecords[0].longitude && (
                  <div className="text-sm text-muted-foreground">
                    Coordinates: {trackingRecords[0].latitude.toFixed(6)}, {trackingRecords[0].longitude.toFixed(6)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Recorded by</div>
                <div className="font-medium">{trackingRecords[0].recorded_by_user?.name || 'System'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-6">
          <TrackingTimeline skr={skr} showAddButton={false} />
        </TabsContent>
        
        <TabsContent value="map" className="mt-6">
          <TrackingMap skr={skr} trackingRecords={trackingRecords} />
        </TabsContent>
      </Tabs>
    </div>
  )
}