import { SKRStatus } from '@/types'
import crypto from 'crypto'

export const skrUtils = {
  getStatusDisplayName(status: SKRStatus): string {
    const statusNames: Record<SKRStatus, string> = {
      draft: 'Draft',
      approved: 'Approved',
      issued: 'Issued',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      closed: 'Closed'
    }
    return statusNames[status]
  },

  getStatusColor(status: SKRStatus): string {
    const statusColors: Record<SKRStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      issued: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      closed: 'bg-purple-100 text-purple-800'
    }
    return statusColors[status]
  },

  getAllStatuses(): { value: SKRStatus; label: string }[] {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'approved', label: 'Approved' },
      { value: 'issued', label: 'Issued' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'closed', label: 'Closed' }
    ]
  },

  getNextStatus(currentStatus: SKRStatus): SKRStatus | null {
    const statusFlow: Record<SKRStatus, SKRStatus | null> = {
      draft: 'approved',
      approved: 'issued',
      issued: 'in_transit',
      in_transit: 'delivered',
      delivered: 'closed',
      closed: null
    }
    return statusFlow[currentStatus]
  },

  canTransitionTo(currentStatus: SKRStatus, targetStatus: SKRStatus): boolean {
    const allowedTransitions: Record<SKRStatus, SKRStatus[]> = {
      draft: ['approved'],
      approved: ['issued', 'draft'], // Can go back to draft for corrections
      issued: ['in_transit'],
      in_transit: ['delivered'],
      delivered: ['closed'],
      closed: [] // Final state
    }
    return allowedTransitions[currentStatus]?.includes(targetStatus) || false
  },

  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  },

  generateSKRHash(skrData: {
    skr_number: string
    client_id: string
    asset_id: string
    issue_date: string
  }): string {
    const hashInput = `${skrData.skr_number}-${skrData.client_id}-${skrData.asset_id}-${skrData.issue_date}`
    return this.generateHash(hashInput)
  },

  getAssetTypes(): string[] {
    return [
      'Precious Metal',
      'Gemstone',
      'Artwork',
      'Luxury Goods',
      'Collectibles',
      'Jewelry',
      'Antiques',
      'Rare Books',
      'Wine & Spirits',
      'Cryptocurrency',
      'Securities',
      'Real Estate Documents',
      'Other'
    ]
  },

  getCurrencies(): { code: string; name: string; symbol: string }[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' }
    ]
  },

  formatSKRNumber(number: string): string {
    // Format: G1-SKR-YYYY-XXXXX
    if (number.match(/^G1-SKR-\d{4}-\d{5}$/)) {
      return number
    }
    // If it's just a number, format it properly
    const year = new Date().getFullYear()
    const paddedNumber = number.padStart(5, '0')
    return `G1-SKR-${year}-${paddedNumber}`
  },

  validateSKRNumber(number: string): boolean {
    return /^G1-SKR-\d{4}-\d{5}$/.test(number)
  },

  getStatusProgress(status: SKRStatus): number {
    const progressMap: Record<SKRStatus, number> = {
      draft: 0,
      approved: 20,
      issued: 40,
      in_transit: 60,
      delivered: 80,
      closed: 100
    }
    return progressMap[status]
  },

  isStatusActive(status: SKRStatus): boolean {
    return ['issued', 'in_transit'].includes(status)
  },

  isStatusCompleted(status: SKRStatus): boolean {
    return ['delivered', 'closed'].includes(status)
  },

  getLocationSuggestions(): string[] {
    return [
      'London Vault',
      'New York Vault',
      'Zurich Vault',
      'Singapore Vault',
      'Hong Kong Vault',
      'Dubai Vault',
      'Geneva Vault',
      'Tokyo Vault',
      'Sydney Vault',
      'Toronto Vault',
      'Client Premises',
      'In Transit',
      'Customs',
      'Airport',
      'Port',
      'Secure Facility',
      'Bank Vault',
      'Insurance Facility'
    ]
  },

  calculateTransitTime(origin: string, destination: string): number {
    // Mock calculation - in real app, this would use actual logistics data
    const distances: Record<string, Record<string, number>> = {
      'London': { 'New York': 7, 'Zurich': 2, 'Singapore': 14, 'Dubai': 7 },
      'New York': { 'London': 7, 'Toronto': 1, 'Singapore': 18, 'Dubai': 12 },
      'Zurich': { 'London': 2, 'New York': 8, 'Singapore': 12, 'Dubai': 6 },
      'Singapore': { 'London': 14, 'New York': 18, 'Hong Kong': 3, 'Dubai': 7 },
      'Dubai': { 'London': 7, 'New York': 12, 'Singapore': 7, 'Zurich': 6 }
    }
    
    const originKey = Object.keys(distances).find(key => origin.includes(key))
    const destKey = Object.keys(distances).find(key => destination.includes(key))
    
    if (originKey && destKey && distances[originKey]?.[destKey]) {
      return distances[originKey][destKey]
    }
    
    return 7 // Default 7 days
  },

  getEstimatedDelivery(issueDate: string, origin: string, destination: string): Date {
    const issue = new Date(issueDate)
    const transitDays = this.calculateTransitTime(origin, destination)
    const deliveryDate = new Date(issue)
    deliveryDate.setDate(deliveryDate.getDate() + transitDays)
    return deliveryDate
  }
}