-- Migration 013: Replace CHECK constraint with primitive_types lookup table
-- Adding a new primitive = INSERT (data change), not DDL migration
-- Wrapped in explicit transaction for atomicity (partial failure safe)

BEGIN;

-- Drop the existing CHECK constraint
ALTER TABLE primitive_results DROP CONSTRAINT IF EXISTS primitive_results_primitive_check;

-- Create lookup table
CREATE TABLE IF NOT EXISTS primitive_types (
  name TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT,
  enabled_by_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed all known primitives (existing + new)
INSERT INTO primitive_types (name, label, category, enabled_by_default) VALUES
  -- Existing primitives
  ('traffic_analysis',      'Traffic Analysis',           'acquisition',   true),
  ('website_cro',           'Website & CRO',              'conversion',    true),  -- legacy, still active
  ('website_technical',     'Website Technical',           'conversion',    true),
  ('website_messaging',     'Messaging & Positioning',     'conversion',    true),
  ('content_presence',      'Content Presence',            'acquisition',   true),
  ('tracking_analytics',    'Tracking & Analytics',        'measurement',   true),
  ('meta_ads',              'Meta Ads',                    'acquisition',   true),
  ('google_ads',            'Google Ads',                  'acquisition',   true),
  ('email_analysis',        'Email Marketing',             'retention',     true),
  ('competitor_context',    'Competitor Context',           'intelligence',  true),
  ('company_enrichment',    'Company Intelligence',         'intelligence',  true),
  ('brand_reputation',      'Brand Reputation',            'trust',         true),
  ('social_organic',        'Social Presence',             'acquisition',   true),
  ('pricing_monetization',  'Pricing & Monetization',      'conversion',    true),
  ('meo_analysis',          'Meaning Engine Optimization', 'acquisition',   true),
  ('agent_native',          'Agent-Native Readiness',      'technology',    true)
ON CONFLICT (name) DO NOTHING;

-- Add FK constraint with NOT VALID to avoid locking the table during validation
ALTER TABLE primitive_results
  ADD CONSTRAINT primitive_results_primitive_fk
  FOREIGN KEY (primitive) REFERENCES primitive_types(name)
  NOT VALID;

COMMIT;

-- Validate the FK separately (no lock on primitive_results during validation)
ALTER TABLE primitive_results VALIDATE CONSTRAINT primitive_results_primitive_fk;

-- RLS: primitive_types is read-only reference data for all users (including anon for share pages)
ALTER TABLE primitive_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "primitive_types_read_all"
  ON primitive_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "primitive_types_read_anon"
  ON primitive_types FOR SELECT
  TO anon
  USING (true);

-- Rollback script (keep for emergencies):
-- ALTER TABLE primitive_results DROP CONSTRAINT IF EXISTS primitive_results_primitive_fk;
-- ALTER TABLE primitive_results ADD CONSTRAINT primitive_results_primitive_check
--   CHECK (primitive IN (
--     'traffic_analysis', 'website_cro', 'website_technical', 'website_messaging',
--     'content_presence', 'tracking_analytics', 'meta_ads', 'google_ads',
--     'email_analysis', 'competitor_context', 'company_enrichment',
--     'brand_reputation', 'social_organic', 'pricing_monetization',
--     'meo_analysis', 'agent_native'
--   ));
-- DROP TABLE IF EXISTS primitive_types;
