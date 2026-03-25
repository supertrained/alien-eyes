# Alien Eyes — Canonical Build Scope

> Version: 2.0
> Date: 2026-03-11
> Status: Binding for current implementation
> Purpose: Tell a build team exactly what to build now, what principles to follow, what to treat as future design, and which documents are authoritative.

---

## 1. Executive Rule

For current implementation, Alien Eyes is a **Phase 0, web-first, URL-first audit product**.

A build team should treat:
- the **web-first audit engine**
- the **web app**
- the **internal REST API**
- the **re-audit/dispute loop**
- the **security/runtime foundations**

as in scope now.

A build team should **not** treat the full multi-surface vision as current implementation scope.

---

## 2. Core Principles

These principles govern HOW the team builds, not just WHAT they build. Every design decision, architecture choice, and implementation detail must align with these. Codex, Opus, and any human developer must internalize these before writing code.

### 2.1 Agent-Native First

Alien Eyes audits digital products BY agents AND FOR agent-nativeness. The product itself must be agent-native:
- Every output is structured for machine consumption (Format JSON, MCP endpoint, CLI)
- Every primitive is an atomic unit of work — smallest meaningful evaluation
- Judgment lives in prompts, not in tool logic (Every.to principle)
- The MCP server and CLI are first-class delivery surfaces, not afterthoughts
- Agent-Nativeness is a scored dimension on every audit

**Build implication:** If a feature works for humans but not agents, it is incomplete. If an API returns HTML instead of structured data, it violates this principle. Every endpoint, every output, every interaction must be consumable by both humans and machines.

### 2.2 Atomic Primitives

Each audit primitive is the smallest meaningful unit of evaluation:
- One primitive = one dimension = one `Envelope<Finding[]>`
- Primitives are composable — any subset can run independently
- Primitives are pluggable — new dimensions add new primitives, never modify existing ones
- The primitive interface (`AuditPrimitive`) is the extension point for the entire system

**Build implication:** Never bundle multiple dimensions into one primitive. Never create a primitive that requires another primitive's output. The `Promise.all` pattern in the monolithic pipeline (ADR-004) depends on primitive independence.

### 2.3 Probabilistic as Possible

Scores are probabilistic, not pass/fail:
- Satisfaction scores 0-100 with confidence intervals (±5 deterministic, ±10 LLM)
- Confidence on every finding (0-1)
- Conservative severity classification — when ambiguous, classify DOWN
- Coverage confidence reported alongside every score (how confident we are we found everything, not just that what we found is accurate)

**Build implication:** Never return a boolean pass/fail. Always return a score with a confidence range. Never classify CRITICAL at confidence < 0.9. The system reports what it knows AND how much it doesn't know.

### 2.4 Discovery-Led (Teresa Torres)

Every interaction generates learning. The product is a continuous discovery engine:
- Every finding is a potential opportunity (OST — Opportunity Solution Tree)
- The pattern database reveals what to build next
- Re-audits are discovery, not just verification (Loop 2 found 5 NEW issues)
- Surface triage discovers all auditable surfaces before deep evaluation
- False positive reports are discovery signal, not failure

**Build implication:** Every finding feeds the patterns table (ADR-016). Every false positive feeds calibration. Every audit run generates metadata that informs methodology evolution. Build the feedback loops from Day 1.

### 2.5 EOS (Entrepreneurial Operating System)

The product generates its own measurable metrics. Build for observability:
- Every audit records: duration, cost, finding count, FP rate, primitive timing
- Weekly scorecard metrics: audits run, findings generated, FP rate, conversion rate, COGS per audit
- Quarterly Rocks map to build phases and gates
- Issues list tracks blockers at every gate review

**Build implication:** Instrument everything. The `EnvelopeMetadata` (tokensUsed, costUsd, durationMs) and `AuditMeta` (totalCostUsd, costByPrimitive) exist for this reason. No primitive should run without recording its cost and duration.

### 2.6 AEO/GEO/MEO Optimized

Four-layer optimization stack, evaluated per surface:
- **SEO** (Surface): Technical signals for traditional search crawlers
- **AEO** (Answer): Structured for answer engine extraction
- **GEO** (Generative): Optimized for citation by generative AI
- **MEO** (Meaning): Semantic coherence for embedding/vector space understanding — the base layer beneath the other three

**Build implication:** Alien Eyes itself must be MEO-optimized: semantic HTML, JSON-LD structured data, topical coherence, entity disambiguation. The audit engine evaluates SEO deterministically in V1. AEO/GEO/MEO rubrics are deferred until validated by 2+ SEO professionals, but the architecture must accommodate them as future dimensions without breaking changes.

