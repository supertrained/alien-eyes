# Alien Eyes — User Stories

> Version: 1.0 | Date: 2026-03-10
> Source: 30 personas (research/personas.md), dogfood validation, adversarial reviews
> Organized by: Epic → Story → Acceptance criteria
> Priority: P0 = Phase 0 (alpha), P1 = Phase 1 (launch), P2 = Phase 2 (PMF), P3 = Phase 3 (scale)

---

## Epic 1: First Audit (The Hook)

### US-1.1: Paste URL and Start Audit [P0]

> As a **solo builder**, I want to **paste my URL and start an audit** so that I can **see what I'm missing without signing up for anything**.

**Persona:** Marcus (solo SaaS builder), Jaylen (vibe coder)

**Acceptance Criteria:**
- [ ] Landing page has a single URL input above the fold
- [ ] Submitting a URL starts an audit immediately
- [ ] Quick Check requires: email verification + Turnstile (not full account)
- [ ] Full Audit requires: account + payment method
- [ ] Invalid URLs show clear error messages
- [ ] URL validation blocks private IP ranges (SSRF defense)

**Maps to WU:** WU-10 (landing page), WU-00b (URL validation)

---

### US-1.2: See Progress While Audit Runs [P0]

> As a **builder waiting for results**, I want to **see what the audit is doing** so that I **don't think it's broken and leave**.

**Persona:** Marcus (impatient, will bounce if nothing happens)

**Acceptance Criteria:**
- [ ] Progress page shows narrated phases ("Browsing as a first-time mobile user...")
- [ ] Phase indicators show which dimensions are being evaluated
- [ ] Estimated time remaining displayed
- [ ] Quick Check completes in < 60 seconds
- [ ] Full Audit completes in < 5 minutes
- [ ] Page auto-transitions to results when complete

**Maps to WU:** WU-11 (progress page), WU-06 (progress events)

---

### US-1.3: Understand Results Without Technical Expertise [P0]

> As a **non-technical founder**, I want to **understand what the audit found** so that I can **decide what to fix first**.

**Persona:** Raymond (non-technical evaluator), Jaylen (vibe coder)

**Acceptance Criteria:**
- [ ] Results start with "What's working well" (celebration-first)
- [ ] Satisfaction score shown as a single number with context
- [ ] Findings sorted by fix order (dependencies first, then severity)
- [ ] Each finding has: what's wrong, where, what should happen, why it matters
- [ ] CRITICAL findings visually distinct (own visual plane)
- [ ] No jargon without explanation

**Maps to WU:** WU-12 (results page), WU-03 (celebration section)

---

## Epic 2: The Fix Loop (Core Product Experience)

### US-2.1: Copy Findings for Coding Agent [P0] — THE MOST IMPORTANT STORY

> As a **builder with a coding agent**, I want to **copy findings and paste them into Claude Code/Cursor** so that **my agent fixes everything automatically**.

**Persona:** Marcus, Diana (full-stack dev), ALL agent personas

**Acceptance Criteria:**
- [ ] "Copy for your coding agent" button is the most prominent action on results page
- [ ] Button copies Format B (condensed, numbered, severity-prefixed)
- [ ] Format B contains NO branding, NO methodology, NO scores
- [ ] Format B matches validated format from dogfood test
- [ ] Format B capped at 5 findings (staged disclosure)
- [ ] Remaining findings noted: "X more findings available after re-audit"
- [ ] Clipboard copy confirmed with visual feedback
- [ ] Format selector available (B default, A/C/JSON available)

**Maps to WU:** WU-12 (copy button), WU-04 (Format B renderer)

**Regression test:** Format B output must produce ≥60% autonomous fix rate when pasted into coding agents (validated at 100% N=1)

---

### US-2.2: Re-Audit After Fixing [P0]

> As a **builder who fixed issues**, I want to **re-audit to verify my fixes worked** so that I **know I'm done**.

**Persona:** ALL builders

**Acceptance Criteria:**
- [ ] "Re-audit" CTA on results page
- [ ] Re-audit runs blind (no reference to previous results during audit)
- [ ] After re-audit: delta comparison shows fixed, new, regressed, unchanged
- [ ] Before/after score comparison
- [ ] Re-audit price: $5-9 (cheaper than fresh audit)
- [ ] Fixed findings shown with checkmark (celebration)
- [ ] New findings get new Format B for next paste

**Maps to WU:** WU-16 (re-audit system), WU-12 (delta display)

---

### US-2.3: Dispute a Finding (False Positive) [P0]

> As a **builder who disagrees with a finding**, I want to **mark it as false positive with a reason** so that **the audit improves over time and I'm not penalized for intentional decisions**.

**Persona:** Diana (expert, will catch errors), builder from dogfood test (caught cookie consent FP)

**Acceptance Criteria:**
- [ ] Every finding has "Mark as false positive" button
- [ ] Reason dropdown: "Working correctly", "Intentional design", "Platform limitation", "Stale test data", "Other"
- [ ] Free text field for explanation
- [ ] Disputed findings are tracked per-primitive
- [ ] Primitives with >20% dispute rate flagged for methodology review
- [ ] Disputed findings excluded from re-audit delta (not counted as "unchanged")

