'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Save, 
  X, 
  Loader2, 
  Navigation, 
  Clock, 
  AlertTriangle
} from 'lucide-react'
import { SKRWithRelations } from '@/types'
import { trackingUtils } from '@/lib/tracking-utils'
import { LocationUpdateData } from '@/lib/validations/tracking'

interface LocationUpdateFormProps {
  skr: SKRWithRelations
  onUpdate?: () => void
  onCancel?: () => void
}

export function LocationUpdateForm({ skr, onUpdate, onCancel }: LocationUpdateFormProps) {
  const [formData, setFormData] = useState<LocationUpdateData>({
    skr_id: skr.id,
    location: '',
    latitude: undefined,
    longitude: undefined,
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  const handleLocationSuggestion = (location: string) => {
    setFormData(prev => ({ ...prev, location }))
  }

  const getCurrentLocation = () => {
    setUseCurrentLocation(true)
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setUseCurrentLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }))
        setUseCurrentLocation(false)
      },
      (error) => {
        setError(`Failed to get location: ${error.message}`)
        setUseCurrentLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/skrs/${skr.id}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update location')
      }

      setSuccess('Location updated successfully!')
      
      // Reset form
      setFormData({
        skr_id: skr.id,
        location: '',
        latitude: undefined,
        longitude: undefined,
        notes: ''
      })
      
      if (onUpdate) {
        setTimeout(() => onUpdate(), 1000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Update Location
            </CardTitle>
            <CardDescription>
              Record a new location for SKR {skr.skr_number}
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKR Information */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">SKR Details</h4>
              <Badge className={`bg-${skr.status === 'in_transit' ? 'orange' : 'blue'}-100 text-${skr.status === 'in_transit' ? 'orange' : 'blue'}-800`}>
                {skr.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Client:</span>
                <span className="ml-2 font-medium">{skr.client?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Asset:</span>
                <span className="ml-2 font-medium">{skr.asset?.asset_name}</span>
              </div>
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="Enter current location"
                required
                disabled={isLoading}
              />
            </div>

            {/* Location Suggestions */}
            <div className="space-y-2">
              <Label>Quick Locations</Label>
              <div className="flex flex-wrap gap-2">
                {trackingUtils.getLocationSuggestions().slice(0, 8).map((location) => (
                  <Button
                    key={location}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLocationSuggestion(location)}
                    disabled={isLoading}
                  >
                    {location}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Coordinates (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isLoading || useCurrentLocation}
              >
                {useCurrentLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    Use Current Location
                  </>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => updateFormData('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g., 51.5074"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => updateFormData('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g., -0.1278"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {formData.latitude && formData.longitude && (
              <div className="text-sm text-muted-foreground">
                Coordinates: {trackingUtils.formatCoordinates(formData.latitude, formData.longitude)}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Add any additional notes about this location update"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Timestamp Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Update will be recorded at: {new Date().toLocaleString()}</span>
          </div>

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !formData.location.trim()}
              className="bg-g1-primary hover:bg-g1-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Location
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}