-- Function to generate SKR number
CREATE OR REPLACE FUNCTION generate_skr_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    formatted_num TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(skr_number FROM 'G1-SKR-' || year_part || '-(\d+)') 
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM skrs
    WHERE skr_number LIKE 'G1-SKR-' || year_part || '-%';
    
    -- Format with leading zeros
    formatted_num := LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN 'G1-SKR-' || year_part || '-' || formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    formatted_num TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this year-month
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(invoice_number FROM 'G1-INV-' || year_month || '-(\d+)') 
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'G1-INV-' || year_month || '-%';
    
    -- Format with leading zeros
    formatted_num := LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN 'G1-INV-' || year_month || '-' || formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    formatted_num TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this year-month
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(receipt_number FROM 'G1-RCP-' || year_month || '-(\d+)') 
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM receipts
    WHERE receipt_number LIKE 'G1-RCP-' || year_month || '-%';
    
    -- Format with leading zeros
    formatted_num := LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN 'G1-RCP-' || year_month || '-' || formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate credit note number
CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    formatted_num TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this year-month
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(credit_note_number FROM 'G1-CN-' || year_month || '-(\d+)') 
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM credit_notes
    WHERE credit_note_number LIKE 'G1-CN-' || year_month || '-%';
    
    -- Format with leading zeros
    formatted_num := LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN 'G1-CN-' || year_month || '-' || formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate client risk score
CREATE OR REPLACE FUNCTION calculate_client_risk_score(client_id UUID)
RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    client_record clients%ROWTYPE;
    skr_count INTEGER;
    total_value DECIMAL;
BEGIN
    -- Get client record
    SELECT * INTO client_record FROM clients WHERE id = client_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Base risk score based on client type
    CASE client_record.type
        WHEN 'individual' THEN risk_score := 10;
        WHEN 'corporate' THEN risk_score := 20;
        WHEN 'institutional' THEN risk_score := 30;
    END CASE;
    
    -- Add risk based on compliance status
    CASE client_record.compliance_status
        WHEN 'approved' THEN risk_score := risk_score + 0;
        WHEN 'under_review' THEN risk_score := risk_score + 10;
        WHEN 'pending' THEN risk_score := risk_score + 20;
        WHEN 'rejected' THEN risk_score := risk_score + 50;
    END CASE;
    
    -- Add risk based on transaction volume
    SELECT COUNT(*), COALESCE(SUM(a.declared_value), 0)
    INTO skr_count, total_value
    FROM skrs s
    JOIN assets a ON s.asset_id = a.id
    WHERE s.client_id = client_id;
    
    -- High transaction volume increases risk
    IF total_value > 10000000 THEN -- > $10M
        risk_score := risk_score + 20;
    ELSIF total_value > 1000000 THEN -- > $1M
        risk_score := risk_score + 10;
    END IF;
    
    -- Many transactions increase risk
    IF skr_count > 100 THEN
        risk_score := risk_score + 15;
    ELSIF skr_count > 10 THEN
        risk_score := risk_score + 5;
    END IF;
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_skrs', (SELECT COUNT(*) FROM skrs),
        'active_skrs', (SELECT COUNT(*) FROM skrs WHERE status IN ('issued', 'in_transit')),
        'total_clients', (SELECT COUNT(*) FROM clients),
        'pending_compliance', (SELECT COUNT(*) FROM clients WHERE compliance_status = 'pending'),
        'total_invoices', (SELECT COUNT(*) FROM invoices),
        'outstanding_amount', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM invoices 
            WHERE status IN ('sent', 'overdue')
        ),
        'recent_activities', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'action', action,
                    'resource_type', resource_type,
                    'resource_id', resource_id,
                    'created_at', created_at
                )
            )
            FROM (
                SELECT * FROM audit_logs 
                ORDER BY created_at DESC 
                LIMIT 10
            ) recent
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search across multiple tables
CREATE OR REPLACE FUNCTION global_search(search_term TEXT)
RETURNS TABLE(
    result_type TEXT,
    result_id UUID,
    result_title TEXT,
    result_description TEXT,
    result_url TEXT
) AS $$
BEGIN
    -- Search in clients
    RETURN QUERY
    SELECT 
        'client'::TEXT,
        c.id,
        c.name,
        c.email || ' - ' || c.country,
        '/dashboard/clients/' || c.id::TEXT
    FROM clients c
    WHERE 
        c.name ILIKE '%' || search_term || '%' OR
        c.email ILIKE '%' || search_term || '%' OR
        c.country ILIKE '%' || search_term || '%';
    
    -- Search in SKRs
    RETURN QUERY
    SELECT 
        'skr'::TEXT,
        s.id,
        s.skr_number,
        'Status: ' || s.status::TEXT || ' - Client: ' || c.name,
        '/dashboard/skrs/' || s.id::TEXT
    FROM skrs s
    JOIN clients c ON s.client_id = c.id
    WHERE 
        s.skr_number ILIKE '%' || search_term || '%' OR
        s.remarks ILIKE '%' || search_term || '%';
    
    -- Search in invoices
    RETURN QUERY
    SELECT 
        'invoice'::TEXT,
        i.id,
        i.invoice_number,
        'Amount: $' || i.amount::TEXT || ' - Client: ' || c.name,
        '/dashboard/finance/invoices/' || i.id::TEXT
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE 
        i.invoice_number ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;