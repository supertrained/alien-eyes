-- ============================================================
-- Alien Eyes Builders (AEB) tables
-- Shared Supabase project with GMPF; all objects prefixed aeb_
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- aeb_users ----------
CREATE TABLE aeb_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email',
  plan TEXT NOT NULL DEFAULT 'free',
  ownership_verified_domains TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aeb_users_email ON aeb_users(email);

-- ---------- aeb_api_keys ----------
CREATE TABLE aeb_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES aeb_users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  permissions TEXT[] NOT NULL DEFAULT '{read,audit}',
  last_used_at TIMESTAMPTZ,
  rate_limit_per_hour INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_aeb_api_keys_user_id ON aeb_api_keys(user_id);
CREATE UNIQUE INDEX idx_aeb_api_keys_key_hash ON aeb_api_keys(key_hash);
CREATE INDEX idx_aeb_api_keys_prefix ON aeb_api_keys(key_prefix);

-- ---------- aeb_audits ----------
CREATE TABLE aeb_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES aeb_users(id),
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'quick_check',
  methodology_version TEXT NOT NULL DEFAULT 'v0.1',
  ownership_verified BOOLEAN NOT NULL DEFAULT false,
  page_limit INT NOT NULL DEFAULT 30,
  cost_budget NUMERIC(6,2) NOT NULL DEFAULT 5.00,
  targeted_dimensions TEXT[] DEFAULT NULL,
  is_re_audit BOOLEAN NOT NULL DEFAULT false,
  previous_audit_id UUID REFERENCES aeb_audits(id),
  status TEXT NOT NULL DEFAULT 'pending',
  progress NUMERIC(5,2) DEFAULT 0,
  current_phase TEXT,
  error_message TEXT,
  satisfaction_score NUMERIC(5,2),
  satisfaction_confidence_low NUMERIC(5,2),
  satisfaction_confidence_high NUMERIC(5,2),
  human_native_score NUMERIC(5,2),
  agent_nativeness_score NUMERIC(5,2),
  finding_count INT DEFAULT 0,
  critical_count INT DEFAULT 0,
  high_count INT DEFAULT 0,
  medium_count INT DEFAULT 0,
  low_count INT DEFAULT 0,
  total_cost_usd NUMERIC(6,4) DEFAULT 0,
  cost_by_primitive JSONB DEFAULT '{}',
  detected_stack TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug TEXT UNIQUE
);
CREATE INDEX idx_aeb_audits_user_id ON aeb_audits(user_id);
CREATE INDEX idx_aeb_audits_url ON aeb_audits(normalized_url);
CREATE INDEX idx_aeb_audits_domain ON aeb_audits(domain);
CREATE INDEX idx_aeb_audits_status ON aeb_audits(status);
CREATE INDEX idx_aeb_audits_created_at ON aeb_audits(created_at DESC);
CREATE INDEX idx_aeb_audits_previous ON aeb_audits(previous_audit_id) WHERE is_re_audit = true;

-- ---------- aeb_crawl_results ----------
CREATE TABLE aeb_crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES aeb_audits(id) ON DELETE CASCADE,
  pages_crawled INT NOT NULL DEFAULT 0,
  pages_discovered INT NOT NULL DEFAULT 0,
  pages_skipped INT NOT NULL DEFAULT 0,
  total_duration_ms INT NOT NULL DEFAULT 0,
  robots_txt_status TEXT NOT NULL DEFAULT 'not_found',
  detected_stack TEXT[] DEFAULT '{}',
  raw_data_storage_path TEXT,
  raw_data_expires_at TIMESTAMPTZ,
  page_summaries JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aeb_crawl_results_audit_id ON aeb_crawl_results(audit_id);

-- ---------- aeb_primitive_results ----------
CREATE TABLE aeb_primitive_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES aeb_audits(id) ON DELETE CASCADE,
  primitive_name TEXT NOT NULL,
  dimension TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  confidence_factors TEXT[] DEFAULT '{}',
  reasoning TEXT,
  model TEXT,
  tokens_used INT DEFAULT 0,
  cost_usd NUMERIC(6,4) DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  methodology_version TEXT NOT NULL DEFAULT 'v0.1',
  finding_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, primitive_name)
);
CREATE INDEX idx_aeb_primitive_results_audit_id ON aeb_primitive_results(audit_id);
CREATE INDEX idx_aeb_primitive_results_primitive ON aeb_primitive_results(primitive_name);

