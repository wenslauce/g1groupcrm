import { z } from 'zod'

// Common date range schema
export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).optional()
})

// SKR Analytics filters
export const skrAnalyticsSchema = z.object({
  ...dateRangeSchema.shape,
  status: z.array(z.enum(['draft', 'approved', 'issued', 'in_transit', 'delivered', 'closed'])).optional(),
  client_id: z.string().uuid().optional(),
  group_by: z.enum(['status', 'client', 'date', 'asset_type']).optional()
})

// Financial Analytics filters
export const financialAnalyticsSchema = z.object({
  ...dateRangeSchema.shape,
  client_id: z.string().uuid().optional(),
  currency: z.string().optional(),
  metric: z.enum(['revenue', 'outstanding', 'paid', 'overdue', 'all']).optional(),
  group_by: z.enum(['client', 'date', 'currency', 'status']).optional()
})

// Compliance Analytics filters
export const complianceAnalyticsSchema = z.object({
  ...dateRangeSchema.shape,
  compliance_status: z.array(z.enum(['pending', 'approved', 'rejected', 'under_review'])).optional(),
  risk_level: z.array(z.enum(['low', 'medium', 'high'])).optional(),
  client_type: z.array(z.enum(['individual', 'corporate', 'institutional'])).optional(),
  country: z.string().optional(),
  group_by: z.enum(['status', 'risk_level', 'type', 'country', 'date']).optional()
})

// Export types
export type SKRAnalyticsFilters = z.infer<typeof skrAnalyticsSchema>
export type FinancialAnalyticsFilters = z.infer<typeof financialAnalyticsSchema>
export type ComplianceAnalyticsFilters = z.infer<typeof complianceAnalyticsSchema>

