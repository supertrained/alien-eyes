# Alien Eyes — Database Schema Specification

> Version: 1.0 | Date: 2026-03-10
> Database: Supabase (PostgreSQL)
> Purpose: Define all tables, relationships, indexes, and RLS policies before any code is written.

---

## Schema Overview

```
users ──< audits ──< findings
                 ──< primitive_results
                 ──< crawl_results
                 ──< reports

patterns (anonymized, cross-product)
api_keys ──< users
```

---

## Tables

### 1. users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email',  -- 'email', 'github'
  plan TEXT NOT NULL DEFAULT 'free',            -- 'free', 'starter', 'monthly', 'professional', 'enterprise'
  ownership_verified_domains TEXT[] DEFAULT '{}', -- domains verified via DNS TXT/meta tag
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

### 2. api_keys

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,                      -- SHA-256 hash of API key (never store plaintext)
  key_prefix TEXT NOT NULL,                    -- First 8 chars for identification (e.g., "ae_live_ab")
  name TEXT NOT NULL DEFAULT 'Default',        -- User-assigned name
  permissions TEXT[] NOT NULL DEFAULT '{read,audit}', -- 'read', 'audit', 're-audit'
  last_used_at TIMESTAMPTZ,
  rate_limit_per_hour INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ                       -- Optional expiration
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
```

### 3. audits

The central table. One row per audit request.

```sql
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),           -- NULL for anonymous Quick Checks
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,                 -- URL after normalization (lowercase, strip trailing slash, etc.)
  domain TEXT NOT NULL,                         -- Extracted domain for grouping

  -- Audit configuration
  tier TEXT NOT NULL DEFAULT 'quick_check',     -- 'quick_check', 'full_audit'
  methodology_version TEXT NOT NULL DEFAULT 'v0.1',
  ownership_verified BOOLEAN NOT NULL DEFAULT false,
  page_limit INT NOT NULL DEFAULT 30,
  cost_budget NUMERIC(6,2) NOT NULL DEFAULT 5.00,
  targeted_dimensions TEXT[] DEFAULT NULL,      -- NULL = all dimensions

  -- Re-audit tracking
  is_re_audit BOOLEAN NOT NULL DEFAULT false,
  previous_audit_id UUID REFERENCES audits(id),

  -- Status and progress
  status TEXT NOT NULL DEFAULT 'pending',
  -- States: pending, validating, crawling, extracting, auditing, synthesizing, rendering, complete, error, timeout
  progress NUMERIC(3,2) DEFAULT 0,             -- 0.00 to 1.00
  current_phase TEXT,                          -- Human-readable phase name
  error_message TEXT,

  -- Results (populated on completion)
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

  -- Cost tracking
  total_cost_usd NUMERIC(6,4) DEFAULT 0,
  cost_by_primitive JSONB DEFAULT '{}',

  -- Detected stack
  detected_stack TEXT[] DEFAULT '{}',

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Privacy
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug TEXT UNIQUE                       -- Short URL for sharing (if published)
);

-- Indexes
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_url ON audits(normalized_url);
CREATE INDEX idx_audits_domain ON audits(domain);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_audits_previous ON audits(previous_audit_id) WHERE is_re_audit = true;
```

### 4. crawl_results

One per audit. Stores crawl output. Raw data deleted within 24 hours.

```sql
CREATE TABLE crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,

  -- Summary data (kept permanently)
  pages_crawled INT NOT NULL DEFAULT 0,
  pages_discovered INT NOT NULL DEFAULT 0,
  pages_skipped INT NOT NULL DEFAULT 0,
  total_duration_ms INT NOT NULL DEFAULT 0,
  robots_txt_status TEXT NOT NULL DEFAULT 'not_found',
  detected_stack TEXT[] DEFAULT '{}',

  -- Raw data (deleted within 24h — see privacy policy)
  -- Stored in Supabase Storage, referenced by path
  raw_data_storage_path TEXT,                  -- Path to full CrawlResult JSON in storage
  raw_data_expires_at TIMESTAMPTZ,             -- When raw data should be deleted

  -- Page summaries (kept permanently — these are the compressed representations)
  page_summaries JSONB NOT NULL DEFAULT '[]',  -- Array of PageSummary objects

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_crawl_results_audit_id ON crawl_results(audit_id);
```

### 5. primitive_results

One per primitive per audit. Stores the Envelope output.

```sql
CREATE TABLE primitive_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  primitive_name TEXT NOT NULL,                 -- 'seo', 'accessibility', 'security', etc.
  dimension TEXT NOT NULL,                     -- AuditDimension

  -- Envelope data
  status TEXT NOT NULL,                        -- 'success', 'error', 'timeout'
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  confidence_factors TEXT[] DEFAULT '{}',
  reasoning TEXT,

  -- Cost/performance
  model TEXT,
  tokens_used INT DEFAULT 0,
  cost_usd NUMERIC(6,4) DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  methodology_version TEXT NOT NULL DEFAULT 'v0.1',

  -- Finding count from this primitive
  finding_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(audit_id, primitive_name)
);

