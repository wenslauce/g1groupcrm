import { z } from 'zod'

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required')
})

export const kycDocumentSchema = z.object({
  id: z.string(),
  type: z.string(),
  filename: z.string(),
  url: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  uploaded_at: z.string(),
  reviewed_at: z.string().optional(),
  reviewed_by: z.string().optional(),
  notes: z.string().optional()
})

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  type: z.enum(['individual', 'corporate', 'institutional'], {
    required_error: 'Client type is required'
  }),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  address: addressSchema.optional(),
  risk_level: z.enum(['low', 'medium', 'high']).default('medium')
})

export const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  type: z.enum(['individual', 'corporate', 'institutional']).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required').optional(),
  address: addressSchema.optional(),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  compliance_status: z.enum(['pending', 'approved', 'rejected', 'under_review']).optional(),
  kyc_documents: z.array(kycDocumentSchema).optional()
})

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['individual', 'corporate', 'institutional']).optional(),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  compliance_status: z.enum(['pending', 'approved', 'rejected', 'under_review']).optional(),
  country: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

export type ClientFormData = z.infer<typeof clientFormSchema>
export type ClientUpdateData = z.infer<typeof clientUpdateSchema>
export type ClientFilters = z.infer<typeof clientFiltersSchema>
export type Address = z.infer<typeof addressSchema>
export type KYCDocument = z.infer<typeof kycDocumentSchema>