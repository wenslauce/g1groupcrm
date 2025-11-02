import { TrackingStatus } from '@/types'
import { 
  ALL_LOCATIONS, 
  searchLocations, 
  calculateDistance as calcDistFromCoords,
  LocationData,
  MAJOR_PORTS,
  MAJOR_AIRPORTS,
  MAJOR_CITIES
} from './location-data'

export const trackingUtils = {
  // Search locations from dataset
  searchLocations(query: string, types?: LocationData['type'][]): LocationData[] {
    return searchLocations(query, types)
  },

  // Get all ports
  getAllPorts(): LocationData[] {
    return MAJOR_PORTS
  },

  // Get all airports
  getAllAirports(): LocationData[] {
    return MAJOR_AIRPORTS
  },

  // Get all cities
  getAllCities(): LocationData[] {
    return MAJOR_CITIES
  },

  // Get location by name (fuzzy match)
  findLocationByName(name: string): LocationData | undefined {
    const lowerName = name.toLowerCase()
    return ALL_LOCATIONS.find(loc => 
      loc.name.toLowerCase() === lowerName ||
      loc.searchTerms.some(term => term === lowerName)
    )
  },

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
    // Use the real Haversine formula from location-data
    return calcDistFromCoords({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 })
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
    // Return mix of real locations and operational statuses
    return [
      // Major Ports
      'Port of Shanghai',
      'Port of Singapore',
      'Port of Rotterdam',
      'Port of Los Angeles',
      'Port of Hong Kong',
      'Port of Hamburg',
      'Port of Antwerp',
      'Port of Jebel Ali',
      // Major Airports
      'Shanghai Pudong International Airport',
      'Singapore Changi Airport',
      'London Heathrow Airport',
      'Dubai International Airport',
      'Los Angeles International Airport',
      'Hong Kong International Airport',
      // Transit Statuses
      'In Transit - Sea',
      'In Transit - Air',
      'In Transit - Road',
      'In Transit - Rail',
      'Customs Clearance',
      'Border Crossing',
      // Facilities
      'Distribution Center',
      'Warehouse - Main',
      'Consolidation Point',
      'Container Yard',
      'Free Trade Zone',
      'Bonded Warehouse',
      'G1 Vault',
      'Client Location'
    ]
  },

  // Get popular locations by type
  getPopularLocationsByType(type: LocationData['type'], limit: number = 10): LocationData[] {
    const locations = type === 'port' ? MAJOR_PORTS : 
                     type === 'airport' ? MAJOR_AIRPORTS : 
                     MAJOR_CITIES
    return locations.slice(0, limit)
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