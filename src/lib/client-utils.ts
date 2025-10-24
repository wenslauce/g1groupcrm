import { ClientType, RiskLevel, ComplianceStatus } from '@/types'

export const clientUtils = {
  getTypeDisplayName(type: ClientType): string {
    const typeNames: Record<ClientType, string> = {
      individual: 'Individual',
      corporate: 'Corporate',
      institutional: 'Institutional'
    }
    return typeNames[type]
  },

  getTypeColor(type: ClientType): string {
    const typeColors: Record<ClientType, string> = {
      individual: 'bg-blue-100 text-blue-800',
      corporate: 'bg-green-100 text-green-800',
      institutional: 'bg-purple-100 text-purple-800'
    }
    return typeColors[type]
  },

  getRiskLevelDisplayName(level: RiskLevel): string {
    const levelNames: Record<RiskLevel, string> = {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk'
    }
    return levelNames[level]
  },

  getRiskLevelColor(level: RiskLevel): string {
    const levelColors: Record<RiskLevel, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    return levelColors[level]
  },

  getComplianceStatusDisplayName(status: ComplianceStatus): string {
    const statusNames: Record<ComplianceStatus, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      under_review: 'Under Review'
    }
    return statusNames[status]
  },

  getComplianceStatusColor(status: ComplianceStatus): string {
    const statusColors: Record<ComplianceStatus, string> = {
      pending: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_review: 'bg-yellow-100 text-yellow-800'
    }
    return statusColors[status]
  },

  getAllTypes(): { value: ClientType; label: string }[] {
    return [
      { value: 'individual', label: 'Individual' },
      { value: 'corporate', label: 'Corporate' },
      { value: 'institutional', label: 'Institutional' }
    ]
  },

  getAllRiskLevels(): { value: RiskLevel; label: string }[] {
    return [
      { value: 'low', label: 'Low Risk' },
      { value: 'medium', label: 'Medium Risk' },
      { value: 'high', label: 'High Risk' }
    ]
  },

  getAllComplianceStatuses(): { value: ComplianceStatus; label: string }[] {
    return [
      { value: 'pending', label: 'Pending Review' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' }
    ]
  },

  formatAddress(address: any): string {
    if (!address) return 'No address provided'
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean)
    
    return parts.join(', ')
  },

  getCountryList(): string[] {
    return [
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'Germany',
      'France',
      'Switzerland',
      'Singapore',
      'Hong Kong',
      'Japan',
      'South Korea',
      'United Arab Emirates',
      'Saudi Arabia',
      'Qatar',
      'Kuwait',
      'Bahrain',
      'Oman',
      'Jordan',
      'Lebanon',
      'Egypt',
      'South Africa',
      'Nigeria',
      'Kenya',
      'Ghana',
      'Morocco',
      'Tunisia',
      'India',
      'China',
      'Thailand',
      'Malaysia',
      'Indonesia',
      'Philippines',
      'Vietnam',
      'Brazil',
      'Mexico',
      'Argentina',
      'Chile',
      'Colombia',
      'Peru'
    ].sort()
  },

  calculateRiskScore(client: any): number {
    let score = 0
    
    // Base score by type
    switch (client.type) {
      case 'individual':
        score += 10
        break
      case 'corporate':
        score += 20
        break
      case 'institutional':
        score += 30
        break
    }
    
    // Risk level modifier
    switch (client.risk_level) {
      case 'low':
        score += 0
        break
      case 'medium':
        score += 15
        break
      case 'high':
        score += 30
        break
    }
    
    // Compliance status modifier
    switch (client.compliance_status) {
      case 'approved':
        score += 0
        break
      case 'under_review':
        score += 10
        break
      case 'pending':
        score += 20
        break
      case 'rejected':
        score += 50
        break
    }
    
    return Math.min(score, 100) // Cap at 100
  },

  getKYCDocumentTypes(): string[] {
    return [
      'Passport',
      'Driver License',
      'National ID',
      'Utility Bill',
      'Bank Statement',
      'Certificate of Incorporation',
      'Articles of Association',
      'Board Resolution',
      'Beneficial Ownership Declaration',
      'Financial Statements',
      'Tax Certificate',
      'Regulatory License',
      'Other'
    ]
  },

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  },

  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d\+]/g, '')
    
    // Basic formatting for common patterns
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
      // US/Canada format: +1 (XXX) XXX-XXXX
      return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
    } else if (cleaned.startsWith('+44') && cleaned.length >= 12) {
      // UK format: +44 XX XXXX XXXX
      return `+44 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`
    }
    
    return cleaned // Return cleaned version if no specific format matches
  }
}