-- Indexes
CREATE INDEX idx_primitive_results_audit_id ON primitive_results(audit_id);
CREATE INDEX idx_primitive_results_primitive ON primitive_results(primitive_name);
```

### 6. findings

One per finding per audit. The most queried table.

```sql
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  primitive_name TEXT NOT NULL,
  finding_id TEXT NOT NULL,                    -- Logical ID within the audit (e.g., "seo-001")

  -- Finding content (the 7 ingredients)
  what TEXT NOT NULL,
  where_found TEXT NOT NULL,                   -- 'where' is a SQL keyword, so using where_found
  expected TEXT NOT NULL,
  why TEXT NOT NULL,
  verify TEXT NOT NULL,
  severity TEXT NOT NULL,                      -- 'critical', 'high', 'medium', 'low'
  dimension TEXT NOT NULL,

  -- Relationships
  causal_chain TEXT[] DEFAULT '{}',            -- IDs of related findings
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  requires_human_judgment BOOLEAN DEFAULT false,
  human_judgment_reason TEXT,

  -- Evidence bundle
  evidence JSONB NOT NULL DEFAULT '{}',        -- EvidenceBundle as JSON

  -- Lifecycle
  lifecycle_state TEXT NOT NULL DEFAULT 'detected',
  lifecycle_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lifecycle_updated_by TEXT,
  lifecycle_reason TEXT,
  lifecycle_platform TEXT,                     -- For platform-limited findings
  lifecycle_third_party TEXT,                  -- For third-party findings

  -- Delta tracking (for re-audits)
  delta_status TEXT,                           -- 'new', 'fixed', 'regressed', 'unchanged' (set during re-audit)
  matched_previous_finding_id UUID,            -- Links to the finding in previous audit

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(audit_id, finding_id)
);

-- Indexes
CREATE INDEX idx_findings_audit_id ON findings(audit_id);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_dimension ON findings(dimension);
CREATE INDEX idx_findings_lifecycle ON findings(lifecycle_state);
CREATE INDEX idx_findings_domain ON findings(audit_id, dimension);
```

### 7. reports

Rendered reports. One per format per audit.

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  format TEXT NOT NULL,                        -- 'format-a', 'format-b', 'format-c', 'format-json', 'pdf'
  content TEXT NOT NULL,                       -- Rendered content (HTML, text, JSON)
  content_hash TEXT NOT NULL,                  -- SHA-256 for cache invalidation

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(audit_id, format)
);

-- Index
CREATE INDEX idx_reports_audit_id ON reports(audit_id);
```

### 8. patterns

Anonymized, cross-product pattern database. The data moat.

```sql
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_hash TEXT NOT NULL,                  -- Hash of (what + dimension + severity) for dedup
  dimension TEXT NOT NULL,
  severity TEXT NOT NULL,
  what_template TEXT NOT NULL,                 -- Anonymized finding description (URLs removed)
  stack_tags TEXT[] DEFAULT '{}',              -- Technology stack tags (e.g., ['next.js', 'react', 'tailwind'])
  frequency INT NOT NULL DEFAULT 1,           -- How many times this pattern has been seen
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(finding_hash)
);

-- Indexes
CREATE INDEX idx_patterns_dimension ON patterns(dimension);
CREATE INDEX idx_patterns_stack ON patterns USING gin(stack_tags);
CREATE INDEX idx_patterns_frequency ON patterns(frequency DESC);
```

