-- Migration 007: Add MHAS audit opinion, dimension categories, and raw outreach to reports
-- Part of the Quality & Robustness Overhaul (Round 3)

-- Raw outreach message (pre-humanizer) for A/B testing
ALTER TABLE reports ADD COLUMN IF NOT EXISTS outreach_message_raw TEXT;

-- MHAS audit opinion: Sound, Qualified, Deficient, or Incomplete
ALTER TABLE reports ADD COLUMN IF NOT EXISTS audit_opinion TEXT
  CHECK (audit_opinion IN ('Sound', 'Qualified', 'Deficient', 'Incomplete'));

-- Per-dimension MHAS categories (0-4 scale per dimension)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS dimension_categories JSONB;
