-- Migration 009: Add MEO and Agent-Native primitive types
-- Adds meo_analysis and agent_native to the primitive CHECK constraint

ALTER TABLE primitive_results DROP CONSTRAINT IF EXISTS primitive_results_primitive_check;
ALTER TABLE primitive_results ADD CONSTRAINT primitive_results_primitive_check
  CHECK (primitive IN (
    'traffic_analysis', 'website_cro', 'tracking_analytics',
    'meta_ads', 'google_ads', 'email_analysis',
    'competitor_context', 'company_enrichment',
    'meo_analysis', 'agent_native'
  ));
