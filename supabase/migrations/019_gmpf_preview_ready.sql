-- Migration 015: Add preview_ready flag for progressive report delivery
-- After 3+ primitives complete, a mini-synthesis runs and sets this flag
-- so the frontend can show preliminary results while the full scan continues.

BEGIN;

ALTER TABLE scans ADD COLUMN IF NOT EXISTS preview_ready BOOLEAN DEFAULT false;

COMMIT;
