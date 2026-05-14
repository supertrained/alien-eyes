BEGIN;

CREATE TABLE IF NOT EXISTS domain_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  primitive TEXT NOT NULL,
  data JSONB NOT NULL,
  confidence NUMERIC(4,3) DEFAULT 0,
  confidence_factors TEXT[] DEFAULT '{}',
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  duration_ms INTEGER,
  cached_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(domain, primitive)
);

-- No partial predicate — now() is not IMMUTABLE
CREATE INDEX idx_domain_cache_lookup ON domain_cache(domain, primitive);
CREATE INDEX idx_domain_cache_expiry ON domain_cache(expires_at);

-- RLS: service role only (workers access via service role key)
ALTER TABLE domain_cache ENABLE ROW LEVEL SECURITY;

COMMIT;
