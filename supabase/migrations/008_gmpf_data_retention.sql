-- Data retention: add expires_at columns and cleanup function.
-- Default: 30 days from creation.

ALTER TABLE scans ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Set default for new rows
ALTER TABLE scans ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');
ALTER TABLE prospects ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- Backfill existing rows
UPDATE scans SET expires_at = created_at + interval '30 days' WHERE expires_at IS NULL;
UPDATE prospects SET expires_at = created_at + interval '30 days' WHERE expires_at IS NULL;

-- Cleanup function for cron job
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired scans (cascading will clean up primitive_results, screenshots, reports)
  DELETE FROM scans WHERE expires_at IS NOT NULL AND expires_at < now();

  -- Delete prospects with no remaining scans
  DELETE FROM prospects p
  WHERE p.expires_at IS NOT NULL
    AND p.expires_at < now()
    AND NOT EXISTS (SELECT 1 FROM scans s WHERE s.prospect_id = p.id);
END;
$$;

-- Enable pg_cron and schedule daily cleanup at 3 AM UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-data',
  '0 3 * * *',
  'SELECT cleanup_expired_data()'
);
