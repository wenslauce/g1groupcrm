-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE skrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has required role
CREATE OR REPLACE FUNCTION has_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clients table policies
CREATE POLICY "Users can view clients based on role" ON clients
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Admin and Finance can manage clients" ON clients
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance']::user_role[])
    );

-- Assets table policies
CREATE POLICY "Users can view assets based on role" ON assets
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Admin, Finance and Operations can manage assets" ON assets
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance', 'operations']::user_role[])
    );

-- SKRs table policies
CREATE POLICY "Users can view SKRs based on role" ON skrs
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Finance and Operations can create SKRs" ON skrs
    FOR INSERT WITH CHECK (
        has_role(ARRAY['admin', 'finance', 'operations']::user_role[])
    );

CREATE POLICY "Finance and Operations can update SKRs" ON skrs
    FOR UPDATE USING (
        has_role(ARRAY['admin', 'finance', 'operations']::user_role[])
    );

CREATE POLICY "Admin can delete SKRs" ON skrs
    FOR DELETE USING (
        has_role(ARRAY['admin']::user_role[])
    );

-- Tracking table policies
CREATE POLICY "Users can view tracking based on role" ON tracking
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Operations can manage tracking" ON tracking
    FOR ALL USING (
        has_role(ARRAY['admin', 'operations']::user_role[])
    );

-- Invoices table policies
CREATE POLICY "Users can view invoices based on role" ON invoices
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Finance can manage invoices" ON invoices
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance']::user_role[])
    );

-- Receipts table policies
CREATE POLICY "Users can view receipts based on role" ON receipts
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Finance can manage receipts" ON receipts
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance']::user_role[])
    );

-- Credit notes table policies
CREATE POLICY "Users can view credit notes based on role" ON credit_notes
    FOR SELECT USING (
        has_role(ARRAY['admin', 'finance', 'operations', 'compliance']::user_role[])
    );

CREATE POLICY "Finance can manage credit notes" ON credit_notes
    FOR ALL USING (
        has_role(ARRAY['admin', 'finance']::user_role[])
    );

-- User profiles table policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can view all profiles" ON user_profiles
    FOR SELECT USING (
        has_role(ARRAY['admin']::user_role[])
    );

CREATE POLICY "Admin can manage all profiles" ON user_profiles
    FOR ALL USING (
        has_role(ARRAY['admin']::user_role[])
    );

-- Audit logs table policies
CREATE POLICY "Users can view audit logs based on role" ON audit_logs
    FOR SELECT USING (
        has_role(ARRAY['admin', 'compliance']::user_role[])
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_skrs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON skrs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_user_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();