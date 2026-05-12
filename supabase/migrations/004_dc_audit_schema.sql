-- ============================================================
-- Dual Cognition (DC) audit tables
-- Shared Supabase project with AEB; all objects prefixed dc_
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- dc_clients ----------
CREATE TABLE dc_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  competitors JSONB DEFAULT '[]',
  icp_description TEXT,
  category TEXT,
  engagement_tier TEXT CHECK (engagement_tier IN ('audit_only', 'foundation', 'growth', 'enterprise')),
  engagement_start DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dc_clients_status ON dc_clients(status);

-- ---------- dc_audit_runs ----------
CREATE TABLE dc_audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dc_clients(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('baseline', 'monthly', 'quarterly')),
  modules_run TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'partial', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cost_usd NUMERIC(8,2),
  models_tested TEXT[],
  search_tools_tested TEXT[],
  degraded_providers TEXT[],
  ae_audit_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, run_id)
);
CREATE INDEX idx_dc_audit_runs_client ON dc_audit_runs(client_id);
CREATE INDEX idx_dc_audit_runs_status ON dc_audit_runs(status);
CREATE INDEX idx_dc_audit_runs_created ON dc_audit_runs(created_at DESC);

-- ---------- dc_measurements ----------
CREATE TABLE dc_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES dc_audit_runs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES dc_clients(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  recommendation_rate NUMERIC(5,4),
  entity_accuracy NUMERIC(5,4),
  hallucination_rate NUMERIC(5,4),
  meo_score NUMERIC(5,2),
  consistency_score NUMERIC(5,2),
  gap_score NUMERIC(3,1),
  competitive_share NUMERIC(5,4),
  human_score NUMERIC(3,1),
  machine_score NUMERIC(3,1),
  raw_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dc_measurements_run ON dc_measurements(run_id);
CREATE INDEX idx_dc_measurements_client ON dc_measurements(client_id);
CREATE INDEX idx_dc_measurements_module ON dc_measurements(module);
CREATE INDEX idx_dc_measurements_created ON dc_measurements(created_at DESC);

-- ---------- dc_business_context ----------
CREATE TABLE dc_business_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dc_clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  ai_referred_visits INTEGER,
  website_conversion_rate NUMERIC(5,4),
  brand_search_volume INTEGER,
  total_leads INTEGER,
  organic_traffic INTEGER,
  direct_traffic INTEGER,
  review_count INTEGER,
  review_avg_rating NUMERIC(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, month)
);
CREATE INDEX idx_dc_business_context_client ON dc_business_context(client_id);

-- ---------- dc_control_baselines ----------
CREATE TABLE dc_control_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES dc_audit_runs(id) ON DELETE CASCADE,
  query_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  mentions_expected BOOLEAN,
  mentions_actual BOOLEAN,
  shift_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dc_control_baselines_run ON dc_control_baselines(run_id);
CREATE INDEX idx_dc_control_baselines_shift ON dc_control_baselines(shift_detected) WHERE shift_detected = true;

-- ============================================================
-- Row Level Security
-- DC tables use a service-role key (not end-user auth),
-- so RLS allows the service role full access while blocking
-- anonymous/public access entirely.
-- ============================================================

ALTER TABLE dc_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_clients_service ON dc_clients FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE dc_audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_audit_runs_service ON dc_audit_runs FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE dc_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_measurements_service ON dc_measurements FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE dc_business_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_business_context_service ON dc_business_context FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE dc_control_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_control_baselines_service ON dc_control_baselines FOR ALL
  USING (auth.role() = 'service_role');
