# Alien Eyes — Agent Handoff Document

> Last Updated: 2026-03-18
> Product Name: **Alien Eyes** (alieneyes.dev)
> CLI: `ae` (short form) / `alieneyes` (long form)
> Packages: alien-eyes (npm) / alien-eyes (PyPI)
> Current Round: 7 (Auth verified except credentialed GitHub login -> live quality/robustness sprint next)
> Product Thesis: DEMONSTRATED (N=1) on supertrained.ai. NOT validated at scale. See PRODUCT-SPEC.md Section 2A.

## Quick Context

An agent-native testing/auditing service that audits digital products from an alien perspective — external, independent, fresh eyes — for both human users AND AI agent users. The core product experience: builder pastes URL → we crawl from multiple perspectives they can't have → they copy findings into their coding agent → agent fixes → re-test. The clipboard is the product. Two loops took supertrained.ai from "critical SEO issue" to clean.

Outputs feed Rhumb's AN Score. Delivers as SaaS (V1), CLI (Phase 1), MCP (Phase 2).

---

## What's Been Demonstrated (N=1)

On March 5-6, 2026, we ran a dogfood test on ONE site (supertrained.ai), ONE tech stack (Next.js), with ONE builder (the Alien Eyes creator), using ONE coding agent (Claude Code):

| Loop | What Happened | Result |
|------|--------------|--------|
| 1 | Audited supertrained.ai, found 12 issues (1 CRITICAL), pasted Format B into Claude Code | 12/12 fixed, 22+ files found without path hints, build passed |
| 2 | Re-tested live site, found 5 new + 3 partial, pasted 8-item payload | All resolved, 2 correctly triaged as no-op, 1 false positive caught by builder |

**What this demonstrates:**
- The clipboard IS the product — Format B (condensed, no file paths) produces correct fixes
- The loop converges — two iterations, critical-to-clean
- Builder pushback is a feature — the loop is self-correcting
- Clean browser profiles are mandatory (false positive from stale state)

**What this does NOT prove (from adversarial review):**
- That machine-generated findings (not hand-crafted) produce the same fix rate
- That the loop works on non-Next.js stacks, strangers' codebases, or non-Claude-Code agents
- That builders will pay real money for this
- That complex findings (logic bugs, auth bypasses) produce correct autonomous fixes
- That the false positive rate is acceptable at scale (12.5% on Loop 2 is one sample, not a rate)

---

## Vision

**One sentence:** The independent quality layer that tells builders — and their agents — whether the thing they shipped actually works for the people and machines trying to use it.

