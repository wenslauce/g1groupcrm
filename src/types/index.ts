// Database types generated from Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          phone: string
          address: string
          country: string
          type: string
          compliance_status: string
          risk_level: string
          kyc_documents: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email: string
          phone: string
          address: string
          country: string
          type: string
          compliance_status?: string
          risk_level?: string
          kyc_documents?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          country?: string
          type?: string
          compliance_status?: string
          risk_level?: string
          kyc_documents?: Json
          metadata?: Json
        }
      }
      skrs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          skr_number: string
          client_id: string
          asset_id: string
          status: string
          issue_date: string
          hash: string
          remarks: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          skr_number: string
          client_id: string
          asset_id: string
          status?: string
          issue_date: string
          hash?: string
          remarks?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          skr_number?: string
          client_id?: string
          asset_id?: string
          status?: string
          issue_date?: string
          hash?: string
          remarks?: string
          metadata?: Json
        }
      }
      assets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          asset_name: string
          asset_type: string
          declared_value: number
          currency: string
          client_id: string
          description: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          asset_name: string
          asset_type: string
          declared_value: number
          currency: string
          client_id: string
          description?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          asset_name?: string
          asset_type?: string
          declared_value?: number
          currency?: string
          client_id?: string
          description?: string
          metadata?: Json
        }
      }
      tracking: {
        Row: {
          id: string
          created_at: string
          skr_id: string
          location: string
          latitude: number | null
          longitude: number | null
          status: string
          notes: string | null
          recorded_by: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          skr_id: string
          location: string
          latitude?: number | null
          longitude?: number | null
          status: string
          notes?: string | null
          recorded_by?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          skr_id?: string
          location?: string
          latitude?: number | null
          longitude?: number | null
          status?: string
          notes?: string | null
          recorded_by?: string | null
          metadata?: Json | null
        }
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          invoice_number: string
          client_id: string
          skr_id: string | null
          amount: number
          currency: string
          status: string
          due_date: string
          items: Json
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_number: string
          client_id: string
          skr_id?: string | null
          amount: number
          currency: string
          status?: string
          due_date: string
          items?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_number?: string
          client_id?: string
          skr_id?: string | null
          amount?: number
          currency?: string
          status?: string
          due_date?: string
          items?: Json
          metadata?: Json
        }
      }
      receipts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          receipt_number: string
          invoice_id: string
          amount: number
          currency: string
          payment_method: string
          payment_reference: string | null
          issue_date: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          receipt_number: string
          invoice_id: string
          amount: number
          currency: string
          payment_method: string
          payment_reference?: string | null
          issue_date: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          receipt_number?: string
          invoice_id?: string
          amount?: number
          currency?: string
          payment_method?: string
          payment_reference?: string | null
          issue_date?: string
          metadata?: Json
        }
      }
      credit_notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          credit_note_number: string
          invoice_id: string
          amount: number
          currency: string
          reason: string
          status: string
          issue_date: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          credit_note_number: string
          invoice_id: string
          amount: number
          currency: string
          reason: string
          status?: string
          issue_date: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          credit_note_number?: string
          invoice_id?: string
          amount?: number
          currency?: string
          reason?: string
          status?: string
          issue_date?: string
          metadata?: Json
        }
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
          role: string
          status: string
          last_login: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          full_name: string
          role: string
          status?: string
          last_login?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string
          role?: string
          status?: string
          last_login?: string | null
          metadata?: Json
        }
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          details: Json
          ip_address: string | null
          user_agent: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
        }
      }
    }
  }
}

// Base types
export type Client = Database['public']['Tables']['clients']['Row']
export type SKR = Database['public']['Tables']['skrs']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type Tracking = Database['public']['Tables']['tracking']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Receipt = Database['public']['Tables']['receipts']['Row']
export type CreditNote = Database['public']['Tables']['credit_notes']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Insert types
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type SKRInsert = Database['public']['Tables']['skrs']['Insert']
export type AssetInsert = Database['public']['Tables']['assets']['Insert']
export type TrackingInsert = Database['public']['Tables']['tracking']['Insert']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type ReceiptInsert = Database['public']['Tables']['receipts']['Insert']
export type CreditNoteInsert = Database['public']['Tables']['credit_notes']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

// Update types
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type SKRUpdate = Database['public']['Tables']['skrs']['Update']
export type AssetUpdate = Database['public']['Tables']['assets']['Update']
export type TrackingUpdate = Database['public']['Tables']['tracking']['Update']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
export type ReceiptUpdate = Database['public']['Tables']['receipts']['Update']
export type CreditNoteUpdate = Database['public']['Tables']['credit_notes']['Update']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update']

// Extended Types with Relations
export interface TrackingRecord extends Tracking {
  recorded_by_user?: {
    id: string
    name: string
  }
  isLatest?: boolean
  previousLocation?: string
  distanceTraveled?: number
}

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
  skr?: SKR
  receipts?: Receipt[]
  credit_notes?: CreditNote[]
}

export interface ReceiptWithRelations extends Receipt {
  invoice?: Invoice
}

export interface CreditNoteWithRelations extends CreditNote {
  invoice?: Invoice
}

export interface AuditLogWithRelations extends AuditLog {
  user_profiles?: UserProfile
}

// Enum types
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

// Search types
export interface SearchSuggestion {
  id: string
  type: 'client' | 'skr' | 'asset' | 'invoice'
  title: string
  subtitle: string
  url: string
}

export interface SearchResult {
  id: string
  type: 'client' | 'skr' | 'asset' | 'invoice'
  title: string
  subtitle: string
  description: string
  url: string
  metadata: Record<string, any>
}

// Analytics types
export interface AnalyticsOverview {
  key_metrics: {
    total_clients: number
    new_clients: number
    compliant_clients: number
    total_skrs: number
    issued_skrs: number
    in_transit_skrs: number
    delivered_skrs: number
    total_revenue: number
    collected_revenue: number
    compliance_rate: number
  }
  growth: {
    client_growth: number
    skr_growth: number
    revenue_growth: number
  }
  distributions: {
    compliance_status: Record<string, number>
    risk_levels: Record<string, number>
    client_types: Record<string, number>
  }
  recent_activities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    user: string
  }>
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  metadata: Record<string, any>
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  in_app: boolean
  push: boolean
}

// Filter types
export interface FilterPreset {
  id: string
  name: string
  type: string
  filters: Record<string, any>
  user_id: string
  created_at: string
}

// Generic update type helper
type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']