**Maps to WU:** WU-12 (FP button), WU-16 (FP tracking), Methodology v0.1 Section 13

---

## Epic 3: Account & History

### US-3.1: Create Account [P0]

> As a **returning builder**, I want to **create an account** so that I can **see my audit history and track improvement over time**.

**Persona:** Marcus (wants to see progress), Diana (wants API access)

**Acceptance Criteria:**
- [ ] GitHub OAuth (primary)
- [ ] Email + magic link (fallback)
- [ ] No card required for free tier
- [ ] Card required for first paid action (Full Audit or re-test)
- [ ] Account links to previous anonymous Quick Checks (by email)

**Maps to WU:** WU-13 (account system)

---

### US-3.2: View Audit History [P0]

> As a **builder with multiple audits**, I want to **see my audit history with score trends** so that I can **track improvement over time**.

**Persona:** Marcus, Craig (consultant running client audits)

**Acceptance Criteria:**
- [ ] Dashboard shows list of past audits (URL, date, score, finding count)
- [ ] Score trend chart for repeated audits of same URL
- [ ] Filter by URL, date range, score range
- [ ] Click to view full results of any past audit

**Maps to WU:** WU-13 (dashboard)

---

### US-3.3: Generate API Key [P1]

> As a **developer building an integration**, I want to **generate an API key** so that I can **call Alien Eyes from my CI/CD pipeline or coding agent**.

**Persona:** Diana (full-stack dev), Ravi (QA lead)

**Acceptance Criteria:**
- [ ] API key generation from dashboard
- [ ] Key shown once, then hashed (never stored plaintext)
- [ ] Key prefix visible for identification (ae_live_abc...)
- [ ] Configurable rate limits
- [ ] Revoke button
- [ ] Multiple keys supported

**Maps to WU:** WU-13 (API key management)

---

## Epic 4: Quick Check (Free Tier)

### US-4.1: Run Free Quick Check [P0]

> As a **builder with no budget**, I want to **get a free quality check** so that I can **find obvious issues without paying**.

**Persona:** Jaylen ($0 budget), Marcus ($0-20/mo constraint)

**Acceptance Criteria:**
- [ ] Quick Check runs SEO + Performance + Accessibility only
- [ ] No LLM used (fully deterministic)
- [ ] Completes in < 60 seconds
- [ ] Requires email verification + Turnstile (not full account)
- [ ] Rate limited: 1 per email per 30 days, 3 per IP per 24 hours
- [ ] Results include Format B output (copyable)
- [ ] Clear upsell to Full Audit ("Want the full alien perspective?")

**Maps to WU:** WU-06 (quick check mode), WU-02 (deterministic primitives only)

---

## Epic 5: CLI

### US-5.1: Run Audit from Terminal [P1]

> As a **developer comfortable with CLI tools**, I want to **run `ae audit <url>`** so that I can **audit from my terminal without leaving my workflow**.

**Persona:** Diana, Ravi

**Acceptance Criteria:**
- [ ] `ae audit <url>` (or `npx alien-eyes audit <url>`) runs full audit locally
- [ ] Only requires ANTHROPIC_API_KEY
- [ ] No Redis, no Supabase, no cloud dependencies
- [ ] Format B output to stdout (pipeable)
- [ ] Progress spinner in stderr
- [ ] `--quick` flag for Quick Check (no LLM, < 60s)
- [ ] `--format a|b|c|json` flag
- [ ] `--json` shorthand
- [ ] Exit code: 0 = clean, 1 = findings, 2 = error
- [ ] `--help` shows usage

**Maps to WU:** WU-07a (CLI local mode)

---

### US-5.2: Run Audit via Cloud API from CLI [P1]

> As a **developer in a CI pipeline**, I want to **run `ae audit <url> --cloud`** so that I can **use the hosted service without running Playwright locally**.

**Persona:** Ravi (CI/CD integration)

**Acceptance Criteria:**
- [ ] `--cloud` flag submits to hosted API
- [ ] Requires ALIEN_EYES_API_KEY
- [ ] Polls for results with progress display
- [ ] Same output format as local mode
- [ ] Timeout with informative error if API is unreachable

**Maps to WU:** WU-07b (CLI cloud mode)

---

## Epic 6: MCP Integration (Agent-to-Agent Loop)

### US-6.1: Call Alien Eyes from Coding Agent via MCP [P2]

> As a **coding agent (Claude Code/Cursor)**, I want to **call Alien Eyes via MCP** so that I can **audit, get findings, fix, and re-audit without human intervention**.

**Persona:** Agent personas 21-30

**Acceptance Criteria:**
- [ ] MCP server exposes: audit_url, get_status, get_findings, get_score, re_audit, dispute_finding
- [ ] Format JSON returned by default
- [ ] Auth via API key
- [ ] Status polling supported
- [ ] The full loop works: audit → get_findings → fix → re_audit → get_findings → compare