**Core principles:**
- **Agent-native first** — follows atomic primitives (parity, granularity, composability, emergent capability, improvement over time)
- **Probabilistic default, deterministic when necessary** — satisfaction scores, not pass/fail
- **Discovery-led** — continuous discovery a la Teresa Torres
- **Separation of concerns** — the tool that BUILDS cannot also TEST (StrongDM's cardinal insight)
- **Dual-audience testing** — every audit runs for both human users and agent users
- **The clipboard is the product** — if the paste produces correct fixes, we win; if not, nothing else matters
- **Default private, publish by choice** — reports private by default; security findings require ownership verification (adversarial C4/C5)
- **Every finding carries evidence** — immutable evidence bundle; CRITICAL findings blocked without 100% evidence completeness (adversarial C2)
- **Abuse prevention is Day 1** — not Phase 6 (adversarial C1/C3)

---

## Key Documents

### Product & Strategy
| Document | Purpose |
|----------|---------|
| `PRODUCT-SPEC.md` | Full product specification v3.0 — vision, validation evidence, positioning, principles, scope, risks, roadmap |
| `GO-TO-MARKET.md` | Launch strategy v2.0 — unit economics, pricing, competitive positioning, alpha plan |
| `ADVERSARIAL-MODIFICATIONS.md` | Full adversarial review findings (10 CRITICAL + 10 HIGH + 9 MEDIUM) |

### Architecture & Planning (docs/)
| Document | Purpose |
|----------|---------|
| `docs/CANONICAL-BUILD-SCOPE.md` | **BINDING SCOPE + PRINCIPLES.** v2.0: Core principles (agent-native, probabilistic, discovery-led, EOS, MEO), scope control, cost measurement policy, gates with acceptance criteria, external dependencies, validation strategy |
| `docs/FULL-VISION-SPEC.md` | Future-design reference. Synthesis of 4 panels (29 experts). 9 surfaces, ~58 dimensions, ~187 WUs, 5 build phases. Does NOT expand Phase 0 scope. |
| `docs/WORK-UNITS.md` | **WEB BUILD PLAN.** 25 work units for Phase 0 (web V1) |
| `docs/TYPE-SPEC.md` | **FROZEN TYPES v1.0.** Finding, Envelope, CrawlResult, PageSummary, AuditPrimitive, SynthesisResult |
| `docs/MULTI-SURFACE-METHODOLOGY.md` | **Panel A.** MCP, REST API, GraphQL, Webhook (7 experts, 2,971 lines) |
| `docs/MULTI-SURFACE-SPEC.md` | **Panel B.** CLI, Package, GitHub, Docs (7 experts, 2,840 lines) |
| `docs/PLATFORM-ARCHITECTURE.md` | **Panel D.** Enterprise, monitoring, personas, methodology v0.2, grammar v2.0, badges, patterns (8 experts, 4,110 lines) |
| `docs/METHODOLOGY-v0.1.md` | Pre-registered scoring methodology: dimensions, rubrics, weights, FP targets |
| `docs/SCHEMA.md` | Supabase database schema: 10 tables + 27 new tables proposed in FULL-VISION-SPEC |
| `docs/USER-STORIES.md` | 20 user stories organized by epic, with acceptance criteria and WU mappings |
| `docs/ADR.md` | 16 ADRs + 19 proposed (ADR-018 through ADR-036) in FULL-VISION-SPEC |
| `docs/SCENARIO-GRAMMAR.md` | Web scenario grammar v1.0 (5 axes, 27,440+ configs). Grammar v2.0 in PLATFORM-ARCHITECTURE.md |
| `docs/ENDPOINT-COVERAGE-AUDIT.md` | Separates Alien Eyes interfaces from target-product surfaces |
| `docs/PERSONA-METHODOLOGY.md` | Business-specific per-audit persona generation spec |
| `docs/SURFACE-COVERAGE-SYNTHESIS.md` | Surface strategy (23 experts). Now superseded by FULL-VISION-SPEC for scope decisions. |
| `docs/AGENT-HANDOFF-PROTOCOL.md` | Agent coordination: Opus 4.6 vs Codex 5.4 roles, handoff format, review gates, rules |

### Research
| Document | Purpose |
|----------|---------|
| `research/personas.md` | 30 simulated personas (20 human + 10 agent) with journeys, don't-wants, gap reveals |
| `research/feedback-payload-design.md` | Payload format design rationale and prototype formats |
| `research/audit-supertrained-ai-2026-03-05.md` | Real audit of supertrained.ai — 12 findings with full evidence |
| `research/test-payloads/format-B-condensed.md` | Demonstrated condensed payload format (12/12 fixes, N=1) |
| `research/test-payloads/format-C-file-aware.md` | File-aware payload format |

### Process
| Document | Purpose |
|----------|---------|
| `AGENTS.md` | Passive context layer for Claude (CB methodology, auto-triggers) |
| `.compound-beads/panel-round1.md` | 5-expert panel (film/aviation/clinical/mystery/chaos) — 6 mechanisms |
| `research/panels/panel-round2-surface-coverage.md` | 7-expert panel (pentester/mystery shop/film/biostat/inspector/crash test/food safety) — surface coverage |
| `.compound-beads/context.md` | Compound Beads current state |
| `.compound-beads/learnings.md` | Compounded insights — patterns, guidelines, prevention rules |

---

## Architecture Influences

### StrongDM Dark Factory
- Scenarios stored OUTSIDE the codebase — agents can't cheat their own tests
- Probabilistic "satisfaction" scoring, not boolean pass/fail
- Digital Twin Universe — behavioral clones for deterministic testing
- Separate LLM as judge evaluating whether outputs satisfy scenarios
- Three-run requirement with 2-of-3 pass threshold (DEFERRED to v0.2 — triples cost)

### Stanford Generative Agent Personas (arXiv:2411.10109)
- 1,052 personas from 2-hour interviews → 85% accuracy vs human self-consistency
- Interview-grounded agents dramatically outperform demographic-only agents
- Application: simulated user panels that test products from diverse perspectives

### Every.to Agent-Native Primitives
- 5 properties: Parity, Granularity, Composability, Emergent Capability, Improvement Over Time
- Tools = smallest meaningful unit of action; judgment lives in prompts, not tools
- CRUD completeness audit per entity

### Growth Marketing Problem Finder (sister project)
- Reusable: Envelope pattern, browser pool, model router, phased pipeline orchestrator
- Lessons: pluggable primitive system (not hardcoded), auth/privacy from day one

### Six Stolen Mechanisms (from expert panel)
1. **Steady State Hypothesis** (Chaos Engineering) — observe what it does, test whether it keeps doing that
2. **Swiss Cheese Model** (Aviation) — findings as causal chains, not isolated bugs
3. **Scenario Grammar** (Chaos + Mystery Shopping) — composable test configs (see `docs/SCENARIO-GRAMMAR.md` — 5 axes, 27,440+ configurations)
4. **Adaptive Enrichment** (Clinical Trials) — focus resources on informative dimensions
5. **Verbatim Narrative** (Mystery Shopping + Film) — first-person experience story
6. **Pre-registered Endpoints** (Clinical Trials) — freeze methodology before audits run

---

## Rhumb Integration

Alien Eyes is a **primary data source** for Rhumb's AN Score.

| AN Score Dimension | What We Measure |
|--------------------|----------------|
| Parity | API endpoints vs UI feature coverage gaps |
| Granularity | Operations per endpoint, bundled vs atomic |
| Composability | Structured output formats, pipeable outputs |
| Schema Stability | Response schema fingerprints over time |
| Token Cost | Benchmarks: MCP vs CLI vs REST for same operation |
| Error Handling | Explicit completion signals vs ambiguous responses |
| Data Freshness | How current is returned data |

**Key outputs for Rhumb:** Token cost benchmarks (viral free product), schema fingerprints (Monitor pillar), parity coverage maps, "tested 37 minutes ago" recency signals.

---

## Tech Stack (Planned)

- **Frontend**: Next.js, React 19, Tailwind CSS 4
- **Backend**: Next.js API routes (Vercel) + workers on Railway/Fly.io (Playwright can't run on Vercel)
- **Database**: Supabase (Postgres + Storage)
- **Queue**: BullMQ + Redis (Upstash) — monolithic pipeline for V1, station workers at scale
- **Browser**: Playwright (clean profiles per audit — stale state causes false positives)
- **LLM**: 4-tier model router — Quick Check uses NO LLM; Full Audit uses Sonnet/Haiku, Opus for synthesis only
- **Security**: URLValidator (SSRF defense), InputSanitizer (prompt injection defense), Turnstile (abuse prevention)
- **Testing**: Scenarios stored separately from codebase
- **APIs**: See ~/.api-keys for available keys

---

## Pricing (Revised — adversarial review)

| Tier | Price | Rationale |
|------|-------|-----------|
| Quick Check (free) | $0 | Deterministic only (SEO/Perf/A11y). No LLM. Sub-60s. Email + Turnstile required. 1/email/30d, 3/IP/24h. |
| Full Audit | $19-49 | All dimensions, LLM-powered alien perspective. Account + payment required. |
| Re-test (same URL, <7 days) | $5-9 | Baseline exists, comparison is the value. |
| Monthly plan | $29/mo + $5/audit | Supports habitual looping |
| Professional | $49-99/audit | PDF export, executive summary, white-label |
| Enterprise | Custom | CI/CD, compliance, SLA |

**COGS reality:** Full Audit costs $1.90-4.40 per audit (p50: $2.50). Quick Check costs ~$0.10. Original $0.40-1.00 estimate was 3-5x too low. Per-audit LLM cost tracked (soft warning at $5); hard caps deferred until 50+ real audits establish baselines. See CANONICAL-BUILD-SCOPE Section 7.

---

## Adversarial Review Integration (March 7, 2026)

Two adversarial panels (30 experts total) stress-tested this plan. Key modifications integrated:

| Category | Change | Documents Modified |
|----------|--------|-------------------|
| **Validation language** | "VALIDATED" → "Demonstrated (N=1)" throughout | All three |
| **Free tier** | Split into Quick Check (free, deterministic) + Full Audit (paid, LLM) | PRODUCT-SPEC, GTM, CLAUDE.md |
| **Abuse prevention** | Turnstile + email verification + rate limits — Day 1, not Phase 6 | PRODUCT-SPEC, GTM |
| **Privacy/security** | Default private reports; security findings require ownership verification | PRODUCT-SPEC, GTM |
| **Unit economics** | COGS revised from $0.40-1.00 to $1.90-4.40; pricing adjusted | GTM |
| **Revenue targets** | Base/target/upside scenarios instead of single optimistic line | PRODUCT-SPEC, GTM |
| **FP targets** | Tightened from <15% to <10% overall, <1% CRITICAL | PRODUCT-SPEC, GTM |
| **V1 scope** | Cut delivery surfaces from 4 to 2 (web + API). CLI Phase 1, MCP Phase 2. | PRODUCT-SPEC |
| **Evidence bundles** | Every finding carries evidence; CRITICAL blocked without 100% | PRODUCT-SPEC |
| **Finding states** | fixable, mitigable, platform-limited, accepted-risk, third-party | PRODUCT-SPEC |
| **Moat honesty** | Status column added; most moats are "unbuilt" | PRODUCT-SPEC |
| **Competing agent** | "vs Claude Code" section added to competitive positioning | GTM |
| **AEO/GEO/MEO** | Must be validated by 2+ SEO professionals before launch messaging | PRODUCT-SPEC, GTM |

---

## Current Work

### Round 1: Discovery & Architecture

> **Type**: feature
> **Goal**: Research synthesis, project setup, define architecture and audit dimensions
> **Status**: DESIGN-COMPLETE (full vision). 4 panels, 29 experts, ~12,600 lines of specs. Ready for WU-00 scaffolding.

#### Completed
- [x] Initialize Compound Beads
- [x] Research StrongDM Dark Factory
- [x] Research Stanford generative agent personas
- [x] Research agent-native primitives (every.to)
- [x] Analyze Growth Marketing Problem Finder for reusable patterns
- [x] Analyze Rhumb for integration points
- [x] Run 5-expert panel (film/aviation/clinical/mystery/chaos)
- [x] Build 30 simulated personas (20 human + 10 agent)
- [x] Write PRODUCT-SPEC.md v1.0
- [x] Design feedback payload format
- [x] Dogfood: audit supertrained.ai (12 findings)
- [x] Endpoint coverage audit: documented that website audits are design-complete, while API/MCP/CLI/GitHub target-surface support remains underspecified
- [x] Persona methodology draft: per-audit business-specific personas generated from evidence, with deterministic and probabilistic modes
- [x] Canonical build scope: defined binding implementation docs and fenced future-design docs from current scope creep
- [x] Dogfood: demonstrate Format B (12/12 fixes, N=1)
- [x] Dogfood: re-test and demonstrate loop convergence
- [x] Update PRODUCT-SPEC.md to v2.0 with demonstration evidence
- [x] Write GO-TO-MARKET.md
- [x] Run 2 adversarial review panels (10 CRITICAL + 10 HIGH + 9 MEDIUM findings)
- [x] Integrate adversarial findings → PRODUCT-SPEC.md v3.0, GO-TO-MARKET.md v2.0

#### Next (Documentation & Planning — Complete Before Code)
- [x] Define work unit specifications (25 WUs with acceptance criteria, agent assignments)
- [x] Freeze type specifications (Finding, Envelope, CrawlResult, PageSummary, etc.)
- [x] Pre-register scoring methodology v0.1 (6 dimensions, rubrics, weights, FP targets)
- [x] Define Supabase schema (10 tables, RLS, retention policy)
- [x] Write user stories (20 stories, 11 epics, P0/P1/P2 priority)
- [x] Record architecture decisions (16 ADRs)
- [x] Define scenario grammar (5 axes, 27,440+ configurations, anti-gaming)
- [x] Define agent handoff protocol (Opus vs Codex roles, review gates, coordination rules)
- [x] Competitive analysis: TestSprite (inside-out complement, not competitor)
- [x] Surface coverage deep audit: 3 panels (23 experts), 4 CRITICAL + 2 HIGH findings. Web-only V1 confirmed. MCP after PMF. 6 web enhancements. ADR-017 proposed.
- [x] **Full-vision design-complete**: 4 expert panels (29 experts, ~12,600 lines):
  - Panel A (7 experts): MCP, REST API, GraphQL, Webhook → `docs/MULTI-SURFACE-METHODOLOGY.md` (2,971 lines)
  - Panel B (7 experts): CLI, Package, GitHub, Docs → `docs/MULTI-SURFACE-SPEC.md` (2,840 lines)
  - Panel C (7 experts): Cross-surface evaluation theory → `research/panels/panel-round3-cross-surface-metrology.md`
  - Panel D (8 experts): Enterprise, monitoring, CI/CD, personas, methodology v0.2, scenario grammar v2.0, badges, patterns → `docs/PLATFORM-ARCHITECTURE.md` (4,110 lines)
  - **SYNTHESIS**: `docs/FULL-VISION-SPEC.md` (1,212 lines) — THE master index document
- [x] **Unified architecture**: 9 surfaces, ~58 dimensions, ~37,820 scenario configs, ~187 WUs, ~507h total, 5 build phases
- [x] **19 new ADRs** (ADR-018 through ADR-036) covering discriminated unions, methodology registry, MEO, sandwich architecture, badges, patterns
- [ ] Write AEO/GEO/MEO rubric (2-page definition — deferred to Phase 1, requires SEO professional validation)
- [ ] LLM cost validation: run 10 real audits, measure actual token usage and costs
- [x] Name the product — **Alien Eyes** (alieneyes.dev, CLI: `ae`/`alieneyes`, packages: alien-eyes)

#### Implementation Progress
- [x] **WU-00 / 00a / 00b:** Scaffold, types, worker runtime, security — GATE 1 approved
- [x] **WU-01 through WU-08:** Crawl, extraction, 6 primitives, synthesis, 4 renderers, pipeline, CLI, regression harness
- [x] **WU-09 through WU-12 (partial):** Web UI (landing/progress/results), hosted lifecycle, Supabase persistence
- [x] **Adversarial Sprints 1-3:** TDD remediation of panel findings
- [x] **Hosted lifecycle hardening:** Race conditions fixed, live-validated on Vercel + Railway + Supabase
- [x] **Quality Sprint 4:** Performance CWV gaps, agent-nativeness keyword FP, copy-ux specificity, Format B evidence

#### Next
- [x] **WU-13: Account & Dashboard**
- [x] Magic-link callback verified locally and in production via generated Supabase links
- [ ] Verify GitHub OAuth with a real credentialed browser login
- [ ] Quality/robustness sprint on live runs (`supertrained.ai` over-reporting, non-Next.js stalls)
- [ ] Scoring calibration (issue #5 from Quality Sprint 4 memo) — deferred to post-alpha with methodology v0.1 disclaimer

WU-13 implementation summary:
- `src/lib/auth.ts` added auth helpers, API key utilities, dashboard trend aggregation, and bearer-token verification
- `src/app/api/account/*` added `sync`, `dashboard`, and `api-keys` routes
- `src/app/auth/*` added login, signup, and callback pages
- `src/app/dashboard/page.tsx` added dashboard shell
- `src/components/dashboard/*` added audit list and trend chart
- `src/components/account/*` added auth actions, callback client, and account nav
- `POST /api/audit` now attaches authenticated `user_id`

WU-13 verification:
- `npm test` -> 74 passing tests across 32 files
- `npm run typecheck` -> pass
- `npm run build` -> pass
- Local owned-account smoke with disposable Supabase user:
  - account sync 200
  - API key creation 200
  - authenticated audit completed
  - dashboard returned owned audit history and trend series
  - DB rows confirmed shared `user_id`
- GitHub OAuth provider smoke (`skipBrowserRedirect: true`) returned a real Supabase OAuth URL

Remaining blocker before calling WU-13 fully verified:
- full GitHub OAuth login completion in a real browser with credentials

Post-WU-13 live validation:
- `supertrained.ai` quick check returned `141` findings in current live state
- `stripe.com` CLI quick check stalled without producing output in a reasonable window
- `python.org` CLI quick check also stalled without producing output in a reasonable window
- This is now the higher-priority blocker before `WU-15`

Latest review note:
- Claude's quality calibration memo was reviewed and accepted in direction.
- Caveats: the memo used a stale test-count snapshot, and `agent-nativeness.ts` `usesLLM = true` is not itself a defect because `full_audit` still uses LLM-assisted findings there.
- No more planning is needed before `WU-13`.

---

### Quality Sprint 4 Changes (2026-03-18)

| File | Change | Why |
|------|--------|-----|
| `src/primitives/performance.ts` | Added LCP >2500ms and CLS >0.25 checks | CWV are Google-ranked; ignoring them is a credibility killer |
| `src/primitives/agent-nativeness.ts` | Removed `STRUCTURED_KEYWORDS` text matching | Text mentions ≠ unexposed capabilities; high FP on marketing sites |
| `src/primitives/copy-ux.ts` | Removed Calendly check; expanded `CTA_TEXT_PATTERNS` with 11 more patterns | Product-specific checks don't generalize; narrow CTA list missed common variants |
| `src/renderers/format-b.ts` | Added confidence parenthetical + verify line per finding | Coding agents need confidence to triage and verify to confirm fixes |

**Verification state at that checkpoint:** 66 tests / 30 files passing, 0 TS errors. Current repo state is beyond that checkpoint.

---

## How to Continue

**For WU-13 (the current task):**

1. Read this CLAUDE.md for context
2. Read `.compound-beads/context.md` for session state
3. Read `docs/WORK-UNITS.md` — find WU-13 acceptance criteria
4. Read existing web surface: `src/app/*`, `src/components/*`, `src/lib/audit-repository.ts`
5. Implement account/auth + dashboard shell

**For architecture foresight (reference only — does not expand Phase 0 scope):**

- `docs/FULL-VISION-SPEC.md` — multi-surface vision (9 surfaces, ~187 WUs, 5 phases)
- `PRODUCT-SPEC.md` — product vision v3.0 with adversarial integration
- Panel docs in `docs/MULTI-SURFACE-*.md` and `docs/PLATFORM-ARCHITECTURE.md`

Use `/ready` to start a session.
