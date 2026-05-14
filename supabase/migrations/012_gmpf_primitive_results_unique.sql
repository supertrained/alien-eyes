-- Migration 008: Add UNIQUE constraint on (scan_id, primitive)
-- Prevents duplicate rows on BullMQ retry and ensures UPDATE targets exactly one row.
-- Also allows UPSERT (ON CONFLICT) in markPrimitivesRunning.

-- First, clean up any existing duplicates (keep the newest row per scan_id + primitive)
DELETE FROM primitive_results a
USING primitive_results b
WHERE a.scan_id = b.scan_id
  AND a.primitive = b.primitive
  AND a.created_at < b.created_at;

ALTER TABLE primitive_results
  ADD CONSTRAINT uq_primitive_results_scan_primitive
  UNIQUE (scan_id, primitive);