### 2.7 The Clipboard Is the Product

If the paste produces correct fixes, we win. If not, nothing else matters.
- Format B is the core deliverable — tested, validated (N=1), proven
- No branding, no methodology, no scores in the clipboard output
- Findings ordered by optimal fix sequence, not raw severity
- Capped at 5 per paste (staged disclosure, re-audit for next batch)
- Every other format (A, C, JSON) is a view of the same findings

**Build implication:** Format B is the regression baseline. The dogfood (12/12 fixes) is the acceptance test. If Format B regresses, it's a P0 bug regardless of what else is working.

---

## 3. Binding Documents For Current Build

These documents are authoritative for implementation now.

### Product and scope

- [PRODUCT-SPEC.md](../PRODUCT-SPEC.md) — full product specification v3.0
- [CLAUDE.md](../CLAUDE.md) — agent handoff document

### Core implementation contract

- [docs/WORK-UNITS.md](WORK-UNITS.md) — 25 work units with acceptance criteria
- [docs/TYPE-SPEC.md](TYPE-SPEC.md) — frozen types (v1.0)
- [docs/SCHEMA.md](SCHEMA.md) — Supabase schema (10 tables, RLS)
- [docs/ADR.md](ADR.md) — 16 architecture decision records
- [docs/METHODOLOGY-v0.1.md](METHODOLOGY-v0.1.md) — pre-registered scoring methodology
- [docs/USER-STORIES.md](USER-STORIES.md) — 20 user stories, 11 epics
- [docs/AGENT-HANDOFF-PROTOCOL.md](AGENT-HANDOFF-PROTOCOL.md) — multi-agent coordination

### Current scope clarifiers

- [docs/ENDPOINT-COVERAGE-AUDIT.md](ENDPOINT-COVERAGE-AUDIT.md)
- [docs/PERSONA-METHODOLOGY.md](PERSONA-METHODOLOGY.md)

---

## 4. Document Precedence

### For scope and boundary questions

If documents conflict on WHAT to build or whether something is in scope:

1. `docs/CANONICAL-BUILD-SCOPE.md` (this document)
2. `docs/ADR.md`
3. `docs/WORK-UNITS.md`
4. `PRODUCT-SPEC.md`
5. `CLAUDE.md`
6. research and future-design docs

### For technical implementation questions

If documents conflict on HOW to implement something within approved scope:

1. `docs/TYPE-SPEC.md` (frozen types are the coordination contract)
2. `docs/ADR.md` (architecture decisions)
3. `docs/METHODOLOGY-v0.1.md` (scoring rules)
4. `docs/SCHEMA.md` (database design)
5. `docs/WORK-UNITS.md` (acceptance criteria)

### Special rule

If a future-design doc conflicts with a current implementation doc, the future-design doc does **not** expand scope automatically.

It is reference material only unless a human explicitly promotes it via the scope change process (Section 14).

---

## 5. What The Team Should Build Now

### Phase 0 implementation scope

Build:
- project scaffold
- frozen types
- Supabase migration
- worker runtime split
- security architecture
- crawl engine
- extraction layer
- 6 core web-first primitives
- synthesis engine
- renderers (4 formats: A, B, C, JSON)
- monolithic pipeline orchestrator
- web app pages (landing, progress, results, dashboard)
- internal REST API
- account/history
- re-audit system
- dispute flow
- PDF export

This maps directly to:
- `WU-00` through `WU-20` in [docs/WORK-UNITS.md](WORK-UNITS.md)

### V1 target surface

The only fully supported target surface for current build is:
- **public web products reachable by URL**

Including:
- standard websites (static and dynamic)
- SPAs rendered through Playwright (React, Vue, Angular, Svelte)
- mobile web / responsive experiences
- public docs pages
- public marketing/product pages

### Edge cases for "reachable by URL"

| Situation | Handling |
|-----------|---------|
| **Sites behind Cloudflare Bot Protection / WAFs** | Attempt crawl; if blocked, report partial results with explanation. Do NOT bypass bot protection. |
| **Sites requiring JavaScript rendering** | Playwright handles this natively. SPAs are in scope. |
| **Sites with authentication-gated public pages** | Audit the public-facing surface only. Auth-required flows are Phase 2 (staging URL + test credentials). |
| **Sites with aggressive rate limiting** | Respect rate limits. Crawl at a polite pace (configurable delay between requests). Report partial results if rate-limited. |
| **Sites on localhost/private IPs** | Blocked by URLValidator (ADR-008). SSRF defense is non-negotiable. |
| **Very large sites (1000+ pages)** | Page limit: 30 pages per audit by default. Homepage + nav-linked pages prioritized. |

