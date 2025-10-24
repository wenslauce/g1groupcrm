-- Insert sample clients
INSERT INTO clients (name, type, email, phone, country, address, risk_level, compliance_status) VALUES
('ABC Corporation Ltd', 'corporate', 'contact@abccorp.com', '+1-555-0101', 'United States', 
 '{"street": "123 Business Ave", "city": "New York", "state": "NY", "postal_code": "10001", "country": "United States"}'::jsonb, 
 'low', 'approved'),
 
('XYZ Holdings Inc', 'institutional', 'info@xyzholdings.com', '+44-20-7946-0958', 'United Kingdom',
 '{"street": "456 Financial St", "city": "London", "postal_code": "EC1A 1BB", "country": "United Kingdom"}'::jsonb,
 'medium', 'approved'),
 
('John Smith', 'individual', 'john.smith@email.com', '+1-555-0102', 'Canada',
 '{"street": "789 Maple St", "city": "Toronto", "state": "ON", "postal_code": "M5V 3A8", "country": "Canada"}'::jsonb,
 'low', 'approved'),
 
('Global Commodities Ltd', 'corporate', 'trading@globalcom.com', '+65-6123-4567', 'Singapore',
 '{"street": "321 Trade Center", "city": "Singapore", "postal_code": "018989", "country": "Singapore"}'::jsonb,
 'high', 'under_review'),
 
('Premium Assets Group', 'institutional', 'assets@premiumgroup.com', '+41-44-123-4567', 'Switzerland',
 '{"street": "Swiss Financial Plaza", "city": "Zurich", "postal_code": "8001", "country": "Switzerland"}'::jsonb,
 'medium', 'pending');

-- Insert sample assets
INSERT INTO assets (client_id, asset_name, asset_type, declared_value, currency, origin, destination, specifications) VALUES
((SELECT id FROM clients WHERE email = 'contact@abccorp.com'), 'Gold Bars - 99.99% Pure', 'Precious Metal', 2500000.00, 'USD', 'London Vault', 'New York Vault',
 '{"weight": "50kg", "purity": "99.99%", "bars": 20, "serial_numbers": ["GB001", "GB002", "GB003"]}'::jsonb),
 
((SELECT id FROM clients WHERE email = 'info@xyzholdings.com'), 'Diamond Collection', 'Gemstone', 1800000.00, 'USD', 'Antwerp', 'London',
 '{"pieces": 15, "total_carats": 125.5, "certification": "GIA", "grades": ["D-FL", "E-VVS1", "F-VS1"]}'::jsonb),
 
((SELECT id FROM clients WHERE email = 'john.smith@email.com'), 'Vintage Watch Collection', 'Luxury Goods', 450000.00, 'USD', 'Geneva', 'Toronto',
 '{"pieces": 5, "brands": ["Patek Philippe", "Rolex", "Audemars Piguet"], "condition": "Excellent"}'::jsonb),
 
((SELECT id FROM clients WHERE email = 'trading@globalcom.com'), 'Platinum Ingots', 'Precious Metal', 3200000.00, 'USD', 'Johannesburg', 'Singapore',
 '{"weight": "100kg", "purity": "99.95%", "ingots": 10, "assay_certificates": true}'::jsonb),
 
((SELECT id FROM clients WHERE email = 'assets@premiumgroup.com'), 'Art Collection - Modern Masters', 'Artwork', 5500000.00, 'USD', 'New York', 'Zurich',
 '{"pieces": 8, "artists": ["Picasso", "Monet", "Van Gogh"], "authentication": "Verified", "insurance_value": 6000000}'::jsonb);

-- Insert sample SKRs
INSERT INTO skrs (skr_number, client_id, asset_id, status, issue_date, issued_by, hash, remarks) VALUES
('G1-SKR-2024-00001', 
 (SELECT id FROM clients WHERE email = 'contact@abccorp.com'),
 (SELECT id FROM assets WHERE asset_name = 'Gold Bars - 99.99% Pure'),
 'delivered', '2024-01-15 10:30:00+00', 
 (SELECT id FROM auth.users LIMIT 1),
 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
 'Standard gold transfer - all documentation verified'),

('G1-SKR-2024-00002',
 (SELECT id FROM clients WHERE email = 'info@xyzholdings.com'),
 (SELECT id FROM assets WHERE asset_name = 'Diamond Collection'),
 'in_transit', '2024-02-20 14:15:00+00',
 (SELECT id FROM auth.users LIMIT 1),
 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
 'High-value diamond shipment - extra security protocols applied'),

