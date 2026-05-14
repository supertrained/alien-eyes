-- 018_scan_active_unique.sql
-- Prevent race condition: only one active scan per prospect at a time.
-- A partial unique index on (prospect_id) WHERE status is active ensures
-- that concurrent INSERT attempts for the same prospect will fail at the
-- DB level, closing the TOCTOU gap in the API check.

BEGIN;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_active_per_prospect
  ON scans(prospect_id)
  WHERE status IN ('queued', 'running', 'synthesizing');

COMMIT;
