-- Share tokens for public report links
CREATE TABLE share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT share_tokens_token_unique UNIQUE (token)
);

-- Index for fast token lookups
CREATE INDEX idx_share_tokens_token ON share_tokens(token);

-- RLS: anyone can read share_tokens by token (public route)
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Public read access via token (no auth required)
CREATE POLICY "share_tokens_public_read" ON share_tokens
  FOR SELECT USING (expires_at > now());

-- Only service role can insert/delete
CREATE POLICY "share_tokens_service_insert" ON share_tokens
  FOR INSERT WITH CHECK (true);
