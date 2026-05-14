-- Scan opt-out registry: domains that have requested not to be scanned.

CREATE TABLE IF NOT EXISTS scan_optouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by_email TEXT,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_scan_optouts_domain ON scan_optouts (domain);
