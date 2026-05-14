-- Deep analysis opt-in: controls whether email signup + contact enrichment are performed.
-- Default: false (observation-only mode).

ALTER TABLE scans ADD COLUMN IF NOT EXISTS deep_analysis BOOLEAN DEFAULT false;