**Maps to WU:** WU-14 (MCP server)

---

## Epic 7: REST API

### US-7.1: Start Audit via API [P0]

> As a **developer building a custom integration**, I want to **POST to /api/audit** so that I can **start audits programmatically**.

**Acceptance Criteria:**
- [ ] POST /api/audit with `{ url, options }` returns `{ id, status }`
- [ ] Options: tier, page_limit, targeted_dimensions
- [ ] Rate limited per API key
- [ ] Input validation (URL format, valid options)

**Maps to WU:** WU-15 (REST API)

---

### US-7.2: Get Audit Results via API [P0]

> As a **developer polling for results**, I want to **GET /api/audit/:id** so that I can **check status and retrieve results**.

**Acceptance Criteria:**
- [ ] Returns: status, progress, current_phase (while running)
- [ ] Returns: full results when complete (scores, finding count, report URLs)
- [ ] GET /api/audit/:id/findings?format=b returns Format B text

**Maps to WU:** WU-15 (REST API)

---

## Epic 8: Security & Privacy

### US-8.1: Verify Site Ownership [P0]

> As a **site owner**, I want to **verify I own the domain** so that I can **access security findings and agent-nativeness analysis**.

**Persona:** Diana (wants full results), Viktor (security concern)

**Acceptance Criteria:**
- [ ] Three verification methods: DNS TXT record, meta tag, file upload
- [ ] Verification persists for 90 days
- [ ] Verified domains shown in dashboard
- [ ] Unverified URLs receive only: SEO, Performance, Accessibility findings
- [ ] Security + Agent-Nativeness findings require verification

**Maps to WU:** WU-00b (security architecture), WU-13 (verification UI)

---

### US-8.2: Control Report Visibility [P0]

> As a **builder who doesn't want competitors seeing my audit results**, I want to **keep my reports private by default** with the option to publish.

**Persona:** Diana (privacy-conscious), Viktor (security)

**Acceptance Criteria:**
- [ ] All reports private by default
- [ ] "Publish" button with redaction preview
- [ ] Security findings NEVER included in public reports
- [ ] Takedown mechanism: site owner can request removal
- [ ] Published reports have a short, shareable URL

**Maps to WU:** WU-12 (privacy controls), Principle 16

---

## Epic 9: Continuous Monitoring

### US-9.1: Schedule Recurring Audits [P2]

> As a **builder shipping frequently**, I want to **schedule weekly re-audits** so that I can **catch regressions without remembering to re-test**.

**Persona:** Ravi (QA lead), Craig (consultant)

**Acceptance Criteria:**
- [ ] Schedule: daily, weekly, biweekly, monthly
- [ ] Notification options: always, on regression, on critical, never
- [ ] Delta report emailed
- [ ] $3/week for weekly ($12/month)
- [ ] Pause/resume from dashboard

**Maps to WU:** WU-16 (scheduled audit)

---

## Epic 10: PDF Export

### US-10.1: Export Audit as PDF [P0]

> As a **consultant presenting to a client**, I want to **export the audit as a professional PDF** so that I can **share it in a meeting or attach to a proposal**.

**Persona:** Craig (consultant), Raymond (non-technical evaluator)

**Acceptance Criteria:**
- [ ] One-click PDF export from results page
- [ ] PDF includes: score summary, findings list, celebration section, methodology version
- [ ] Professional formatting (SuperTrained branding, clean layout)
- [ ] No internal metadata (evidence hashes, model names, token counts)

**Maps to WU:** WU-12 (PDF export)

---

## Epic 11: Platform Detection & Limitations

### US-11.1: Handle Platform-Hosted Sites [P1]

> As a **Shopify/Wix/Squarespace builder**, I want to **understand which findings I can fix and which are platform limitations** so that I **don't waste time on things I can't change**.

**Persona:** Jaylen (React Native → web), platform-hosted builders

**Acceptance Criteria:**
- [ ] Stack detection identifies platform (Shopify, Wix, Squarespace, WordPress.com)
- [ ] Findings tagged `platform-limited` include: "This is a limitation of [Platform]"
- [ ] Scoring adjusts to not penalize platform limitations
- [ ] Workarounds suggested where possible
- [ ] Format B includes platform context for coding agents

**Maps to WU:** WU-01 (stack detection), WU-02 (platform tagging), Principle 15

---

## Story Priority Summary

| Priority | Stories | Phase |
|----------|---------|-------|
| **P0** | US-1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 7.1, 7.2, 8.1, 8.2, 10.1 | Phase 0 (Alpha) |
| **P1** | US-3.3, 5.1, 5.2, 11.1 | Phase 1 (Launch) |
| **P2** | US-6.1, 9.1 | Phase 2 (PMF) |
| **P3** | — | Phase 3 (Scale) |

**Total P0 stories:** 14 (must work for alpha)
**Total P1 stories:** 4 (must work for public launch)
**Total P2 stories:** 2 (must work for PMF)
