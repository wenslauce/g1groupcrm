import { z } from 'zod'

// Invoice Schemas
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255, 'Description is too long'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  total: z.number().min(0, 'Total cannot be negative')
})

export const invoiceFormSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  skr_id: z.string().uuid('Invalid SKR ID').optional(),
  invoice_number: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Invalid currency code').default('USD'),
  due_date: z.string().datetime().optional(),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax_rate: z.number().min(0).max(1).default(0),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const invoiceUpdateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID').optional(),
  skr_id: z.string().uuid('Invalid SKR ID').optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Invalid currency code').optional(),
  due_date: z.string().datetime().optional(),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
  tax_rate: z.number().min(0).max(1).optional(),
  discount_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  metadata: z.record(z.any()).optional()
})

export const invoiceFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  client_id: z.string().uuid().optional(),
  skr_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  amount_min: z.number().min(0).optional(),
  amount_max: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

// Receipt Schemas
export const receiptFormSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  client_id: z.string().uuid('Invalid client ID'),
  receipt_number: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Invalid currency code').default('USD'),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'crypto', 'other']),
  payment_reference: z.string().optional(),
  payment_date: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const receiptUpdateSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Invalid currency code').optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'crypto', 'other']).optional(),
  payment_reference: z.string().optional(),
  payment_date: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Credit Note Schemas
export const creditNoteFormSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  client_id: z.string().uuid('Invalid client ID'),
  credit_note_number: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Invalid currency code').default('USD'),
  reason: z.enum(['return', 'discount', 'error', 'cancellation', 'other']),
  description: z.string().min(1, 'Description is required'),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const creditNoteUpdateSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0').optional(),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Invalid currency code').optional(),
  reason: z.enum(['return', 'discount', 'error', 'cancellation', 'other']).optional(),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'issued', 'applied']).optional(),
  metadata: z.record(z.any()).optional()
})

// Financial Filters
export const financialFiltersSchema = z.object({
  search: z.string().optional(),
  client_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  amount_min: z.number().min(0).optional(),
  amount_max: z.number().min(0).optional(),
  currency: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

// Export types
export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>
export type InvoiceUpdateData = z.infer<typeof invoiceUpdateSchema>
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>
export type ReceiptFormData = z.infer<typeof receiptFormSchema>
export type ReceiptUpdateData = z.infer<typeof receiptUpdateSchema>
export type CreditNoteFormData = z.infer<typeof creditNoteFormSchema>
export type CreditNoteUpdateData = z.infer<typeof creditNoteUpdateSchema>
export type FinancialFilters = z.infer<typeof financialFiltersSchema>