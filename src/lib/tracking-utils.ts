import { TrackingStatus } from '@/types'

export const trackingUtils = {
  getStatusDisplayName(status: TrackingStatus): string {
    const statusNames: Record<TrackingStatus, string> = {
      in_vault: 'In Vault',
      in_transit: 'In Transit',
      at_destination: 'At Destination',
      delivered: 'Delivered',
      returned: 'Returned'
    }
    return statusNames[status]
  },

  getStatusColor(status: TrackingStatus): string {
    const statusColors: Record<TrackingStatus, string> = {
      in_vault: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-orange-100 text-orange-800',
      at_destination: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      returned: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status]
  },

  getAllStatuses(): { value: TrackingStatus; label: string }[] {
    return [
      { value: 'in_vault', label: 'In Vault' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'at_destination', label: 'At Destination' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'returned', label: 'Returned' }
    ]
  },

  getStatusIcon(status: TrackingStatus): string {
    const iconMap: Record<TrackingStatus, string> = {
      in_vault: '🏦',
      in_transit: '🚚',
      at_destination: '📍',
      delivered: '✅',
      returned: '↩️'
    }
    return iconMap[status] || '📍'
  },

  validateCoordinates(latitude?: number, longitude?: number): boolean {
    if (latitude !== undefined && longitude !== undefined) {
      return (
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
      )
    }
    return true // Optional coordinates are valid
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula to calculate distance between two points
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  },

  formatCoordinates(latitude?: number, longitude?: number): string {
    if (latitude !== undefined && longitude !== undefined) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }
    return 'Not specified'
  },

  getLocationSuggestions(): string[] {
    return [
      'G1 London Vault',
      'G1 New York Vault', 
      'G1 Zurich Vault',
      'G1 Singapore Vault',
      'G1 Hong Kong Vault',
      'G1 Dubai Vault',
      'G1 Geneva Vault',
      'G1 Tokyo Vault',
      'Client Premises',
      'Heathrow Airport',
      'JFK Airport',
      'Changi Airport',
      'Zurich Airport',
      'Dubai International Airport',
      'Customs Office',
      'Secure Transport Vehicle',
      'Partner Facility',
      'Insurance Facility',
      'Bank Vault',
      'Temporary Storage'
    ]
  },

  getTransportMethods(): string[] {
    return [
      'Armored Vehicle',
      'Secure Courier',
      'Air Freight',
      'Sea Freight',
      'Diplomatic Pouch',
      'Personal Escort',
      'Bank Transfer',
      'Vault to Vault'
    ]
  },

  estimateTransitTime(origin: string, destination: string, method: string): number {
    // Simple estimation logic - in real app would use actual logistics data
    const baseTime = {
      'Armored Vehicle': 1,
      'Secure Courier': 1,
      'Air Freight': 2,
      'Sea Freight': 14,
      'Diplomatic Pouch': 3,
      'Personal Escort': 1,
      'Bank Transfer': 0.5,
      'Vault to Vault': 0.5
    }[method] || 2

    // Adjust for international vs domestic
    const isInternational = origin.toLowerCase() !== destination.toLowerCase()
    return isInternational ? baseTime * 2 : baseTime
  },

  getTrackingStatusFromSKRStatus(skrStatus: string): TrackingStatus {
    const statusMapping: Record<string, TrackingStatus> = {
      'draft': 'in_vault',
      'approved': 'in_vault',
      'issued': 'in_vault',
      'in_transit': 'in_transit',
      'delivered': 'delivered',
      'closed': 'delivered'
    }
    return statusMapping[skrStatus] || 'in_vault'
  },

  validateLocationUpdate(data: any): string[] {
    const errors: string[] = []
    
    if (!data.location || data.location.trim().length === 0) {
      errors.push('Location is required')
    }
    
    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      errors.push('Latitude must be between -90 and 90')
    }
    
    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      errors.push('Longitude must be between -180 and 180')
    }
    
    // Both coordinates should be provided together
    if ((data.latitude !== undefined) !== (data.longitude !== undefined)) {
      errors.push('Both latitude and longitude must be provided together')
    }
    
    return errors
  },

  generateTrackingId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `TRK-${timestamp}-${random}`.toUpperCase()
  },

  formatTrackingHistory(records: any[]): any[] {
    return records
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((record, index, array) => ({
        ...record,
        isLatest: index === 0,
        previousLocation: index < array.length - 1 ? array[index + 1].location : null,
        distanceTraveled: index < array.length - 1 && 
          record.latitude && record.longitude && 
          array[index + 1].latitude && array[index + 1].longitude
          ? this.calculateDistance(
              array[index + 1].latitude,
              array[index + 1].longitude,
              record.latitude,
              record.longitude
            )
          : null
      }))
  }
}