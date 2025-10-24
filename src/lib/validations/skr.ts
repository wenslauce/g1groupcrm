import { z } from 'zod'

export const skrFormSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  asset_id: z.string().uuid('Invalid asset ID'),
  remarks: z.string().max(1000, 'Remarks must be less than 1000 characters').optional(),
  metadata: z.record(z.any()).optional()
})

export const skrUpdateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID').optional(),
  asset_id: z.string().uuid('Invalid asset ID').optional(),
  status: z.enum(['draft', 'approved', 'issued', 'in_transit', 'delivered', 'closed']).optional(),
  issue_date: z.string().datetime().optional(),
  issued_by: z.string().uuid().optional(),
  hash: z.string().optional(),
  pdf_url: z.string().url().optional(),
  qr_code_url: z.string().url().optional(),
  remarks: z.string().max(1000, 'Remarks must be less than 1000 characters').optional(),
  metadata: z.record(z.any()).optional()
})

export const skrFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'approved', 'issued', 'in_transit', 'delivered', 'closed']).optional(),
  client_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

export const assetFormSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  asset_name: z.string().min(1, 'Asset name is required').max(255, 'Asset name is too long'),
  asset_type: z.string().min(1, 'Asset type is required'),
  declared_value: z.number().positive('Declared value must be positive'),
  currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be exactly 3 characters').default('USD'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().optional(),
  specifications: z.record(z.any()).optional()
})

export const assetUpdateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID').optional(),
  asset_name: z.string().min(1, 'Asset name is required').max(255, 'Asset name is too long').optional(),
  asset_type: z.string().min(1, 'Asset type is required').optional(),
  declared_value: z.number().positive('Declared value must be positive').optional(),
  currency: z.string().min(3).max(3).optional(),
  origin: z.string().min(1, 'Origin is required').optional(),
  destination: z.string().optional(),
  specifications: z.record(z.any()).optional()
})

export type SKRFormData = z.infer<typeof skrFormSchema>
export type SKRUpdateData = z.infer<typeof skrUpdateSchema>
export type SKRFilters = z.infer<typeof skrFiltersSchema>
export type AssetFormData = z.infer<typeof assetFormSchema>
export type AssetUpdateData = z.infer<typeof assetUpdateSchema>