---

## 6. What Is In Scope But Narrowly Interpreted

### REST API

`REST API` is in scope now only as:
- the internal app/programmatic interface for Alien Eyes itself
- the Phase 0 endpoints defined in `WU-15: REST API`

It is **not** current scope as a full target-surface audit mode for third-party APIs.

### Agent-nativeness

`agent-nativeness` is in scope now only as:
- web-observable, URL-first signals (Principle 2.1)
- ownership-gated (ADR-010)
- early methodology v0.1

It is **not** current scope as:
- complete API parity benchmarking
- complete MCP-server evaluation
- complete CLI evaluation

### Personas

Personas are in scope now as:
- a methodology direction
- a generation framework to inform future implementation

They are **not** yet a frozen runtime subsystem with final scoring impact.

### AEO/GEO/MEO

AEO, GEO, and MEO are in scope now as:
- architectural extension points (the `AuditDimension` type includes 'aeo', 'geo', 'meo')
- Alien Eyes's own MEO optimization (semantic HTML, JSON-LD, topical coherence)

They are **not** scored dimensions in methodology v0.1. Rubrics require validation by 2+ SEO professionals before activation.

---

## 7. Cost Measurement Policy

**There are no cost guardrails for Phase 0.** The priority is learning actual costs across use cases, tools, and models.

### What to measure

Every audit must record:
- Total LLM cost (via `AuditMeta.totalCostUsd`)
- Cost per primitive (via `AuditMeta.costByPrimitive`)
- Token usage per model tier (via `EnvelopeMetadata.tokensUsed`)
- Duration per primitive (via `EnvelopeMetadata.durationMs`)
- Total audit duration (via `AuditMeta.durationMs`)
- Pages crawled vs discovered (to understand scope-driven cost variance)

### What to NOT enforce (yet)

- No per-audit LLM hard cap
- No per-primitive token budget cap
- No total hourly LLM spend cap
- No tier-specific model restrictions (Quick Check may use LLM during measurement phase)

### When guardrails will be introduced

After 50+ real audits across varied sites, we will analyze actual cost distributions and set evidence-based limits. Setting arbitrary caps before understanding real costs risks:
- Capping too low → degraded finding quality
- Capping too high → meaningless constraint
- Wrong model tier assignment → suboptimal cost/quality tradeoff

**The `CostBudget` type in TYPE-SPEC remains in the codebase as a tracking mechanism.** It records `currentSpend` and `primitiveSpend` for observability. The `maxPerAudit` field and `isExceeded` flag exist but should not trigger automatic termination during Phase 0. They are measurement instruments, not enforcement mechanisms.

### What IS enforced from Day 1

- Every LLM call goes through the model router, which records cost
- Every primitive returns `EnvelopeMetadata` with cost data
- Every audit generates `AuditMeta` with aggregate cost
- Cost data is stored in Supabase for analysis

---

## 8. What The Team Should Not Build Now

Do not build these as part of the current implementation unless a human explicitly expands scope:

- **MCP server for Alien Eyes itself (WU-14)** — Phase 2. Architecture is designed, WU exists for foresight, but it is not a Phase 0 deliverable.
- third-party REST API audit mode
- GraphQL audit mode
- MCP server audit mode (auditing third-party MCP servers)
- CLI audit mode
- GitHub repo/code ingestion as a target-surface evaluator
- webhook listener infrastructure for auditing webhook producers
- native mobile app emulator testing
- enterprise platform layer (teams, RBAC, SSO)
- monitoring product (scheduled re-audits, alerting)
- badges/certificates
- full benchmark/public data APIs
- cross-surface score normalization
- multi-run consensus orchestration (2-of-3 averaging)
- persona generation runtime (methodology direction only for Phase 0)

These may be well designed in future docs, but they are not current build scope.

---

## 9. Future-Design Documents

These documents are useful for architecture foresight, but they are **not binding for current implementation**:

