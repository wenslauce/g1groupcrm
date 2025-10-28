import { KYCDocumentStatus, DocumentType, RiskLevel } from '@/types'

export const kycUtils = {
  // Document type utilities
  getDocumentTypeDisplayName(type: DocumentType): string {
    const typeNames: Record<DocumentType, string> = {
      passport: 'Passport',
      national_id: 'National ID',
      drivers_license: 'Driver\'s License',
      utility_bill: 'Utility Bill',
      bank_statement: 'Bank Statement',
      proof_of_address: 'Proof of Address',
      business_registration: 'Business Registration',
      articles_of_incorporation: 'Articles of Incorporation',
      tax_certificate: 'Tax Certificate',
      other: 'Other'
    }
    return typeNames[type]
  },

  getAllDocumentTypes(): { value: DocumentType; label: string; category: string }[] {
    return [
      { value: 'passport', label: 'Passport', category: 'Identity' },
      { value: 'national_id', label: 'National ID', category: 'Identity' },
      { value: 'drivers_license', label: 'Driver\'s License', category: 'Identity' },
      { value: 'utility_bill', label: 'Utility Bill', category: 'Address' },
      { value: 'bank_statement', label: 'Bank Statement', category: 'Financial' },
      { value: 'proof_of_address', label: 'Proof of Address', category: 'Address' },
      { value: 'business_registration', label: 'Business Registration', category: 'Business' },
      { value: 'articles_of_incorporation', label: 'Articles of Incorporation', category: 'Business' },
      { value: 'tax_certificate', label: 'Tax Certificate', category: 'Financial' },
      { value: 'other', label: 'Other', category: 'Other' }
    ]
  },

  // Status utilities
  getKYCStatusDisplayName(status: KYCDocumentStatus): string {
    const statusNames: Record<KYCDocumentStatus, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      under_review: 'Under Review'
    }
    return statusNames[status]
  },

  getKYCStatusColor(status: KYCDocumentStatus): string {
    const statusColors: Record<KYCDocumentStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800'
    }
    return statusColors[status]
  },

  getAllKYCStatuses(): { value: KYCDocumentStatus; label: string }[] {
    return [
      { value: 'pending', label: 'Pending Review' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' }
    ]
  },

  // Risk assessment utilities
  calculateRiskScore(factors: Array<{ score: number; weight: number }>): number {
    if (factors.length === 0) return 0
    
    const weightedSum = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight)
    }, 0)
    
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)
    
    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) : 0
  },

  getRiskLevelFromScore(score: number): RiskLevel {
    if (score <= 30) return 'low'
    if (score <= 70) return 'medium'
    return 'high'
  },

  getRiskLevelColor(level: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    return colors[level]
  },

  // Document validation
  validateDocumentExpiry(expiryDate: string): boolean {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    
    return expiry > threeMonthsFromNow
  },

  isDocumentExpiringSoon(expiryDate: string, daysThreshold: number = 90): boolean {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const threshold = new Date()
    threshold.setDate(threshold.getDate() + daysThreshold)
    
    return expiry <= threshold && expiry > now
  },

  isDocumentExpired(expiryDate: string): boolean {
    const expiry = new Date(expiryDate)
    const now = new Date()
    return expiry <= now
  },

  // File validation
  validateFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return extension ? allowedTypes.includes(extension) : false
  },

  validateFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return fileSize <= maxSizeBytes
  },

  getAllowedFileTypes(): string[] {
    return ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
  },

  getMaxFileSize(): number {
    return 10 // MB
  },

  // Compliance workflow
  getRequiredDocumentsForClientType(clientType: string): DocumentType[] {
    const requirements: Record<string, DocumentType[]> = {
      individual: ['passport', 'proof_of_address'],
      corporate: ['business_registration', 'articles_of_incorporation', 'proof_of_address'],
      institutional: ['business_registration', 'articles_of_incorporation', 'tax_certificate']
    }
    
    return requirements[clientType] || []
  },

  calculateComplianceCompleteness(clientType: string, submittedDocuments: DocumentType[]): number {
    const required = this.getRequiredDocumentsForClientType(clientType)
    if (required.length === 0) return 100
    
    const submitted = submittedDocuments.filter(doc => required.includes(doc))
    return Math.round((submitted.length / required.length) * 100)
  },

  // Risk factors
  getStandardRiskFactors(): Array<{ factor: string; description: string; maxScore: number }> {
    return [
      {
        factor: 'Geographic Risk',
        description: 'Risk based on client\'s country of residence/operation',
        maxScore: 10
      },
      {
        factor: 'Business Type Risk',
        description: 'Risk associated with client\'s business activities',
        maxScore: 10
      },
      {
        factor: 'Transaction Volume',
        description: 'Risk based on expected transaction volumes',
        maxScore: 10
      },
      {
        factor: 'Source of Funds',
        description: 'Risk related to the source of client\'s funds',
        maxScore: 10
      },
      {
        factor: 'PEP Status',
        description: 'Politically Exposed Person status',
        maxScore: 10
      },
      {
        factor: 'Sanctions Screening',
        description: 'Results of sanctions list screening',
        maxScore: 10
      },
      {
        factor: 'Media Coverage',
        description: 'Negative media coverage or adverse information',
        maxScore: 10
      },
      {
        factor: 'Document Quality',
        description: 'Quality and authenticity of submitted documents',
        maxScore: 10
      }
    ]
  },

  // Compliance flags
  getComplianceFlags(): Array<{ flag: string; description: string; severity: 'low' | 'medium' | 'high' }> {
    return [
      {
        flag: 'INCOMPLETE_DOCUMENTATION',
        description: 'Required documents are missing or incomplete',
        severity: 'medium'
      },
      {
        flag: 'EXPIRED_DOCUMENTS',
        description: 'One or more documents have expired',
        severity: 'high'
      },
      {
        flag: 'HIGH_RISK_JURISDICTION',
        description: 'Client is from a high-risk jurisdiction',
        severity: 'high'
      },
      {
        flag: 'PEP_IDENTIFIED',
        description: 'Client identified as Politically Exposed Person',
        severity: 'high'
      },
      {
        flag: 'SANCTIONS_MATCH',
        description: 'Potential match found in sanctions screening',
        severity: 'high'
      },
      {
        flag: 'ADVERSE_MEDIA',
        description: 'Negative media coverage identified',
        severity: 'medium'
      },
      {
        flag: 'INCONSISTENT_INFORMATION',
        description: 'Inconsistencies found in provided information',
        severity: 'medium'
      },
      {
        flag: 'UNUSUAL_TRANSACTION_PATTERN',
        description: 'Unusual or suspicious transaction patterns',
        severity: 'high'
      }
    ]
  },

  // Review workflow
  canTransitionKYCStatus(currentStatus: KYCDocumentStatus, newStatus: KYCDocumentStatus): boolean {
    const allowedTransitions: Record<KYCDocumentStatus, KYCDocumentStatus[]> = {
      pending: ['under_review', 'approved', 'rejected'],
      under_review: ['approved', 'rejected', 'pending'],
      approved: ['under_review'], // Can be re-reviewed if needed
      rejected: ['under_review', 'pending'] // Can be resubmitted
    }
    
    return allowedTransitions[currentStatus]?.includes(newStatus) || false
  },

  // Reporting utilities
  generateComplianceReport(documents: any[], assessments: any[]) {
    const totalDocuments = documents.length
    const approvedDocuments = documents.filter(doc => doc.status === 'approved').length
    const rejectedDocuments = documents.filter(doc => doc.status === 'rejected').length
    const pendingDocuments = documents.filter(doc => doc.status === 'pending' || doc.status === 'under_review').length
    
    const averageRiskScore = assessments.length > 0 
      ? assessments.reduce((sum, assessment) => sum + assessment.overall_risk_score, 0) / assessments.length
      : 0
    
    const riskDistribution = {
      low: assessments.filter(a => a.risk_level === 'low').length,
      medium: assessments.filter(a => a.risk_level === 'medium').length,
      high: assessments.filter(a => a.risk_level === 'high').length
    }
    
    return {
      totalDocuments,
      approvedDocuments,
      rejectedDocuments,
      pendingDocuments,
      approvalRate: totalDocuments > 0 ? (approvedDocuments / totalDocuments) * 100 : 0,
      averageRiskScore: Math.round(averageRiskScore),
      riskDistribution
    }
  },

  // Notification utilities
  getKYCNotificationMessage(status: KYCDocumentStatus, documentType: DocumentType): string {
    const docName = this.getDocumentTypeDisplayName(documentType)
    
    switch (status) {
      case 'approved':
        return `Your ${docName} has been approved and is now compliant.`
      case 'rejected':
        return `Your ${docName} has been rejected. Please review the feedback and resubmit.`
      case 'under_review':
        return `Your ${docName} is currently under review by our compliance team.`
      default:
        return `Your ${docName} has been received and is pending review.`
    }
  },

  // Due diligence levels
  getDueDiligenceLevel(riskScore: number, clientType: string): 'standard' | 'enhanced' | 'simplified' {
    if (riskScore >= 70) return 'enhanced'
    if (riskScore <= 30 && clientType === 'individual') return 'simplified'
    return 'standard'
  },

  getRequiredDueDiligenceMeasures(level: 'standard' | 'enhanced' | 'simplified'): string[] {
    const measures: Record<string, string[]> = {
      simplified: [
        'Basic identity verification',
        'Address verification',
        'Basic sanctions screening'
      ],
      standard: [
        'Identity verification',
        'Address verification',
        'Source of funds verification',
        'Sanctions and PEP screening',
        'Business purpose assessment'
      ],
      enhanced: [
        'Enhanced identity verification',
        'Enhanced address verification',
        'Detailed source of funds verification',
        'Enhanced sanctions and PEP screening',
        'Adverse media screening',
        'Senior management approval',
        'Ongoing monitoring',
        'Additional documentation requirements'
      ]
    }
    
    return measures[level] || measures.standard
  }
}