-- Create filter presets table
CREATE TABLE IF NOT EXISTS filter_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS filter_presets_user_id_idx ON filter_presets(user_id);
CREATE INDEX IF NOT EXISTS filter_presets_is_default_idx ON filter_presets(is_default);
CREATE INDEX IF NOT EXISTS filter_presets_created_at_idx ON filter_presets(created_at);

-- Enable RLS
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own filter presets" ON filter_presets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own filter presets" ON filter_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filter presets" ON filter_presets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filter presets" ON filter_presets
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_filter_presets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW EXECUTE FUNCTION update_filter_presets_updated_at();

-- Create function to ensure only one default preset per user
CREATE OR REPLACE FUNCTION ensure_single_default_preset()
RETURNS trigger AS $$
BEGIN
  -- If setting a preset as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE filter_presets 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_preset_trigger
  BEFORE INSERT OR UPDATE ON filter_presets
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_preset();

-- Insert default filter presets for system
INSERT INTO filter_presets (user_id, name, description, filters, is_default) VALUES
-- These will be created for each user when they first access the system
-- For now, we'll create them as system defaults that can be copied
(
  '00000000-0000-0000-0000-000000000000', -- System user placeholder
  'Active SKRs',
  'Show only active SKRs',
  '{"types": ["skr"], "status": ["active", "in_transit"], "tags": [], "customFields": {}}',
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  'Pending Invoices', 
  'Show unpaid invoices',
  '{"types": ["invoice"], "status": ["pending", "overdue"], "tags": [], "customFields": {}}',
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  'Recent Clients',
  'Clients added in the last 30 days',
  '{"types": ["client"], "status": [], "tags": [], "customFields": {}}',
  false
),
(
  '00000000-0000-0000-0000-000000000000',
  'High Value Assets',
  'Assets worth more than $10,000',
  '{"types": ["asset"], "status": [], "amountMin": 10000, "tags": [], "customFields": {}}',
  false
)
ON CONFLICT DO NOTHING;

-- Create function to copy system presets to new users
CREATE OR REPLACE FUNCTION copy_system_presets_to_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO filter_presets (user_id, name, description, filters, is_default)
  SELECT 
    target_user_id,
    name,
    description,
    filters,
    false -- Don't copy default status
  FROM filter_presets 
  WHERE user_id = '00000000-0000-0000-0000-000000000000'
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION copy_system_presets_to_user(uuid) TO authenticated;