-- ---------- aeb_findings ----------
CREATE TABLE aeb_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES aeb_audits(id) ON DELETE CASCADE,
  primitive_name TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  what TEXT NOT NULL,
  where_found TEXT NOT NULL,
  expected TEXT NOT NULL,
  why TEXT NOT NULL,
  verify TEXT NOT NULL,
  severity TEXT NOT NULL,
  dimension TEXT NOT NULL,
  causal_chain TEXT[] DEFAULT '{}',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  requires_human_judgment BOOLEAN DEFAULT false,
  human_judgment_reason TEXT,
  evidence JSONB NOT NULL DEFAULT '{}',
  lifecycle_state TEXT NOT NULL DEFAULT 'detected',
  lifecycle_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lifecycle_updated_by TEXT,
  lifecycle_reason TEXT,
  lifecycle_platform TEXT,
  lifecycle_third_party TEXT,
  delta_status TEXT,
  matched_previous_finding_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, finding_id)
);
CREATE INDEX idx_aeb_findings_audit_id ON aeb_findings(audit_id);
CREATE INDEX idx_aeb_findings_severity ON aeb_findings(severity);
CREATE INDEX idx_aeb_findings_dimension ON aeb_findings(dimension);
CREATE INDEX idx_aeb_findings_lifecycle ON aeb_findings(lifecycle_state);
CREATE INDEX idx_aeb_findings_domain ON aeb_findings(audit_id, dimension);

-- ---------- aeb_reports ----------
CREATE TABLE aeb_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES aeb_audits(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, format)
);
CREATE INDEX idx_aeb_reports_audit_id ON aeb_reports(audit_id);

-- ---------- aeb_patterns ----------
CREATE TABLE aeb_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_hash TEXT NOT NULL,
  dimension TEXT NOT NULL,
  severity TEXT NOT NULL,
  what_template TEXT NOT NULL,
  stack_tags TEXT[] DEFAULT '{}',
  frequency INT NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(finding_hash)
);
CREATE INDEX idx_aeb_patterns_dimension ON aeb_patterns(dimension);
CREATE INDEX idx_aeb_patterns_stack ON aeb_patterns USING gin(stack_tags);
CREATE INDEX idx_aeb_patterns_frequency ON aeb_patterns(frequency DESC);

-- ---------- aeb_false_positive_reports ----------
CREATE TABLE aeb_false_positive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES aeb_findings(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES aeb_audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES aeb_users(id),
  reason TEXT NOT NULL,
  detail TEXT,
  primitive_name TEXT NOT NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aeb_fp_reports_finding ON aeb_false_positive_reports(finding_id);
CREATE INDEX idx_aeb_fp_reports_primitive ON aeb_false_positive_reports(primitive_name);
CREATE INDEX idx_aeb_fp_reports_reason ON aeb_false_positive_reports(reason);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE aeb_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_users_own ON aeb_users FOR ALL USING (auth.uid() = id);

ALTER TABLE aeb_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_audits_own ON aeb_audits FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY aeb_audits_public ON aeb_audits FOR SELECT USING (is_public = true);

ALTER TABLE aeb_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_findings_own ON aeb_findings FOR ALL USING (
  audit_id IN (SELECT id FROM aeb_audits WHERE user_id = auth.uid() OR user_id IS NULL)
);
CREATE POLICY aeb_findings_public ON aeb_findings FOR SELECT USING (
  audit_id IN (SELECT id FROM aeb_audits WHERE is_public = true)
);

ALTER TABLE aeb_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_reports_own ON aeb_reports FOR ALL USING (
  audit_id IN (SELECT id FROM aeb_audits WHERE user_id = auth.uid() OR user_id IS NULL)
);

ALTER TABLE aeb_crawl_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_crawl_results_own ON aeb_crawl_results FOR ALL USING (
  audit_id IN (SELECT id FROM aeb_audits WHERE user_id = auth.uid() OR user_id IS NULL)
);

ALTER TABLE aeb_primitive_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_primitive_results_own ON aeb_primitive_results FOR ALL USING (
  audit_id IN (SELECT id FROM aeb_audits WHERE user_id = auth.uid() OR user_id IS NULL)
);

ALTER TABLE aeb_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_patterns_public ON aeb_patterns FOR SELECT USING (true);

ALTER TABLE aeb_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_api_keys_own ON aeb_api_keys FOR ALL USING (user_id = auth.uid());

ALTER TABLE aeb_false_positive_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY aeb_fp_reports_own ON aeb_false_positive_reports FOR ALL USING (user_id = auth.uid());
