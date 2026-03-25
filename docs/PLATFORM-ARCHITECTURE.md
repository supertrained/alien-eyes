# Alien Eyes — Platform Architecture Specification

> Version: 1.0 | Date: 2026-03-11
> Status: DESIGNED. Expert panel output. Implementation-ready.
> Panel: 8 specialists, 8 domains. Covers everything AROUND the core audit pipeline.
> Depends on: TYPE-SPEC.md (frozen types), SCHEMA.md (base schema), METHODOLOGY-v0.1.md, SCENARIO-GRAMMAR.md, ADR.md
> Scope: Enterprise features, continuous monitoring, persona implementation, methodology evolution, CI/CD integration, badge/certification, cross-product pattern database, scenario grammar v2.0

---

## Table of Contents

1. [Expert 1: Enterprise Platform (Victoria Chen)](#expert-1-enterprise-platform)
2. [Expert 2: Continuous Monitoring (Dr. Marcus Webb)](#expert-2-continuous-monitoring)
3. [Expert 3: CI/CD Integration (Ravi Patel)](#expert-3-cicd-integration)
4. [Expert 4: Persona System Implementation (Dr. Anna Kowalski)](#expert-4-persona-system-implementation)
5. [Expert 5: Methodology Evolution (Professor David Chang)](#expert-5-methodology-evolution)
6. [Expert 6: Scenario Grammar v2.0 (Miyuki Suzuki)](#expert-6-scenario-grammar-v20)
7. [Expert 7: Badge & Certification System (James Moreau)](#expert-7-badge--certification-system)
8. [Expert 8: Cross-Product Pattern Database (Dr. Sophia Torres)](#expert-8-cross-product-pattern-database)
9. [Cross-Panel Synthesis](#cross-panel-synthesis)

---

## Expert 1: Enterprise Platform

**Victoria Chen — Enterprise SaaS Platform Architect**
*Built multi-tenant SaaS at Datadog, Snowflake. Deep expertise in SSO/SAML, RBAC, audit trails, compliance, tenant isolation.*

### 1.1 Feature Specification

#### Purpose

Transform Alien Eyes from a single-user tool into a team-ready, enterprise-grade platform. Enterprise customers need: team accounts with role-based access, SSO integration, audit trails for compliance, custom audit configurations, white-label reports, data residency controls, and SLA guarantees.

#### User Stories

**US-ENT-1: Team Account Creation [P2]**
> As an **engineering manager**, I want to **create a team account and invite my engineers** so that **we can share audit history and coordinate quality across our product portfolio**.

**US-ENT-2: Role-Based Access [P2]**
> As a **team admin**, I want to **assign roles (admin, auditor, viewer)** so that **interns can view results but not trigger paid audits**.

**US-ENT-3: SSO Login [P3]**
> As an **enterprise IT admin**, I want to **require SSO (SAML/OIDC) for all team members** so that **access is governed by our identity provider and offboarding is automatic**.

**US-ENT-4: Audit Trail [P3]**
> As a **compliance officer**, I want to **see who ran which audits, who viewed results, and who disputed findings** so that **we can demonstrate due diligence in our SOC 2 audit**.

**US-ENT-5: Custom Dimensions [P3]**
> As a **platform team lead**, I want to **configure custom audit dimensions and thresholds per project** so that **our internal standards are enforced across all team projects**.

**US-ENT-6: White-Label Reports [P3]**
> As a **agency owner**, I want to **generate audit reports with my branding** so that **I can deliver professional reports to clients under my own brand**.

**US-ENT-7: Data Residency [P3]**
> As a **EU-based enterprise**, I want to **ensure all audit data stays in EU regions** so that **we comply with GDPR data residency requirements**.

**US-ENT-8: Dedicated Worker Pool [P3]**
> As an **enterprise with SLA requirements**, I want **dedicated audit workers** so that **my audits are not queued behind free-tier users and I get guaranteed throughput**.

#### Data Model

##### Organizations (Teams)

```
Organization
├── id: UUID
├── name: string
├── slug: string (unique, URL-safe)
├── plan: 'team' | 'enterprise'
├── sso_config?: SSOConfig
├── branding?: WhiteLabelConfig
├── data_residency: 'us' | 'eu' | 'ap'
├── custom_dimensions?: CustomDimensionConfig[]
├── worker_pool: 'shared' | 'dedicated'
├── sla_tier?: 'standard' | 'priority' | 'critical'
├── max_seats: number
├── created_at: timestamp
└── updated_at: timestamp

Membership
├── id: UUID
├── org_id: UUID → Organization
├── user_id: UUID → users
├── role: 'owner' | 'admin' | 'auditor' | 'viewer'
├── invited_by: UUID → users
├── accepted_at?: timestamp
├── created_at: timestamp
└── updated_at: timestamp

AuditTrailEntry
├── id: UUID
├── org_id: UUID → Organization
├── actor_id: UUID → users
├── action: AuditTrailAction
├── resource_type: 'audit' | 'finding' | 'report' | 'member' | 'config' | 'api_key'
├── resource_id: UUID
├── metadata: JSONB (action-specific details)
├── ip_address: string
├── user_agent: string
├── created_at: timestamp
└── (NO updated_at — audit trail entries are immutable)

SSOConfig
├── provider: 'saml' | 'oidc'
├── entity_id: string
├── sso_url: string
├── certificate: string (encrypted at rest)
├── attribute_mapping: { email: string, name: string, groups?: string }
├── enforce: boolean (if true, password login disabled)
└── auto_provision: boolean (create user on first SSO login)

WhiteLabelConfig
├── logo_url: string
├── primary_color: string (hex)
├── company_name: string
├── report_footer?: string
├── custom_domain?: string
└── hide_alien_eyes_branding: boolean

CustomDimensionConfig
├── dimension: AuditDimension
├── enabled: boolean
├── custom_thresholds?: Record<string, number>
├── custom_severity_overrides?: Record<string, Severity>
└── weight_override?: number
```

##### Audit Trail Actions

```typescript
type AuditTrailAction =
  | 'audit.created'
  | 'audit.viewed'
  | 'audit.published'
  | 'audit.deleted'
  | 'finding.disputed'
  | 'finding.accepted'
  | 'report.generated'
  | 'report.downloaded'
  | 'report.shared'
  | 'member.invited'
  | 'member.role_changed'
  | 'member.removed'
  | 'config.updated'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'sso.configured'
  | 'sso.login'
  | 'billing.plan_changed';
```

#### API Endpoints

```
POST   /api/orgs                          Create organization
GET    /api/orgs/:slug                    Get organization details
PATCH  /api/orgs/:slug                    Update organization settings
DELETE /api/orgs/:slug                    Delete organization (admin only)

POST   /api/orgs/:slug/members            Invite member
GET    /api/orgs/:slug/members            List members
PATCH  /api/orgs/:slug/members/:id        Change member role
DELETE /api/orgs/:slug/members/:id        Remove member

GET    /api/orgs/:slug/audit-trail        Query audit trail (filterable)
GET    /api/orgs/:slug/audit-trail/export Export audit trail (CSV/JSON)

POST   /api/orgs/:slug/sso                Configure SSO
GET    /api/orgs/:slug/sso                Get SSO config
DELETE /api/orgs/:slug/sso                Remove SSO

PATCH  /api/orgs/:slug/branding           Update white-label config
GET    /api/orgs/:slug/branding           Get white-label config

GET    /api/orgs/:slug/audits             List all org audits (aggregated)
GET    /api/orgs/:slug/dashboard          Org-level dashboard (scores, trends)
```

#### Key Algorithms

**Role Permission Matrix:**

```
                    owner  admin  auditor  viewer
create_audit         ✓      ✓       ✓       ✗
view_audit           ✓      ✓       ✓       ✓
dispute_finding      ✓      ✓       ✓       ✗
publish_report       ✓      ✓       ✗       ✗
invite_member        ✓      ✓       ✗       ✗
change_role          ✓      ✓*      ✗       ✗
remove_member        ✓      ✓*      ✗       ✗
configure_sso        ✓      ✗       ✗       ✗
update_branding      ✓      ✓       ✗       ✗
view_audit_trail     ✓      ✓       ✗       ✗
manage_billing       ✓      ✗       ✗       ✗
delete_org           ✓      ✗       ✗       ✗

* admin cannot change owner role or remove owner
```

**Tenant Isolation via RLS:**

```sql
-- All org-scoped queries filter by org_id
-- RLS policy: user can see data only for orgs they belong to
CREATE POLICY org_member_access ON audits
  FOR ALL USING (
    org_id IS NULL AND user_id = auth.uid()  -- personal audits
    OR org_id IN (
      SELECT org_id FROM memberships WHERE user_id = auth.uid()
    )
  );
```

**Dedicated Worker Pool Routing:**

```pseudocode
function routeAuditJob(audit):
  org = getOrganization(audit.org_id)
  if org and org.worker_pool == 'dedicated':
    queue = `audit-jobs:org:${org.id}`  // dedicated BullMQ queue
  else:
    queue = 'audit-jobs:shared'         // shared queue
  enqueue(queue, audit)
```

#### Edge Cases

1. **Ownership transfer**: When the sole owner leaves, block deletion until ownership is transferred. Never allow an org with zero owners.
2. **SSO enforcement + emergency access**: If SSO is enforced and the IdP goes down, the org owner can use a one-time recovery code (generated at SSO setup time) to bypass SSO temporarily. Recovery codes are single-use and logged in audit trail.
3. **Cross-org audits**: A user in multiple orgs sees audits scoped to each org separately. Personal (non-org) audits are never visible to org members.
4. **Billing on seat changes**: Adding seats mid-cycle is prorated. Removing seats takes effect at next billing cycle. Downgrade below current seat count is blocked until members are removed.
5. **Data residency migration**: Changing data residency region requires explicit confirmation and triggers an async migration job. Audits in progress are completed in the current region.

#### Security Considerations

- SSO certificates encrypted at rest (AES-256) in a separate secrets table, not in the main org record.
- Audit trail entries are append-only. No UPDATE or DELETE on the audit_trail table. Retention: 7 years for enterprise, 1 year for team.
- API keys inherit the creating user's role permissions. An auditor's API key cannot publish reports.
- White-label custom domains require DNS verification (CNAME to alieneyes.dev subdomain).
- SCIM provisioning (user lifecycle management) deferred to Phase 4. Manual member management for initial enterprise launch.

### 1.2 Type Extensions

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'team' | 'enterprise';
  ssoConfig?: SSOConfig;
  branding?: WhiteLabelConfig;
  dataResidency: 'us' | 'eu' | 'ap';
  customDimensions?: CustomDimensionConfig[];
  workerPool: 'shared' | 'dedicated';
  slaTier?: 'standard' | 'priority' | 'critical';
  maxSeats: number;
  createdAt: string;
  updatedAt: string;
}

interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: 'owner' | 'admin' | 'auditor' | 'viewer';
  invitedBy: string;
  acceptedAt?: string;
  createdAt: string;
}

interface AuditTrailEntry {
  id: string;
  orgId: string;
  actorId: string;
  action: AuditTrailAction;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface SSOConfig {
  provider: 'saml' | 'oidc';
  entityId: string;
  ssoUrl: string;
  certificate: string;
  attributeMapping: { email: string; name: string; groups?: string };
  enforce: boolean;
  autoProvision: boolean;
}

interface WhiteLabelConfig {
  logoUrl: string;
  primaryColor: string;
  companyName: string;
  reportFooter?: string;
  customDomain?: string;
  hideAlienEyesBranding: boolean;
}

interface CustomDimensionConfig {
  dimension: AuditDimension;
  enabled: boolean;
  customThresholds?: Record<string, number>;
  customSeverityOverrides?: Record<string, 'critical' | 'high' | 'medium' | 'low'>;
  weightOverride?: number;
}

// Extension to existing AuditConfig
interface AuditConfig {
  // ... existing fields ...
  orgId?: string;
  customDimensions?: CustomDimensionConfig[];
  whiteLabel?: WhiteLabelConfig;
}

// Extension to existing audits — add org_id
interface AuditRecord {
  // ... existing fields ...
  orgId?: string;
}
```

### 1.3 Database Schema Extensions

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'team',
  sso_config JSONB,
  branding JSONB,
  data_residency TEXT NOT NULL DEFAULT 'us',
  custom_dimensions JSONB DEFAULT '[]',
  worker_pool TEXT NOT NULL DEFAULT 'shared',
  sla_tier TEXT,
  max_seats INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_orgs_slug ON organizations(slug);

-- Memberships
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_memberships_org ON memberships(org_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

-- Audit Trail (append-only)
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No UPDATE or DELETE policies on audit_trail
CREATE INDEX idx_audit_trail_org ON audit_trail(org_id);
CREATE INDEX idx_audit_trail_actor ON audit_trail(actor_id);
CREATE INDEX idx_audit_trail_action ON audit_trail(action);
CREATE INDEX idx_audit_trail_created ON audit_trail(created_at DESC);

-- SSO secrets (separate table, encrypted)
CREATE TABLE sso_secrets (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  encrypted_certificate TEXT NOT NULL,
  recovery_code_hash TEXT,
  recovery_code_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add org_id to audits table
ALTER TABLE audits ADD COLUMN org_id UUID REFERENCES organizations(id);
CREATE INDEX idx_audits_org ON audits(org_id) WHERE org_id IS NOT NULL;

-- RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_member ON organizations FOR ALL
  USING (id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid()));

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_member ON memberships FOR SELECT
  USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY membership_admin ON memberships FOR ALL
  USING (org_id IN (
    SELECT org_id FROM memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY trail_admin ON audit_trail FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
-- INSERT allowed for system only (service role key)
```

### 1.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-ENT-01 | Organizations table, memberships, RLS policies | Codex | 3 | WU-00 (schema) | Phase 3 |
| WU-ENT-02 | Invite/accept flow, role management API | Codex | 3 | WU-ENT-01 | Phase 3 |
| WU-ENT-03 | Audit trail table, append-only logging middleware | Opus | 3 | WU-ENT-01 | Phase 3 |
| WU-ENT-04 | SSO SAML integration (passport-saml or similar) | Opus | 5 | WU-ENT-01, WU-13 | Phase 3 |
| WU-ENT-05 | SSO OIDC integration | Opus | 3 | WU-ENT-04 | Phase 3 |
| WU-ENT-06 | White-label report rendering | Codex | 3 | WU-ENT-01, WU-04 | Phase 3 |
| WU-ENT-07 | Org dashboard UI (members, settings, audit trail) | Codex | 4 | WU-ENT-01-03 | Phase 3 |
| WU-ENT-08 | Dedicated worker pool routing | Opus | 2 | WU-ENT-01, WU-06 | Phase 4 |
| WU-ENT-09 | Data residency routing (region-aware storage) | Opus | 4 | WU-ENT-01 | Phase 4 |
| WU-ENT-10 | Custom dimension configuration UI | Codex | 3 | WU-ENT-01, WU-02 | Phase 4 |

**Total: 33 hours**

### 1.5 Acceptance Criteria

1. A user can create an organization, invite members by email, and members can accept and see shared audits.
2. Role permissions are enforced at API level — a viewer receives 403 when attempting to create an audit.
3. Every state-changing action on org resources produces an audit trail entry with actor, action, resource, timestamp, and IP.
4. SSO SAML login works with Okta and Azure AD (tested against both).
5. White-label reports render with custom logo, colors, and company name; "Alien Eyes" branding is suppressed when configured.
6. Audit trail entries cannot be modified or deleted via any API endpoint.
7. Org-scoped RLS prevents users from seeing audits belonging to other organizations.

### 1.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| SSO integration complexity (each IdP has quirks) | HIGH | Start with Okta + Azure AD only. Use battle-tested library (passport-saml). Budget 2x for SSO WUs. |
| Multi-tenancy RLS bugs leaking data between orgs | CRITICAL | Comprehensive RLS test suite. Every query tested with cross-org user. Penetration test before enterprise launch. |
| Audit trail storage growth | LOW | Partitioned by month. Archive after 1 year (team) / 7 years (enterprise). Estimated: ~1KB per entry, 100 entries/org/day = ~36MB/org/year. |
| White-label custom domain SSL | MEDIUM | Use Caddy or similar for automatic SSL provisioning. Rate-limit domain additions. |

---

## Expert 2: Continuous Monitoring

**Dr. Marcus Webb — Monitoring & Observability Platform Architect**
*Built monitoring at Grafana and PagerDuty. Expert in SLI/SLO, alerting logic, temporal data models.*

### 2.1 Feature Specification

#### Purpose

Transform Alien Eyes from episodic auditing ("run once, get results") into continuous monitoring ("always watching, alerts on regression"). Monitoring is a fundamentally different product from auditing: it produces temporal data, detects trends, and generates alerts based on thresholds rather than absolute findings.

#### How Monitoring Differs from Episodic Auditing

| Dimension | Episodic Audit | Continuous Monitoring |
|-----------|---------------|----------------------|
| Trigger | User-initiated | Scheduled (cron) |
| Value | "What's wrong now?" | "What changed since last time?" |
| Output | Findings list | Delta report + trend data |
| Scoring | Absolute score | Score trajectory (improving/degrading/stable) |
| Alerting | None | Threshold-based alerts |
| Data model | Point-in-time snapshot | Time series |
| Finding categories | severity-based | temporal: current_defect / emerging_risk / degradation_signal / resolved |
| Cost sensitivity | Per-audit pricing | Subscription (predictable cost) |

#### Temporal Finding Categories

Findings in monitoring mode carry a temporal classification in addition to severity:

```
current_defect     — Present now and was present in the previous audit. Persistent problem.
emerging_risk      — New finding that was NOT present in the previous audit. Something changed.
degradation_signal — Score in a dimension dropped by >5 points between consecutive audits.
                     Not a specific finding, but a trend signal.
resolved           — Finding was present in previous audit but is now absent. Something was fixed.
regression         — Finding was previously resolved but has returned. Fix was reverted or broken.
flapping           — Finding alternates between present/absent across 3+ consecutive audits.
                     Indicates non-determinism or environment-dependent behavior.
```

#### Health Score Model

Each monitored URL gets a **Health Score** that is a rolling composite:

```pseudocode
function calculateHealthScore(url, window = 4):
  // Get last N audits for this URL
  audits = getRecentAudits(url, count = window)
  if audits.length < 2:
    return { score: audits[0].satisfactionScore, trend: 'insufficient_data' }

  // Current score
  current = audits[0].satisfactionScore

  // Trend: linear regression over window
  slope = linearRegression(audits.map(a => a.satisfactionScore))
  trend = slope > 1.0 ? 'improving'
        : slope < -1.0 ? 'degrading'
        : 'stable'

  // Volatility: standard deviation of scores in window
  volatility = stddev(audits.map(a => a.satisfactionScore))

  // Regression count: findings that were fixed then returned
  regressions = countRegressions(audits)

  return {
    score: current,
    trend: trend,
    slope: slope,
    volatility: volatility,
    regressionCount: regressions,
    windowSize: audits.length,
    lastAuditAt: audits[0].timestamp
  }
```

#### SLI/SLO Framework

Builders can define SLOs (Service Level Objectives) on their audit dimensions:

```
SLO Example:
  "SEO score stays above 75"
  "Zero CRITICAL findings at all times"
  "Agent-nativeness score above 60"
  "No regressions persist for more than 2 scheduled audits"

SLI (Service Level Indicator):
  The actual measured value from each audit.

Error Budget:
  How much the SLI can deviate from the SLO before alerting.
  Example: SLO = "SEO > 75", error budget = 5 points.
  Alert fires when SEO drops below 70 (75 - 5).
```

#### Alerting Logic

```pseudocode
function evaluateAlerts(monitorConfig, latestAudit, previousAudit):
  alerts = []

  // 1. Threshold alerts (SLO violation)
  for slo in monitorConfig.slos:
    currentValue = getDimensionScore(latestAudit, slo.dimension)
    if currentValue < slo.threshold - slo.errorBudget:
      alerts.push({
        type: 'slo_violation',
        dimension: slo.dimension,
        threshold: slo.threshold,
        actual: currentValue,
        severity: currentValue < slo.threshold - (2 * slo.errorBudget) ? 'critical' : 'warning'
      })

  // 2. Regression alerts (finding returned)
  if previousAudit:
    regressions = findRegressions(latestAudit.findings, previousAudit.findings)
    if regressions.length > 0:
      alerts.push({
        type: 'regression',
        findings: regressions,
        severity: regressions.some(f => f.severity === 'critical') ? 'critical' : 'warning'
      })

  // 3. New critical finding alert
  newCriticals = latestAudit.findings.filter(f =>
    f.severity === 'critical' && f.delta_status === 'new'
  )
  if newCriticals.length > 0:
    alerts.push({
      type: 'new_critical',
      findings: newCriticals,
      severity: 'critical'
    })

  // 4. Score degradation alert (>10 point drop)
  if previousAudit:
    scoreDrop = previousAudit.satisfactionScore - latestAudit.satisfactionScore
    if scoreDrop > 10:
      alerts.push({
        type: 'score_degradation',
        previousScore: previousAudit.satisfactionScore,
        currentScore: latestAudit.satisfactionScore,
        drop: scoreDrop,
        severity: scoreDrop > 20 ? 'critical' : 'warning'
      })

  // 5. Flapping detection (3+ alternations)
  flapping = detectFlapping(monitorConfig.url, windowSize = 6)
  if flapping.length > 0:
    alerts.push({
      type: 'flapping',
      findings: flapping,
      severity: 'info'
    })

  return alerts
```

#### Alert Delivery Channels

```
email         — Delta report with alerts (default)
webhook       — POST to configured URL with alert payload (JSON)
slack         — Slack incoming webhook with formatted message
pagerduty     — PagerDuty events API for critical alerts (enterprise only)
```

#### Monitoring Dashboard Data

```
Per URL:
  ├── Health score (current + trend arrow)
  ├── Score sparkline (last 12 audits)
  ├── Active SLO status (green/yellow/red per SLO)
  ├── Finding count over time (stacked by severity)
  ├── Regression timeline (when things broke and when they were fixed)
  └── Time-to-fix tracking (how long findings persist before resolution)

Aggregate (org-level):
  ├── Portfolio health (all monitored URLs at a glance)
  ├── Worst-performing URLs
  ├── Most common finding patterns across portfolio
  └── SLO compliance rate across all URLs
```

#### Pricing

| Monitoring Tier | Price | What You Get |
|----------------|-------|-------------|
| Weekly (starter) | $12/mo per URL | Weekly full audit, email alerts, 90-day history |
| Daily (pro) | $39/mo per URL | Daily full audit, all alert channels, 1-year history, SLO config |
| Continuous (enterprise) | Custom | Custom frequency, PagerDuty, SLA, dedicated workers |
| Quick Check monitoring | $5/mo per URL | Weekly deterministic-only audit, email alerts |

**COGS analysis:** Weekly full audit = 4 audits/mo at ~$2.50 COGS = $10/mo COGS. $12/mo price gives thin margin. Daily = 30 audits/mo at ~$2.50 = $75/mo COGS vs $39/mo price = **negative margin**. Must use Quick Check (deterministic-only, ~$0.10 COGS) for daily monitoring and reserve Full Audit for weekly/monthly deep scans. Revised:

| Monitoring Tier | Price | Audit Type | Frequency | COGS/mo |
|----------------|-------|-----------|-----------|---------|
| Lite | $9/mo per URL | Quick Check | Weekly | ~$0.40 |
| Standard | $29/mo per URL | Quick Check daily + Full Audit weekly | 34/mo | ~$13.00 |
| Pro | $59/mo per URL | Quick Check daily + Full Audit weekly + SLO + all channels | 34/mo | ~$13.00 |
| Enterprise | Custom | Custom | Custom | Custom |

### 2.2 Type Extensions

```typescript
interface MonitorConfig {
  id: string;
  userId: string;
  orgId?: string;
  url: string;
  normalizedUrl: string;
  domain: string;

  // Schedule
  quickCheckFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'none';
  fullAuditFrequency: 'weekly' | 'biweekly' | 'monthly' | 'none';
  nextQuickCheckAt: string;
  nextFullAuditAt: string;

  // SLOs
  slos: SLODefinition[];

  // Alerting
  alertChannels: AlertChannel[];
  alertOnRegression: boolean;
  alertOnNewCritical: boolean;
  alertOnScoreDrop: number; // threshold in points (e.g., 10)

  // Audit config
  tier: 'quick_check' | 'full_audit';
  targetedDimensions?: AuditDimension[];
  methodologyVersion: string;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SLODefinition {
  id: string;
  dimension: AuditDimension | 'satisfaction' | 'human_native' | 'agent_nativeness';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  threshold: number;
  errorBudget: number;
}

interface AlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'pagerduty';
  config: Record<string, string>; // email: {address}, webhook: {url, secret}, etc.
  severityFilter: ('critical' | 'warning' | 'info')[];
}

interface HealthScore {
  url: string;
  score: number;
  trend: 'improving' | 'stable' | 'degrading' | 'insufficient_data';
  slope: number;
  volatility: number;
  regressionCount: number;
  windowSize: number;
  lastAuditAt: string;
  sloStatus: SLOStatus[];
}

interface SLOStatus {
  sloId: string;
  dimension: string;
  threshold: number;
  currentValue: number;
  status: 'met' | 'at_risk' | 'violated';
  violatedSince?: string;
}

type TemporalFindingCategory =
  | 'current_defect'
  | 'emerging_risk'
  | 'degradation_signal'
  | 'resolved'
  | 'regression'
  | 'flapping';

// Extension to Finding for monitoring context
interface MonitoringFindingContext {
  temporalCategory: TemporalFindingCategory;
  firstSeenAuditId: string;
  firstSeenAt: string;
  persistenceCount: number; // how many consecutive audits this has appeared in
  wasEverResolved: boolean;
  resolvedAt?: string;
  regressedAt?: string;
}

interface Alert {
  id: string;
  monitorId: string;
  auditId: string;
  type: 'slo_violation' | 'regression' | 'new_critical' | 'score_degradation' | 'flapping';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  details: Record<string, unknown>;
  deliveredVia: string[];
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
}
```

### 2.3 Database Schema Extensions

```sql
-- Monitor configurations (replaces/extends scheduled_audits)
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Schedule
  quick_check_frequency TEXT NOT NULL DEFAULT 'daily',
  full_audit_frequency TEXT NOT NULL DEFAULT 'weekly',
  next_quick_check_at TIMESTAMPTZ,
  next_full_audit_at TIMESTAMPTZ,

  -- SLOs
  slos JSONB NOT NULL DEFAULT '[]',

  -- Alerting
  alert_channels JSONB NOT NULL DEFAULT '[]',
  alert_on_regression BOOLEAN NOT NULL DEFAULT true,
  alert_on_new_critical BOOLEAN NOT NULL DEFAULT true,
  alert_on_score_drop INT NOT NULL DEFAULT 10,

  -- Config
  targeted_dimensions TEXT[],
  methodology_version TEXT NOT NULL DEFAULT 'v0.1',

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitors_user ON monitors(user_id);
CREATE INDEX idx_monitors_org ON monitors(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_monitors_next_qc ON monitors(next_quick_check_at) WHERE is_active = true;
CREATE INDEX idx_monitors_next_fa ON monitors(next_full_audit_at) WHERE is_active = true;
CREATE INDEX idx_monitors_url ON monitors(normalized_url);

-- Health score snapshots (materialized from audits)
CREATE TABLE health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id),
  score NUMERIC(5,2) NOT NULL,
  trend TEXT NOT NULL,
  slope NUMERIC(6,3),
  volatility NUMERIC(5,2),
  regression_count INT NOT NULL DEFAULT 0,
  slo_status JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_monitor ON health_snapshots(monitor_id, created_at DESC);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  delivered_via TEXT[] DEFAULT '{}',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_monitor ON alerts(monitor_id, created_at DESC);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_unacked ON alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

-- Finding temporal tracking
ALTER TABLE findings ADD COLUMN temporal_category TEXT;
ALTER TABLE findings ADD COLUMN first_seen_audit_id UUID REFERENCES audits(id);
ALTER TABLE findings ADD COLUMN first_seen_at TIMESTAMPTZ;
ALTER TABLE findings ADD COLUMN persistence_count INT DEFAULT 1;
ALTER TABLE findings ADD COLUMN was_ever_resolved BOOLEAN DEFAULT false;
ALTER TABLE findings ADD COLUMN resolved_at TIMESTAMPTZ;
ALTER TABLE findings ADD COLUMN regressed_at TIMESTAMPTZ;

-- Add monitor_id to audits
ALTER TABLE audits ADD COLUMN monitor_id UUID REFERENCES monitors(id);
CREATE INDEX idx_audits_monitor ON audits(monitor_id) WHERE monitor_id IS NOT NULL;

-- RLS
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY monitors_own ON monitors FOR ALL USING (user_id = auth.uid());
CREATE POLICY monitors_org ON monitors FOR ALL USING (
  org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY alerts_own ON alerts FOR SELECT USING (
  monitor_id IN (SELECT id FROM monitors WHERE user_id = auth.uid())
);
```

### 2.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-MON-01 | Monitors table, CRUD API, migration | Codex | 3 | WU-00 | Phase 2 |
| WU-MON-02 | Monitor scheduler (cron job that enqueues audits) | Opus | 3 | WU-MON-01, WU-06 | Phase 2 |
| WU-MON-03 | Health score calculation + snapshot storage | Opus | 3 | WU-MON-01 | Phase 2 |
| WU-MON-04 | Alert evaluation engine | Opus | 4 | WU-MON-03 | Phase 2 |
| WU-MON-05 | Alert delivery: email + webhook | Codex | 3 | WU-MON-04 | Phase 2 |
| WU-MON-06 | Alert delivery: Slack + PagerDuty | Codex | 2 | WU-MON-05 | Phase 3 |
| WU-MON-07 | Temporal finding tracking (persistence, flapping) | Opus | 4 | WU-MON-01, WU-16 | Phase 2 |
| WU-MON-08 | Monitoring dashboard UI (sparklines, SLO status, trend) | Codex | 5 | WU-MON-03, WU-MON-04 | Phase 3 |
| WU-MON-09 | SLO configuration UI | Codex | 3 | WU-MON-01 | Phase 3 |
| WU-MON-10 | Portfolio health view (org-level aggregate) | Codex | 3 | WU-MON-03, WU-ENT-01 | Phase 3 |

**Total: 33 hours**

### 2.5 Acceptance Criteria

1. A monitor configured for daily Quick Check + weekly Full Audit produces audits on schedule (within 5 minutes of scheduled time).
2. Health score reflects the rolling window (default 4 audits) and correctly identifies improving/stable/degrading trends.
3. SLO violations trigger alerts within 5 minutes of audit completion.
4. Regression detection correctly identifies findings that were resolved and then returned (matching by finding hash, not ID).
5. Flapping detection flags findings that alternate between present/absent across 3+ consecutive audits.
6. Email alerts contain a delta summary (new/fixed/regressed finding counts, score change, SLO status).
7. Webhook alerts deliver valid JSON matching the Alert type spec.
8. Alert acknowledgment is tracked with user and timestamp.

### 2.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Daily monitoring COGS exceeds subscription price | HIGH | Default to Quick Check for daily scans. Full Audit only weekly. COGS table above reflects this. |
| Finding matching across audits (is finding A in audit 1 the "same" as finding B in audit 2?) | HIGH | Match by `finding_hash = SHA256(what + where + dimension)`. Accept ~5% false mismatch rate. Refine with fuzzy matching in v2. |
| Scheduler reliability (missed audit windows) | MEDIUM | Use BullMQ repeatable jobs with Upstash Redis. Dead letter queue for failed scheduling. Health check endpoint for scheduler process. |
| Alert fatigue (too many alerts → users ignore them all) | MEDIUM | Default to regression + critical only. Provide "quiet hours" config. Aggregate alerts within 1-hour window. |
| Flapping findings causing noise | LOW | Flapping detection auto-mutes after 3 alternations. User can manually mute specific findings. |

---

## Expert 3: CI/CD Integration

**Ravi Patel — CI/CD Platform Engineer**
*Built GitHub Actions and GitLab CI integrations at multiple DevTool companies. Expert in PR checks, deterministic testing, threshold configuration.*

### 3.1 Feature Specification

#### Purpose

Enable developers to run Alien Eyes audits as part of their CI/CD pipeline, blocking merges on quality regressions and enforcing quality standards on every deploy. CI/CD mode must be deterministic (same code = same results), fast (< 3 minutes), and produce machine-readable output (SARIF, JUnit) that integrates with existing tooling.

#### How CI/CD Mode Differs from Interactive Mode

| Dimension | Interactive (Web/CLI) | CI/CD |
|-----------|----------------------|-------|
| Trigger | User-initiated | Commit/PR event |
| URL | Production URL | Staging/preview URL (dynamic) |
| Determinism | Probabilistic (different personas/scenarios each run) | Deterministic (seed-based, reproducible) |
| Output | Human-readable (Format B, dashboard) | Machine-readable (SARIF, JUnit, JSON) + PR comment |
| Scoring | Absolute score | Pass/fail against thresholds |
| Cost model | Per-audit pricing | Included in monthly/enterprise plan |
| Persona selection | Adaptive, probabilistic | Fixed seed, deterministic |
| Timeout | 5 minutes | Configurable (default: 3 minutes) |

#### GitHub Action Specification

**Action name:** `alien-eyes/audit-action`
**Marketplace:** GitHub Marketplace

**Usage:**

```yaml
# .github/workflows/alien-eyes.yml
name: Alien Eyes Audit
on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        uses: actions/wait-for-deployment@v1
        with:
          environment: preview

      - name: Run Alien Eyes Audit
        uses: alien-eyes/audit-action@v1
        with:
          # Required
          url: ${{ env.PREVIEW_URL }}
          api-key: ${{ secrets.ALIEN_EYES_API_KEY }}

          # Optional — mode
          mode: cloud              # 'cloud' (hosted) or 'local' (self-hosted Playwright)
          tier: quick_check        # 'quick_check' or 'full_audit'

          # Optional — thresholds (fail if ANY threshold is not met)
          min-satisfaction-score: 70
          min-seo-score: 60
          min-accessibility-score: 75
          min-performance-score: 60
          max-critical-findings: 0
          max-high-findings: 3

          # Optional — behavior
          dimensions: seo,accessibility,performance  # comma-separated
          fail-on-regression: true  # fail if any previously-fixed finding returns
          baseline-audit-id: auto   # 'auto' = latest audit for this URL, or specific UUID
          timeout: 180              # seconds
          deterministic-seed: ${{ github.sha }}  # ensures reproducibility

          # Optional — output
          sarif: true               # generate SARIF for GitHub Security tab
          junit: true               # generate JUnit XML for test reporters
          comment: true             # post PR comment with summary
          comment-on-pass: false    # only comment when thresholds fail
          artifact-name: alien-eyes-report  # upload full report as artifact

        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Action outputs:**

```yaml
outputs:
  satisfaction-score:
    description: Overall satisfaction score (0-100)
  audit-id:
    description: Alien Eyes audit ID for API access
  finding-count:
    description: Total findings count
  critical-count:
    description: CRITICAL findings count
  passed:
    description: Whether all thresholds were met (true/false)
  report-url:
    description: URL to full report on alieneyes.dev
  sarif-file:
    description: Path to SARIF output file
  junit-file:
    description: Path to JUnit XML output file
```

#### Configuration Schema (`.alieneyes.yml`)

For persistent configuration that doesn't change per-run:

```yaml
# .alieneyes.yml (in repo root)
version: 1

# Default audit settings
defaults:
  tier: quick_check
  dimensions:
    - seo
    - accessibility
    - performance
  timeout: 180
  deterministic: true

# Threshold definitions
thresholds:
  satisfaction: 70
  seo: 60
  accessibility: 75
  performance: 60
  max_critical: 0
  max_high: 3

# Per-environment overrides
environments:
  staging:
    url_pattern: "https://staging.example.com"
    tier: full_audit
    dimensions:
      - seo
      - accessibility
      - performance
      - security
      - agent-nativeness
      - copy-ux
    thresholds:
      satisfaction: 65  # more lenient for staging

  production:
    url_pattern: "https://example.com"
    tier: full_audit
    thresholds:
      satisfaction: 75
      max_critical: 0
      max_high: 0  # stricter for production

# Ignored findings (by finding hash or pattern)
ignore:
  - finding: "perf-003"  # Known: third-party widget adds 200ms
    reason: "Accepted risk: marketing requires HubSpot widget"
    expires: "2026-06-01"

  - pattern: "cookie-consent-*"
    reason: "Platform limitation: Shopify controls cookie banner"

# Regression baseline
regression:
  enabled: true
  baseline: auto  # auto = latest passing audit for this branch
```

#### PR Comment Format

```markdown
## Alien Eyes Audit Results

**Score: 78/100** (▲ +3 from baseline)

| Dimension | Score | Threshold | Status |
|-----------|-------|-----------|--------|
| SEO | 85 | 60 | ✅ Pass |
| Accessibility | 72 | 75 | ❌ Fail |
| Performance | 91 | 60 | ✅ Pass |

### Findings (4 total)

| # | Severity | Finding | Dimension |
|---|----------|---------|-----------|
| 1 | 🔴 HIGH | Form inputs on /contact missing labels | Accessibility |
| 2 | 🟡 MEDIUM | Skip-to-content link absent | Accessibility |
| 3 | 🟡 MEDIUM | OG image missing on /blog/* | SEO |
| 4 | 🟢 LOW | Render-blocking custom font | Performance |

### Regressions (1)
- ⚠️ `seo-002` "Duplicate meta descriptions" — was fixed in previous audit, now returned

<details>
<summary>Copy for your coding agent (Format B)</summary>

```
1. HIGH | Form inputs missing labels
...
```

</details>

---
*Audited by [Alien Eyes](https://alieneyes.dev) • [Full Report](https://alieneyes.dev/audit/abc123) • Methodology v0.1*
```

#### GitLab CI Template

```yaml
# .gitlab-ci.yml
alien-eyes:
  stage: test
  image: node:20
  script:
    - npx alien-eyes audit $CI_ENVIRONMENT_URL --cloud --json > report.json
    - npx alien-eyes check report.json --config .alieneyes.yml
  artifacts:
    reports:
      junit: alien-eyes-junit.xml
      sast: alien-eyes-sarif.json
    paths:
      - report.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

#### Generic Webhook Trigger

For CI systems that aren't GitHub/GitLab:

```
POST /api/ci/audit
Authorization: Bearer ae_live_xxx
Content-Type: application/json

{
  "url": "https://staging.example.com",
  "config": { ... },   // same as .alieneyes.yml defaults
  "callback_url": "https://ci.example.com/webhooks/alien-eyes",
  "metadata": {
    "commit_sha": "abc123",
    "branch": "feature/signup",
    "pr_number": 42,
    "ci_system": "jenkins"
  }
}

Response: { "audit_id": "...", "status": "pending" }

Callback (POST to callback_url on completion):
{
  "audit_id": "...",
  "status": "complete",
  "passed": true,
  "satisfaction_score": 78,
  "findings": [...],
  "report_url": "https://alieneyes.dev/audit/abc123"
}
```

#### SARIF Output

SARIF (Static Analysis Results Interchange Format) is the standard for security findings in GitHub. Alien Eyes generates SARIF so findings appear in GitHub's Security tab.

```pseudocode
function generateSARIF(synthesisResult):
  return {
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "Alien Eyes",
          version: packageVersion,
          informationUri: "https://alieneyes.dev",
          rules: synthesisResult.findings.map(f => ({
            id: f.id,
            name: f.id,
            shortDescription: { text: f.what },
            fullDescription: { text: `${f.what}\n\nExpected: ${f.expected}\n\nWhy: ${f.why}` },
            defaultConfiguration: {
              level: sarifLevel(f.severity) // critical->error, high->error, medium->warning, low->note
            }
          }))
        }
      },
      results: synthesisResult.findings.map(f => ({
        ruleId: f.id,
        level: sarifLevel(f.severity),
        message: { text: f.what },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: f.where }
          }
        }]
      }))
    }]
  }
```

#### Edge Cases

1. **Dynamic preview URLs**: Vercel, Netlify, and Cloudflare Pages generate unique URLs per commit. The action must accept URL patterns or environment variables.
2. **Deployment timing**: The audit must wait for deployment to complete. The action should support `wait-for-url` with timeout (poll URL until it returns 200, then audit).
3. **Branch-specific baselines**: On a feature branch, the baseline should be the latest passing audit on the target branch (main), not the latest audit on the feature branch.
4. **Ignored findings expiration**: `.alieneyes.yml` ignore rules have expiration dates. After expiration, the finding reappears and must be re-evaluated.
5. **Cost control**: CI/CD runs on every commit could be expensive. Quick Check mode (~$0.10) is the default. Full Audit requires explicit opt-in per environment.
6. **Concurrent PR audits**: Multiple PRs auditing simultaneously must be isolated. Each gets its own audit ID and preview URL.

#### Security Considerations

- API key for CI should be a dedicated key with `ci` scope (can trigger audits and read results, cannot manage account or billing).
- API key stored as GitHub Secret, never in workflow files.
- Webhook callback URLs validated against allowlist configured in Alien Eyes dashboard.
- SARIF output strips evidence details (screenshots, DOM hashes) to avoid leaking sensitive content into GitHub Security tab.

### 3.2 Type Extensions

```typescript
interface CIAuditConfig {
  url: string;
  apiKey: string;
  mode: 'cloud' | 'local';
  tier: 'quick_check' | 'full_audit';
  dimensions?: AuditDimension[];
  thresholds: CIThresholds;
  deterministicSeed?: string;
  timeout: number; // seconds
  baselineAuditId?: string | 'auto';
  failOnRegression: boolean;
  ignoredFindings: IgnoredFinding[];
  outputFormats: ('sarif' | 'junit' | 'json' | 'format-b')[];
  callbackUrl?: string;
  metadata?: CIMetadata;
}

interface CIThresholds {
  satisfaction?: number;
  seo?: number;
  accessibility?: number;
  performance?: number;
  security?: number;
  agentNativeness?: number;
  copyUx?: number;
  maxCritical: number;
  maxHigh: number;
}

interface IgnoredFinding {
  finding?: string;   // specific finding ID
  pattern?: string;   // glob pattern on finding ID
  reason: string;
  expires?: string;   // ISO date
}

interface CIMetadata {
  commitSha: string;
  branch: string;
  prNumber?: number;
  ciSystem: string;
  environment: string;
  repositoryUrl?: string;
}

interface CIAuditResult {
  auditId: string;
  passed: boolean;
  satisfactionScore: number;
  dimensionScores: Record<string, number>;
  thresholdResults: ThresholdResult[];
  findings: Finding[];
  regressions: Finding[];
  reportUrl: string;
  sarifFile?: string;
  junitFile?: string;
}

interface ThresholdResult {
  dimension: string;
  threshold: number;
  actual: number;
  passed: boolean;
}
```

### 3.3 Database Schema Extensions

```sql
-- CI audit metadata
ALTER TABLE audits ADD COLUMN ci_metadata JSONB;
ALTER TABLE audits ADD COLUMN ci_passed BOOLEAN;
ALTER TABLE audits ADD COLUMN ci_thresholds JSONB;
ALTER TABLE audits ADD COLUMN deterministic_seed TEXT;

-- CI-specific index for baseline lookups
CREATE INDEX idx_audits_ci_baseline ON audits(normalized_url, created_at DESC)
  WHERE ci_metadata IS NOT NULL AND ci_passed = true;

-- Ignored findings (persistent config, not per-audit)
CREATE TABLE ci_ignored_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  url_pattern TEXT NOT NULL,       -- glob pattern for URLs this applies to
  finding_pattern TEXT NOT NULL,   -- finding ID or glob
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ci_ignored_user ON ci_ignored_findings(user_id);
CREATE INDEX idx_ci_ignored_org ON ci_ignored_findings(org_id) WHERE org_id IS NOT NULL;
```

### 3.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-CI-01 | CI audit endpoint (`POST /api/ci/audit`) with config parsing | Codex | 3 | WU-15 (REST API) | Phase 2 |
| WU-CI-02 | Deterministic mode (seed-based persona/scenario selection) | Opus | 3 | WU-CI-01, WU-03 | Phase 2 |
| WU-CI-03 | Threshold evaluation engine + pass/fail logic | Codex | 2 | WU-CI-01 | Phase 2 |
| WU-CI-04 | SARIF output generator | Codex | 2 | WU-CI-01 | Phase 2 |
| WU-CI-05 | JUnit XML output generator | Codex | 1 | WU-CI-01 | Phase 2 |
| WU-CI-06 | GitHub Action (`alien-eyes/audit-action`) | Opus | 4 | WU-CI-01 through 05 | Phase 2 |
| WU-CI-07 | PR comment posting (GitHub API) | Codex | 2 | WU-CI-06 | Phase 2 |
| WU-CI-08 | `.alieneyes.yml` config parser + validator | Codex | 2 | WU-CI-01 | Phase 2 |
| WU-CI-09 | Regression detection against branch-specific baselines | Opus | 3 | WU-CI-01, WU-16 | Phase 2 |
| WU-CI-10 | Ignored findings with expiration | Codex | 2 | WU-CI-08 | Phase 2 |
| WU-CI-11 | GitLab CI template + generic webhook callback | Codex | 3 | WU-CI-01 | Phase 3 |
| WU-CI-12 | Wait-for-URL deployment readiness check | Codex | 1 | WU-CI-06 | Phase 2 |

**Total: 28 hours**

### 3.5 Acceptance Criteria

1. `alien-eyes/audit-action@v1` installs and runs in a GitHub Actions workflow within 30 seconds of setup time.
2. Quick Check audit completes within 90 seconds in CI mode (including URL readiness check).
3. PR check fails (exit code 1) when any configured threshold is not met.
4. PR comment posts with correct score, dimension breakdown, findings table, and Format B in collapsible section.
5. SARIF output uploads to GitHub Security tab and findings appear with correct severity levels.
6. JUnit XML is parseable by standard CI test reporters (GitHub, GitLab, Jenkins).
7. Deterministic mode: same commit SHA seed produces identical findings on two consecutive runs against the same URL content.
8. `.alieneyes.yml` configuration is validated at action start; invalid config fails fast with clear error message.
9. Regression detection correctly identifies findings present in baseline but not in current audit (resolved) and vice versa (new/regressed).
10. Ignored findings with past expiration dates are no longer ignored.

### 3.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| GitHub Action marketplace review delays | MEDIUM | Publish as public repo action first (no marketplace review needed). Marketplace listing later. |
| Dynamic preview URL timing (deployment not ready when action runs) | HIGH | Wait-for-URL step with configurable timeout. Poll with exponential backoff. Default 120s timeout. |
| CI cost explosion (every commit triggers paid audit) | HIGH | Default to Quick Check ($0.10). Full Audit requires explicit `tier: full_audit`. Monthly CI plan includes N audits. |
| Deterministic mode isn't truly deterministic (LLM temperature, network variance) | MEDIUM | Quick Check is fully deterministic (no LLM). Full Audit in deterministic mode uses temperature=0 and fixed seed but may still vary ~2%. Document this limitation. |
| SARIF schema compliance across GitHub versions | LOW | Pin to SARIF 2.1.0 schema. Test against GitHub's SARIF validator. |

---

## Expert 4: Persona System Implementation

**Dr. Anna Kowalski — UX Research Methodologist**
*Led persona programs at IDEO, Google, Spotify. Expert in persona validation, bias mitigation, lifecycle management.*

### 4.1 Feature Specification

#### Purpose

Implement the persona generation methodology defined in `docs/PERSONA-METHODOLOGY.md` as working code. The persona system generates business-specific simulated personas for each audit, producing behavioral lenses that detect friction, confusion, trust breakdown, and abandonment from diverse perspectives.

#### Architecture Overview

```
CrawlResult + PageSummary[]
    │
    ▼
┌──────────────────────┐
│  Context Extractor    │  Deterministic. Extracts business signals from crawl data.
│  (No LLM)            │  Output: ContextPacket
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Audience Inferrer    │  LLM (Haiku). Infers likely audiences from context.
│  (Haiku)              │  Output: AudienceInference
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Candidate Generator  │  LLM (Sonnet). Generates 12-24 candidate personas.
│  (Sonnet)             │  Output: CandidatePersona[]
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Panel Selector       │  Deterministic algorithm. Selects 5-7 for this audit.
│  (No LLM)            │  Optimizes: coverage, diversity, dimension sensitivity.
│                       │  Output: SelectedPersona[]
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Scenario Generator   │  Combines selected personas with scenario grammar axes.
│  (Deterministic +     │  Output: AuditScenario[]
│   optional Haiku)     │
└──────────────────────┘
```

**Total LLM cost per persona pipeline:** ~$0.15-0.30 (Haiku for inference, Sonnet for generation). This is included in the Full Audit LLM budget. Quick Check uses fixed personas (no generation pipeline).

#### Module 1: Context Extractor

Extracts observable business signals from crawl data without any LLM. This is the "evidence bundle for audience inference" described in PERSONA-METHODOLOGY.md.

```typescript
interface ContextPacket {
  // From meta tags and structured data
  businessCategory: string | null;      // e.g., "SaaS", "E-commerce", "Blog"
  industry: string | null;              // from structured data or content analysis
  productType: string | null;           // "tool", "marketplace", "content site", "API"

  // From visible content
  valueProposition: string | null;      // extracted from h1/hero text
  targetAudienceSignals: string[];      // keywords suggesting audience ("developers", "marketers")
  pricingPresent: boolean;
  pricingTiers: string[];               // extracted tier names
  hasSignupFlow: boolean;
  hasContactForm: boolean;
  hasBlog: boolean;
  hasDocumentation: boolean;
  hasAPIReference: boolean;

  // From technical signals
  detectedStack: string[];
  hasStructuredData: boolean;
  structuredDataTypes: string[];        // "Organization", "Product", "Article", etc.
  hasMCPManifest: boolean;
  hasOpenAPISpec: boolean;
  hasRSSFeed: boolean;

  // From navigation and IA
  primaryNavItems: string[];            // top-level nav labels
  pageCount: number;
  contentLanguages: string[];
  hasMultiLanguage: boolean;

  // From trust signals
  hasSocialProof: boolean;             // testimonials, logos, case studies
  hasSecurityBadges: boolean;          // SOC 2, ISO badges
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;

  // Confidence
  extractionConfidence: number;         // 0-1, based on signal density
}
```

**Algorithm (pseudocode):**

```pseudocode
function extractContext(crawl: CrawlResult, summaries: PageSummary[]): ContextPacket:
  packet = new ContextPacket()

  homepage = summaries.find(s => isHomepage(s.url))
  if homepage:
    packet.valueProposition = homepage.headings[0]?.text  // h1
    packet.targetAudienceSignals = extractAudienceKeywords(homepage.sanitizedTextContent)
    packet.hasSocialProof = containsSocialProofPatterns(homepage.sanitizedTextContent)

  for summary in summaries:
    if containsPricingPatterns(summary.url, summary.sanitizedTextContent):
      packet.pricingPresent = true
      packet.pricingTiers = extractTierNames(summary.sanitizedTextContent)

    if isDocumentationPage(summary.url):
      packet.hasDocumentation = true

    if isAPIReferencePage(summary.url, summary.sanitizedTextContent):
      packet.hasAPIReference = true

    if summary.structuredData.length > 0:
      packet.hasStructuredData = true
      for sd in summary.structuredData:
        packet.structuredDataTypes.push(sd['@type'])

  packet.detectedStack = crawl.detectedStack
  packet.primaryNavItems = extractNavItems(homepage)
  packet.pageCount = summaries.length
  packet.extractionConfidence = calculateSignalDensity(packet)

  return packet
```

#### Module 2: Audience Inferrer

Uses Haiku (cheapest LLM) to infer likely audiences from the context packet. This is a structured completion, not a conversation.

```pseudocode
function inferAudience(context: ContextPacket): AudienceInference:
  prompt = `
    Given the following observable signals from a website, infer the likely audiences.

    Business signals:
    - Value proposition: ${context.valueProposition}
    - Category: ${context.businessCategory}
    - Pricing tiers: ${context.pricingTiers.join(', ')}
    - Has documentation: ${context.hasDocumentation}
    - Has API reference: ${context.hasAPIReference}
    - Target audience keywords: ${context.targetAudienceSignals.join(', ')}
    - Navigation items: ${context.primaryNavItems.join(', ')}
    - Tech stack: ${context.detectedStack.join(', ')}

    For each audience segment, provide:
    1. Who they are (role, experience level, context)
    2. What they're trying to accomplish
    3. What would make them leave (abandon triggers)
    4. Which audit dimensions they'd be most sensitive to

    Output exactly 4-6 audience segments as JSON array.
  `

  return modelRouter.complete('haiku', prompt, AudienceInferenceSchema)
```

```typescript
interface AudienceInference {
  segments: AudienceSegment[];
  confidence: number;
  reasoning: string;
}

interface AudienceSegment {
  label: string;                    // "Technical evaluator", "Non-technical buyer"
  description: string;
  goals: string[];
  abandonmentTriggers: string[];
  dimensionSensitivity: AuditDimension[];  // which dimensions they care about most
  estimatedPercentage: number;      // rough proportion of audience (sums to 100)
  personaFamily: PersonaFamily;     // which family template to use
}

type PersonaFamily =
  // Human families
  | 'first-time-builder'
  | 'experienced-developer'
  | 'non-technical-evaluator'
  | 'mobile-first-user'
  | 'accessibility-dependent'
  | 'price-sensitive-evaluator'
  | 'power-user'
  | 'international-user'
  | 'enterprise-buyer'
  | 'consultant-auditor'
  // Agent families
  | 'browsing-agent'
  | 'api-consumer'
  | 'mcp-client'
  | 'search-crawler'
  | 'monitoring-bot'
  | 'integration-agent'
  | 'evaluation-agent'
  | 'content-extraction-agent';
```

#### Module 3: Candidate Generator

Uses Sonnet to generate richly detailed persona candidates grounded in the audience inference.

```pseudocode
function generateCandidates(
  context: ContextPacket,
  audience: AudienceInference,
  count: number = 18  // generate 12-24, default 18
): CandidatePersona[]:

  prompt = `
    You are generating simulated user personas for an external quality audit
    of a ${context.businessCategory} product.

    Business context:
    ${JSON.stringify(context, null, 2)}

    Inferred audience segments:
    ${JSON.stringify(audience.segments, null, 2)}

    Generate ${count} unique persona candidates. For each:
    - Ground them in the specific business context (not generic)
    - Include at least 2 personas per audience segment
    - Include at least 3 agent personas (if the product has API/MCP/docs)
    - Include at least 1 accessibility-dependent persona
    - Include at least 1 mobile-first persona
    - Each persona must have specific, non-overlapping "don't wants"
    - Each persona must have concrete abandonment triggers

    IMPORTANT: Optimize for friction detection and trust breakdown.
    "Don't wants" are more valuable than "wants."

    Output as JSON array matching the AuditPersona schema.
  `

  return modelRouter.complete('sonnet', prompt, AuditPersonaArraySchema)
```

```typescript
interface AuditPersona {
  id: string;                          // generated: "persona-{family}-{hash}"
  name: string;                        // realistic name
  family: PersonaFamily;
  type: 'human' | 'agent';

  // Grounding (what makes this persona specific to THIS audit)
  grounding: PersonaGrounding;

  // Behavioral lens
  context: string;                     // 2-3 sentence backstory
  goals: string[];                     // what they're trying to accomplish
  antiGoals: string[];                 // what they actively do NOT want
  frustrations: string[];              // past bad experiences that shape expectations
  abandonmentTriggers: string[];       // specific things that make them leave
  evaluationLens: string;              // how they judge quality (1 sentence)

  // Audit relevance
  dimensionSensitivity: AuditDimension[];  // which dimensions this persona tests
  scenarioAffinity: string[];          // which scenario grammar axes this persona maps to

  // For agent personas
  agentProfile?: AgentRuntimeProfile;

  // Calibration tracking
  calibration: PersonaCalibrationData;
}

interface PersonaGrounding {
  audienceSegment: string;             // which segment this persona belongs to
  businessSpecificDetail: string;      // what about THIS business makes this persona relevant
  evidenceSource: string;              // what observable signal supported this persona's existence
  confidence: number;                  // 0-1, how well-grounded is this persona
}

interface AgentRuntimeProfile {
  interfaceType: 'browser' | 'api' | 'mcp' | 'cli';
  capabilities: string[];             // what the agent can do
  timeoutMs: number;
  retries: number;
  schemaStrictness: 'strict' | 'lenient';
  errorTolerance: 'fail_fast' | 'retry' | 'fallback';
}

interface PersonaCalibrationData {
  findingsProduced: number;            // how many findings this persona generated (across all audits)
  findingsDisputed: number;            // how many were disputed as false positives
  findingsVerified: number;            // how many were verified as real (fixed)
  noveltyRate: number;                 // % of findings unique to this persona (not found by others)
  lastUsedAt?: string;
}
```

#### Module 4: Panel Selector

Deterministic algorithm that selects 5-7 personas from the candidate pool. This is the most critical algorithm in the persona system — it must ensure coverage, diversity, and dimension sensitivity without LLM involvement.

```pseudocode
function selectPanel(
  candidates: CandidatePersona[],
  config: AuditConfig,
  seed?: string                        // for deterministic mode
): SelectedPersona[]:

  panelSize = config.tier == 'quick_check' ? 3 : 7
  rng = seed ? seededRandom(seed) : Math.random

  // Step 1: Enforce hard constraints
  required = []

  // At least 1 accessibility persona
  accessibilityPersonas = candidates.filter(p =>
    p.dimensionSensitivity.includes('accessibility')
  )
  required.push(selectHighestConfidence(accessibilityPersonas))

  // At least 1 mobile persona
  mobilePersonas = candidates.filter(p =>
    p.family == 'mobile-first-user'
  )
  if mobilePersonas.length > 0:
    required.push(selectHighestConfidence(mobilePersonas))

  // At least 1 agent persona (if product has API/docs)
  if config.context.hasAPIReference or config.context.hasDocumentation:
    agentPersonas = candidates.filter(p => p.type == 'agent')
    if agentPersonas.length > 0:
      required.push(selectHighestConfidence(agentPersonas))

  // Step 2: Dimension coverage optimization
  // Ensure every targeted dimension has at least 1 persona sensitive to it
  coveredDimensions = new Set(required.flatMap(p => p.dimensionSensitivity))
  targetDimensions = config.targetedDimensions || ALL_DIMENSIONS
  uncoveredDimensions = targetDimensions.filter(d => !coveredDimensions.has(d))

  for dim in uncoveredDimensions:
    covering = candidates.filter(p =>
      p.dimensionSensitivity.includes(dim) && !required.includes(p)
    )
    if covering.length > 0 and required.length < panelSize:
      required.push(selectByDiversityScore(covering, required, rng))

  // Step 3: Diversity optimization for remaining slots
  remaining = panelSize - required.length
  available = candidates.filter(p => !required.includes(p))

  for i in range(remaining):
    if available.length == 0: break
    // Score each candidate by how much diversity they add
    scores = available.map(p => ({
      persona: p,
      diversityScore: calculateDiversityScore(p, required)
    }))
    scores.sort(by: diversityScore, descending: true)
    // Weighted random from top 3 (deterministic if seed provided)
    selected = weightedSelect(scores.slice(0, 3), rng)
    required.push(selected)
    available.remove(selected)

  return required


function calculateDiversityScore(candidate, currentPanel):
  score = 0

  // Family diversity: +2 for each family not yet represented
  familiesPresent = new Set(currentPanel.map(p => p.family))
  if !familiesPresent.has(candidate.family): score += 2

  // Dimension diversity: +1 for each dimension not yet covered
  dimsCovered = new Set(currentPanel.flatMap(p => p.dimensionSensitivity))
  newDims = candidate.dimensionSensitivity.filter(d => !dimsCovered.has(d))
  score += newDims.length

  // Type diversity: +1 if this type (human/agent) is underrepresented
  typeCount = currentPanel.filter(p => p.type == candidate.type).length
  if typeCount < currentPanel.length / 3: score += 1

  // Grounding confidence: +0.5 * confidence
  score += candidate.grounding.confidence * 0.5

  // Historical calibration: prefer personas with high novelty rate
  if candidate.calibration.noveltyRate > 0.3: score += 1

  return score
```

#### Module 5: Scenario Generator

Converts selected personas into concrete audit scenarios by combining with the scenario grammar.

```pseudocode
function generateScenarios(
  panel: SelectedPersona[],
  context: ContextPacket,
  config: AuditConfig,
  seed?: string
): AuditScenario[]:

  scenarios = []
  rng = seed ? seededRandom(seed) : Math.random

  for persona in panel:
    // Select entry points relevant to this persona
    entryPoints = selectEntryPoints(persona, context, rng)
    // Select intents relevant to this persona
    intents = selectIntents(persona, context, rng)
    // Select conditions relevant to this persona
    conditions = selectConditions(persona, config, rng)

    for entryPoint in entryPoints:
      for intent in intents:
        for condition in conditions:
          // Generate steady-state hypothesis
          hypothesis = generateHypothesis(persona, entryPoint, intent, condition, context)

          scenarios.push({
            persona: persona,
            entryPoint: entryPoint,
            intent: intent,
            dimensionFocus: selectDimensionFocus(persona),
            condition: condition,
            hypothesis: hypothesis,
            estimatedCost: estimateScenarioCost(persona, entryPoint, intent, condition)
          })

  // Budget-constrain: keep scenarios within cost budget
  scenarios.sort(by: informationValue, descending: true)
  budgetRemaining = config.costBudget * 0.3  // 30% of budget for persona/scenario
  selected = []
  for s in scenarios:
    if budgetRemaining >= s.estimatedCost:
      selected.push(s)
      budgetRemaining -= s.estimatedCost
    if selected.length >= 60: break  // cap at 60 scenarios

  return selected
```

#### Calibration Feedback Loop

After every audit, the persona system learns:

```pseudocode
function calibratePersonas(audit, findings, disputes):
  for finding in findings:
    persona = finding.producedByPersona
    if not persona: continue

    // Update finding count
    persona.calibration.findingsProduced += 1

    // Check if this finding was unique to this persona
    otherFindings = findings.filter(f =>
      f.producedByPersona != persona && findingsSimilar(f, finding)
    )
    if otherFindings.length == 0:
      persona.calibration.noveltyRate = recalculateNovelty(persona)

  for dispute in disputes:
    if dispute.resolution == 'confirmed_fp':
      persona = dispute.finding.producedByPersona
      persona.calibration.findingsDisputed += 1

  // Flag personas with high FP rate
  for persona in usedPersonas:
    fpRate = persona.calibration.findingsDisputed / persona.calibration.findingsProduced
    if fpRate > 0.25 and persona.calibration.findingsProduced > 10:
      flagForReview(persona, 'high_false_positive_rate')
```

### 4.2 Type Extensions

All types defined inline above in Section 4.1 (ContextPacket, AudienceInference, AudienceSegment, AuditPersona, PersonaGrounding, AgentRuntimeProfile, PersonaCalibrationData).

Additional types:

```typescript
interface AuditScenario {
  id: string;
  persona: AuditPersona;
  entryPoint: EntryPointPrimitive;
  intent: IntentPrimitive;
  dimensionFocus: DimensionFocusPrimitive;
  condition: ConditionPrimitive;
  hypothesis: SteadyStateHypothesis;
  estimatedCost: number;
}

interface SteadyStateHypothesis {
  statement: string;          // "A first-time visitor should be able to..."
  testableChecks: string[];   // specific things to verify
  successCriteria: string;    // what "passing" looks like
  failureCriteria: string;    // what "failing" looks like
}

// Extension to Finding — track which persona produced it
interface Finding {
  // ... existing fields ...
  producedByPersonaId?: string;
  producedByScenarioId?: string;
}

// Extension to Envelope — track persona pipeline cost
interface EnvelopeMetadata {
  // ... existing fields ...
  personaPipelineCostUsd?: number;
  personasUsed?: string[];
  scenariosRun?: number;
}
```

### 4.3 Database Schema Extensions

```sql
-- Persona calibration data (aggregated across audits)
CREATE TABLE persona_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_family TEXT NOT NULL,
  persona_hash TEXT NOT NULL,          -- hash of persona config for dedup
  findings_produced INT NOT NULL DEFAULT 0,
  findings_disputed INT NOT NULL DEFAULT 0,
  findings_verified INT NOT NULL DEFAULT 0,
  novelty_rate NUMERIC(3,2) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  flagged_for_review BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(persona_hash)
);

CREATE INDEX idx_persona_cal_family ON persona_calibration(persona_family);
CREATE INDEX idx_persona_cal_flagged ON persona_calibration(flagged_for_review) WHERE flagged_for_review = true;

-- Per-audit persona records (what personas were used for each audit)
CREATE TABLE audit_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  persona_data JSONB NOT NULL,         -- full AuditPersona object
  scenarios_generated INT NOT NULL DEFAULT 0,
  findings_produced INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_personas_audit ON audit_personas(audit_id);

-- Add persona tracking to findings
ALTER TABLE findings ADD COLUMN persona_id TEXT;
ALTER TABLE findings ADD COLUMN scenario_id TEXT;
```

### 4.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-PER-01 | Context Extractor (deterministic, from crawl data) | Codex | 3 | WU-01.5 (PageSummarizer) | Phase 1 |
| WU-PER-02 | Audience Inferrer (Haiku structured completion) | Opus | 3 | WU-PER-01, WU-05 (ModelRouter) | Phase 1 |
| WU-PER-03 | Candidate Generator (Sonnet structured completion) | Opus | 4 | WU-PER-02 | Phase 2 |
| WU-PER-04 | Panel Selector (deterministic coverage/diversity algorithm) | Opus | 4 | WU-PER-03 | Phase 2 |
| WU-PER-05 | Scenario Generator (persona + grammar composition) | Opus | 3 | WU-PER-04, Scenario Grammar | Phase 2 |
| WU-PER-06 | Hypothesis Generator (steady-state hypotheses per scenario) | Opus | 3 | WU-PER-05 | Phase 2 |
| WU-PER-07 | Calibration feedback loop (post-audit learning) | Opus | 3 | WU-PER-04, WU-16 | Phase 2 |
| WU-PER-08 | Deterministic mode (seed-based fixed persona selection) | Codex | 2 | WU-PER-04 | Phase 2 |
| WU-PER-09 | Quick Check fixed personas (no generation pipeline) | Codex | 1 | WU-PER-01 | Phase 1 |

**Total: 26 hours**

### 4.5 Acceptance Criteria

1. Context Extractor produces a ContextPacket from any CrawlResult in < 500ms with zero LLM calls.
2. Audience Inferrer produces 4-6 segments with Haiku in < 5 seconds at < $0.02 cost.
3. Candidate Generator produces 12-24 personas with Sonnet in < 15 seconds at < $0.15 cost.
4. Panel Selector always includes at least 1 accessibility persona, 1 mobile persona, and (if applicable) 1 agent persona.
5. Panel Selector covers all targeted dimensions (every dimension has at least 1 persona sensitive to it).
6. Deterministic mode with same seed produces identical panel selection.
7. Calibration loop updates persona stats after each audit and flags personas with >25% FP rate.
8. Total persona pipeline cost stays under $0.30 per Full Audit.
9. Quick Check uses hardcoded personas with zero generation cost.

### 4.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM generates stereotypical/biased personas | HIGH | Diversity constraints in Panel Selector are algorithmic, not LLM-dependent. Include bias checks in prompt. Review generated personas during alpha. |
| Persona generation adds too much latency | MEDIUM | Pipeline runs in parallel with early deterministic primitives (SEO, Performance). By the time LLM primitives start, personas are ready. |
| Calibration data is sparse for new persona families | LOW | Bootstrap with zero calibration data. Default to equal weighting. Calibration improves over 100+ audits. |
| Candidate generation quality varies by business type | MEDIUM | Include 5-10 golden-set businesses with hand-verified persona outputs. Test generation quality against these. |
| Panel Selector produces suboptimal panels for unusual businesses | MEDIUM | Log all panel selections. Review monthly for systematic gaps. Allow manual persona override for enterprise customers. |

---

## Expert 5: Methodology Evolution

**Professor David Chang — Clinical Trial Statistician**
*20 years designing adaptive clinical trials, methodology versioning, multi-center studies. Expert in FDR correction, gauge R&R, A/B testing of measurement instruments.*

### 5.1 Feature Specification

#### Purpose

Design the statistical framework for methodology evolution: multi-run averaging (2-of-3 agreement), multiplicity correction, gauge R&R validation, methodology versioning lifecycle, A/B testing of methodology changes, and cross-surface score normalization. Methodology v0.1 is a starting point. This specification defines how the methodology improves systematically without invalidating historical data.

#### Multi-Run Averaging (v0.2)

The single-run evaluation in v0.1 trades accuracy for cost. Multi-run averaging addresses the core weakness: LLM-evaluated findings are non-deterministic. The same audit on the same site can produce different findings on different runs.

**Protocol:**

```pseudocode
function multiRunAudit(url, config, runCount = 3):
  runs = []
  for i in range(runCount):
    // Each run uses a different random seed but same methodology
    run = executeAudit(url, { ...config, seed: generateSeed(i) })
    runs.push(run)

  // Deterministic findings (SEO, Performance) are identical across runs
  // Only LLM-evaluated findings need consensus
  deterministicFindings = runs[0].findings.filter(f => isDeterministic(f))
  llmFindings = collectLLMFindings(runs)

  // Consensus: a finding must appear in at least K of N runs
  K = Math.ceil(runCount * 2 / 3)  // 2 of 3, 3 of 5, etc.
  consensusFindings = []

  for findingCluster in clusterSimilarFindings(llmFindings):
    runsPresent = countDistinctRuns(findingCluster)
    if runsPresent >= K:
      // Use the finding instance with highest confidence
      representative = selectHighestConfidence(findingCluster)
      representative.consensusRuns = runsPresent
      representative.totalRuns = runCount
      representative.confidence = adjustConfidenceByConsensus(
        representative.confidence,
        runsPresent,
        runCount
      )
      consensusFindings.push(representative)

  // Score: average of per-run scores
  scores = runs.map(r => r.satisfactionScore)
  averageScore = mean(scores)
  scoreCI = confidenceInterval(scores, 0.95)

  return {
    findings: [...deterministicFindings, ...consensusFindings],
    satisfactionScore: averageScore,
    confidenceInterval: scoreCI,
    perRunScores: scores,
    consensusRate: consensusFindings.length / totalUniqueLLMFindings
  }


function adjustConfidenceByConsensus(baseConfidence, runsPresent, totalRuns):
  consensusRatio = runsPresent / totalRuns
  if consensusRatio >= 1.0:  return min(baseConfidence * 1.1, 1.0)  // all runs agree
  if consensusRatio >= 0.67: return baseConfidence                   // 2/3 agree
  return baseConfidence * 0.8                                        // barely passed


function clusterSimilarFindings(allFindings):
  // Group findings that describe the same issue
  // Match by: dimension + normalized 'what' + normalized 'where'
  // Use Jaccard similarity on tokenized 'what' field, threshold > 0.6
  clusters = []
  for finding in allFindings:
    matched = false
    for cluster in clusters:
      if findingSimilarity(finding, cluster.representative) > 0.6:
        cluster.add(finding)
        matched = true
        break
    if not matched:
      clusters.push(new Cluster(finding))
  return clusters
```

**Cost implication:** 3-run audit costs ~3x a single run. Full Audit at $2.50 COGS becomes $7.50. Must be priced accordingly ($39-79 for multi-run) or offered as a premium option.

#### Benjamini-Hochberg FDR Correction

When running 6+ dimensions with multiple checks per dimension, the probability of at least one false positive increases. The BH procedure controls the False Discovery Rate.

```pseudocode
function applyBHCorrection(findings: Finding[]): Finding[]:
  // Sort findings by p-value (derived from confidence)
  // p-value approximation: p = 1 - confidence
  sorted = findings.sort(by: f => 1 - f.confidence, ascending: true)
  m = sorted.length
  targetFDR = 0.10  // 10% target FDR

  // BH procedure
  lastSignificant = -1
  for i in range(m):
    pValue = 1 - sorted[i].confidence
    bhThreshold = (i + 1) / m * targetFDR
    if pValue <= bhThreshold:
      lastSignificant = i

  // All findings up to lastSignificant pass the correction
  corrected = []
  for i in range(m):
    finding = sorted[i]
    if i <= lastSignificant:
      finding.bhCorrected = true
      finding.adjustedConfidence = finding.confidence  // passes
    else:
      finding.bhCorrected = false
      // Adjust confidence down to reflect multiplicity
      finding.adjustedConfidence = finding.confidence * (1 - targetFDR)
      // If adjusted confidence drops below threshold, downgrade severity
      if finding.adjustedConfidence < 0.7 and finding.severity in ['critical', 'high']:
        finding.severity = downgradeSeverity(finding.severity)
        finding.bhNote = 'Severity downgraded after multiplicity correction'
    corrected.push(finding)

  return corrected
```

**When to apply:** BH correction runs in the Synthesizer (WU-03) after all primitives complete. It replaces the simpler multiplicity correction currently described in the pipeline.

#### Gauge R&R Validation Protocol

Gauge R&R (Repeatability and Reproducibility) measures whether the measurement instrument (Alien Eyes) produces consistent results. This is the validation protocol that must be run before alpha exit.

```pseudocode
protocol GaugeRR:
  // Setup
  sites = select 10 diverse sites:
    - 2 Next.js, 2 WordPress, 2 Shopify, 1 Rails, 1 Django, 1 Go, 1 static
  operators = [
    'methodology_v0.1_run1',
    'methodology_v0.1_run2',
    'methodology_v0.1_run3'
  ]

  // Execute
  for site in sites:
    for operator in operators:
      result = executeAudit(site, methodology='v0.1', seed=operator)
      record(site, operator, result)

  // Analyze
  for dimension in ALL_DIMENSIONS:
    scores = getAllScores(dimension)

    // Repeatability: variance within same site, same operator (should be 0 for deterministic)
    withinVariance = calculateWithinVariance(scores)

    // Reproducibility: variance between operators for same site
    betweenVariance = calculateBetweenVariance(scores)

    // Total variance
    totalVariance = withinVariance + betweenVariance

    // %GRR
    grrPercent = totalVariance / totalObservedVariance * 100

    // Acceptance criteria
    if grrPercent < 10:
      status = 'EXCELLENT — measurement system is reliable'
    elif grrPercent < 30:
      status = 'ACCEPTABLE — may need improvement'
    else:
      status = 'UNACCEPTABLE — measurement system needs redesign'

    report(dimension, grrPercent, status)

  // Finding-level repeatability
  for site in sites:
    runs = getAllRuns(site)
    findingHashes = runs.map(r => Set(r.findings.map(hashFinding)))
    // Jaccard similarity between all pairs of runs
    pairwiseSimilarity = calculatePairwiseJaccard(findingHashes)
    averageSimilarity = mean(pairwiseSimilarity)

    if averageSimilarity < 0.80:
      flag('Finding repeatability below 80% for ' + site.url)
```

**Target:** %GRR < 30% for all dimensions. Finding repeatability > 80% across runs. Deterministic dimensions (SEO, Performance) should have %GRR < 1%.

#### Methodology Versioning Lifecycle

```
v0.1 (PRE-REGISTERED)
  │
  ├── Hotfix v0.1.1 (bug in deterministic check, no scoring change)
  │   - Does NOT require version bump in audits
  │   - Does NOT invalidate historical scores
  │
  ├── Minor v0.2 (add multi-run, add AEO/GEO/MEO, adjust weights)
  │   - Requires version bump in audits
  │   - Historical scores remain under v0.1 (not retroactively changed)
  │   - Migration: parallel run both versions for 2 weeks, compare
  │
  └── Major v1.0 (fundamentally new scoring model)
      - Requires version bump
      - Historical scores clearly labeled as "v0.x methodology"
      - Migration: all active monitors re-baselined
```

**Version numbering:**
- `v0.1` — pre-alpha (current)
- `v0.2` — alpha exit (multi-run, extended dimensions, calibrated weights)
- `v0.3` — post-alpha refinement (1,000+ audit calibration)
- `v1.0` — public methodology (peer-reviewed, published, stable)

**Rules:**
1. Audits always record `methodology_version`.
2. Score comparisons are only valid within the same methodology version.
3. Cross-version comparison shows a "methodology changed" notice.
4. Old methodology versions are never deleted.
5. Active monitors can be pinned to a specific methodology version or set to "latest."

#### A/B Testing Methodology Changes

Before any methodology version bump, run both versions in parallel and compare:

```pseudocode
function abTestMethodology(newVersion, sampleSize = 100):
  // Select sample: next N audits get both versions
  results = []
  for audit in nextAudits(sampleSize):
    resultOld = executeAudit(audit.url, methodology=currentVersion)
    resultNew = executeAudit(audit.url, methodology=newVersion)
    results.push({ old: resultOld, new: resultNew })

  // Analyze
  scoreDiffs = results.map(r => r.new.satisfactionScore - r.old.satisfactionScore)
  meanDiff = mean(scoreDiffs)
  stdDiff = stddev(scoreDiffs)

  // Are scores significantly different?
  tStat = meanDiff / (stdDiff / sqrt(sampleSize))
  pValue = tTest(tStat, df = sampleSize - 1)

  // Finding-level comparison
  newFindingsOnly = results.flatMap(r =>
    r.new.findings.filter(f => !r.old.findings.some(of => hashMatch(of, f)))
  )
  removedFindings = results.flatMap(r =>
    r.old.findings.filter(f => !r.new.findings.some(nf => hashMatch(nf, f)))
  )

  // FP rate comparison
  oldFPRate = estimateFPRate(results.map(r => r.old))
  newFPRate = estimateFPRate(results.map(r => r.new))

  return {
    sampleSize,
    meanScoreDiff: meanDiff,
    pValue,
    significant: pValue < 0.05,
    newFindingsCount: newFindingsOnly.length,
    removedFindingsCount: removedFindings.length,
    oldFPRate,
    newFPRate,
    recommendation: pValue < 0.05 and newFPRate <= oldFPRate
      ? 'ADOPT new version'
      : 'HOLD current version'
  }
```

**Cost:** A/B testing doubles audit cost for the sample. Budget: 100 audits x $2.50 = $250 per methodology test. Acceptable.

#### Cross-Surface Score Normalization

When Alien Eyes expands beyond web to APIs, CLIs, MCP servers, and packages, scores must be comparable across surfaces.

**Problem:** A "75" for a website and a "75" for an API should mean roughly the same quality level. But surfaces have different dimensions (websites have accessibility; APIs do not). Direct comparison is invalid without normalization.

**Approach: Surface-Specific Dimension Profiles**

```typescript
interface SurfaceDimensionProfile {
  surface: AuditSurface;
  applicableDimensions: AuditDimension[];
  weights: Record<AuditDimension, number>; // must sum to 1.0
  benchmarkMedian: number;    // median score from 100+ audits of this surface type
  benchmarkStdDev: number;    // std dev from benchmark dataset
}

type AuditSurface = 'web' | 'api' | 'cli' | 'mcp' | 'package' | 'docs';
```

| Surface | Applicable Dimensions | Key Weights |
|---------|----------------------|-------------|
| Web | SEO, A11y, Security, Perf, AN, Copy/UX | A11y: 0.20, Copy/UX: 0.20 |
| API | Security, Perf, AN, Docs quality | AN: 0.35, Security: 0.25 |
| CLI | Perf, AN, Docs quality, UX | AN: 0.30, UX: 0.25 |
| MCP | Security, AN, Perf | AN: 0.45, Security: 0.30 |
| Package | Security, AN, Docs quality | AN: 0.35, Docs: 0.30 |

**Normalization algorithm:**

```pseudocode
function normalizeScore(rawScore, surface):
  profile = getSurfaceProfile(surface)
  if profile.benchmarkMedian == null:
    return rawScore  // insufficient data, return raw

  // Z-score normalization against surface benchmark
  zScore = (rawScore - profile.benchmarkMedian) / profile.benchmarkStdDev

  // Convert to percentile within surface type
  percentile = normalCDF(zScore) * 100

  return {
    rawScore: rawScore,
    normalizedScore: percentile,
    surface: surface,
    benchmarkMedian: profile.benchmarkMedian,
    comparisonLabel: percentileLabel(percentile)
    // "above average", "top 10%", "below average", etc.
  }
```

**Bootstrap period:** Cross-surface normalization requires benchmark data. Until 100+ audits per surface type exist, raw scores are shown with a "benchmark data insufficient" note. Web surface will reach this threshold first (by Phase 1). API/CLI/MCP surfaces may take until Phase 3.

### 5.2 Type Extensions

```typescript
// Multi-run result
interface MultiRunResult {
  runs: SynthesisResult[];
  consensusFindings: ConsensusEnrichedFinding[];
  averageScore: number;
  scoreConfidenceInterval: { low: number; high: number };
  perRunScores: number[];
  consensusRate: number;
  runCount: number;
}

interface ConsensusEnrichedFinding extends Finding {
  consensusRuns: number;     // how many runs found this
  totalRuns: number;
  adjustedConfidence: number; // post-consensus adjustment
}

// BH correction
interface BHCorrectedFinding extends Finding {
  bhCorrected: boolean;
  adjustedConfidence: number;
  bhNote?: string;
  originalSeverity?: 'critical' | 'high' | 'medium' | 'low';
}

// Gauge R&R
interface GaugeRRResult {
  dimension: AuditDimension;
  grrPercent: number;
  withinVariance: number;
  betweenVariance: number;
  status: 'excellent' | 'acceptable' | 'unacceptable';
  findingRepeatability: number; // Jaccard similarity
}

// Cross-surface normalization
interface NormalizedScore {
  rawScore: number;
  normalizedScore: number;
  surface: AuditSurface;
  benchmarkMedian: number | null;
  benchmarkStdDev: number | null;
  percentile: number | null;
  comparisonLabel: string;
}

// Methodology A/B test
interface MethodologyABTestResult {
  oldVersion: string;
  newVersion: string;
  sampleSize: number;
  meanScoreDiff: number;
  pValue: number;
  significant: boolean;
  newFindingsCount: number;
  removedFindingsCount: number;
  oldFPRate: number;
  newFPRate: number;
  recommendation: 'adopt' | 'hold';
}

// Extension to AuditMeta
interface AuditMeta {
  // ... existing fields ...
  multiRunConfig?: { runCount: number; consensusThreshold: number };
  bhCorrectionApplied: boolean;
  surfaceType: AuditSurface;
}
```

### 5.3 Database Schema Extensions

```sql
-- Methodology versions (registry)
CREATE TABLE methodology_versions (
  version TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft',   -- 'draft', 'active', 'deprecated', 'archived'
  dimension_weights JSONB NOT NULL,
  scoring_rules JSONB NOT NULL,
  release_notes TEXT,
  predecessor TEXT REFERENCES methodology_versions(version),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gauge R&R validation runs
CREATE TABLE gauge_rr_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_version TEXT NOT NULL REFERENCES methodology_versions(version),
  sites_tested INT NOT NULL,
  runs_per_site INT NOT NULL,
  results JSONB NOT NULL,              -- GaugeRRResult[] per dimension
  finding_repeatability NUMERIC(3,2),
  overall_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Methodology A/B tests
CREATE TABLE methodology_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_version TEXT NOT NULL REFERENCES methodology_versions(version),
  new_version TEXT NOT NULL REFERENCES methodology_versions(version),
  sample_size INT NOT NULL,
  results JSONB NOT NULL,              -- MethodologyABTestResult
  recommendation TEXT NOT NULL,
  decided_at TIMESTAMPTZ,
  decision TEXT,                       -- 'adopted', 'rejected', 'modified'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Surface benchmark data
CREATE TABLE surface_benchmarks (
  surface TEXT NOT NULL,
  methodology_version TEXT NOT NULL REFERENCES methodology_versions(version),
  sample_size INT NOT NULL,
  median_score NUMERIC(5,2),
  stddev_score NUMERIC(5,2),
  dimension_medians JSONB,             -- per-dimension medians
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (surface, methodology_version)
);

-- Multi-run tracking
ALTER TABLE audits ADD COLUMN run_number INT DEFAULT 1;
ALTER TABLE audits ADD COLUMN multi_run_group_id UUID;
ALTER TABLE audits ADD COLUMN consensus_applied BOOLEAN DEFAULT false;
ALTER TABLE audits ADD COLUMN bh_correction_applied BOOLEAN DEFAULT false;
ALTER TABLE audits ADD COLUMN surface_type TEXT DEFAULT 'web';

CREATE INDEX idx_audits_multi_run ON audits(multi_run_group_id) WHERE multi_run_group_id IS NOT NULL;
```

### 5.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-METH-01 | Methodology version registry + migration tooling | Opus | 3 | WU-00 | Phase 2 |
| WU-METH-02 | BH FDR multiplicity correction in Synthesizer | Opus | 3 | WU-03 (Synthesizer) | Phase 2 |
| WU-METH-03 | Multi-run orchestrator (N-run execution + consensus) | Opus | 5 | WU-06 (Pipeline), WU-METH-02 | Phase 2 |
| WU-METH-04 | Finding clustering algorithm (cross-run similarity) | Opus | 4 | WU-METH-03 | Phase 2 |
| WU-METH-05 | Gauge R&R validation harness | Opus | 4 | WU-METH-01 | Phase 1 |
| WU-METH-06 | Methodology A/B test framework | Opus | 3 | WU-METH-01 | Phase 3 |
| WU-METH-07 | Surface benchmark data collection + normalization | Opus | 3 | WU-METH-01 | Phase 3 |
| WU-METH-08 | Cross-surface score normalization engine | Opus | 3 | WU-METH-07 | Phase 3 |

**Total: 28 hours**

### 5.5 Acceptance Criteria

1. BH correction reduces CRITICAL false positive rate to < 1% on a test set of 100 audits.
2. Multi-run consensus (2-of-3) produces finding repeatability > 90% for deterministic dimensions and > 80% for LLM dimensions.
3. Gauge R&R %GRR < 30% for all dimensions before alpha exit. Deterministic dimensions < 1%.
4. Methodology version changes are recorded and all audits reference the correct version.
5. A/B test framework can run both methodology versions on the same audit and produce comparison statistics.
6. Cross-surface normalization produces comparable percentile scores when benchmark data is available.
7. Score comparisons across methodology versions display a clear "methodology changed" warning.

### 5.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Multi-run triples COGS | HIGH | Offer multi-run as premium tier ($39-79). Default remains single-run. Quick Check never multi-run. |
| BH correction removes legitimate findings | MEDIUM | Conservative FDR target (10%). Track "removed by BH" findings. If pattern emerges, adjust. |
| Gauge R&R fails for LLM dimensions (>30% variance) | HIGH | If fails: lower temperature, tighten prompts, restrict to more constrained evaluation. Worst case: reclassify dimension as "indicative, not scored." |
| Cross-surface normalization biased by early adopter distribution | MEDIUM | Minimum 100 audits per surface before enabling normalization. Clearly label "insufficient benchmark data." |
| Methodology version proliferation | LOW | Maximum 3 active versions at any time. Deprecated versions archived after 6 months of zero usage. |

---

## Expert 6: Scenario Grammar v2.0

**Miyuki Suzuki — Game Designer / Anti-Gaming Specialist**
*Designed ranking systems for competitive games (Riot, Valve). Expert in Goodhart's Law prevention, dynamic difficulty, anti-cheat.*

### 6.1 Feature Specification

#### Purpose

Evolve the scenario grammar from a static 5-axis configuration system (v1.0, 27,440 configs) into a dynamic composition engine with per-surface primitive registries, exclusion/priority rules, frequency tracking, per-site memory, and anti-gaming properties that prevent builders from optimizing for the grammar rather than for quality.

#### The Core Anti-Gaming Insight

**Goodhart's Law:** "When a measure becomes a target, it ceases to be a good measure."

If builders can predict which scenarios will run, they will optimize for those scenarios rather than for genuine quality. The grammar must be:

1. **Large enough** that exhaustive optimization is impractical (10^6+ configs per surface)
2. **Adaptive** so that gaming one area increases scrutiny of others
3. **Evolving** so that today's optimization is tomorrow's blind spot
4. **Unpredictable** in per-audit scenario selection while being reproducible in deterministic mode

#### Per-Surface Primitive Registries

Each audit surface has its own set of axis primitives, but the composition engine is shared.

```typescript
interface SurfacePrimitiveRegistry {
  surface: AuditSurface;
  personas: PersonaPrimitive[];
  entryPoints: EntryPointPrimitive[];
  intents: IntentPrimitive[];
  dimensionFoci: DimensionFocusPrimitive[];
  conditions: ConditionPrimitive[];
  exclusionRules: ExclusionRule[];
  priorityRules: PriorityRule[];
  totalConfigurations: number; // computed: product of all axis counts
}
```

**Web registry** (existing, expanded):

| Axis | V1 Count | V2 Count | New Primitives |
|------|---------|---------|----------------|
| Persona | 10 | 14 | `seo-professional`, `content-marketer`, `agency-evaluator`, `privacy-auditor` |
| Entry Point | 7 | 10 | `llm-citation`, `email-link`, `qr-code` |
| Intent | 7 | 10 | `compare-alternatives`, `verify-claim`, `find-api-docs` |
| Dimension Focus | 7 | 7 | (unchanged) |
| Condition | 8 | 12 | `high-dpi`, `dark-mode`, `prefers-reduced-motion`, `proxy-vpn` |

**V2 total web configurations:** 14 x 10 x 10 x 7 x 12 = **117,600**

**API registry** (new):

| Axis | Count | Primitives |
|------|-------|-----------|
| Persona | 6 | `integration-developer`, `monitoring-agent`, `data-pipeline`, `sdk-user`, `security-scanner`, `load-tester` |
| Entry Point | 5 | `docs-discovery`, `openapi-spec`, `direct-endpoint`, `sdk-import`, `mcp-manifest` |
| Intent | 6 | `authenticate`, `crud-entity`, `batch-operation`, `error-recovery`, `rate-limit-test`, `schema-discovery` |
| Dimension Focus | 4 | `security-focus`, `performance-focus`, `agent-focus`, `reliability-focus` |
| Condition | 5 | `normal`, `rate-limited`, `expired-token`, `malformed-input`, `concurrent-requests` |

**API total:** 6 x 5 x 6 x 4 x 5 = **3,600**

**MCP registry** (new):

| Axis | Count | Primitives |
|------|-------|-----------|
| Persona | 4 | `claude-code`, `cursor-agent`, `custom-agent`, `discovery-crawler` |
| Entry Point | 3 | `mcp-manifest`, `tool-listing`, `direct-invocation` |
| Intent | 5 | `discover-tools`, `invoke-tool`, `handle-error`, `chain-tools`, `verify-output` |
| Dimension Focus | 3 | `agent-focus`, `reliability-focus`, `security-focus` |
| Condition | 4 | `normal`, `tool-timeout`, `schema-mismatch`, `concurrent-invocations` |

**MCP total:** 4 x 3 x 5 x 3 x 4 = **720**

**CLI registry** (new):

| Axis | Count | Primitives |
|------|-------|-----------|
| Persona | 4 | `first-time-user`, `power-user`, `scripting-agent`, `ci-pipeline` |
| Entry Point | 4 | `readme-discovery`, `help-flag`, `man-page`, `package-manager` |
| Intent | 5 | `install`, `first-command`, `complex-workflow`, `error-recovery`, `pipe-output` |
| Dimension Focus | 3 | `ux-focus`, `agent-focus`, `reliability-focus` |
| Condition | 4 | `normal`, `no-color`, `non-interactive`, `minimal-env` |

**CLI total:** 4 x 4 x 5 x 3 x 4 = **960**

**Grand total across all surfaces:** 117,600 + 3,600 + 720 + 960 = **122,880 configurations**

#### Exclusion Rules

Some scenario combinations are invalid or nonsensical. The grammar engine filters these before selection.

```typescript
interface ExclusionRule {
  id: string;
  surface: AuditSurface;
  description: string;
  // Condition: if ALL of these match, exclude the scenario
  conditions: {
    axis: 'persona' | 'entryPoint' | 'intent' | 'dimensionFocus' | 'condition';
    value: string;
  }[];
}
```

**Example exclusion rules:**

```
EXCL-001: (web, ai-agent, homepage, sign-up)
  → Agents don't sign up via web forms

EXCL-002: (web, screen-reader-user, *, *, dark-mode)
  → Dark mode is irrelevant for screen reader users

EXCL-003: (api, *, docs-discovery, *, rate-limited)
  → Docs pages shouldn't be rate-limited

EXCL-004: (web, search-crawler, *, *, js-disabled)
  → Modern crawlers execute JS; this tests a non-real scenario

EXCL-005: (mcp, *, *, *, tool-timeout) AND (intent == discover-tools)
  → Tool listing should not timeout; testing this combination is noise
```

#### Priority Rules

Some combinations are more informative than others. Priority rules increase selection probability.

```typescript
interface PriorityRule {
  id: string;
  surface: AuditSurface;
  description: string;
  conditions: {
    axis: string;
    value: string;
  }[];
  weight: number;  // multiplier on selection probability (default 1.0)
}
```

**Example priority rules:**

```
PRIO-001: (web, first-time-visitor, homepage, balanced, normal) weight=3.0
  → The canonical first-impression scenario. Always high priority.

PRIO-002: (web, mobile-user, *, *, slow-network) weight=2.0
  → Mobile + slow network reveals real-world degradation.

PRIO-003: (api, integration-developer, openapi-spec, agent-focus, normal) weight=2.5
  → Core agent integration path. High value.

PRIO-004: (web, *, *, accessibility-focus, *) weight=2.0
  → Accessibility scenarios are underrepresented without boosting.

PRIO-005: (*, *, *, *, normal) weight=0.7
  → Slightly deprioritize normal conditions to ensure adversarial coverage.
```

#### Frequency Tracking and Coverage Guarantee

Over time, the grammar ensures all viable scenarios get coverage across a site's audit history.

```pseudocode
function trackFrequency(url, scenario):
  key = hashScenario(scenario)
  increment scenarioFrequency[url][key]

function selectWithCoverage(url, candidates, count, rng):
  // Get frequency data for this URL
  frequencies = getScenarioFrequencies(url)

  // Score each candidate
  scored = candidates.map(c => ({
    scenario: c,
    frequency: frequencies[hashScenario(c)] || 0,
    priority: calculatePriority(c),
    // Coverage score: inverse of frequency (less-run = higher score)
    coverageScore: 1.0 / (1 + frequency),
    // Combined score
    combinedScore: coverageScore * priority
  }))

  // Weighted random selection from top candidates
  scored.sort(by: combinedScore, descending: true)
  selected = []
  for i in range(count):
    // Select from top 3 * remaining with weighted probability
    pool = scored.slice(0, 3 * (count - i))
    choice = weightedRandomSelect(pool, weights = pool.map(s => s.combinedScore), rng)
    selected.push(choice.scenario)
    scored.remove(choice)

  return selected
```

#### Per-Site Memory (Re-Audit Differentiation)

When a site is re-audited, the grammar deliberately selects different scenarios to increase total coverage:

```pseudocode
function selectForReAudit(url, previousAuditScenarios, candidates, count, rng):
  // Deprioritize scenarios that ran in the previous audit
  previousHashes = Set(previousAuditScenarios.map(hashScenario))

  scored = candidates.map(c => ({
    scenario: c,
    wasInPrevious: previousHashes.has(hashScenario(c)),
    priority: calculatePriority(c),
    noveltyBonus: wasInPrevious ? 0.3 : 1.0,  // 70% penalty for repeats
    combinedScore: priority * noveltyBonus
  }))

  // But always include the canonical scenario (PRIO-001) for comparability
  canonical = scored.find(s => isCanonicalScenario(s.scenario))
  if canonical: forceInclude(canonical)

  return weightedSelect(scored, count, rng)
```

#### Adaptive Enrichment v2

V1 adaptive enrichment was simple: find the weakest dimension, run more scenarios there. V2 uses a more sophisticated approach:

```pseudocode
function adaptiveEnrichmentV2(initialResults, budget, rng):
  // 1. Identify signal density per dimension
  signalDensity = {}
  for dim in ALL_DIMENSIONS:
    findings = initialResults.findings.filter(f => f.dimension == dim)
    signalDensity[dim] = {
      count: findings.length,
      avgConfidence: mean(findings.map(f => f.confidence)),
      hasAmbiguous: findings.some(f => f.confidence < 0.8)
    }

  // 2. Enrichment targets (not just "most findings" — also "most uncertain")
  targets = []
  for dim, signal in signalDensity:
    if signal.hasAmbiguous:
      targets.push({ dim, reason: 'ambiguous_findings', priority: 3 })
    if signal.count > 3:
      targets.push({ dim, reason: 'high_signal', priority: 2 })
    if signal.count == 0 and dim not in cleanDimensions:
      targets.push({ dim, reason: 'unexpected_silence', priority: 1 })

  // 3. Generate enrichment scenarios targeting those dimensions
  enrichmentScenarios = []
  for target in targets.sort(by: priority, descending: true):
    scenarios = generateFocusedScenarios(target.dim, count = 3, rng)
    enrichmentScenarios.extend(scenarios)
    if estimateCost(enrichmentScenarios) > budget: break

  return enrichmentScenarios
```

**New enrichment trigger:** "unexpected silence" — if a dimension should have findings (based on the context packet) but the initial pass found none, the enrichment pass investigates why. This catches false negatives.

#### Anti-Gaming Properties (V2 Additions)

1. **Scenario rotation:** No two consecutive audits of the same URL use the same scenario set (except the canonical scenario for comparability).
2. **Hidden dimensions:** In addition to the 6 visible dimensions, run 1-2 "exploratory checks" that are not part of the published methodology. Findings from exploratory checks are flagged as "emerging" but can be promoted in future methodology versions. This prevents builders from optimizing only for published checks.
3. **Cross-product calibration:** If 80% of sites with the same tech stack have an issue that this site does NOT have, flag for deeper investigation. The absence of a common issue is informative.
4. **Grammar evolution cadence:** New primitives added quarterly. Old primitives never removed (they just get lower frequency). The grammar always grows.
5. **Scenario audit log:** The exact scenarios run are logged internally but never exposed to the builder. Builders see findings, not test cases.

### 6.2 Type Extensions

```typescript
interface ScenarioGrammarEngine {
  registries: Map<AuditSurface, SurfacePrimitiveRegistry>;

  compose(
    surface: AuditSurface,
    config: AuditConfig,
    personas: AuditPersona[],
    seed?: string
  ): AuditScenario[];

  applyExclusions(scenarios: AuditScenario[]): AuditScenario[];
  applyPriorities(scenarios: AuditScenario[]): ScoredScenario[];
  selectWithCoverage(scored: ScoredScenario[], count: number, urlHistory: ScenarioHistory): AuditScenario[];
  adaptiveEnrich(initialResults: SynthesisResult, budget: number): AuditScenario[];
}

interface ScoredScenario {
  scenario: AuditScenario;
  priorityScore: number;
  coverageScore: number;
  noveltyScore: number;
  combinedScore: number;
}

interface ScenarioHistory {
  url: string;
  previousScenarioHashes: Set<string>[];  // one set per previous audit
  frequencyMap: Map<string, number>;       // hash → run count
}

interface ExclusionRule {
  id: string;
  surface: AuditSurface;
  description: string;
  conditions: { axis: string; value: string }[];
}

interface PriorityRule {
  id: string;
  surface: AuditSurface;
  description: string;
  conditions: { axis: string; value: string }[];
  weight: number;
}

// Extension to AuditMeta
interface AuditMeta {
  // ... existing fields ...
  scenariosRun: number;
  scenarioHashesRun: string[];   // for per-site memory
  enrichmentTriggered: boolean;
  enrichmentTargets?: string[];  // which dimensions were enriched
}
```

### 6.3 Database Schema Extensions

```sql
-- Scenario frequency tracking (per URL)
CREATE TABLE scenario_frequencies (
  url_hash TEXT NOT NULL,              -- SHA-256 of normalized URL
  scenario_hash TEXT NOT NULL,         -- SHA-256 of scenario config
  surface TEXT NOT NULL,
  run_count INT NOT NULL DEFAULT 1,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (url_hash, scenario_hash)
);

CREATE INDEX idx_scenario_freq_url ON scenario_frequencies(url_hash);

-- Surface primitive registries (configuration, not per-audit)
CREATE TABLE surface_registries (
  surface TEXT PRIMARY KEY,
  personas JSONB NOT NULL DEFAULT '[]',
  entry_points JSONB NOT NULL DEFAULT '[]',
  intents JSONB NOT NULL DEFAULT '[]',
  dimension_foci JSONB NOT NULL DEFAULT '[]',
  conditions JSONB NOT NULL DEFAULT '[]',
  exclusion_rules JSONB NOT NULL DEFAULT '[]',
  priority_rules JSONB NOT NULL DEFAULT '[]',
  total_configurations INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-audit scenario log (internal, never exposed to builder)
ALTER TABLE audits ADD COLUMN scenarios_run JSONB;
ALTER TABLE audits ADD COLUMN enrichment_triggered BOOLEAN DEFAULT false;
ALTER TABLE audits ADD COLUMN enrichment_targets TEXT[];
```

### 6.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-GRAM-01 | Scenario grammar composition engine (shared across surfaces) | Opus | 5 | WU-00 | Phase 1 |
| WU-GRAM-02 | Web surface primitive registry (expanded V2) | Codex | 2 | WU-GRAM-01 | Phase 1 |
| WU-GRAM-03 | Exclusion rule engine + validation | Codex | 2 | WU-GRAM-01 | Phase 1 |
| WU-GRAM-04 | Priority rule engine + weighted selection | Opus | 3 | WU-GRAM-01 | Phase 1 |
| WU-GRAM-05 | Frequency tracking + coverage guarantee | Opus | 3 | WU-GRAM-01 | Phase 2 |
| WU-GRAM-06 | Per-site memory (re-audit differentiation) | Opus | 2 | WU-GRAM-05, WU-16 | Phase 2 |
| WU-GRAM-07 | Adaptive enrichment v2 (with unexpected silence) | Opus | 3 | WU-GRAM-01, WU-03 | Phase 2 |
| WU-GRAM-08 | API surface primitive registry | Codex | 2 | WU-GRAM-01 | Phase 3 |
| WU-GRAM-09 | MCP surface primitive registry | Codex | 2 | WU-GRAM-01 | Phase 3 |
| WU-GRAM-10 | CLI surface primitive registry | Codex | 2 | WU-GRAM-01 | Phase 3 |

**Total: 26 hours**

### 6.5 Acceptance Criteria

1. Composition engine generates valid scenarios for all registered surfaces.
2. Exclusion rules filter 100% of invalid combinations (tested against a known-invalid list).
3. Priority rules demonstrably increase selection probability of high-value scenarios (verified by Monte Carlo simulation of 10,000 selections).
4. Frequency tracking ensures no scenario is selected more than 2x the average frequency across 20+ audits of the same URL.
5. Re-audit of the same URL produces >70% novel scenarios (not run in the previous audit), while always including the canonical scenario.
6. Adaptive enrichment v2 correctly identifies and investigates "unexpected silence" dimensions.
7. Total scenario count across all surfaces exceeds 100,000 unique configurations.
8. Scenario selection is deterministic when a seed is provided.

### 6.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Grammar grows complex enough to have bugs in exclusion rules | MEDIUM | Property-based testing: generate 100,000 random scenarios, verify none match exclusion rules. |
| Priority rules create predictable bias | HIGH | Quarterly review of priority weights. A/B test: random vs. priority-weighted selection. Measure finding quality difference. |
| Frequency tracking creates storage burden | LOW | Estimated: 100 bytes per entry. 1,000 URLs x 1,000 scenarios = 100MB. Trivial. Prune entries older than 1 year. |
| Hidden dimensions seen as deceptive | MEDIUM | Framed as "emerging checks" in methodology docs. Findings from hidden dimensions are clearly labeled as "exploratory" and do not affect scores until promoted. |
| Cross-surface registries diverge in quality | MEDIUM | Web registry is mature (validated through N=1 dogfood). Other registries start minimal and grow based on real audit feedback. |

---

## Expert 7: Badge & Certification System

**James Moreau — Certification & Standards Body Expert**
*ISO 9001 lead auditor. Built certification programs for multiple industries. Expert in continuous compliance, badge fraud prevention, and verification protocols.*

### 7.1 Feature Specification

#### Purpose

Design the "Audited by Alien Eyes" badge and certification system. Badges are the viral trust signal that makes audit results visible outside the Alien Eyes platform. They must be: continuously verified (not a snapshot), fraud-resistant, tiered (not binary), and machine-readable (agents can verify badges programmatically).

#### How Real Certification Bodies Handle Continuous Compliance

Lessons from ISO, SOC 2, PCI DSS:

1. **Certification has a validity period** (typically 1-3 years). It is NOT a one-time stamp.
2. **Surveillance audits** happen between full recertifications (annual for ISO, continuous for PCI).
3. **Certification can be suspended** if the organization falls out of compliance between audits.
4. **Public registries** allow third parties to verify certification status.
5. **Certificate numbers** are unique and traceable.
6. **Scope is specific** — you're certified for a specific scope, not "everything you do."

#### Badge Tiers

```
TIER          CRITERIA                                    BADGE COLOR    VALIDITY
──────────────────────────────────────────────────────────────────────────────────
Verified      Score >= 50, no CRITICAL findings            Gray           30 days
Bronze        Score >= 65, no CRITICAL, ≤2 HIGH            Bronze         60 days
Silver        Score >= 75, no CRITICAL, no HIGH             Silver         60 days
Gold          Score >= 85, no CRITICAL, no HIGH,           Gold           90 days
              ≤3 MEDIUM total
Platinum      Score >= 90, no CRITICAL, no HIGH,           Platinum       90 days
              ≤2 MEDIUM, continuous monitoring active
```

**Key principle:** Badges expire. A badge is a CLAIM about current quality, not a record of past quality. Expired badges are visually distinct (grayed out with "Expired" overlay).

**Platinum requires continuous monitoring** because a static audit is a snapshot. Only continuous monitoring can support the claim "this product is currently high quality."

#### Badge Lifecycle

```
Audit completes → Score qualifies for tier
    │
    ▼
Badge issued (unique certificate ID)
    │
    ├── Active: displayed on site, verifiable via registry
    │
    ├── Approaching expiry (7 days before): email reminder to re-audit
    │
    ├── Expired: badge grayed out, registry shows "expired"
    │   └── Re-audit within 30 days of expiry: no gap in certification record
    │
    ├── Suspended: score dropped below tier threshold on re-audit or monitoring
    │   └── Badge removed, registry shows "suspended"
    │   └── Can be reinstated by passing a new audit at the tier threshold
    │
    └── Revoked: fraud detected or ToS violation
        └── Badge permanently removed, registry shows "revoked"
```

#### Badge Embedding

Builders embed the badge on their site as either an SVG image or a JS widget.

**SVG Badge (static):**

```html
<!-- Static SVG badge — shows tier at time of last audit -->
<a href="https://alieneyes.dev/verify/CERT-2026-abc123">
  <img src="https://alieneyes.dev/badge/CERT-2026-abc123.svg"
       alt="Audited by Alien Eyes — Gold"
       width="150" height="50" />
</a>
```

**JS Widget (dynamic, recommended):**

```html
<!-- Dynamic widget — live-verifies badge status -->
<script src="https://alieneyes.dev/widget.js"
        data-cert="CERT-2026-abc123"
        data-style="compact"    <!-- compact | full | minimal -->
        data-theme="light">     <!-- light | dark | auto -->
</script>
```

The JS widget:
1. Loads asynchronously (< 5KB gzipped)
2. Calls the verification API on page load
3. Renders the current badge status (active/expired/suspended)
4. Shows score, tier, and last audit date on hover
5. Links to the public verification page
6. Caches verification result for 1 hour (reduces API calls)

**Machine-readable verification (for agents):**

```html
<!-- JSON-LD in page head (added by widget or manually) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Review",
  "author": {
    "@type": "Organization",
    "name": "Alien Eyes",
    "url": "https://alieneyes.dev"
  },
  "itemReviewed": {
    "@type": "WebSite",
    "url": "https://example.com"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 85,
    "bestRating": 100,
    "worstRating": 0
  },
  "datePublished": "2026-03-15",
  "expires": "2026-06-15",
  "identifier": "CERT-2026-abc123"
}
</script>
```

#### Public Verification Page

`https://alieneyes.dev/verify/CERT-2026-abc123`

Displays:
- Badge tier and visual badge
- URL audited (with owner's permission)
- Score (satisfaction, human-native, agent-nativeness)
- Last audit date
- Badge expiration date
- Certification status (active/expired/suspended/revoked)
- Methodology version
- Dimension breakdown (if owner published it)
- "Audit your site" CTA

**Does NOT display:** Specific findings, evidence bundles, internal metadata.

#### Certification Registry API

```
GET /api/verify/:certId
Response:
{
  "certId": "CERT-2026-abc123",
  "url": "https://example.com",
  "status": "active",           // active | expired | suspended | revoked
  "tier": "gold",
  "score": 85,
  "issuedAt": "2026-03-15T...",
  "expiresAt": "2026-06-15T...",
  "lastAuditAt": "2026-03-15T...",
  "methodologyVersion": "v0.1",
  "verificationUrl": "https://alieneyes.dev/verify/CERT-2026-abc123"
}

GET /api/verify/domain/:domain
Response:
{
  "domain": "example.com",
  "certificates": [
    { "certId": "...", "url": "...", "status": "active", "tier": "gold" }
  ]
}
```

#### Fraud Prevention

| Threat | Mitigation |
|--------|-----------|
| Builder copies badge SVG and hosts locally | JS widget always verifies against live API. Static SVG has expiry metadata. Verification page is the source of truth. |
| Builder places badge on a different URL than the audited one | Badge is bound to a specific normalized URL. Verification page shows the audited URL. Widget checks `document.location` against the certified URL. |
| Builder modifies badge to show higher tier | SVG is generated server-side with signed parameters. Widget renders from API data. Tampering is visible on verification page. |
| Builder audits a clean version then changes the site | Badge expiration (30-90 days) limits this window. Continuous monitoring (Platinum) eliminates it. Random spot-checks for Gold+ badges (1/month). |
| Competitor audits a site to get a low-score badge and embarrass them | Badges are opt-in. Owner must explicitly request badge. Default private reports. |

#### Badge as Product Signal for Agents

Agents discovering tools can check for Alien Eyes certification:

```
Agent workflow:
1. Discover tool URL
2. GET /api/verify/domain/{domain}
3. If certified: trust signal (+)
4. If not certified: no signal (neutral, not negative)
5. If expired/suspended: caution signal

Integration with Rhumb:
- Alien Eyes badge status feeds Rhumb's trust layer
- AN Score incorporates certification status
- Certified tools rank higher in Rhumb discovery
```

### 7.2 Type Extensions

```typescript
interface Certificate {
  id: string;                          // "CERT-{year}-{hash}"
  userId: string;
  orgId?: string;
  auditId: string;
  url: string;
  normalizedUrl: string;
  domain: string;

  tier: BadgeTier;
  score: number;
  humanNativeScore: number;
  agentNativenessScore: number;

  status: CertificateStatus;
  issuedAt: string;
  expiresAt: string;
  lastVerifiedAt: string;

  // For suspension
  suspendedAt?: string;
  suspensionReason?: string;

  // For revocation
  revokedAt?: string;
  revocationReason?: string;

  methodologyVersion: string;
  monitorId?: string;                  // if linked to continuous monitoring
}

type BadgeTier = 'verified' | 'bronze' | 'silver' | 'gold' | 'platinum';
type CertificateStatus = 'active' | 'expired' | 'suspended' | 'revoked';

interface BadgeEmbed {
  certId: string;
  format: 'svg' | 'js-widget' | 'json-ld';
  style: 'compact' | 'full' | 'minimal';
  theme: 'light' | 'dark' | 'auto';
  embedCode: string;
}

interface CertificateVerification {
  certId: string;
  url: string;
  status: CertificateStatus;
  tier: BadgeTier;
  score: number;
  issuedAt: string;
  expiresAt: string;
  lastAuditAt: string;
  methodologyVersion: string;
  verificationUrl: string;
}
```

### 7.3 Database Schema Extensions

```sql
-- Certificates
CREATE TABLE certificates (
  id TEXT PRIMARY KEY,                 -- "CERT-2026-abc123"
  user_id UUID NOT NULL REFERENCES users(id),
  org_id UUID REFERENCES organizations(id),
  audit_id UUID NOT NULL REFERENCES audits(id),
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,

  tier TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  human_native_score NUMERIC(5,2),
  agent_nativeness_score NUMERIC(5,2),

  status TEXT NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,

  methodology_version TEXT NOT NULL,
  monitor_id UUID REFERENCES monitors(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certs_url ON certificates(normalized_url);
CREATE INDEX idx_certs_domain ON certificates(domain);
CREATE INDEX idx_certs_status ON certificates(status);
CREATE INDEX idx_certs_expiry ON certificates(expires_at) WHERE status = 'active';
CREATE INDEX idx_certs_user ON certificates(user_id);

-- Badge verification log (for fraud detection)
CREATE TABLE badge_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id TEXT NOT NULL REFERENCES certificates(id),
  requesting_url TEXT,                 -- URL where the badge is embedded
  requesting_ip TEXT,
  user_agent TEXT,
  result TEXT NOT NULL,                -- 'valid', 'expired', 'suspended', 'revoked', 'url_mismatch'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_badge_verify_cert ON badge_verifications(cert_id, created_at DESC);
CREATE INDEX idx_badge_verify_mismatch ON badge_verifications(result) WHERE result = 'url_mismatch';

-- RLS: certificates are publicly readable (verification), but only owner can manage
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY certs_public_read ON certificates FOR SELECT USING (true);
CREATE POLICY certs_owner_write ON certificates FOR ALL USING (user_id = auth.uid());
```

### 7.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-BADGE-01 | Certificates table, issuance logic, tier calculation | Codex | 3 | WU-03 (Synthesizer) | Phase 2 |
| WU-BADGE-02 | Certificate lifecycle (expiry, suspension, revocation) | Opus | 3 | WU-BADGE-01 | Phase 2 |
| WU-BADGE-03 | SVG badge generator (per-tier, signed) | Codex | 2 | WU-BADGE-01 | Phase 2 |
| WU-BADGE-04 | JS widget (< 5KB, async, cached verification) | Codex | 3 | WU-BADGE-01, WU-BADGE-03 | Phase 2 |
| WU-BADGE-05 | Public verification page | Codex | 2 | WU-BADGE-01 | Phase 2 |
| WU-BADGE-06 | Verification API (`GET /api/verify/:certId`) | Codex | 1 | WU-BADGE-01 | Phase 2 |
| WU-BADGE-07 | JSON-LD structured data generation | Codex | 1 | WU-BADGE-01 | Phase 2 |
| WU-BADGE-08 | Fraud detection (URL mismatch logging, spot-check scheduler) | Opus | 3 | WU-BADGE-01, WU-MON-02 | Phase 3 |
| WU-BADGE-09 | Rhumb integration (badge status feeds trust layer) | Opus | 2 | WU-BADGE-06 | Phase 3 |
| WU-BADGE-10 | Badge embed page in dashboard (copy embed code) | Codex | 2 | WU-BADGE-03, WU-BADGE-04 | Phase 2 |

**Total: 22 hours**

### 7.5 Acceptance Criteria

1. Audit completion at qualifying score automatically offers badge issuance (opt-in).
2. Badge correctly calculates tier based on score, CRITICAL count, HIGH count, MEDIUM count, and monitoring status.
3. Expired badges are visually distinct (grayed out) in both SVG and JS widget.
4. JS widget loads in < 200ms, is < 5KB gzipped, and caches verification for 1 hour.
5. Verification API returns correct status for all lifecycle states (active, expired, suspended, revoked).
6. Widget detects URL mismatch (badge embedded on wrong URL) and logs it for fraud detection.
7. Public verification page displays badge info without exposing specific findings.
8. JSON-LD is valid schema.org markup verifiable by Google's Rich Results tester.
9. Badge expiry reminder email sends 7 days before expiration.

### 7.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Badge perceived as "pay to play" (buy high score) | HIGH | Methodology is published and public. Score is deterministic (for a given site state). Cannot buy a score — only improve your product. |
| Badge widget causes performance issues on embedded sites | MEDIUM | Widget is < 5KB, async, cached. Performance budget: < 50ms impact on page load. Test with Lighthouse. |
| Low badge adoption | MEDIUM | Default prompt after every qualifying audit. Embed code copy is one click. Badge is free for all paid tiers. |
| Certificate ID enumeration (crawl all certificates) | LOW | Certificate IDs are random hashes, not sequential. Rate-limit verification API (60/min per IP). |
| Badge expiry creates negative perception ("my badge expired") | MEDIUM | Framing: "Your badge is renewable" not "your badge expired." Re-audit prompt is positive ("keep your quality current"). |

---

## Expert 8: Cross-Product Pattern Database

**Dr. Sophia Torres — Data Platform Architect & ML Engineer**
*Built recommendation systems and data platforms at Netflix and Spotify. Expert in similarity matching, privacy-preserving analytics, and ML at scale.*

### 8.1 Feature Specification

#### Purpose

Design the cross-product pattern database at scale. This is the data moat described in ADR-016: every finding from every audit is anonymized and stored as a pattern. Patterns enable: stack-specific benchmarking ("67% of Next.js sites have this issue"), false positive prediction, probable origin mapping, and the Rhumb AN Score integration.

#### Pattern Extraction Algorithm

Every finding is transformed into an anonymized pattern:

```pseudocode
function extractPattern(finding: Finding, audit: Audit): PatternCandidate:
  // Step 1: Anonymize — remove all site-specific information
  anonymizedWhat = anonymize(finding.what):
    - Replace URLs with "[URL]"
    - Replace domain names with "[DOMAIN]"
    - Replace email addresses with "[EMAIL]"
    - Replace API keys/tokens with "[SECRET]"
    - Replace unique identifiers (UUIDs, IDs) with "[ID]"
    - Preserve: dimension, severity, structural description

  anonymizedWhere = anonymize(finding.where):
    - Replace specific paths with path patterns
      "/blog/my-post-about-ai" → "/blog/[slug]"
      "/products/123" → "/products/[id]"
    - Preserve: path structure, page type

  // Step 2: Generate fingerprint
  fingerprint = SHA256(
    normalize(anonymizedWhat) +
    finding.dimension +
    finding.severity
  )

  // Step 3: Extract stack context
  stackTags = audit.detectedStack.map(normalizeStackTag)
  // e.g., ['next.js', 'react', 'tailwind', 'vercel']

  // Step 4: Classify pattern
  patternCategory = classifyPattern(anonymizedWhat, finding.dimension):
    // e.g., "canonical-url-misconfiguration", "missing-alt-text", "no-csp-header"

  return {
    fingerprint: fingerprint,
    anonymizedWhat: anonymizedWhat,
    anonymizedWhere: anonymizedWhere,
    dimension: finding.dimension,
    severity: finding.severity,
    category: patternCategory,
    stackTags: stackTags,
    surface: audit.surface_type
  }
```

#### Similarity Matching

When is finding A on site X the "same pattern" as finding B on site Y?

```pseudocode
function findingSimilarity(a: PatternCandidate, b: PatternCandidate): number:
  // Fast check: exact fingerprint match
  if a.fingerprint == b.fingerprint: return 1.0

  // Must be same dimension
  if a.dimension != b.dimension: return 0.0

  // Semantic similarity of anonymized 'what' field
  whatSimilarity = cosineSimilarity(
    embed(a.anonymizedWhat),
    embed(b.anonymizedWhat)
  )

  // Category match bonus
  categoryBonus = a.category == b.category ? 0.2 : 0.0

  // Severity match bonus
  severityBonus = a.severity == b.severity ? 0.1 : 0.0

  return min(whatSimilarity + categoryBonus + severityBonus, 1.0)


// When to consider findings the "same pattern":
// similarity >= 0.85 → merge into existing pattern
// similarity >= 0.70 → flag for human review (might be same, might not)
// similarity < 0.70 → treat as distinct pattern
```

**Embedding model:** Use a lightweight embedding model (e.g., `text-embedding-3-small` from OpenAI, or a local model). Embed anonymized `what` field only. Store embeddings for fast similarity search.

**Indexing:** Use pgvector extension in Supabase for approximate nearest neighbor search on pattern embeddings.

#### Stack-Specific Pattern Clustering

```pseudocode
function clusterByStack(patterns):
  // Group patterns by stack tags
  stackGroups = {}
  for pattern in patterns:
    for tag in pattern.stackTags:
      stackGroups[tag] = stackGroups[tag] || []
      stackGroups[tag].push(pattern)

  // Calculate per-stack frequency
  stackBenchmarks = {}
  for stack, stackPatterns in stackGroups:
    totalAudits = countAuditsWithStack(stack)
    for pattern in unique(stackPatterns, by: fingerprint):
      frequency = countOccurrences(pattern.fingerprint, stack)
      stackBenchmarks[stack] = stackBenchmarks[stack] || []
      stackBenchmarks[stack].push({
        pattern: pattern,
        frequency: frequency,
        percentage: frequency / totalAudits * 100,
        // "67% of Next.js sites have this issue"
        label: `${round(frequency / totalAudits * 100)}% of ${stack} sites have this issue`
      })

  return stackBenchmarks
```

#### Benchmarking Outputs

Patterns feed three kinds of benchmarks:

**1. Stack benchmarks** (public, anonymized):
```
"67% of Next.js sites are missing OG image tags"
"42% of WordPress sites have render-blocking resources >3"
"89% of Shopify sites have platform-limited accessibility issues"
```

**2. Dimension benchmarks** (public, anonymized):
```
"Median SEO score for SaaS products: 72"
"Median agent-nativeness score for API-first products: 58"
"Most common CRITICAL finding: canonical URL misconfiguration (23%)"
```

**3. Comparative benchmarks** (per-audit, personalized):
```
"Your SEO score (82) is in the 73rd percentile for Next.js sites"
"Your agent-nativeness score (65) is above average for SaaS products"
"3 of your 5 findings are among the 10 most common Next.js issues"
```

#### Pattern-to-Probable-Origin Mapping

Over time, patterns can be mapped to probable root causes:

```pseudocode
function mapProbableOrigin(pattern):
  // Based on accumulated data:
  // - Which stack tags are associated with this pattern?
  // - Is it always present on a specific platform? → platform limitation
  // - Is it always absent after a specific fix? → known fix exists
  // - Does it correlate with other patterns? → shared root cause

  origins = []

  // Platform correlation
  platformPatterns = pattern.occurrences.filter(o =>
    o.stackTags.some(t => PLATFORMS.includes(t))
  )
  if platformPatterns.length > 0.8 * pattern.totalOccurrences:
    origins.push({
      type: 'platform_limitation',
      platform: dominantPlatform(platformPatterns),
      confidence: platformPatterns.length / pattern.totalOccurrences
    })

  // Stack correlation
  stackCorrelation = calculateStackCorrelation(pattern)
  if stackCorrelation.topStack and stackCorrelation.confidence > 0.6:
    origins.push({
      type: 'stack_default',
      stack: stackCorrelation.topStack,
      confidence: stackCorrelation.confidence
    })

  // Co-occurrence with other patterns
  cooccurring = findCooccurringPatterns(pattern, threshold = 0.7)
  if cooccurring.length > 0:
    origins.push({
      type: 'shared_root_cause',
      relatedPatterns: cooccurring.map(p => p.fingerprint),
      confidence: 0.5  // co-occurrence doesn't prove causation
    })

  return origins
```

#### False Positive Prediction (ML)

After accumulating sufficient FP data, train a model to predict which findings are likely false positives:

```pseudocode
function trainFPPredictor():
  // Features per finding:
  features = [
    'dimension',              // categorical
    'severity',               // categorical
    'confidence',             // numeric
    'stack_tags',             // multi-label
    'pattern_frequency',      // how common is this pattern
    'pattern_fp_rate',        // historical FP rate for this pattern
    'page_type',              // homepage, blog, pricing, etc.
    'has_evidence_screenshot', // boolean
    'evidence_completeness',  // numeric
    'finding_word_count',     // length of 'what' field
  ]

  // Labels: 1 = confirmed FP, 0 = not FP (accepted or fixed)
  trainingData = getResolvedFindings(minSampleSize = 1000)

  model = trainLogisticRegression(trainingData, features)
  // Start simple. Logistic regression is interpretable.
  // Upgrade to gradient boosting when data > 10,000.

  // Validation: 5-fold cross-validation, target AUC > 0.80
  validate(model, trainingData, folds = 5)

  return model


function predictFP(finding, model):
  features = extractFeatures(finding)
  probability = model.predict(features)

  if probability > 0.7:
    finding.fpPrediction = {
      probability: probability,
      label: 'likely_false_positive',
      recommendation: 'Flag for manual review before delivery'
    }
  return finding
```

**When to deploy:** Only after 1,000+ resolved findings with FP/not-FP labels. Estimated: Month 6-9 post-launch. Until then, use historical pattern FP rate as a simple heuristic.

#### Rhumb Integration

Alien Eyes patterns feed Rhumb's AN Score across several dimensions:

```
Pattern Database → Rhumb Integration Points:

1. Parity coverage maps
   - For each audited product: which API endpoints exist vs which UI features exist
   - Aggregated: "average parity gap for SaaS products: 35%"
   - Feeds Rhumb's Parity dimension

2. Schema fingerprints
   - Response schema hashes tracked over time
   - Schema changes detected between audits
   - Feeds Rhumb's Schema Stability dimension

3. Token cost benchmarks
   - How many tokens does it take to accomplish X via this tool's MCP/API?
   - Benchmarked against competing tools in the same category
   - Feeds Rhumb's Token Cost dimension (viral free product)

4. Error handling quality
   - Pattern of error responses across audited APIs/MCPs
   - Structured vs unstructured errors
   - Feeds Rhumb's Error Handling dimension

5. Stack-level insights
   - "Next.js sites average 72% agent-nativeness vs 45% for WordPress"
   - Category-level quality signals for Rhumb directory
```

#### Privacy-Preserving Analytics

**Principle:** Patterns are anonymized before storage. No pattern should be traceable back to a specific site.

```pseudocode
function validateAnonymization(pattern):
  // Checks:
  checks = [
    !containsURL(pattern.anonymizedWhat),
    !containsDomain(pattern.anonymizedWhat),
    !containsEmail(pattern.anonymizedWhat),
    !containsIPAddress(pattern.anonymizedWhat),
    !containsUUID(pattern.anonymizedWhat),
    !containsAPIKey(pattern.anonymizedWhat),
    pattern.anonymizedWhere matches /^\/[a-z\-\[\]\/\*]+$/,  // path pattern, not literal
  ]

  if !all(checks):
    throw AnonymizationFailure(pattern)
    // Pattern is NOT stored. Logged for review.

  return true
```

**Data retention:**
- Patterns: indefinite (they're anonymized)
- Pattern embeddings: indefinite
- Pattern-to-audit links: 90 days, then deleted (prevents tracing)
- Aggregate stats: indefinite
- Individual occurrence records: 90 days

**DSAR (Data Subject Access Request) handling:**
- Patterns are anonymized and cannot be linked to specific sites after 90 days
- Within 90 days: pattern-to-audit link enables deletion if requested
- Deletion removes the link, not the anonymous pattern itself

### 8.2 Type Extensions

```typescript
interface Pattern {
  id: string;
  fingerprint: string;                 // SHA-256 hash for dedup
  anonymizedWhat: string;
  anonymizedWhere: string;
  dimension: AuditDimension;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;                    // e.g., "canonical-url-misconfiguration"
  surface: AuditSurface;

  // Frequency
  totalOccurrences: number;
  stackOccurrences: Record<string, number>; // stack tag → count
  firstSeenAt: string;
  lastSeenAt: string;

  // Probable origins
  probableOrigins: ProbableOrigin[];

  // False positive data
  totalDisputeCount: number;
  confirmedFPCount: number;
  fpRate: number;                      // confirmedFP / totalOccurrences

  // Embedding (for similarity search)
  embedding?: number[];                // vector for pgvector

  // Rhumb integration
  rhumbDimensions?: string[];          // which Rhumb dimensions this pattern informs
}

interface ProbableOrigin {
  type: 'platform_limitation' | 'stack_default' | 'shared_root_cause' | 'common_mistake';
  detail: string;                      // e.g., "Shopify", "Next.js default config"
  confidence: number;
  relatedPatterns?: string[];          // fingerprints of related patterns
}

interface StackBenchmark {
  stack: string;
  totalAudits: number;
  patterns: StackPatternFrequency[];
  medianScores: Record<AuditDimension, number>;
  updatedAt: string;
}

interface StackPatternFrequency {
  patternFingerprint: string;
  category: string;
  dimension: AuditDimension;
  severity: string;
  frequency: number;
  percentage: number;
  label: string;                       // human-readable benchmark label
}

interface ComparativeBenchmark {
  auditId: string;
  stack: string[];
  surface: AuditSurface;
  percentiles: Record<AuditDimension, number>;
  commonPatterns: {
    pattern: string;
    isCommonForStack: boolean;         // true if >50% of stack has this
    yourFinding?: Finding;             // matching finding in your audit, if any
  }[];
}

interface FPPrediction {
  findingId: string;
  probability: number;
  label: 'likely_false_positive' | 'probably_real' | 'uncertain';
  factors: string[];                   // which features contributed most
}
```

### 8.3 Database Schema Extensions

```sql
-- Extended patterns table (replaces the simpler version in SCHEMA.md)
-- The original patterns table remains; these columns are additions
ALTER TABLE patterns ADD COLUMN category TEXT;
ALTER TABLE patterns ADD COLUMN surface TEXT DEFAULT 'web';
ALTER TABLE patterns ADD COLUMN anonymized_where TEXT;
ALTER TABLE patterns ADD COLUMN stack_occurrences JSONB DEFAULT '{}';
ALTER TABLE patterns ADD COLUMN probable_origins JSONB DEFAULT '[]';
ALTER TABLE patterns ADD COLUMN total_dispute_count INT DEFAULT 0;
ALTER TABLE patterns ADD COLUMN confirmed_fp_count INT DEFAULT 0;
ALTER TABLE patterns ADD COLUMN fp_rate NUMERIC(4,3) DEFAULT 0;
ALTER TABLE patterns ADD COLUMN embedding vector(1536);   -- pgvector
ALTER TABLE patterns ADD COLUMN rhumb_dimensions TEXT[] DEFAULT '{}';

-- pgvector index for similarity search
CREATE INDEX idx_patterns_embedding ON patterns USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_surface ON patterns(surface);

-- Pattern occurrence links (temporary, deleted after 90 days)
CREATE TABLE pattern_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES patterns(id),
  audit_id UUID NOT NULL REFERENCES audits(id),
  finding_id UUID NOT NULL REFERENCES findings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '90 days'
);

CREATE INDEX idx_pattern_occ_pattern ON pattern_occurrences(pattern_id);
CREATE INDEX idx_pattern_occ_expiry ON pattern_occurrences(expires_at);

-- Stack benchmarks (materialized)
CREATE TABLE stack_benchmarks (
  stack TEXT NOT NULL,
  surface TEXT NOT NULL,
  total_audits INT NOT NULL DEFAULT 0,
  pattern_frequencies JSONB NOT NULL DEFAULT '[]',
  median_scores JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (stack, surface)
);

-- FP prediction model metadata
CREATE TABLE fp_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  training_size INT NOT NULL,
  auc_score NUMERIC(4,3),
  features JSONB NOT NULL,
  model_artifact_path TEXT NOT NULL,   -- Supabase Storage path
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rhumb export queue
CREATE TABLE rhumb_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL,           -- 'parity_map', 'schema_fingerprint', 'token_benchmark', 'error_quality'
  data JSONB NOT NULL,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rhumb_exports_pending ON rhumb_exports(exported_at) WHERE exported_at IS NULL;
```

### 8.4 Work Unit Specifications

| WU | Description | Agent | Hours | Dependencies | Phase |
|----|-------------|-------|-------|--------------|-------|
| WU-PAT-01 | Pattern extraction + anonymization pipeline | Opus | 4 | WU-03 (Synthesizer) | Phase 1 |
| WU-PAT-02 | Anonymization validation + test suite | Codex | 2 | WU-PAT-01 | Phase 1 |
| WU-PAT-03 | Pattern embedding generation + pgvector setup | Opus | 3 | WU-PAT-01 | Phase 2 |
| WU-PAT-04 | Similarity matching (pgvector ANN search) | Opus | 3 | WU-PAT-03 | Phase 2 |
| WU-PAT-05 | Stack-specific clustering + benchmark generation | Opus | 4 | WU-PAT-01 | Phase 2 |
| WU-PAT-06 | Comparative benchmark generation (per-audit) | Codex | 3 | WU-PAT-05 | Phase 2 |
| WU-PAT-07 | Pattern-to-probable-origin mapping | Opus | 3 | WU-PAT-04, WU-PAT-05 | Phase 3 |
| WU-PAT-08 | FP prediction model training pipeline | Opus | 5 | WU-PAT-01, WU-16 (FP data) | Phase 3 |
| WU-PAT-09 | Rhumb export pipeline (parity, schema, token, error) | Opus | 4 | WU-PAT-05 | Phase 3 |
| WU-PAT-10 | Pattern occurrence cleanup job (90-day retention) | Codex | 1 | WU-PAT-01 | Phase 2 |
| WU-PAT-11 | Public benchmark API endpoints | Codex | 2 | WU-PAT-05 | Phase 3 |
| WU-PAT-12 | Dashboard: comparative benchmark display | Codex | 3 | WU-PAT-06 | Phase 3 |

**Total: 37 hours**

### 8.5 Acceptance Criteria

1. Pattern extraction anonymizes all URLs, domains, emails, and identifiers. Validated by anonymization test suite with 100+ edge cases.
2. No pattern in the database contains a literal URL, domain, or personally identifiable information (automated scan).
3. Pattern similarity matching with pgvector returns the correct top-5 similar patterns with < 100ms latency.
4. Similarity threshold of 0.85 correctly merges patterns that describe the same issue (tested against 50 hand-labeled pairs).
5. Stack benchmarks update within 1 hour of new audit completion.
6. Comparative benchmarks appear in audit results when sufficient benchmark data exists (>= 50 audits for the relevant stack).
7. Pattern occurrence links are automatically deleted after 90 days.
8. FP prediction model achieves AUC > 0.80 on held-out test set (when sufficient data exists).
9. Rhumb export pipeline delivers data within 24 hours of audit completion.

### 8.6 Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Anonymization failure leaks site-specific data | CRITICAL | Every pattern passes validateAnonymization() before storage. Failed patterns logged but not stored. Monthly anonymization audit. |
| Pattern similarity produces too many false merges | HIGH | Conservative threshold (0.85). Log all merges. Human review of first 100 merges. Adjust threshold based on review. |
| pgvector performance degrades at scale | MEDIUM | IVF index with 100 lists handles 1M+ vectors. Re-index when pattern count exceeds 500K. Consider pgvector alternatives (Pinecone) at 10M+. |
| Insufficient data for FP prediction | MEDIUM | Do not deploy model until 1,000+ resolved findings. Use simple heuristic (pattern historical FP rate) as interim. |
| Benchmark data biased by early adopter distribution | HIGH | Clearly label sample sizes on all benchmarks. "Based on N audits" displayed alongside every benchmark. Minimum N=50 before displaying. |
| Pattern database becomes a competitive intelligence tool | MEDIUM | Patterns are fully anonymized. Stack benchmarks are aggregate statistics. No per-site data exposed. Cannot reverse-engineer which site produced a pattern after 90 days. |

---

## Cross-Panel Synthesis

### 9.1 Platform Architecture Map

```
                    ┌─────────────────────────────────────────────┐
                    │              DELIVERY SURFACES              │
                    │                                             │
                    │  Web Dashboard  CLI  MCP Server  REST API   │
                    │  GitHub Action  GitLab CI  Webhook  Badge   │
                    └─────────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────┐
                    │           PRESENTATION LAYER                │
                    │                                             │
                    │  Format A (HTML)  Format B (Clipboard)      │
                    │  Format C (File-aware)  Format JSON         │
                    │  SARIF  JUnit  PDF  PR Comment              │
                    │  Badge SVG  JS Widget  JSON-LD              │
                    └─────────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────┐
                    │           ORCHESTRATION LAYER               │
                    │                                             │
                    │  Audit Pipeline  Monitor Scheduler          │
                    │  CI Coordinator  Multi-Run Orchestrator     │
                    │  Badge Lifecycle  Alert Engine               │
                    └─────────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────┐
                    │            CORE AUDIT ENGINE                │
                    │                                             │
                    │  URL Validator  →  Crawl Engine             │
                    │  Page Summarizer  →  Persona Pipeline       │
                    │  Scenario Grammar  →  Audit Primitives      │
                    │  BH Correction  →  Synthesizer              │
                    │  Methodology Router  →  Renderers           │
                    └─────────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────┐
                    │            DATA & INTELLIGENCE              │
                    │                                             │
                    │  Supabase (core)  Pattern Database          │
                    │  Persona Calibration  Scenario Frequencies  │
                    │  Health Snapshots  Stack Benchmarks         │
                    │  FP Prediction Model  Surface Benchmarks    │
                    │  Methodology Registry  Certificate Registry │
                    └─────────────────────┬───────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────┐
                    │            EXTERNAL INTEGRATIONS            │
                    │                                             │
                    │  Rhumb (AN Scores)  GitHub (PR checks)      │
                    │  Slack  PagerDuty  Email (Resend)           │
                    │  Stripe (billing)  Supabase Auth            │
                    └─────────────────────────────────────────────┘
```

### 9.2 Shared Infrastructure

These subsystems are used by multiple features and should be built once:

| Infrastructure | Used By | Build Phase |
|----------------|---------|-------------|
| **Pattern Database** | Benchmarks, FP prediction, Rhumb integration, comparative reports, badge validation | Phase 1-2 |
| **Methodology Router** | Core audit, CI/CD mode, monitoring, multi-run, A/B testing | Phase 1 |
| **Alert Delivery Engine** | Monitoring alerts, badge expiry, CI/CD notifications | Phase 2 |
| **Deterministic Seed System** | CI/CD, persona selection, scenario selection, multi-run | Phase 1-2 |
| **Finding Similarity Engine** | Multi-run consensus, pattern dedup, regression detection, FP prediction | Phase 2 |
| **Org/Team RBAC** | Enterprise features, monitoring, badge management, audit trail | Phase 3 |
| **Scheduled Job System** | Monitoring, badge expiry, pattern cleanup, benchmark refresh | Phase 2 |

### 9.3 Phase-Specific Build Sequence

```
PHASE 1: Foundation (existing WU-00 through WU-20)
├── Core audit pipeline (Crawl → Primitives → Synthesis → Render)
├── WU-PER-01: Context Extractor (persona, deterministic)
├── WU-PER-09: Quick Check fixed personas
├── WU-PAT-01: Pattern extraction + anonymization
├── WU-PAT-02: Anonymization validation
├── WU-GRAM-01: Scenario grammar engine (shared)
├── WU-GRAM-02: Web surface registry (expanded)
├── WU-GRAM-03: Exclusion rules
├── WU-GRAM-04: Priority rules
├── WU-METH-05: Gauge R&R validation harness
└── [GATE 1-5 from existing plan]

PHASE 2: Platform Layer
├── Monitoring
│   ├── WU-MON-01: Monitors table + API
│   ├── WU-MON-02: Monitor scheduler
│   ├── WU-MON-03: Health score calculation
│   ├── WU-MON-04: Alert evaluation engine
│   ├── WU-MON-05: Alert delivery (email + webhook)
│   └── WU-MON-07: Temporal finding tracking
├── CI/CD
│   ├── WU-CI-01: CI audit endpoint
│   ├── WU-CI-02: Deterministic mode
│   ├── WU-CI-03: Threshold evaluation
│   ├── WU-CI-04: SARIF output
│   ├── WU-CI-05: JUnit output
│   ├── WU-CI-06: GitHub Action
│   ├── WU-CI-07: PR comment posting
│   ├── WU-CI-08: Config parser
│   ├── WU-CI-09: Regression detection
│   ├── WU-CI-10: Ignored findings
│   └── WU-CI-12: Wait-for-URL
├── Personas
│   ├── WU-PER-02: Audience Inferrer
│   ├── WU-PER-03: Candidate Generator
│   ├── WU-PER-04: Panel Selector
│   ├── WU-PER-05: Scenario Generator
│   ├── WU-PER-06: Hypothesis Generator
│   ├── WU-PER-07: Calibration feedback loop
│   └── WU-PER-08: Deterministic mode
├── Badges
│   ├── WU-BADGE-01: Certificates table + issuance
│   ├── WU-BADGE-02: Certificate lifecycle
│   ├── WU-BADGE-03: SVG badge generator
│   ├── WU-BADGE-04: JS widget
│   ├── WU-BADGE-05: Verification page
│   ├── WU-BADGE-06: Verification API
│   ├── WU-BADGE-07: JSON-LD generation
│   └── WU-BADGE-10: Dashboard embed page
├── Methodology
│   ├── WU-METH-01: Version registry
│   ├── WU-METH-02: BH correction
│   ├── WU-METH-03: Multi-run orchestrator
│   └── WU-METH-04: Finding clustering
├── Patterns
│   ├── WU-PAT-03: Embeddings + pgvector
│   ├── WU-PAT-04: Similarity matching
│   ├── WU-PAT-05: Stack clustering + benchmarks
│   ├── WU-PAT-06: Comparative benchmarks
│   └── WU-PAT-10: Occurrence cleanup
├── Grammar
│   ├── WU-GRAM-05: Frequency tracking
│   ├── WU-GRAM-06: Per-site memory
│   └── WU-GRAM-07: Adaptive enrichment v2
└── [GATE 6: Platform review]

PHASE 3: Scale & Enterprise
├── Enterprise
│   ├── WU-ENT-01 through WU-ENT-07 (org, RBAC, SSO, audit trail, white-label)
├── Monitoring (advanced)
│   ├── WU-MON-06: Slack + PagerDuty
│   ├── WU-MON-08: Dashboard UI
│   ├── WU-MON-09: SLO configuration UI
│   └── WU-MON-10: Portfolio health view
├── CI/CD (advanced)
│   └── WU-CI-11: GitLab CI + generic webhook
├── Badges (advanced)
│   ├── WU-BADGE-08: Fraud detection
│   └── WU-BADGE-09: Rhumb integration
├── Methodology (advanced)
│   ├── WU-METH-06: A/B test framework
│   ├── WU-METH-07: Surface benchmark collection
│   └── WU-METH-08: Cross-surface normalization
├── Patterns (advanced)
│   ├── WU-PAT-07: Probable origin mapping
│   ├── WU-PAT-08: FP prediction model
│   ├── WU-PAT-09: Rhumb export pipeline
│   ├── WU-PAT-11: Public benchmark API
│   └── WU-PAT-12: Benchmark dashboard
├── Grammar (surfaces)
│   ├── WU-GRAM-08: API surface registry
│   ├── WU-GRAM-09: MCP surface registry
│   └── WU-GRAM-10: CLI surface registry
└── [GATE 7: Enterprise + scale review]

PHASE 4: Advanced Enterprise
├── WU-ENT-08: Dedicated worker pools
├── WU-ENT-09: Data residency routing
├── WU-ENT-10: Custom dimension config UI
└── [GATE 8: Full platform review]
```

### 9.4 Enterprise Tier Design

| Feature | Team ($99-199/mo) | Enterprise (Custom) |
|---------|-------------------|---------------------|
| Team accounts | Up to 10 seats | Unlimited seats |
| Roles | Admin, Auditor, Viewer | + Custom roles |
| SSO | GitHub OAuth only | SAML + OIDC |
| Audit trail | 1-year retention | 7-year retention |
| Custom dimensions | No | Yes |
| White-label reports | No | Yes |
| Data residency | US only | US, EU, AP |
| Worker pool | Shared | Dedicated |
| SLA | Best effort | 99.9% uptime, 4h response |
| Monitoring | Standard tier included | Pro tier included |
| CI/CD | Included | Included + priority queue |
| Badge | Standard | Custom branding |
| Support | Email | Dedicated Slack channel |
| Compliance reports | No | SOC 2 mapping, ISO 27001 mapping |

**Enterprise pricing:** $500-2,000/mo base + per-audit usage. Estimated: 3-5 enterprise customers in first year = $30K-120K ARR from enterprise alone.

### 9.5 Monitoring Product Design

**Positioning:** "Alien Eyes watches your product 24/7 so you don't have to."

**Core loop:**
```
Monitor configured → Scheduled audit runs → Delta calculated → Health score updated
    → If alert condition met → Alert delivered → Builder fixes → Next audit → Score improves
```

**Differentiation from uptime monitoring (Pingdom, UptimeRobot):**
- Uptime monitoring: "Is the site up?" (binary)
- Alien Eyes monitoring: "Is the site GOOD?" (multi-dimensional quality)

**Key insight from Dr. Webb:** The temporal finding categories (emerging_risk, degradation_signal, regression, flapping) are the core value. A static score is table stakes. Trend detection is the product.

### 9.6 Integration Surface Map

All delivery surfaces share the same core engine. Here is how they differ:

```
                        Core Engine Output: SynthesisResult
                                     │
          ┌──────────┬───────────┬───┴───┬──────────┬──────────┐
          │          │           │       │          │          │
       Web UI      CLI        MCP    REST API   GitHub    Badge
          │          │           │       │      Action      │
     ┌────┴────┐     │       ┌──┴──┐    │     ┌──┴──┐      │
   Format A  Copy  Format B  JSON  Tools JSON  SARIF  SVG/Widget
   Dashboard  B    to stdout       MCP   API   JUnit  Verify API
   Progress      Exit code       tools  GET    PR
   page           0/1/2                 POST  Comment
```

| Surface | Auth | Output Format | Cost Model | Deterministic? |
|---------|------|--------------|------------|----------------|
| Web Dashboard | Session (Supabase) | Format A (HTML) | Per-audit | Probabilistic |
| CLI (local) | ANTHROPIC_API_KEY | Format B (stdout) | User's API key | Configurable |
| CLI (cloud) | ALIEN_EYES_API_KEY | Format B (stdout) | Per-audit | Configurable |
| MCP Server | API key | Format JSON | Per-audit | Configurable |
| REST API | API key | JSON | Per-audit | Configurable |
| GitHub Action | API key (secret) | SARIF + JUnit + PR comment | Monthly plan | Deterministic (default) |
| Badge Widget | Public (verification) | SVG / JS | Free (included) | N/A |

### 9.7 Pattern Database as Foundation

The cross-product pattern database is the single most important infrastructure component for long-term product value. It feeds:

1. **Benchmarking** (Expert 8) — "67% of Next.js sites have this issue"
2. **FP prediction** (Expert 8) — ML model trained on resolved findings
3. **Monitoring** (Expert 2) — cross-product regression detection
4. **Badges** (Expert 7) — comparative tier placement
5. **Methodology evolution** (Expert 5) — calibration data for weight adjustment
6. **Scenario grammar** (Expert 6) — cross-product calibration (common issue absent = investigate)
7. **Rhumb** (external) — AN Scores, token benchmarks, schema fingerprints
8. **Content marketing** (GTM) — findings-as-content, "most common mistakes" posts

**Build sequence:** Pattern extraction (WU-PAT-01) must be in Phase 1. It is the earliest possible start of data accumulation. Every audit that runs without pattern extraction is lost data.

### 9.8 Total Work Unit Estimates

| Domain | Work Units | Total Hours | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|-----------|-------------|---------|---------|---------|---------|
| Enterprise | 10 | 33h | — | — | 24h | 9h |
| Monitoring | 10 | 33h | — | 20h | 13h | — |
| CI/CD | 12 | 28h | — | 25h | 3h | — |
| Personas | 9 | 26h | 4h | 22h | — | — |
| Methodology | 8 | 28h | 4h | 15h | 9h | — |
| Scenario Grammar | 10 | 26h | 9h | 8h | 6h | 3h |
| Badges | 10 | 22h | — | 17h | 5h | — |
| Patterns | 12 | 37h | 6h | 17h | 14h | — |
| **TOTAL** | **81** | **233h** | **23h** | **124h** | **74h** | **12h** |

**Combined with existing plan (25 WUs, ~100h):**
- **Total WUs:** 106
- **Total Hours:** ~333h
- **Phase 1:** ~123h (existing 100h + 23h platform foundation)
- **Phase 2:** ~124h (platform layer)
- **Phase 3:** ~74h (scale + enterprise)
- **Phase 4:** ~12h (advanced enterprise)

**Agent split:**
- Opus 4.6: ~185h (complex architecture, LLM integration, algorithms, security)
- Codex 5.4: ~110h (deterministic modules, UI, CRUD, API routes)
- Human review: ~10h (8 gates x 30 min + methodology reviews)

### 9.9 Critical Risks

| # | Risk | Domain | Severity | Mitigation |
|---|------|--------|----------|------------|
| 1 | **Multi-tenancy RLS data leak** | Enterprise | CRITICAL | Comprehensive test suite. Cross-org penetration test. Every RLS policy tested with unauthorized user. |
| 2 | **Pattern anonymization failure** | Patterns | CRITICAL | Every pattern validated before storage. Monthly automated anonymization audit. Failed patterns blocked, logged, reviewed. |
| 3 | **Monitoring COGS exceed subscription price** | Monitoring | HIGH | Default daily=Quick Check ($0.10), weekly=Full Audit ($2.50). Monthly COGS per URL: ~$13. Price: $29-59/mo. Margins tight but positive. |
| 4 | **Gauge R&R fails for LLM dimensions** | Methodology | HIGH | Run GR&R before alpha. If >30% variance: lower temperature, tighten prompts, constrain evaluation. Worst case: mark dimension as "indicative." |
| 5 | **CI/CD cost explosion** | CI/CD | HIGH | Default Quick Check ($0.10) in CI. Full Audit requires explicit opt-in. Monthly CI plans include N audits with overage pricing. |

### 9.10 New ADRs Required

| ADR | Title | Decision |
|-----|-------|----------|
| ADR-017 | Multi-tenancy via RLS + org_id | All org-scoped data uses org_id foreign key + RLS policies. No schema-per-tenant. |
| ADR-018 | Monitoring as Quick Check + Full Audit combo | Daily monitoring uses Quick Check (cheap). Full Audit weekly. Prevents negative-margin monitoring. |
| ADR-019 | Badge expiration rather than perpetual | Badges expire (30-90 days by tier). Continuous monitoring extends validity. Snapshot badges are misleading. |
| ADR-020 | Pattern embeddings via pgvector | Use Supabase pgvector for pattern similarity search. Avoids external vector DB dependency. |
| ADR-021 | BH FDR correction in Synthesizer | Replace simpler multiplicity correction with Benjamini-Hochberg. Controls false discovery rate at 10%. |
| ADR-022 | Deterministic mode via seeded RNG | CI/CD and multi-run use seeded random for reproducibility. Seed = commit SHA in CI, run index in multi-run. |
| ADR-023 | Persona pipeline cost budget | Persona generation capped at 30% of audit LLM budget (~$0.30). Quick Check uses fixed personas. |
| ADR-024 | Scenario grammar per-surface registries | Each surface has its own primitive registry. Composition engine is shared. Surfaces can be added independently. |
| ADR-025 | Pattern-to-audit link retention (90 days) | Pattern occurrence links deleted after 90 days. Anonymous patterns retained indefinitely. Balances privacy with data utility. |

---

## Appendix: Database Schema Summary

### New Tables (12)

| Table | Expert | Phase | Purpose |
|-------|--------|-------|---------|
| organizations | Victoria Chen | 3 | Team/enterprise accounts |
| memberships | Victoria Chen | 3 | User-to-org membership with roles |
| audit_trail | Victoria Chen | 3 | Immutable compliance log |
| sso_secrets | Victoria Chen | 3 | Encrypted SSO certificates |
| monitors | Marcus Webb | 2 | Continuous monitoring configuration |
| health_snapshots | Marcus Webb | 2 | Rolling health score history |
| alerts | Marcus Webb | 2 | Alert records with delivery tracking |
| ci_ignored_findings | Ravi Patel | 2 | CI/CD finding suppression with expiry |
| persona_calibration | Anna Kowalski | 2 | Cross-audit persona performance tracking |
| audit_personas | Anna Kowalski | 2 | Per-audit persona records |
| certificates | James Moreau | 2 | Badge/certification registry |
| badge_verifications | James Moreau | 2 | Fraud detection log |

### New Tables (continued, 7)

| Table | Expert | Phase | Purpose |
|-------|--------|-------|---------|
| methodology_versions | David Chang | 2 | Methodology version registry |
| gauge_rr_runs | David Chang | 1 | Validation protocol results |
| methodology_ab_tests | David Chang | 3 | A/B test results |
| surface_benchmarks | David Chang | 3 | Per-surface score benchmarks |
| scenario_frequencies | Miyuki Suzuki | 2 | Per-URL scenario coverage tracking |
| surface_registries | Miyuki Suzuki | 1 | Per-surface grammar primitives |
| pattern_occurrences | Sophia Torres | 2 | Temporary pattern-to-audit links |

### Modified Existing Tables (5)

| Table | Changes | Expert(s) |
|-------|---------|-----------|
| audits | +org_id, +monitor_id, +ci_metadata, +ci_passed, +ci_thresholds, +deterministic_seed, +scenarios_run, +enrichment_triggered, +enrichment_targets, +run_number, +multi_run_group_id, +consensus_applied, +bh_correction_applied, +surface_type | All |
| findings | +persona_id, +scenario_id, +temporal_category, +first_seen_audit_id, +first_seen_at, +persistence_count, +was_ever_resolved, +resolved_at, +regressed_at | Webb, Kowalski |
| patterns | +category, +surface, +anonymized_where, +stack_occurrences, +probable_origins, +total_dispute_count, +confirmed_fp_count, +fp_rate, +embedding, +rhumb_dimensions | Torres |
| users | (no changes) | — |
| api_keys | (no changes) | — |

### Additional Tables (3, from Patterns/ML)

| Table | Expert | Phase | Purpose |
|-------|--------|-------|---------|
| stack_benchmarks | Sophia Torres | 2 | Materialized stack-level quality benchmarks |
| fp_models | Sophia Torres | 3 | FP prediction model registry |
| rhumb_exports | Sophia Torres | 3 | Queue for Rhumb data pipeline |

**Grand total: 22 new tables + 3 modified tables = 32 tables** (up from 10 in base schema)

---

*Document generated by 8-expert panel facilitated by Claude Opus 4.6, 2026-03-11.*
*All specifications are implementation-ready. A team should be able to build everything in this document using the type extensions, schema definitions, pseudocode algorithms, and acceptance criteria provided.*
