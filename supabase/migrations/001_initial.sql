CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email',
  plan TEXT NOT NULL DEFAULT 'free',
  ownership_verified_domains TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
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
  previous_audit_id UUID REFERENCES audits(id),
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
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_url ON audits(normalized_url);
CREATE INDEX idx_audits_domain ON audits(domain);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_audits_previous ON audits(previous_audit_id) WHERE is_re_audit = true;

CREATE TABLE crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
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
CREATE INDEX idx_crawl_results_audit_id ON crawl_results(audit_id);

CREATE TABLE primitive_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
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
CREATE INDEX idx_primitive_results_audit_id ON primitive_results(audit_id);
CREATE INDEX idx_primitive_results_primitive ON primitive_results(primitive_name);

CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
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
CREATE INDEX idx_findings_audit_id ON findings(audit_id);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_dimension ON findings(dimension);
CREATE INDEX idx_findings_lifecycle ON findings(lifecycle_state);
CREATE INDEX idx_findings_domain ON findings(audit_id, dimension);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, format)
);
CREATE INDEX idx_reports_audit_id ON reports(audit_id);

CREATE TABLE patterns (
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
CREATE INDEX idx_patterns_dimension ON patterns(dimension);
CREATE INDEX idx_patterns_stack ON patterns USING gin(stack_tags);
CREATE INDEX idx_patterns_frequency ON patterns(frequency DESC);

CREATE TABLE false_positive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  detail TEXT,
  primitive_name TEXT NOT NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fp_reports_finding ON false_positive_reports(finding_id);
CREATE INDEX idx_fp_reports_primitive ON false_positive_reports(primitive_name);
CREATE INDEX idx_fp_reports_reason ON false_positive_reports(reason);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own ON users FOR ALL USING (auth.uid() = id);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY audits_own ON audits FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY findings_own ON findings FOR ALL USING (
  audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_own ON reports FOR ALL USING (
  audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY audits_public ON audits FOR SELECT USING (is_public = true);
CREATE POLICY findings_public ON findings FOR SELECT USING (
  audit_id IN (SELECT id FROM audits WHERE is_public = true)
);

ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY patterns_public ON patterns FOR SELECT USING (true);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_keys_own ON api_keys FOR ALL USING (user_id = auth.uid());

ALTER TABLE false_positive_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY fp_reports_own ON false_positive_reports FOR ALL USING (user_id = auth.uid());

