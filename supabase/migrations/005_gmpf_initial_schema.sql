-- 001_initial_schema.sql
-- Growth Marketing Problem Finder — initial database schema
-- Multi-tenant, RLS-ready, scoped to org_id

-- ============================================================
-- Use gen_random_uuid() (built-in to Postgres 13+, Supabase default)
-- ============================================================

-- ============================================================
-- Helper: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- organizations
-- ============================================================

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')) DEFAULT 'trial',
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- users (extends Supabase Auth)
-- ============================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id      UUID REFERENCES organizations(id) NOT NULL,
  full_name   TEXT,
  role        TEXT CHECK (role IN ('owner', 'admin', 'salesperson')) DEFAULT 'salesperson',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_org_id ON users(org_id);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- prospects
-- ============================================================

CREATE TABLE prospects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) NOT NULL,
  url           TEXT NOT NULL,
  domain        TEXT NOT NULL,
  company_name  TEXT,
  industry      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_prospects_org_id ON prospects(org_id);
CREATE INDEX idx_prospects_domain ON prospects(domain);

CREATE TRIGGER trg_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- scans
-- ============================================================

CREATE TABLE scans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID REFERENCES organizations(id) NOT NULL,
  prospect_id       UUID REFERENCES prospects(id) NOT NULL,
  submitted_by      UUID REFERENCES users(id),
  status            TEXT CHECK (status IN ('queued', 'running', 'synthesizing', 'completed', 'failed', 'partial')) DEFAULT 'queued',
  phase             TEXT CHECK (phase IN ('foundation', 'enrichment', 'email_monitoring', 'synthesis', 'done')),
  progress          INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  error_message     TEXT,
  cost_usd          NUMERIC(10,4) DEFAULT 0,
  report_ready      BOOLEAN DEFAULT FALSE,
  email_report_ready BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_scans_org_id ON scans(org_id);
CREATE INDEX idx_scans_prospect_id ON scans(prospect_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

CREATE TRIGGER trg_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- primitive_results
-- ============================================================

CREATE TABLE primitive_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id             UUID REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  primitive           TEXT CHECK (primitive IN (
                        'traffic_analysis', 'website_cro', 'tracking_analytics',
                        'meta_ads', 'google_ads', 'email_analysis',
                        'competitor_context', 'company_enrichment'
                      )) NOT NULL,
  status              TEXT CHECK (status IN ('pending', 'running', 'success', 'error', 'timeout', 'skipped')) DEFAULT 'pending',
  data                JSONB DEFAULT '{}',
  confidence          NUMERIC(3,2) DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  confidence_factors  TEXT[] DEFAULT '{}',
  reasoning           TEXT,
  model_used          TEXT,
  tokens_used         INTEGER DEFAULT 0,
  cost_usd            NUMERIC(10,4) DEFAULT 0,
  duration_ms         INTEGER,
  error_message       TEXT,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_primitive_results_scan_id ON primitive_results(scan_id);
CREATE INDEX idx_primitive_results_status ON primitive_results(status);

ALTER TABLE primitive_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- screenshots
-- ============================================================

CREATE TABLE screenshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         UUID REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  storage_path    TEXT NOT NULL,
  label           TEXT NOT NULL,
  device_type     TEXT CHECK (device_type IN ('desktop', 'mobile')) NOT NULL,
  viewport_width  INTEGER,
  viewport_height INTEGER,
  page_url        TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_screenshots_scan_id ON screenshots(scan_id);

ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- reports
-- ============================================================

CREATE TABLE reports (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id                   UUID REFERENCES scans(id) ON DELETE CASCADE UNIQUE NOT NULL,
  org_id                    UUID REFERENCES organizations(id) NOT NULL,
  biggest_problem           TEXT,
  biggest_problem_category  TEXT,
  outreach_message          TEXT,
  loom_script               JSONB,
  ranked_problems           JSONB,
  synthesis_model           TEXT,
  synthesis_tokens          INTEGER,
  synthesis_cost_usd        NUMERIC(10,4),
  version                   INTEGER DEFAULT 1,
  created_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reports_scan_id ON reports(scan_id);
CREATE INDEX idx_reports_org_id ON reports(org_id);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- email_monitoring
-- ============================================================

CREATE TABLE email_monitoring (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id                 UUID REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  inbox_id                TEXT,
  inbox_email             TEXT,
  signup_status           TEXT CHECK (signup_status IN ('pending', 'form_found', 'signed_up', 'failed', 'no_form')) DEFAULT 'pending',
  signup_url              TEXT,
  email_platform_detected TEXT,
  emails_received         INTEGER DEFAULT 0,
  last_checked_at         TIMESTAMPTZ,
  monitoring_until        TIMESTAMPTZ,
  analysis                JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_email_monitoring_scan_id ON email_monitoring(scan_id);

CREATE TRIGGER trg_email_monitoring_updated_at
  BEFORE UPDATE ON email_monitoring
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE email_monitoring ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- activity_log
-- ============================================================

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id) NOT NULL,
  user_id     UUID REFERENCES users(id),
  scan_id     UUID REFERENCES scans(id),
  action      TEXT NOT NULL,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_activity_log_org_id ON activity_log(org_id);
CREATE INDEX idx_activity_log_scan_id ON activity_log(scan_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