### 9. false_positive_reports

Tracks builder disputes for methodology calibration.

```sql
CREATE TABLE false_positive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  reason TEXT NOT NULL,                        -- 'working_correctly', 'intentional_design', 'platform_limitation', 'stale_test_data', 'other'
  detail TEXT,                                 -- Free-text explanation
  primitive_name TEXT NOT NULL,

  -- Resolution
  resolution TEXT,                             -- 'confirmed_fp', 'upheld_finding', 'under_review'
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fp_reports_finding ON false_positive_reports(finding_id);
CREATE INDEX idx_fp_reports_primitive ON false_positive_reports(primitive_name);
CREATE INDEX idx_fp_reports_reason ON false_positive_reports(reason);
```

### 10. scheduled_audits

For continuous monitoring subscribers.

```sql
CREATE TABLE scheduled_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Schedule
  frequency TEXT NOT NULL DEFAULT 'weekly',    -- 'daily', 'weekly', 'biweekly', 'monthly'
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  last_audit_id UUID REFERENCES audits(id),

  -- Configuration
  tier TEXT NOT NULL DEFAULT 'full_audit',
  targeted_dimensions TEXT[],
  notify_on TEXT NOT NULL DEFAULT 'regression', -- 'always', 'regression', 'critical', 'never'
  notification_email TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scheduled_next_run ON scheduled_audits(next_run_at) WHERE is_active = true;
CREATE INDEX idx_scheduled_user ON scheduled_audits(user_id);
```

---

## Row Level Security (RLS)

```sql
-- Users can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own ON users FOR ALL USING (auth.uid() = id);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY audits_own ON audits FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
-- Anonymous Quick Checks (user_id IS NULL) are readable by the session that created them (tracked via JWT)

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY findings_own ON findings FOR ALL
  USING (audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL));

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_own ON reports FOR ALL
  USING (audit_id IN (SELECT id FROM audits WHERE user_id = auth.uid() OR user_id IS NULL));

-- Public audits are readable by anyone
CREATE POLICY audits_public ON audits FOR SELECT
  USING (is_public = true);

CREATE POLICY findings_public ON findings FOR SELECT
  USING (audit_id IN (SELECT id FROM audits WHERE is_public = true));

-- Patterns table is globally readable (anonymized data)
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY patterns_public ON patterns FOR SELECT USING (true);

-- API keys: users can only manage their own
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_keys_own ON api_keys FOR ALL USING (user_id = auth.uid());

-- False positive reports: users can only create for their own audits
ALTER TABLE false_positive_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY fp_reports_own ON false_positive_reports FOR ALL USING (user_id = auth.uid());

-- Scheduled audits: users can only manage their own
ALTER TABLE scheduled_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduled_own ON scheduled_audits FOR ALL USING (user_id = auth.uid());
```

---

## Storage Buckets

```
crawl-screenshots/
  ├── {audit_id}/
  │   ├── {page_url_hash}_desktop.png
  │   └── {page_url_hash}_mobile.png
  └── (auto-delete after 24h via lifecycle policy)

crawl-raw/
  ├── {audit_id}/
  │   └── crawl-result.json.gz
  └── (auto-delete after 24h via lifecycle policy)
```

---

## Data Retention Policy

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| User accounts | Until deletion requested | Standard |
| Audit metadata (scores, timing, config) | Indefinite | Trend tracking |
| Findings (all fields) | Indefinite | Historical comparison, pattern database |
| Reports (rendered content) | Indefinite | Re-download |
| Page summaries | Indefinite | Re-audit comparison |
| Raw crawl data (HTML, screenshots) | **24 hours** | Privacy: contains PII (forms, console logs) |
| Patterns (anonymized) | Indefinite | Data moat |
| False positive reports | Indefinite | Calibration data |

---

## Migration File

The initial migration (`supabase/migrations/001_initial.sql`) should create all tables above in dependency order:
1. users
2. api_keys
3. audits
4. crawl_results
5. primitive_results
6. findings
7. reports
8. patterns
9. false_positive_reports
10. scheduled_audits
11. RLS policies
12. Indexes
