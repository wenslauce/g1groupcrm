export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          type: 'individual' | 'corporate' | 'institutional'
          email: string
          phone: string | null
          country: string
          address: Json | null
          risk_level: 'low' | 'medium' | 'high'
          compliance_status: 'pending' | 'approved' | 'rejected' | 'under_review'
          kyc_documents: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'individual' | 'corporate' | 'institutional'
          email: string
          phone?: string | null
          country: string
          address?: Json | null
          risk_level?: 'low' | 'medium' | 'high'
          compliance_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          kyc_documents?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'individual' | 'corporate' | 'institutional'
          email?: string
          phone?: string | null
          country?: string
          address?: Json | null
          risk_level?: 'low' | 'medium' | 'high'
          compliance_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          kyc_documents?: Json
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          client_id: string
          asset_name: string
          asset_type: string
          declared_value: number
          currency: string
          origin: string
          destination: string | null
          specifications: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          asset_name: string
          asset_type: string
          declared_value: number
          currency?: string
          origin: string
          destination?: string | null
          specifications?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          asset_name?: string
          asset_type?: string
          declared_value?: number
          currency?: string
          origin?: string
          destination?: string | null
          specifications?: Json
          created_at?: string
          updated_at?: string
        }
      }
      skrs: {
        Row: {
          id: string
          skr_number: string
          client_id: string
          asset_id: string
          status: 'draft' | 'approved' | 'issued' | 'in_transit' | 'delivered' | 'closed'
          issue_date: string | null
          issued_by: string | null
          hash: string | null
          pdf_url: string | null
          qr_code_url: string | null
          remarks: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          skr_number: string
          client_id: string
          asset_id: string
          status?: 'draft' | 'approved' | 'issued' | 'in_transit' | 'delivered' | 'closed'
          issue_date?: string | null
          issued_by?: string | null
          hash?: string | null
          pdf_url?: string | null
          qr_code_url?: string | null
          remarks?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          skr_number?: string
          client_id?: string
          asset_id?: string
          status?: 'draft' | 'approved' | 'issued' | 'in_transit' | 'delivered' | 'closed'
          issue_date?: string | null
          issued_by?: string | null
          hash?: string | null
          pdf_url?: string | null
          qr_code_url?: string | null
          remarks?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tracking: {
        Row: {
          id: string
          skr_id: string
          current_location: string | null
          status: string
          coordinates: string | null
          last_update: string
          updated_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          skr_id: string
          current_location?: string | null
          status: string
          coordinates?: string | null
          last_update?: string
          updated_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          skr_id?: string
          current_location?: string | null
          status?: string
          coordinates?: string | null
          last_update?: string
          updated_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          client_id: string
          skr_id: string | null
          amount: number
          currency: string
          issue_date: string
          due_date: string | null
          pdf_url: string | null
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          client_id: string
          skr_id?: string | null
          amount: number
          currency?: string
          issue_date?: string
          due_date?: string | null
          pdf_url?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          client_id?: string
          skr_id?: string | null
          amount?: number
          currency?: string
          issue_date?: string
          due_date?: string | null
          pdf_url?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          receipt_number: string
          invoice_id: string
          amount: number
          payment_method: string
          payment_reference: string | null
          issue_date: string
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          receipt_number: string
          invoice_id: string
          amount: number
          payment_method: string
          payment_reference?: string | null
          issue_date?: string
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          receipt_number?: string
          invoice_id?: string
          amount?: number
          payment_method?: string
          payment_reference?: string | null
          issue_date?: string
          pdf_url?: string | null
          created_at?: string
        }
      }
      credit_notes: {
        Row: {
          id: string
          credit_note_number: string
          reference_invoice: string
          amount: number
          reason: string
          issue_date: string
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          credit_note_number: string
          reference_invoice: string
          amount: number
          reason: string
          issue_date?: string
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          credit_note_number?: string
          reference_invoice?: string
          amount?: number
          reason?: string
          issue_date?: string
          pdf_url?: string | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'finance' | 'operations' | 'compliance' | 'read_only'
          department: string | null
          email: string
          avatar_url: string | null
          permissions: Json
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'admin' | 'finance' | 'operations' | 'compliance' | 'read_only'
          department?: string | null
          email: string
          avatar_url?: string | null
          permissions?: Json
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'finance' | 'operations' | 'compliance' | 'read_only'
          department?: string | null
          email?: string
          avatar_url?: string | null
          permissions?: Json
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}