- [docs/FULL-VISION-SPEC.md](FULL-VISION-SPEC.md) — master synthesis of 4 panels, 29 experts, ~12,600 lines
- [docs/MULTI-SURFACE-SPEC.md](MULTI-SURFACE-SPEC.md) — CLI, Package, Repo, Docs surfaces
- [docs/MULTI-SURFACE-METHODOLOGY.md](MULTI-SURFACE-METHODOLOGY.md) — MCP, REST API, GraphQL, Webhook surfaces
- [docs/PLATFORM-ARCHITECTURE.md](PLATFORM-ARCHITECTURE.md) — Enterprise, monitoring, CI/CD, badges, patterns
- [docs/SURFACE-COVERAGE-SYNTHESIS.md](SURFACE-COVERAGE-SYNTHESIS.md) — cross-surface analysis

Use them to avoid dead-end architecture.
Do not use them to justify extra current-scope implementation.

**"Avoid dead-end architecture" means:** When you have a design choice between two approaches of similar effort, prefer the one that preserves extensibility for multi-surface expansion. When the extensible approach is significantly more complex, choose simplicity and note the future concern in a HANDOFF.md.

---

## 10. External Dependencies

The team must provision these before WU-00 can start:

| Dependency | Required By | Purpose | Status |
|-----------|------------|---------|--------|
| Supabase project | WU-00 | Database + storage | Needed |
| Anthropic API key | WU-02 | LLM primitives (Opus, Sonnet, Haiku) | Available |
| OpenAI API key | WU-05 | Model router fallback (GPT-4o-mini) | Available |
| Upstash Redis | WU-06 | BullMQ queue for pipeline orchestration | Needed |
| Railway or Fly.io account | WU-00a | Worker runtime (Playwright can't run on Vercel) | Needed |
| Vercel project | WU-20 | Frontend hosting (Next.js) | Available |
| Cloudflare Turnstile site key | WU-00b | Abuse prevention (Day 1) | Needed |
| Domain: alieneyes.dev | WU-20 | Production domain | Available |

**API keys:** See `~/.api-keys` for available keys.

---

## 11. Human Review Gates

The team must stop at these decision points. No agent proceeds past a gate without human approval.

### Gate 1 — Foundation (~5 agent-hours: WU-00, WU-00a, WU-00b)

**Deliverables to approve:**
- Frozen types compile with TypeScript strict mode (`tsc --noEmit` passes)
- Supabase migration runs successfully (all 10 tables created)
- URLValidator blocks all RFC 1918, link-local, and cloud metadata addresses
- InputSanitizer strips hidden elements, scripts, comments
- Worker Dockerfile builds and starts
- Methodology v0.1 file is present and unmodified from spec
- Persona methodology direction documented

**Rejection means:** Rework the specific WU that failed. Do not proceed to Phase 2.

**Approval form:** Human reviews PR, runs tests, approves merge to main.

### Gate 2 — Core Engine (~16 agent-hours: WU-01 through WU-05)

**Deliverables to approve:**
- Crawl engine successfully crawls 3+ real sites of varying complexity
- All 6 primitives return valid `Envelope<Finding[]>` for test inputs
- Extraction layer produces `PageSummary` objects (verify token count is 2-5K range)
- Synthesis engine de-duplicates, scores, and builds causal chains
- All 4 renderers produce output from the same `SynthesisResult`
- Model router routes to correct tier and records cost
- Web-first findings are high-quality enough to continue (human judgment)

**Rejection means:** Fix the specific primitive or engine component. Re-submit for Gate 2.

### Gate 3 — Integration (~6 agent-hours: WU-06 through WU-08)

**Deliverables to approve:**
- Pipeline orchestrator runs end-to-end: URL → crawl → primitives → synthesis → render
- CLI local mode works: `ae audit <url>` produces Format B on stdout
- Dogfood regression: CLI audit of supertrained.ai detects ≥10/12 known findings
- **Cost measurement data from 10+ real audits** (no targets, just measurement)

**Rejection means:** Fix pipeline or CLI issues. Re-run dogfood regression.

### Gate 4 — Presentation (~14 agent-hours: WU-09 through WU-13)

**Deliverables to approve:**
- Landing page: URL input works, value prop clear, MEO-optimized (semantic HTML, JSON-LD)
- Progress page: real-time updates from pipeline, narrated phases (not a spinner)
- Results page: celebration-first, satisfaction score with confidence interval, findings list, copy button
- Copy button: one click copies Format B, output matches validated format
- Account: auth works, audit history shows, re-audit from history works
- All pages WCAG 2.1 AA compliant

**Rejection means:** Fix specific UX issues. Re-submit for Gate 4.

### Gate 5 — Deploy (~15 agent-hours: WU-15 through WU-20, excluding WU-14 MCP)

**Deliverables to approve:**
- Full end-to-end test: URL paste → crawl → audit → results → copy → re-audit
- REST API handles `POST /api/audit`, `GET /api/audit/:id`, re-audit endpoints
- Error handling: graceful degradation when primitives fail, partial results display
- Deploy checklist: Vercel + Railway/Fly.io + Supabase + Redis all configured
- Alpha invite system ready (50 users)

**Note:** WU-14 (MCP Server) is Phase 2 scope. It is included in WORK-UNITS.md for architecture foresight but is NOT a Gate 5 deliverable. See Section 6 and Section 8.

**Rejection means:** Fix specific issues. Re-submit for Gate 5.

---

## 12. Validation Strategy

### Regression baseline

The supertrained.ai dogfood (12 findings, Format B, 12/12 fixes) is the engine validation baseline.

| Metric | Threshold | When |
|--------|-----------|------|
| Known finding detection | ≥10/12 from dogfood | Gate 3 |
| Format B produces correct fixes when pasted into coding agent | Qualitative (human verifies) | Gate 3 |
| Copy button output matches validated Format B structure | Exact format match | Gate 4 |

### Measurement targets (not enforcement thresholds)

These are targets to measure against, not hard gates. Phase 0 is about learning actual rates.

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| False positive rate (overall) | < 10% | Track via finding lifecycle (disputed → false_positive) |
| False positive rate (CRITICAL) | < 1% | Same |
| Repeatability (same URL, 3 runs) | > 80% finding overlap | Gauge R&R during alpha |
| Audit duration (Full Audit) | < 5 minutes | Measure via `AuditMeta.durationMs` |
| Format B fix rate | > 60% autonomous | Track during alpha with external builders |

---

## 13. Open Decisions That Must Not Be Silently Assumed

These are known open items. Teams should not invent policy ad hoc. If any of these are required to unblock code, escalate for human review.

### Persona system
- Whether persona generation ships in Phase 0 runtime or remains staged for Phase 1
- Whether only audited-site evidence is used for persona generation in V1, or also public-web evidence (reviews, docs, search snippets)
- How persona-derived findings affect scoring relative to deterministic findings

### Output formats
- Whether Format C ships in Phase 0 or waits for GitHub-connected workflows

### API access
- Whether external REST API access ships in Phase 0 or stays internal-first

### Pricing
- Final pricing tiers (Quick Check free, Full Audit $19-49 is working assumption, not frozen)
- Whether the concierge pricing validation happens before or during build

### Data
- Whether the cross-product pattern database (ADR-016) ships in Phase 0 or is deferred
- Retention policy for raw crawl data (current spec: 24 hours — may change based on storage costs)

### MEO
- AEO/GEO/MEO rubric definitions — requires 2+ SEO professional validation before scoring

---

## 14. Scope Change Process

To promote a future-design item into current scope or add a new requirement:

1. **Write a scope change request** stating:
   - What is being added
   - Which WUs are affected (new or modified)
   - Estimated additional agent-hours
   - Why it can't wait for a future phase
   - Which principle(s) it serves (Section 2)

2. **Human reviews** and either approves, rejects, or defers

3. **If approved:** Update Section 5 of this document, add/modify WUs in WORK-UNITS.md, assign to appropriate gate

4. **If rejected:** Document the decision and rationale in this section for future reference

---

## 15. Safe Build Statement

This is the statement a team can work from:

> Build Alien Eyes as a web-first, URL-first public website audit product. It must be agent-native (structured outputs, atomic primitives, machine-consumable formats), probabilistic (scores with confidence intervals, not pass/fail), and discovery-led (every interaction generates learning). Build strong security foundations, evidence-backed findings, re-audit/dispute lifecycle, and a human-plus-agent output system. Instrument everything for cost measurement — we need to understand real costs before setting limits. Preserve extensibility for future multi-surface expansion, but do not implement that expansion now.

### Build Test

Before starting any WU, ask: **"Does this serve the web-first, URL-first, agent-native, probabilistic, evidence-backed audit product with a working clipboard-to-fix loop?"**

If yes → in scope.
If no → out of scope, regardless of where it appears in other documents.
If unsure → escalate to human review.

---

## 16. Hard Boundary

If a task requires:
- a new target surface beyond public websites
- a new infrastructure class not already required by Phase 0
- a new type family that breaks current frozen web-first contracts
- a new scoring model beyond methodology v0.1
- a cost enforcement mechanism (caps, circuit breakers, kill switches) — defer until after cost measurement

then it is **out of current scope** until explicitly approved via the scope change process (Section 14).
