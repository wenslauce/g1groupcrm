-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE client_type AS ENUM ('individual', 'corporate', 'institutional');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE compliance_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');
CREATE TYPE skr_status AS ENUM ('draft', 'approved', 'issued', 'in_transit', 'delivered', 'closed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'finance', 'operations', 'compliance', 'read_only');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type client_type NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    country TEXT NOT NULL,
    address JSONB,
    risk_level risk_level NOT NULL DEFAULT 'medium',
    compliance_status compliance_status NOT NULL DEFAULT 'pending',
    kyc_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    declared_value DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    origin TEXT NOT NULL,
    destination TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SKRs table
CREATE TABLE skrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skr_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    status skr_status NOT NULL DEFAULT 'draft',
    issue_date TIMESTAMPTZ,
    issued_by UUID REFERENCES auth.users(id),
    hash TEXT UNIQUE,
    pdf_url TEXT,
    qr_code_url TEXT,
    remarks TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking table
CREATE TABLE tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skr_id UUID REFERENCES skrs(id) ON DELETE CASCADE,
    current_location TEXT,
    status TEXT NOT NULL,
    coordinates POINT,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    skr_id UUID REFERENCES skrs(id),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    pdf_url TEXT,
    status invoice_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit notes table
CREATE TABLE credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number TEXT UNIQUE NOT NULL,
    reference_invoice UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    department TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_type ON clients(type);
CREATE INDEX idx_clients_compliance_status ON clients(compliance_status);
CREATE INDEX idx_clients_risk_level ON clients(risk_level);
CREATE INDEX idx_clients_country ON clients(country);

CREATE INDEX idx_assets_client_id ON assets(client_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_value ON assets(declared_value);

CREATE INDEX idx_skrs_number ON skrs(skr_number);
CREATE INDEX idx_skrs_client_id ON skrs(client_id);
CREATE INDEX idx_skrs_asset_id ON skrs(asset_id);
CREATE INDEX idx_skrs_status ON skrs(status);
CREATE INDEX idx_skrs_issue_date ON skrs(issue_date);
CREATE INDEX idx_skrs_created_at ON skrs(created_at);

CREATE INDEX idx_tracking_skr_id ON tracking(skr_id);
CREATE INDEX idx_tracking_status ON tracking(status);
CREATE INDEX idx_tracking_last_update ON tracking(last_update);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_skr_id ON invoices(skr_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE INDEX idx_receipts_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX idx_receipts_issue_date ON receipts(issue_date);

CREATE INDEX idx_credit_notes_number ON credit_notes(credit_note_number);
CREATE INDEX idx_credit_notes_reference_invoice ON credit_notes(reference_invoice);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skrs_updated_at BEFORE UPDATE ON skrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();