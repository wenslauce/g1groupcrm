-- Create full-text search indexes for global search functionality

-- Add search vectors to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for clients search
CREATE INDEX IF NOT EXISTS clients_search_idx ON clients USING gin(search_vector);

-- Create trigger to update search vector for clients
CREATE OR REPLACE FUNCTION update_clients_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.company_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_search_vector_update
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_clients_search_vector();

-- Update existing records
UPDATE clients SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(company_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(phone, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(address, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(city, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(country, '')), 'D');

-- Add search vectors to SKRs table
ALTER TABLE skrs ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for SKRs search
CREATE INDEX IF NOT EXISTS skrs_search_idx ON skrs USING gin(search_vector);

-- Create trigger to update search vector for SKRs
CREATE OR REPLACE FUNCTION update_skrs_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.skr_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.status, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skrs_search_vector_update
  BEFORE INSERT OR UPDATE ON skrs
  FOR EACH ROW EXECUTE FUNCTION update_skrs_search_vector();

-- Update existing SKR records
UPDATE skrs SET search_vector = 
  setweight(to_tsvector('english', COALESCE(skr_number, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(notes, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(status, '')), 'D');

-- Add search vectors to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for assets search
CREATE INDEX IF NOT EXISTS assets_search_idx ON assets USING gin(search_vector);

-- Create trigger to update search vector for assets
CREATE OR REPLACE FUNCTION update_assets_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_search_vector_update
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_assets_search_vector();

-- Update existing asset records
UPDATE assets SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'D');

-- Add search vectors to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for invoices search
CREATE INDEX IF NOT EXISTS invoices_search_idx ON invoices USING gin(search_vector);

-- Create trigger to update search vector for invoices
CREATE OR REPLACE FUNCTION update_invoices_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.invoice_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.status, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_search_vector_update
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_invoices_search_vector();

-- Update existing invoice records
UPDATE invoices SET search_vector = 
  setweight(to_tsvector('english', COALESCE(invoice_number, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(status, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(notes, '')), 'D');

-- Create global search function
CREATE OR REPLACE FUNCTION global_search(search_query text, result_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  subtitle text,
  content text,
  url text,
  rank real,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Search clients
    SELECT 
      c.id,
      'client'::text as type,
      c.name as title,
      c.email as subtitle,
      COALESCE(c.company_name, '') || ' ' || COALESCE(c.phone, '') as content,
      '/dashboard/clients/' || c.id::text as url,
      ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as rank,
      c.created_at
    FROM clients c
    WHERE c.search_vector @@ plainto_tsquery('english', search_query)
    
    UNION ALL
    
    -- Search SKRs
    SELECT 
      s.id,
      'skr'::text as type,
      s.skr_number as title,
      s.description as subtitle,
      COALESCE(s.notes, '') as content,
      '/dashboard/skrs/' || s.id::text as url,
      ts_rank(s.search_vector, plainto_tsquery('english', search_query)) as rank,
      s.created_at
    FROM skrs s
    WHERE s.search_vector @@ plainto_tsquery('english', search_query)
    
    UNION ALL
    
    -- Search assets
    SELECT 
      a.id,
      'asset'::text as type,
      a.name as title,
      a.category as subtitle,
      COALESCE(a.description, '') || ' ' || COALESCE(a.location, '') as content,
      '/dashboard/assets/' || a.id::text as url,
      ts_rank(a.search_vector, plainto_tsquery('english', search_query)) as rank,
      a.created_at
    FROM assets a
    WHERE a.search_vector @@ plainto_tsquery('english', search_query)
    
    UNION ALL
    
    -- Search invoices
    SELECT 
      i.id,
      'invoice'::text as type,
      i.invoice_number as title,
      i.status as subtitle,
      COALESCE(i.description, '') || ' ' || COALESCE(i.notes, '') as content,
      '/dashboard/financial/invoices/' || i.id::text as url,
      ts_rank(i.search_vector, plainto_tsquery('english', search_query)) as rank,
      i.created_at
    FROM invoices i
    WHERE i.search_vector @@ plainto_tsquery('english', search_query)
  )
  ORDER BY rank DESC, created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create search suggestions function
CREATE OR REPLACE FUNCTION search_suggestions(search_query text, suggestion_limit integer DEFAULT 10)
RETURNS TABLE (
  suggestion text,
  type text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH suggestions AS (
    -- Client name suggestions
    SELECT 
      c.name as suggestion,
      'client'::text as type,
      COUNT(*) as count
    FROM clients c
    WHERE c.name ILIKE '%' || search_query || '%'
    GROUP BY c.name
    
    UNION ALL
    
    -- SKR number suggestions
    SELECT 
      s.skr_number as suggestion,
      'skr'::text as type,
      COUNT(*) as count
    FROM skrs s
    WHERE s.skr_number ILIKE '%' || search_query || '%'
    GROUP BY s.skr_number
    
    UNION ALL
    
    -- Asset name suggestions
    SELECT 
      a.name as suggestion,
      'asset'::text as type,
      COUNT(*) as count
    FROM assets a
    WHERE a.name ILIKE '%' || search_query || '%'
    GROUP BY a.name
    
    UNION ALL
    
    -- Invoice number suggestions
    SELECT 
      i.invoice_number as suggestion,
      'invoice'::text as type,
      COUNT(*) as count
    FROM invoices i
    WHERE i.invoice_number ILIKE '%' || search_query || '%'
    GROUP BY i.invoice_number
  )
  SELECT s.suggestion, s.type, s.count
  FROM suggestions s
  ORDER BY s.count DESC, s.suggestion ASC
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION global_search(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION search_suggestions(text, integer) TO authenticated;

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  results_count integer NOT NULL DEFAULT 0,
  clicked_result_id uuid,
  clicked_result_type text,
  search_timestamp timestamptz DEFAULT now(),
  session_id text,
  ip_address inet,
  user_agent text
);

-- Create index for search analytics
CREATE INDEX IF NOT EXISTS search_analytics_user_id_idx ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS search_analytics_timestamp_idx ON search_analytics(search_timestamp);
CREATE INDEX IF NOT EXISTS search_analytics_query_idx ON search_analytics(search_query);

-- Enable RLS on search analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search analytics
CREATE POLICY "Users can view their own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search analytics" ON search_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all search analytics
CREATE POLICY "Admins can view all search analytics" ON search_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );