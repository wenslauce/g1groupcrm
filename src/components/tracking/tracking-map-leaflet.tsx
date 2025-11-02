'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Map, 
  MapPin, 
  Navigation, 
  Maximize2, 
  Minimize2,
  Route,
  Clock
} from 'lucide-react'
import { SKRWithRelations, TrackingRecord } from '@/types'
import { trackingUtils } from '@/lib/tracking-utils'
import { formatDateTime } from '@/lib/utils'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false
})
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), {
  ssr: false
})
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), {
  ssr: false
})
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), {
  ssr: false
})
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), {
  ssr: false
})

interface TrackingMapLeafletProps {
  skr: SKRWithRelations
  trackingRecords: TrackingRecord[]
  className?: string
}

export function TrackingMapLeaflet({ skr, trackingRecords, className }: TrackingMapLeafletProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TrackingRecord | null>(null)
  const mapRef = useRef<any>(null)

  // Filter records that have coordinates
  const recordsWithCoordinates = trackingRecords.filter(
    record => record.latitude && record.longitude
  )

  // Calculate total distance
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

  // Determine map center and bounds
  const lats = recordsWithCoordinates.map(r => r.latitude!)
  const lngs = recordsWithCoordinates.map(r => r.longitude!)
  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2
  const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2

  // Create route coordinates
  const routeCoordinates = recordsWithCoordinates
    .map(r => [r.latitude!, r.longitude!] as [number, number])
    .reverse() // Reverse to show from start to current location

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
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-muted rounded-md"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Leaflet Map */}
          <div className={`relative bg-muted rounded-lg overflow-hidden ${
            isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
          }`}>
            {typeof window !== 'undefined' && (
              <MapContainer
                center={[centerLat, centerLng]}
                zoom={recordsWithCoordinates.length === 1 ? 10 : 6}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Draw route polyline */}
                {recordsWithCoordinates.length > 1 && (
                  <Polyline
                    positions={routeCoordinates}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.7}
                  />
                )}
                
                {/* Add markers for each tracking point */}
                {recordsWithCoordinates.map((record, index) => (
                  <Marker
                    key={record.id}
                    position={[record.latitude!, record.longitude!]}
                    eventHandlers={{
                      click: () => setSelectedRecord(record)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-48">
                        <div className="font-medium mb-1">{record.location}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {formatDateTime(record.created_at)}
                        </div>
                        <Badge className={trackingUtils.getStatusColor(record.status)}>
                          {trackingUtils.getStatusDisplayName(record.status)}
                        </Badge>
                        {record.notes && (
                          <div className="text-xs mt-2 text-muted-foreground">{record.notes}</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Map Stats */}
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
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.latitude && record.longitude && 
                        `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)} • `
                      }
                      {formatDateTime(record.created_at)}
                    </div>
                  </div>
                  
                  <Badge className={trackingUtils.getStatusColor(record.status)}>
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

