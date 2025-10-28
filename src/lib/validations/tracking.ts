import { z } from 'zod'

export const trackingRecordSchema = z.object({
  skr_id: z.string().uuid('Invalid SKR ID'),
  location: z.string().min(1, 'Location is required').max(255, 'Location is too long'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(['in_vault', 'in_transit', 'at_destination', 'delivered', 'returned']),
  notes: z.string().optional(),
  recorded_by: z.string().uuid('Invalid user ID').optional(),
  metadata: z.record(z.any()).optional()
})

export const trackingUpdateSchema = z.object({
  location: z.string().min(1, 'Location is required').max(255, 'Location is too long').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(['in_vault', 'in_transit', 'at_destination', 'delivered', 'returned']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const trackingFiltersSchema = z.object({
  skr_id: z.string().uuid().optional(),
  location: z.string().optional(),
  status: z.enum(['in_vault', 'in_transit', 'at_destination', 'delivered', 'returned']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

export const locationUpdateSchema = z.object({
  skr_id: z.string().uuid('Invalid SKR ID'),
  location: z.string().min(1, 'Location is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().optional()
})

export type TrackingRecordData = z.infer<typeof trackingRecordSchema>
export type TrackingUpdateData = z.infer<typeof trackingUpdateSchema>
export type TrackingFilters = z.infer<typeof trackingFiltersSchema>
export type LocationUpdateData = z.infer<typeof locationUpdateSchema>