('G1-SKR-2024-00003',
 (SELECT id FROM clients WHERE email = 'john.smith@email.com'),
 (SELECT id FROM assets WHERE asset_name = 'Vintage Watch Collection'),
 'delivered', '2024-03-10 09:45:00+00',
 (SELECT id FROM auth.users LIMIT 1),
 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
 'Personal collection transfer - client pickup arranged'),

('G1-SKR-2024-00004',
 (SELECT id FROM clients WHERE email = 'trading@globalcom.com'),
 (SELECT id FROM assets WHERE asset_name = 'Platinum Ingots'),
 'issued', '2024-12-01 11:20:00+00',
 (SELECT id FROM auth.users LIMIT 1),
 'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
 'Awaiting compliance clearance for international transfer'),

('G1-SKR-2024-00005',
 (SELECT id FROM clients WHERE email = 'assets@premiumgroup.com'),
 (SELECT id FROM assets WHERE asset_name = 'Art Collection - Modern Masters'),
 'draft', NULL, NULL, NULL,
 'Pending final valuation and insurance documentation');

-- Insert sample tracking records
INSERT INTO tracking (skr_id, current_location, status, last_update, notes) VALUES
((SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00001'), 'New York Vault - Delivered', 'delivered', '2024-01-18 16:30:00+00', 'Successfully delivered and verified by recipient'),
((SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00002'), 'In Transit - Brussels Hub', 'in_transit', '2024-12-01 08:15:00+00', 'Cleared customs, proceeding to final destination'),
((SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00003'), 'Toronto - Client Premises', 'delivered', '2024-03-12 14:20:00+00', 'Delivered to client residence, signature obtained'),
((SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00004'), 'Singapore Secure Facility', 'issued', '2024-12-01 11:20:00+00', 'Awaiting final compliance approval for release');

-- Insert sample invoices
INSERT INTO invoices (invoice_number, client_id, skr_id, amount, currency, issue_date, due_date, status) VALUES
('G1-INV-202401-0001',
 (SELECT id FROM clients WHERE email = 'contact@abccorp.com'),
 (SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00001'),
 25000.00, 'USD', '2024-01-15 10:30:00+00', '2024-02-14 23:59:59+00', 'paid'),

('G1-INV-202402-0001',
 (SELECT id FROM clients WHERE email = 'info@xyzholdings.com'),
 (SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00002'),
 18000.00, 'USD', '2024-02-20 14:15:00+00', '2024-03-21 23:59:59+00', 'paid'),

('G1-INV-202403-0001',
 (SELECT id FROM clients WHERE email = 'john.smith@email.com'),
 (SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00003'),
 4500.00, 'USD', '2024-03-10 09:45:00+00', '2024-04-09 23:59:59+00', 'paid'),

('G1-INV-202412-0001',
 (SELECT id FROM clients WHERE email = 'trading@globalcom.com'),
 (SELECT id FROM skrs WHERE skr_number = 'G1-SKR-2024-00004'),
 32000.00, 'USD', '2024-12-01 11:20:00+00', '2024-12-31 23:59:59+00', 'sent'),

('G1-INV-202412-0002',
 (SELECT id FROM clients WHERE email = 'assets@premiumgroup.com'),
 NULL, -- Service invoice not linked to SKR
 15000.00, 'USD', '2024-12-01 15:30:00+00', '2025-01-01 23:59:59+00', 'sent');

-- Insert sample receipts for paid invoices
INSERT INTO receipts (receipt_number, invoice_id, amount, payment_method, payment_reference, issue_date) VALUES
('G1-RCP-202401-0001',
 (SELECT id FROM invoices WHERE invoice_number = 'G1-INV-202401-0001'),
 25000.00, 'Wire Transfer', 'WT-ABC-20240125-001', '2024-01-25 10:15:00+00'),

('G1-RCP-202403-0001',
 (SELECT id FROM invoices WHERE invoice_number = 'G1-INV-202402-0001'),
 18000.00, 'Bank Transfer', 'BT-XYZ-20240315-002', '2024-03-15 14:30:00+00'),

('G1-RCP-202404-0001',
 (SELECT id FROM invoices WHERE invoice_number = 'G1-INV-202403-0001'),
 4500.00, 'Credit Card', 'CC-JS-20240405-003', '2024-04-05 09:20:00+00');

-- Create a sample admin user profile (this would normally be created when a user signs up)
-- Note: This assumes there's at least one user in auth.users table
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Try to get an existing user ID, or create a placeholder
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        INSERT INTO user_profiles (id, name, role, department, email, status) VALUES
        (sample_user_id, 'System Administrator', 'admin', 'IT', 'admin@g1holdings.com', 'active')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;