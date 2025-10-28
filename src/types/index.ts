import { Database } from './database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Core Types
export type Client = Tables<'clients'>
export type Asset = Tables<'assets'>
export type SKR = Tables<'skrs'>
export type Tracking = Tables<'tracking'>
export type Invoice = Tables<'invoices'>
export type Receipt = Tables<'receipts'>
export type CreditNote = Tables<'credit_notes'>
export type UserProfile = Tables<'user_profiles'>
export type AuditLog = Tables<'audit_logs'>

// Insert Types
export type ClientInsert = Inserts<'clients'>
export type AssetInsert = Inserts<'assets'>
export type SKRInsert = Inserts<'skrs'>
export type TrackingInsert = Inserts<'tracking'>
export type InvoiceInsert = Inserts<'invoices'>
export type ReceiptInsert = Inserts<'receipts'>
export type CreditNoteInsert = Inserts<'credit_notes'>
export type UserProfileInsert = Inserts<'user_profiles'>
export type AuditLogInsert = Inserts<'audit_logs'>

// Update Types
export type ClientUpdate = Updates<'clients'>
export type AssetUpdate = Updates<'assets'>
export type SKRUpdate = Updates<'skrs'>
export type TrackingUpdate = Updates<'tracking'>
export type InvoiceUpdate = Updates<'invoices'>
export type ReceiptUpdate = Updates<'receipts'>
export type CreditNoteUpdate = Updates<'credit_notes'>
export type UserProfileUpdate = Updates<'user_profiles'>
export type AuditLogUpdate = Updates<'audit_logs'>

// Extended Types with Relations\nexport interface TrackingRecord extends Tracking {\n  recorded_by_user?: {\n    id: string\n    name: string\n  }\n  isLatest?: boolean\n  previousLocation?: string\n  distanceTraveled?: number\n}
export interface SKRWithRelations extends SKR {
  client?: Client
  asset?: Asset
  tracking?: Tracking[]
  invoices?: Invoice[]
}

export interface ClientWithRelations extends Client {
  assets?: Asset[]
  skrs?: SKR[]
  invoices?: Invoice[]
}

export interface AssetWithRelations extends Asset {
  client?: Client
  skrs?: SKR[]
}

export interface InvoiceWithRelations extends Invoice {
  client?: Client
  clients?: Client
  skr?: SKR
  receipts?: Receipt[]
  credit_notes?: CreditNote[]
}

export interface ReceiptWithRelations extends Receipt {
  invoice?: Invoice
  invoices?: Invoice & {
    clients?: Client
  }
}

export interface CreditNoteWithRelations extends CreditNote {
  invoice?: Invoice & {
    clients?: Client
  }
}

// Enums
export type ClientType = 'individual' | 'corporate' | 'institutional'
export type RiskLevel = 'low' | 'medium' | 'high'
export type ComplianceStatus = 'pending' | 'approved' | 'rejected' | 'under_review'
export type SKRStatus = 'draft' | 'approved' | 'issued' | 'in_transit' | 'delivered' | 'closed'
export type TrackingStatus = 'in_vault' | 'in_transit' | 'at_destination' | 'delivered' | 'returned'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'check' | 'crypto' | 'other'
export type CreditNoteReason = 'return' | 'discount' | 'error' | 'cancellation' | 'other'
export type CreditNoteStatus = 'draft' | 'issued' | 'applied'
export type KYCDocumentStatus = 'pending' | 'approved' | 'rejected' | 'under_review'
export type DocumentType = 'passport' | 'national_id' | 'drivers_license' | 'utility_bill' | 'bank_statement' | 'proof_of_address' | 'business_registration' | 'articles_of_incorporation' | 'tax_certificate' | 'other'
export type UserRole = 'admin' | 'finance' | 'operations' | 'compliance' | 'read_only'
export type UserStatus = 'active' | 'inactive' | 'suspended'

// Address Type
export interface Address {
  street: string
  city: string
  state?: string
  postal_code: string
  country: string
}

// KYC Document Type
export interface KYCDocument {
  id: string
  type: string
  filename: string
  url: string
  status: 'pending' | 'approved' | 'rejected'
  uploaded_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
}

// Filter Types
export interface SKRFilters {
  status?: SKRStatus[]
  client_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface ClientFilters {
  type?: ClientType[]
  risk_level?: RiskLevel[]
  compliance_status?: ComplianceStatus[]
  country?: string[]
  search?: string
}

export interface InvoiceFilters {
  status?: InvoiceStatus[]
  client_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

// Dashboard Stats
export interface DashboardStats {
  total_skrs: number
  active_skrs: number
  total_clients: number
  pending_compliance: number
  total_invoices: number
  outstanding_amount: number
  recent_activities: AuditLog[]
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Form Types
export interface SKRFormData {
  client_id: string
  asset_id: string
  remarks?: string
  metadata?: Record<string, any>
}

export interface ClientFormData {
  name: string
  type: ClientType
  email: string
  phone?: string
  country: string
  address?: Address
  risk_level?: RiskLevel
}

export interface AssetFormData {
  client_id: string
  asset_name: string
  asset_type: string
  declared_value: number
  currency: string
  origin: string
  destination?: string
  specifications?: Record<string, any>
}

export interface InvoiceFormData {
  client_id: string
  skr_id?: string
  amount: number
  currency: string
  due_date?: string
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}