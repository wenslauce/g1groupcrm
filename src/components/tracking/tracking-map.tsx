'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Map, 
  MapPin, 
  Navigation, 
  Maximize2, 
  Minimize2,
  Loader2,
  AlertTriangle,
  Route,
  Clock
} from 'lucide-react'
import { SKRWithRelations, TrackingRecord } from '@/types'
import { trackingUtils } from '@/lib/tracking-utils'
import { formatDateTime } from '@/lib/utils'

interface TrackingMapProps {
  skr: SKRWithRelations
  trackingRecords: TrackingRecord[]
  className?: string
}

export function TrackingMap({ skr, trackingRecords, className }: TrackingMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TrackingRecord | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }) // Default to London
  const [mapZoom, setMapZoom] = useState(2)

  // Filter records that have coordinates
  const recordsWithCoordinates = trackingRecords.filter(
    record => record.latitude && record.longitude
  )

  useEffect(() => {
    // Set map center to the latest location with coordinates
    if (recordsWithCoordinates.length > 0) {
      const latest = recordsWithCoordinates[0]
      if (latest.latitude && latest.longitude) {
        setMapCenter({ lat: latest.latitude, lng: latest.longitude })
        setMapZoom(recordsWithCoordinates.length === 1 ? 10 : 6)
      }
    }
  }, [recordsWithCoordinates])

  const calculateBounds = () => {
    if (recordsWithCoordinates.length === 0) return null
    
    const lats = recordsWithCoordinates.map(r => r.latitude!)
    const lngs = recordsWithCoordinates.map(r => r.longitude!)
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }

  const totalDistance = recordsWithCoordinates.reduce((total, record) => 
    total + (record.distanceTraveled || 0), 0
  )

  if (recordsWithCoordinates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Tracking Map
          </CardTitle>
          <CardDescription>
            Visual representation of asset movement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No GPS Coordinates</h3>
            <p className="text-muted-foreground">
              No tracking records with GPS coordinates are available for this SKR.
              Add location updates with coordinates to see the tracking map.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Tracking Map
            </CardTitle>
            <CardDescription>
              {recordsWithCoordinates.length} location{recordsWithCoordinates.length !== 1 ? 's' : ''} with GPS coordinates
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Placeholder */}
          <div className={`relative bg-muted rounded-lg overflow-hidden ${
            isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
          }`}>
            {/* This would be replaced with an actual map component like Leaflet or Google Maps */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
              <div className="text-center">
                <Map className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  This would display an interactive map showing the tracking path.
                  Integration with mapping services like Google Maps or Leaflet would be implemented here.
                </p>
              </div>
            </div>
            
            {/* Simulated map markers */}
            <div className="absolute inset-0">
              {recordsWithCoordinates.map((record, index) => {
                // Simulate marker positions (in real implementation, these would be calculated from actual coordinates)
                const x = 20 + (index * 60) % 80
                const y = 20 + (index * 40) % 60
                
                return (
                  <div
                    key={record.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                      record.isLatest ? 'z-20' : 'z-10'
                    }`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                      record.isLatest 
                        ? 'bg-red-500' 
                        : index === recordsWithCoordinates.length - 1
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`} />
                    
                    {/* Tooltip */}
                    {selectedRecord?.id === record.id && (
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-lg border min-w-48 z-30">
                        <div className="font-medium">{record.location}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(record.created_at)}
                        </div>
                        <Badge className={trackingUtils.getStatusColor(record.status)} size="sm">
                          {trackingUtils.getStatusDisplayName(record.status)}
                        </Badge>
                        {record.notes && (
                          <div className="text-xs mt-1">{record.notes}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Map Controls and Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Total Distance</span>
                </div>
                <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Locations</span>
                </div>
                <div className="text-2xl font-bold">{recordsWithCoordinates.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Duration</span>
                </div>
                <div className="text-2xl font-bold">
                  {recordsWithCoordinates.length > 1 ? (
                    Math.ceil(
                      (new Date(recordsWithCoordinates[0].created_at).getTime() - 
                       new Date(recordsWithCoordinates[recordsWithCoordinates.length - 1].created_at).getTime()) 
                      / (1000 * 60 * 60 * 24)
                    )
                  ) : 0} days
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location List */}
          <div className="space-y-2">
            <h4 className="font-medium">Tracked Locations</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recordsWithCoordinates.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                    selectedRecord?.id === record.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    record.isLatest 
                      ? 'bg-red-500' 
                      : index === recordsWithCoordinates.length - 1
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{record.location}</span>
                      {record.isLatest && (
                        <Badge variant="secondary" size="sm">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trackingUtils.formatCoordinates(record.latitude, record.longitude)} • 
                      {formatDateTime(record.created_at)}
                    </div>
                  </div>
                  
                  <Badge className={trackingUtils.getStatusColor(record.status)} size="sm">
                    {trackingUtils.getStatusDisplayName(record.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Start Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Intermediate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Current Location</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}