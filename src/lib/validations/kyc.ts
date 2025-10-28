import { z } from 'zod'

export const kycDocumentSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  document_type: z.enum([
    'passport',
    'national_id',
    'drivers_license',
    'utility_bill',
    'bank_statement',
    'proof_of_address',
    'business_registration',
    'articles_of_incorporation',
    'tax_certificate',
    'other'
  ]),
  document_number: z.string().optional(),
  issuing_country: z.string().min(2, 'Country code required').max(3, 'Invalid country code'),
  issue_date: z.string().datetime().optional(),
  expiry_date: z.string().datetime().optional(),
  file_name: z.string().min(1, 'File name is required'),
  file_size: z.number().min(1, 'File size must be greater than 0'),
  file_type: z.string().min(1, 'File type is required'),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const kycReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending_review']),
  review_notes: z.string().min(1, 'Review notes are required'),
  reviewed_by: z.string().uuid('Invalid reviewer ID').optional(),
  compliance_flags: z.array(z.string()).optional(),
  risk_score: z.number().min(0).max(100).optional()
})

export const kycFiltersSchema = z.object({
  client_id: z.string().uuid().optional(),
  document_type: z.enum([
    'passport',
    'national_id',
    'drivers_license',
    'utility_bill',
    'bank_statement',
    'proof_of_address',
    'business_registration',
    'articles_of_incorporation',
    'tax_certificate',
    'other'
  ]).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'under_review']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

export const complianceAssessmentSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  assessment_type: z.enum(['initial', 'periodic', 'triggered', 'enhanced']),
  risk_factors: z.array(z.object({
    factor: z.string(),
    score: z.number().min(0).max(10),
    weight: z.number().min(0).max(1),
    notes: z.string().optional()
  })),
  overall_risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['low', 'medium', 'high']),
  recommendations: z.array(z.string()),
  next_review_date: z.string().datetime(),
  assessed_by: z.string().uuid('Invalid assessor ID').optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export type KYCDocumentData = z.infer<typeof kycDocumentSchema>
export type KYCReviewData = z.infer<typeof kycReviewSchema>
export type KYCFilters = z.infer<typeof kycFiltersSchema>
export type ComplianceAssessmentData = z.infer<typeof complianceAssessmentSchema>