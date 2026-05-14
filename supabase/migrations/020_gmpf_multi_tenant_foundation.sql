-- 017_multi_tenant_foundation.sql
-- Multi-tenant agency architecture: per-org API keys, share_tokens.org_id, domain_cache.contributing_org_id

BEGIN;

-- ============================================================
-- 1a. org_api_keys — Per-org API key management
-- Named org_api_keys (not api_keys) to avoid collision with AEB's tables
-- ============================================================

CREATE TABLE org_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,        -- first 8 chars (e.g. "gmpf_dk3a")
  name TEXT NOT NULL DEFAULT 'Default',
  scopes TEXT[] DEFAULT '{agency:read,agency:write}',
  rate_limit_per_hour INT DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_org_api_keys_prefix ON org_api_keys(key_prefix) WHERE revoked_at IS NULL;
CREATE INDEX idx_org_api_keys_org ON org_api_keys(org_id);

ALTER TABLE org_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read their own org's keys
CREATE POLICY "org_api_keys_read" ON org_api_keys
  FOR SELECT USING (org_id = auth_org_id());

-- Service role can do everything (workers + API routes use service role)
CREATE POLICY "org_api_keys_service_all" ON org_api_keys
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 1b. Add org_id to share_tokens
-- ============================================================

ALTER TABLE share_tokens ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Backfill from scans table
UPDATE share_tokens SET org_id = s.org_id FROM scans s WHERE share_tokens.scan_id = s.id;

-- Make NOT NULL after backfill
ALTER TABLE share_tokens ALTER COLUMN org_id SET NOT NULL;

-- Index for org-scoped queries
CREATE INDEX idx_share_tokens_org ON share_tokens(org_id);

-- ============================================================
-- 1c. Add contributing_org_id to domain_cache (GDPR erasure only)
-- ============================================================

ALTER TABLE domain_cache ADD COLUMN contributing_org_id UUID REFERENCES organizations(id);

COMMIT;
