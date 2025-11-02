-- Fix tracking table schema to support public API
-- Add missing columns to tracking table

ALTER TABLE tracking 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS current_country TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint on tracking_number
ALTER TABLE tracking 
ADD CONSTRAINT tracking_number_unique UNIQUE (tracking_number);

-- Create index on tracking_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracking_number ON tracking(tracking_number);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_tracking_updated_at ON tracking;
CREATE TRIGGER update_tracking_updated_at BEFORE UPDATE ON tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create tracking_events table for detailed event history
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skr_id UUID REFERENCES skrs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tracking_events
CREATE INDEX IF NOT EXISTS idx_tracking_events_skr_id ON tracking_events(skr_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_date ON tracking_events(event_date);

-- Add some sample event types as comments for reference
COMMENT ON COLUMN tracking_events.event_type IS 'Event types: picked_up, in_transit, customs, delivered, location_update, etc.';


