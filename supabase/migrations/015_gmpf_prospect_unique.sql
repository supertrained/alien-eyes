-- Add unique constraint on (org_id, domain) to prevent duplicate prospects
-- Use a partial unique index to handle the race condition in scan creation
ALTER TABLE prospects ADD CONSTRAINT prospects_org_domain_unique UNIQUE (org_id, domain);
