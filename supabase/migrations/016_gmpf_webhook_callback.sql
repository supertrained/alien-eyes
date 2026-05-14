-- Add webhook callback columns for agent integration
ALTER TABLE scans ADD COLUMN IF NOT EXISTS callback_url text;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS callback_meta jsonb;
