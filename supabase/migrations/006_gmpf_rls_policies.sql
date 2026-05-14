-- 002_rls_policies.sql
-- Row Level Security policies for multi-tenant isolation
-- All user-facing queries go through org_id scoping.
-- Service role (workers) bypasses RLS automatically.

-- ============================================================
-- Helper: get the current user's org_id from the users table
-- ============================================================

CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- organizations
-- ============================================================

CREATE POLICY "Users can read their own organization"
  ON organizations FOR SELECT
  USING (id = auth_org_id());

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (id = auth_org_id())
  WITH CHECK (id = auth_org_id());

-- ============================================================
-- users
-- ============================================================

CREATE POLICY "Users can read members of their organization"
  ON users FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- prospects
-- ============================================================

CREATE POLICY "Users can read prospects in their org"
  ON prospects FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Users can create prospects in their org"
  ON prospects FOR INSERT
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Users can update prospects in their org"
  ON prospects FOR UPDATE
  USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Users can delete prospects in their org"
  ON prospects FOR DELETE
  USING (org_id = auth_org_id());

-- ============================================================
-- scans
-- ============================================================

CREATE POLICY "Users can read scans in their org"
  ON scans FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Users can create scans in their org"
  ON scans FOR INSERT
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Users can update scans in their org"
  ON scans FOR UPDATE
  USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());

CREATE POLICY "Users can delete scans in their org"
  ON scans FOR DELETE
  USING (org_id = auth_org_id());

-- ============================================================
-- primitive_results (access via scan -> org_id join)
-- ============================================================

CREATE POLICY "Users can read primitive results for their org scans"
  ON primitive_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = primitive_results.scan_id
        AND scans.org_id = auth_org_id()
    )
  );

-- ============================================================
-- screenshots (access via scan -> org_id join)
-- ============================================================

CREATE POLICY "Users can read screenshots for their org scans"
  ON screenshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = screenshots.scan_id
        AND scans.org_id = auth_org_id()
    )
  );

-- ============================================================
-- reports (scoped to org_id)
-- ============================================================

CREATE POLICY "Users can read reports in their org"
  ON reports FOR SELECT
  USING (org_id = auth_org_id());

-- ============================================================
-- email_monitoring (access via scan -> org_id join)
-- ============================================================

CREATE POLICY "Users can read email monitoring for their org scans"
  ON email_monitoring FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = email_monitoring.scan_id
        AND scans.org_id = auth_org_id()
    )
  );

-- ============================================================
-- activity_log (scoped to org_id)
-- ============================================================

CREATE POLICY "Users can read activity log in their org"
  ON activity_log FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Users can insert activity log in their org"
  ON activity_log FOR INSERT
  WITH CHECK (org_id = auth_org_id());
