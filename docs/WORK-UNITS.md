# Alien Eyes — Work Unit Specifications

> Version: 1.0 | Date: 2026-03-10
> Purpose: Detailed specifications for every work unit. This is the contract between agents.
> Each WU defines: what to build, who builds it, inputs, outputs, acceptance criteria, dependencies, and handoff protocol.

---

## How to Use This Document

1. **Before starting a WU:** Read this spec AND the frozen types in `docs/TYPE-SPEC.md`
2. **Agent assignment:** Opus 4.6 = complex architecture, LLM integration, synthesis. Codex (ChatGPT 5.4) = parallel subsystem implementation, deterministic modules, UI components.
3. **Handoff protocol:** When a WU is complete, the agent writes a `HANDOFF.md` in the WU's directory summarizing: what was built, what tests pass, what the next agent needs to know, and any deviations from this spec.
4. **Human review gates:** Five gates. No agent proceeds past a gate without human approval.
5. **Shared files:** Only frozen types (`src/types/`) are shared across WUs. All other files are WU-specific until integration in Phase 3.

---

## Phase 1: Foundation (Week 1)

### WU-00: Architecture & Types

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | None (first WU) |
| **Blocked By** | Nothing |
| **Blocks** | Everything (all WUs depend on frozen types) |

**Objective:** Scaffold project, freeze all types, define Supabase schema, pre-register methodology v0.1, create integration test stubs.

**Inputs:**
- `docs/TYPE-SPEC.md` (this document defines the types; WU-00 implements them)
- `docs/METHODOLOGY-v0.1.md` (scoring methodology)
- `docs/SCHEMA.md` (database schema specification)
- GMPF Envelope pattern (`products/growth-marketing-problem-finder/types/envelope.ts`)

**Outputs:**
- `package.json` with all core dependencies
- `tsconfig.json` with strict mode, path aliases
- `src/types/finding.ts` — Finding interface
- `src/types/envelope.ts` — Envelope<T> with runPrimitive helper
- `src/types/crawl.ts` — CrawlResult, CrawledPage, ConsoleEntry, NetworkEntry
- `src/types/primitive.ts` — AuditPrimitive interface, AuditDimension, AuditConfig
- `src/types/renderer.ts` — PayloadRenderer, AuditMeta
- `src/types/evidence.ts` — EvidenceBundle, FindingLifecycle
- `src/types/index.ts` — barrel export
- `methodology/v0.1.md` — copy of `docs/METHODOLOGY-v0.1.md` in repo root
- `supabase/migrations/001_initial.sql` — from `docs/SCHEMA.md`
- `tests/integration/` — test stubs for all interfaces

**Acceptance Criteria:**
- [ ] `npm run typecheck` passes with zero errors
- [ ] All types importable from `@/types`
- [ ] All interfaces have JSDoc comments explaining purpose
- [ ] Methodology v0.1 is committed and immutable
- [ ] Supabase migration runs without errors
- [ ] Test stubs exist for: Envelope creation, Finding validation, CrawlResult shape, Renderer parity
- [ ] No runtime code — types only

**Files NOT to Create:**
- No runtime implementation code
- No UI components
- No API routes

---

### WU-00a: Worker Runtime Architecture

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 1 |
| **Dependencies** | WU-00 (needs package.json, tsconfig) |
| **Blocks** | WU-01 (crawl worker needs runtime target) |

**Objective:** Define the worker runtime architecture. Workers (Playwright + audit pipeline) run on Railway/Fly.io, NOT Vercel. This WU creates the infrastructure specification and directory structure.

**Why:** Playwright requires: long-running processes (30-120s crawls), writable filesystem, 400MB+ RAM per browser. Vercel has: 60s max timeout (Pro), read-only fs, 512MB /tmp. GMPF already proved this separation.

**Inputs:**
- GMPF worker architecture (`products/growth-marketing-problem-finder/workers/`)
- GMPF Dockerfile if it exists

**Outputs:**
- `workers/package.json` — worker-specific dependencies (Playwright, BullMQ, ioredis)
- `workers/tsconfig.json` — ES2022 target, bundler resolution
- `workers/Dockerfile` — Node.js 22 + Playwright browsers
- `workers/.dockerignore`
- `docs/INFRASTRUCTURE.md` — deployment architecture document:
  - Vercel: Next.js frontend + API routes
  - Railway/Fly.io: Worker processes (Playwright, BullMQ consumers)
  - Upstash: Redis for BullMQ
  - Supabase: Postgres + Storage
  - Communication: workers poll BullMQ queues, write results to Supabase

**Acceptance Criteria:**
- [ ] `workers/` directory exists with its own package.json
- [ ] Dockerfile builds successfully
- [ ] Infrastructure doc clearly defines the split
- [ ] Health check endpoint defined for worker process
- [ ] Environment variable list documented

---

### WU-00b: Security Architecture

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-00 (needs types) |
| **Blocks** | WU-01 (crawl worker uses URLValidator), WU-02 (primitives use InputSanitizer) |

**Objective:** Build the security architecture that protects against SSRF, prompt injection, cost amplification, and abuse. This is Day 1, not Phase 6.

**Inputs:**
- Adversarial review findings C2 (SSRF), C4 (prompt injection), C1 (cost amplification)
- PRODUCT-SPEC.md Section 9 Principle 8 (abuse prevention)

**Outputs:**
- `src/lib/security/url-validator.ts` — URLValidator class:
  - Resolves DNS BEFORE Playwright connects
  - Blocks RFC 1918 ranges (10.x, 172.16-31.x, 192.168.x)
  - Blocks link-local (169.254.x)
  - Blocks cloud metadata (169.254.169.254, metadata.google.internal)
  - Blocks localhost/loopback (127.x, ::1)
  - Re-checks DNS resolution after initial check (anti-rebinding)
  - Validates URL scheme (https only, or http with explicit flag)
  - Validates URL format (no IP addresses without flag)
- `src/lib/security/input-sanitizer.ts` — InputSanitizer class:
  - Strips `display:none`, `visibility:hidden`, `aria-hidden="true"` elements
  - Strips `<script>` tag contents
  - Strips HTML comments
  - Strips `<noscript>` contents
  - Preserves visible text, headings, meta tags, ARIA attributes, links
  - Separates instructions from data in prompt templates
- `src/lib/security/rate-limiter.ts` — Rate limiting config:
  - Per-IP: 3 Quick Checks per 24h, 10 Full Audits per 24h
  - Per-email: 1 Quick Check per 30 days (free tier)
  - Global: log total LLM spend per hour (monitoring only in Phase 0; hard cap deferred)
- `src/lib/security/cost-budget.ts` — Per-audit cost tracking (measurement mode per CANONICAL-BUILD-SCOPE Section 7):
  - Tracks running cost per audit via `CostBudget` type
  - Tracks per-primitive cost breakdown
  - `maxPerAudit` field exists but is NOT enforced in Phase 0 — observability only
  - Logs warning when audit exceeds $5 (soft threshold for monitoring, not a kill switch)
  - Hard caps and circuit breakers deferred until 50+ real audits establish cost baselines
- `tests/unit/url-validator.test.ts`
- `tests/unit/input-sanitizer.test.ts`

**Acceptance Criteria:**
- [ ] URLValidator blocks all RFC 1918, link-local, cloud metadata, loopback addresses
- [ ] URLValidator detects DNS rebinding (IP changes between checks)
- [ ] InputSanitizer removes hidden/invisible content from HTML
- [ ] InputSanitizer preserves semantic structure (headings, meta, ARIA)
- [ ] Cost budget tracks and logs per-audit spend (warns at $5, does not kill)
- [ ] All unit tests pass
- [ ] No false positives on legitimate public URLs (test against 10 real sites)

---

**HUMAN REVIEW GATE 1:** Approve types, schema, security architecture, worker runtime, methodology doc before ANY Phase 2 work begins.

---

## Phase 2: Core Engine (Weeks 2-3) — Parallel Work

> Phase 2 WUs can run in parallel. Each reads from frozen types only. No shared runtime files.

### WU-01: Crawl Worker

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 3 |
| **Dependencies** | WU-00 (types), WU-00a (worker runtime), WU-00b (URLValidator) |
| **Blocks** | WU-06 (orchestrator needs crawl output) |

**Objective:** Single Playwright browser session per audit. Clean profile. Visits all discoverable pages (up to page limit). Collects DOM, screenshots, console, network, headers, meta tags. Returns `CrawlResult`.

**Key Design Decisions:**
- ONE browser session per audit (not per-page, not per-primitive)
- CLEAN profile every time (no cookies, no localStorage, no cache)
- Page limit: 30 pages (free), 50 pages (paid)
- Priority: homepage first, then nav-linked pages, then sitemap pages
- robots.txt respected
- Stealth mode: hide Playwright detection signals

**Inputs:**
- GMPF browser pool (`products/growth-marketing-problem-finder/workers/lib/browser-pool.ts`)
- Frozen types: CrawlResult, CrawledPage, ConsoleEntry, NetworkEntry
- URLValidator from WU-00b

**Outputs:**
- `src/lib/crawler/browser-pool.ts` — Browser lifecycle management
- `src/lib/crawler/page-collector.ts` — Per-page data collection
- `src/lib/crawler/link-discovery.ts` — Find internal links, respect robots.txt
- `src/lib/crawler/crawl-engine.ts` — Orchestrates full crawl, returns CrawlResult
- `tests/unit/crawler/` — Unit tests with mock pages

**Acceptance Criteria:**
- [ ] Crawls a 5-page test site and returns valid CrawlResult
- [ ] Clean browser profile (no state leakage between audits)
- [ ] Respects page limit (stops at 30/50)
- [ ] Collects: HTML, simplified DOM, screenshots, console logs, network requests, response headers, meta tags, status codes, load times
- [ ] URLValidator is called before every navigation
- [ ] robots.txt checked before each page
- [ ] Stealth mode passes basic bot detection
- [ ] Handles: 404 pages, redirects, timeouts, JavaScript-rendered content
- [ ] Total crawl time < 120 seconds for a 20-page site

---

### WU-01.5: Content Extraction & Token Budgeting

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-00 (types), WU-01 (CrawlResult) |
| **Blocks** | WU-02 (primitives consume PageSummary, not raw HTML) |

**Objective:** Create a content extraction layer between crawl and primitives. Deterministically extract structured signals from HTML. Create compressed PageSummary representations. Define per-primitive token budgets. Raw HTML is NEVER fed directly to LLMs.

**Why:** A 20-page site produces 2-10MB of HTML. Raw HTML fed to Opus overflows context windows and costs $1-2 per page. Deterministic extraction handles 60-70% of signal extraction with zero LLM cost.

**Inputs:**
- CrawlResult from WU-01
- InputSanitizer from WU-00b

**Outputs:**
- `src/types/page-summary.ts` — PageSummary type:
  ```
  interface PageSummary {
    url: string;
    title: string;
    metaTags: Record<string, string>;
    headings: Heading[];
    links: Link[];
    images: Image[];
    ariaLandmarks: AriaLandmark[];
    structuredData: any[];       // JSON-LD, microdata
    securityHeaders: Record<string, string>;
    consoleSummary: ConsoleSummary;  // counts by level, not raw logs
    networkSummary: NetworkSummary;  // request counts by type, not bodies
    performanceMetrics: PerformanceMetrics;
    sanitizedTextContent: string;    // Visible text only, stripped of HTML
    tokenEstimate: number;           // Estimated token count
  }
  ```
- `src/lib/extraction/meta-extractor.ts` — Extract all meta tags, OG tags, canonical, robots
- `src/lib/extraction/heading-extractor.ts` — Extract heading hierarchy
- `src/lib/extraction/accessibility-extractor.ts` — Extract ARIA roles, landmarks, alt text, form labels
- `src/lib/extraction/security-extractor.ts` — Extract CSP, HSTS, cookies, mixed content signals
- `src/lib/extraction/structured-data-extractor.ts` — Extract JSON-LD, microdata
- `src/lib/extraction/page-summarizer.ts` — Compose all extractors into PageSummary
- `src/lib/extraction/token-budget.ts` — Per-primitive token budgets:
  - SEO: meta tags, headings, canonical, robots, structured data (~2K tokens/page)
  - Accessibility: ARIA, headings, images, forms (~3K tokens/page)
  - Security: headers only (~500 tokens/page)
  - Performance: metrics only (~200 tokens/page, deterministic)
  - Agent-nativeness: full sanitized text + structured data (~5K tokens/page)
  - Copy-UX: sanitized text + headings + CTAs (~4K tokens/page)
- `tests/unit/extraction/` — Tests for each extractor

**Acceptance Criteria:**
- [ ] PageSummary is 2-5K tokens per page (vs 50-100K raw HTML)
- [ ] All extractors are deterministic (no LLM, no randomness)
- [ ] Token budget enforced per primitive
- [ ] Sanitized text content has no hidden elements, scripts, comments
- [ ] Structured data correctly extracted from JSON-LD and microdata
- [ ] Console summary counts by level (error/warn/info), no raw messages
- [ ] Network summary counts by type (XHR/fetch/script/image), no request bodies

---

### WU-02: Audit Primitives (6 Core)

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 4 |
| **Dependencies** | WU-00 (types), WU-01.5 (PageSummary, token budgets), WU-00b (InputSanitizer) |
| **Blocks** | WU-03 (synthesis consumes primitive outputs), WU-06 (orchestrator runs primitives) |

**Objective:** Implement 6 audit primitives. Each implements the `AuditPrimitive` interface. Each reads from CrawlResult + PageSummary (NOT raw HTML). Each returns `Envelope<Finding[]>`.

**Key Design Decisions:**
- Primitives receive PageSummary, not raw HTML
- Each primitive has a defined LLM tier (or none for deterministic)
- InputSanitizer applied before any LLM call
- Prompt injection defense: structured templates separating instructions from data
- Output validated against Finding schema (reject malformed findings)
- Tiered findings: unverified URLs get SEO, Performance, Accessibility only (no Security, no Agent-Nativeness)

**Primitives:**

#### 2a. SEO Primitive
- **LLM Tier:** Sonnet (for judgment calls) + deterministic (for checks)
- **What it checks:** Canonical URLs, meta tags, title tags, heading hierarchy, robots.txt, sitemap.xml, structured data, internal linking, duplicate content signals, Open Graph tags
- **Deterministic checks (no LLM):** Missing canonical, duplicate titles, missing meta description, broken heading hierarchy, missing robots.txt, missing sitemap.xml, missing OG tags
- **LLM checks:** Content quality assessment, keyword intent alignment, content thin-ness
- **Input:** PageSummary (meta tags, headings, structured data)
- **File:** `src/primitives/seo.ts`

#### 2b. Accessibility Primitive
- **LLM Tier:** Haiku (rules) + Sonnet (judgment)
- **What it checks:** WCAG 2.1 AA compliance, color contrast, alt text, keyboard navigation, ARIA roles/landmarks, form labels, focus management, skip links
- **Deterministic checks:** Missing alt text, missing form labels, missing ARIA landmarks, heading hierarchy violations, missing skip-to-content link
- **LLM checks:** Alt text quality, ARIA usage correctness, semantic HTML assessment
- **Input:** PageSummary (ARIA landmarks, headings, images, forms)
- **File:** `src/primitives/accessibility.ts`

#### 2c. Security Primitive
- **LLM Tier:** Haiku (rules only, no judgment)
- **What it checks:** CSP headers, HSTS, mixed content, cookie attributes (HttpOnly, Secure, SameSite), exposed secrets in HTML/JS, X-Frame-Options, referrer policy
- **All deterministic + Haiku for classification:** Header presence/absence, cookie attribute checks, basic pattern matching for exposed secrets
- **REQUIRES OWNERSHIP VERIFICATION:** Security findings only returned for verified URLs
- **Input:** PageSummary (security headers, cookies)
- **File:** `src/primitives/security.ts`

#### 2d. Performance Primitive
- **LLM Tier:** None (fully deterministic)
- **What it checks:** Load time, TTFB, page weight, script count/size, image optimization, render-blocking resources, Core Web Vitals from crawl data
- **All deterministic:** Computed from CrawlResult network data and timing metrics
- **Input:** CrawlResult (network requests, load times, performance metrics)
- **File:** `src/primitives/performance.ts`

#### 2e. Agent-Nativeness Primitive
- **LLM Tier:** Opus (requires judgment — the most expensive primitive)
- **What it checks:** Parity (API vs UI features), granularity (atomic vs bundled operations), composability (structured outputs, pipeable), CRUD completeness per entity, error handling quality, structured response formats
- **REQUIRES OWNERSHIP VERIFICATION:** Only for verified URLs (prevents reconnaissance)
- **Cost control:** Use Sonnet for initial scan, Opus only for judgment calls. Target: <$1.50 per audit for this primitive.
- **Input:** PageSummary (full sanitized text + structured data + API schema if available)
- **File:** `src/primitives/agent-nativeness.ts`

#### 2f. Copy-UX Primitive
- **LLM Tier:** Sonnet
- **What it checks:** CTA clarity, trust signals, dead-end pages, error state messaging, value proposition clarity, navigation coherence, mobile UX signals
- **Input:** PageSummary (sanitized text, headings, CTAs, navigation structure)
- **File:** `src/primitives/copy-ux.ts`

**Shared files:**
- `src/primitives/base.ts` — Base class/utilities for all primitives
- `src/primitives/index.ts` — Registry, primitive discovery

**Acceptance Criteria:**
- [ ] Each primitive implements `AuditPrimitive` interface
- [ ] Each primitive returns valid `Envelope<Finding[]>`
- [ ] Each finding has all 7 required fields (what, where, expected, why, verify, severity, dimension)
- [ ] No primitive receives raw HTML — only PageSummary
- [ ] InputSanitizer applied before every LLM call
- [ ] Prompt templates separate instructions from data
- [ ] Output validated against Finding schema
- [ ] Security + Agent-Nativeness primitives check ownership verification flag
- [ ] Performance primitive uses no LLM
- [ ] Unit tests with mock PageSummary inputs for each primitive
- [ ] Each primitive has a cost estimate (target total: <$3 for all 6)

---

### WU-03: Synthesis Engine

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 3 |
| **Dependencies** | WU-00 (types), WU-02 (primitive outputs), WU-05 (model router) |
| **Blocks** | WU-06 (orchestrator calls synthesis after primitives) |

**Objective:** Take all primitive outputs, de-duplicate findings, build causal chains, calculate scores, generate verbatim narrative, prepare for rendering.

**Inputs:**
- Array of `Envelope<Finding[]>` from all primitives
- CrawlResult metadata (page count, site structure)
- Scoring methodology v0.1

**Outputs:**
- `src/lib/synthesis/deduplicator.ts` — De-duplicate findings across primitives (same issue found by SEO and Accessibility)
- `src/lib/synthesis/causal-chains.ts` — Swiss Cheese Model: link findings that interact. Use LLM to identify causal relationships.
- `src/lib/synthesis/scoring.ts` — Calculate:
  - Probabilistic satisfaction score (single-run with confidence interval)
  - Human-native composite score
  - Agent-nativeness composite score
  - Per-dimension scores
- `src/lib/synthesis/narrative-generator.ts` — LLM-generated first-person experiential story from simulated user perspective
- `src/lib/synthesis/celebration.ts` — "What's working well" section: identify clean dimensions, working flows, positive observations
- `src/lib/synthesis/synthesizer.ts` — Main entry point: takes all envelopes, returns SynthesisResult
- `src/types/synthesis.ts` — SynthesisResult type

**Acceptance Criteria:**
- [ ] Duplicate findings across primitives are merged (not dropped — evidence from both preserved)
- [ ] Causal chains link related findings by ID
- [ ] Satisfaction score is a number 0-100 with confidence interval
- [ ] "What's working" section identifies positive observations BEFORE findings
- [ ] Verbatim narrative reads as a coherent first-person story
- [ ] Total synthesis cost < $1.50 per audit
- [ ] Findings sorted by optimal fix order (dependencies first, then severity)
- [ ] Unit tests with mock primitive outputs

---

### WU-04: Payload Renderers

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-00 (types), WU-03 (SynthesisResult) |
| **Blocks** | WU-06 (orchestrator calls renderers), WU-12 (results page uses Format A) |

**Objective:** Four renderer functions from the same Finding[]. All four contain the same findings. If a renderer drops a finding, that is a bug.

**Critical Rule:** Format B output must match the validated format from `research/test-payloads/format-B-condensed.md`. This is a regression test baseline.

**Inputs:**
- SynthesisResult (from WU-03)
- `research/test-payloads/format-B-condensed.md` — Format B reference
- `research/feedback-payload-design.md` — Full design rationale

**Outputs:**
- `src/renderers/format-a.ts` — Dashboard HTML/React: full narrative, severity as visual weight, causal chain visualization, celebration section, score hero
- `src/renderers/format-b.ts` — Clipboard plain text:
  - Numbered list, severity-prefixed
  - Each finding: 3-5 lines
  - No file paths, no methodology, no scores, no branding
  - Verification criteria included
  - Causal connections noted
  - Capped at 5 findings per paste (staged disclosure)
  - Fix-order prioritized (dependencies first)
  - **MUST match validated Format B structure**
- `src/renderers/format-c.ts` — Format B + file paths when available
- `src/renderers/format-json.ts` — Full structured JSON for MCP/API:
  - All fields at full resolution
  - Finding IDs for re-audit correlation
  - Confidence scores
  - Evidence bundle references
  - Causal chain references
- `src/renderers/index.ts` — Registry, format selection

**Acceptance Criteria:**
- [ ] All four formats contain identical findings (parity test)
- [ ] Format B matches validated reference format
- [ ] Format B has no branding, no methodology, no scores
- [ ] Format B capped at 5 findings (with note: "X more findings available after re-audit")
- [ ] Format JSON includes all metadata (confidence, evidence, methodology version)
- [ ] Renderer parity test: same input → all 4 formats → assert same finding IDs in each
- [ ] Unit tests for each renderer

---

### WU-05: Model Router

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-00 (types) |
| **Blocks** | WU-02 (primitives use router), WU-03 (synthesis uses router) |

**Objective:** 4-tier model router with cost tracking, structured output with JSON repair, and per-audit cost budgeting.

**Inputs:**
- GMPF model router (`products/growth-marketing-problem-finder/workers/lib/models.ts`)
- Cost budget from WU-00b

**Outputs:**
- `src/lib/llm/model-router.ts` — ModelRouter class:
  - 4 tiers: opus, sonnet, haiku, openai-mini
  - Lazy client initialization
  - Cost calculation per call
  - Structured output with JSON schema validation
  - JSON repair loop (retry malformed JSON up to 3 times)
  - Temperature control (0 for deterministic, 0.3-0.7 for judgment)
- `src/lib/llm/cost-tracker.ts` — Per-audit cost tracking (measurement mode per CANONICAL-BUILD-SCOPE Section 7):
  - Accumulates cost across all LLM calls in an audit
  - Logs warning at $5 (soft threshold, not enforced in Phase 0)
  - Reports cost per primitive
  - Reports total audit cost
  - Feeds `AuditMeta.totalCostUsd` and `AuditMeta.costByPrimitive`
- `src/lib/llm/prompt-templates.ts` — Structured prompt templates:
  - System instructions separated from data
  - Data wrapped in clear delimiters
  - Anti-injection preamble
- `tests/unit/model-router.test.ts`

**Acceptance Criteria:**
- [ ] Router correctly dispatches to 4 model tiers
- [ ] Cost tracked per call with input/output token accounting
- [ ] JSON repair handles: trailing commas, missing quotes, truncated JSON
- [ ] Cost tracker logs warning when audit exceeds $5 (does not kill in Phase 0)
- [ ] Prompt templates use clear instruction/data separation
- [ ] Unit tests (mock LLM responses)

---

**HUMAN REVIEW GATE 2:** Review primitives, synthesis logic, renderers, model router. Run integration tests with mock data.

---

## Phase 3: Integration & CLI (Week 4)

### WU-06: Pipeline Orchestrator

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 (reduced from 3 — monolithic pipeline) |
| **Dependencies** | WU-01, WU-01.5, WU-02, WU-03, WU-04, WU-05 (all core engine) |
| **Blocks** | WU-07, WU-08, WU-11, WU-14, WU-15 |

**Objective:** Connect all components into a single pipeline. Monolithic for V1 (not station workers). State machine tracks progress.

**Architecture Decision:** Monolithic Pipeline with Typed Boundaries (revised from original Decision #4). All primitives run via `Promise.all` within a single BullMQ job handler. Typed boundaries enforce separation at the type level. Extract to station workers when traffic justifies complexity.

**Pipeline:**
```
URL → URLValidator → Crawl → Extract → [Primitives in parallel] → Synthesize → Render → Store
```

**State machine:**
```
pending → validating → crawling → extracting → auditing → synthesizing → rendering → complete
                                                                                    → error
                                                                                    → timeout
```

**Inputs:**
- All outputs from WU-01 through WU-05
- BullMQ from WU-00a

**Outputs:**
- `src/orchestrator/pipeline.ts` — Main pipeline function:
  - Takes: URL, audit config (free/paid, page limit, ownership verified)
  - Returns: AuditResult (synthesis + rendered formats)
  - Runs: validate → crawl → extract → audit → synthesize → render
  - Progress events emitted at each stage
  - Error handling: partial results on primitive failure
  - Timeout: 5 minutes max
- `src/orchestrator/state-machine.ts` — State tracking
- `src/orchestrator/progress.ts` — Progress event emitter (for frontend SSE)
- `src/lib/queue.ts` — BullMQ queue setup (for cloud mode)
- `tests/integration/pipeline.test.ts` — End-to-end test with mock crawl data

**Acceptance Criteria:**
- [ ] Pipeline runs URL → findings in < 5 minutes for a 10-page site
- [ ] State machine tracks all transitions
- [ ] Progress events emitted at each stage (for UI consumption)
- [ ] Partial results returned if one primitive fails (others still work)
- [ ] Timeout at 5 minutes kills gracefully
- [ ] Cost tracking aggregated across all primitives
- [ ] Integration test passes with mock crawl data

---

### WU-07a: CLI Local Mode

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 1.5 |
| **Dependencies** | WU-06 (pipeline) |
| **Blocks** | WU-08 (dogfood regression uses CLI) |

**Objective:** `ae audit <url>` (or `npx alien-eyes audit <url>`) runs a full audit locally. No Redis, no Supabase. Only requires `ANTHROPIC_API_KEY`. Default mode.

**Inputs:**
- Pipeline from WU-06
- Format B from WU-04

**Outputs:**
- `src/cli/index.ts` — CLI entry point (commander or yargs)
- `src/cli/audit.ts` — Audit command:
  - `ae audit <url>` — run audit, output Format B to stdout
  - `--format a|b|c|json` — select output format
  - `--json` — shorthand for `--format json`
  - `--pages <n>` — override page limit
  - `--quick` — Quick Check mode (deterministic only, no LLM)
  - `--verbose` — show progress in stderr
  - Progress spinner in terminal (ora or similar)
  - Exit codes: 0 = clean, 1 = findings, 2 = error
- `bin/ae` — executable script (short form)
- `bin/alieneyes` — executable script (long form)
- `package.json` `bin` field configured

**Acceptance Criteria:**
- [ ] `ae audit https://example.com` (or `npx alien-eyes audit`) runs without Redis/Supabase
- [ ] Only `ANTHROPIC_API_KEY` env var required
- [ ] Format B output to stdout (pipeable)
- [ ] Progress spinner in stderr (doesn't corrupt stdout pipe)
- [ ] Exit code 1 when findings exist
- [ ] `--quick` mode runs in < 60 seconds with no LLM calls
- [ ] `--json` outputs valid JSON to stdout
- [ ] `--help` shows usage

---

### WU-07b: CLI Cloud Mode

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 0.5 |
| **Dependencies** | WU-07a (CLI framework), WU-15 (REST API) |
| **Blocks** | Nothing (enhancement) |

**Objective:** `ae audit <url> --cloud` submits to hosted API and polls for results.

**Outputs:**
- `src/cli/cloud.ts` — Cloud mode:
  - `--cloud` flag submits to REST API
  - Polls `GET /api/audit/:id` for status
  - Displays progress from API status
  - Outputs result when complete
  - Requires `ALIEN_EYES_API_KEY` env var

**Acceptance Criteria:**
- [ ] `--cloud` flag submits to API and polls
- [ ] Progress displayed while polling
- [ ] Falls back to error message if API unreachable

---

### WU-08: Dogfood Regression Test

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 1 |
| **Dependencies** | WU-07a (CLI), validated dogfood data |
| **Blocks** | Human Review Gate 3 |

**Objective:** Run CLI against supertrained.ai. Compare output to known 12 findings. Threshold: detect >= 10/12 known findings.

**Inputs:**
- `research/test-payloads/format-B-condensed.md` — Known findings
- `research/audit-supertrained-ai-2026-03-05.md` — Full audit data

**Outputs:**
- `tests/regression/supertrained-dogfood.test.ts` — Regression test
- `tests/fixtures/known-findings.json` — 12 known findings in structured form
- `tests/regression/finding-matcher.ts` — Fuzzy matching: does generated finding match known finding? (semantic similarity, not exact string match)

**Acceptance Criteria:**
- [ ] >= 10/12 known findings detected (83% recall)
- [ ] No CRITICAL findings missed
- [ ] False positive rate < 15% (< 2 spurious findings per 12 real ones)
- [ ] Findings match Format B structure
- [ ] Test runs in CI (can use fixtures for crawl data to avoid live site dependency)

---

**HUMAN REVIEW GATE 3:** Run CLI against live site, verify dogfood regression, approve core engine. This is the "engine test."

---

## Phase 4: Presentation Layer (Weeks 5-6) — Parallel Work

### WU-09: Design System

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 3 |
| **Dependencies** | WU-00 (project scaffold) |
| **Blocks** | WU-10, WU-11, WU-12, WU-13 (all UI work) |

**Objective:** Define the visual design system. Alien Eyes brand identity (distinct from SuperTrained). Severity as visual weight. Three emotional design moments. Dark mode default.

**Brand Colors (from `research/naming/FINAL-DECISION-ALIEN-EYES.md`):**
- Primary: electric violet `#7C3AED` — alien, non-human, distinct from SuperTrained coral
- Scan / Active: acid green `#84CC16` — the scan line, findings highlighted
- Background: near-black `#0F0F0F` — terminal dark, the darkness the eye peers into
- Text: pure white `#FFFFFF` — clarity, contrast, what's revealed
- Critical: signal red `#EF4444` — critical findings
- Warning: amber `#F59E0B` — moderate findings
- Pass: teal `#14B8A6` — clean checks

**Terminology (agent-native principle):**
All data model terms, CLI commands, and JSON fields use industry-standard names — no glossary needed.
- Finding, Audit, Dimension, Evidence, Surface, Coverage, Score, Severity
- Brand metaphors ("blind spot," "perspective," "the alien perspective") reserved for human-facing marketing copy only — never in JSON output, CLI flags, or API responses.

**Three Emotional Design Moments:**
1. **Loading state (anticipation):** Narrated progress — "Browsing as a first-time mobile user..." "Checking agent-nativeness..."
2. **Findings reveal (the drop):** Satisfaction score appears first, then celebration section, then critical findings with emphasis, then rest fills in
3. **Copy button (empowerment):** The climax. Builder feels armed, not wounded.

**Outputs:**
- `src/app/globals.css` — Tailwind CSS 4 theme with brand tokens
- `src/components/ui/` — Core UI components (Button, Card, Badge, etc.)
- `tailwind.config.ts` — if needed (Tailwind 4 may use CSS-only)
- `docs/DESIGN-SYSTEM.md` — Component inventory, color usage guide, severity visual weights

**Acceptance Criteria:**
- [ ] WCAG 2.1 AA color contrast ratios met
- [ ] Dark mode default with light mode toggle
- [ ] Severity visual weight system: CRITICAL = own visual plane, HIGH = prominent, MEDIUM = standard, LOW = ambient
- [ ] Responsive: mobile-first, works at 320px+
- [ ] All components documented in design system doc

---

### WU-10: Landing Page

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 3 |
| **Dependencies** | WU-09 (design system) |
| **Blocks** | Nothing (standalone) |

**Objective:** Landing page with URL input as the only above-fold CTA.

**Sections:**
1. Hero: URL input + "See what you can't see." (primary tagline)
2. Value prop: "The outside perspective on what you build" — 2-3 sentences
3. Brand story excerpt: alien perspective thesis (from `research/naming/FINAL-DECISION-ALIEN-EYES.md`)
4. How it works: 3 steps (point → audit → fix)
5. "vs Claude Code" positioning (honest differentiator: inside-out vs outside-in)
6. "vs Testing Tools" positioning (TestSprite competitive narrative: test correctness vs test experience)
7. Pricing (Quick Check free, Full Audit $19-49, Re-audit $5-9, Watch $29/mo)
8. Social proof placeholder (testimonial slots for alpha)
9. FAQ (including "Why not just ask my coding agent?")
10. Footer

**Positioning copy (from branding):**
- For developers: "Alien Eyes examines your product the way your users experience it — from the outside, with no context, no forgiveness, and no blind spots."
- For agents: "Autonomous external quality primitive. Point at any target. Get structured findings."
- Uncomfortable truth: "You can't see your own product clearly. You built it. You know where to click."

**Outputs:**
- `src/app/page.tsx` — Landing page
- `src/app/layout.tsx` — Root layout with fonts, metadata
- `src/components/landing/` — Landing page sections

**Acceptance Criteria:**
- [ ] URL input works and submits audit request
- [ ] Semantic HTML, JSON-LD structured data
- [ ] OG tags, meta description
- [ ] WCAG 2.1 AA
- [ ] Mobile responsive
- [ ] "vs Claude Code" section present
- [ ] Pricing reflects Quick Check / Full Audit / Re-test structure

---

### WU-11: Audit Progress Page

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-09 (design system), WU-06 (progress events) |
| **Blocks** | Nothing |

**Objective:** Real-time progress page with narrated phases. The "anticipation" emotional design moment.

**Outputs:**
- `src/app/audit/[id]/page.tsx` — Progress page
- `src/components/audit/progress.tsx` — Progress component with narrated phases
- SSE/polling connection to backend for progress updates

**Acceptance Criteria:**
- [ ] Shows narrated progress messages (not just a spinner)
- [ ] Phase indicators: validating → crawling → auditing → synthesizing → complete
- [ ] Estimated time remaining
- [ ] Transitions to results page when complete
- [ ] Handles errors gracefully (partial results, timeouts)

---

### WU-12: Results Page

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 4 |
| **Dependencies** | WU-09 (design system), WU-03 (synthesis), WU-04 (renderers) |
| **Blocks** | Nothing |

**Objective:** THE most important page. Where the "drop" happens. Celebration-first, then findings.

**Page Structure (top to bottom):**
1. **Celebration section:** "What's working well" — positive observations, clean dimensions, page count, working flows
2. **Score hero:** Satisfaction score with confidence interval (e.g., "73% (68-78%)")
3. **Sub-scores:** Human-native and agent-nativeness composite scores
4. **Findings list:** Severity as visual weight, causal chain connections
5. **Verbatim narrative:** First-person experiential story
6. **Copy button:** PROMINENT. "Copy for your coding agent." Copies Format B.
7. **Format selector:** B (default), A, C, JSON
8. **Re-audit CTA:** "Fixed some issues? Re-audit to verify." (monetization moment)
9. **Before/after comparison** (if re-audit)
10. **PDF export button**
11. **"Mark as false positive" per finding** (feedback mechanism)

**Outputs:**
- `src/app/audit/[id]/results/page.tsx` — Results page
- `src/components/results/score-hero.tsx`
- `src/components/results/celebration.tsx`
- `src/components/results/findings-list.tsx`
- `src/components/results/causal-chain.tsx`
- `src/components/results/narrative.tsx`
- `src/components/results/copy-button.tsx`
- `src/components/results/format-selector.tsx`
- `src/components/results/false-positive-button.tsx`

**Acceptance Criteria:**
- [ ] Celebration section appears BEFORE findings
- [ ] CRITICAL findings occupy own visual plane
- [ ] Copy button copies Format B to clipboard
- [ ] Format selector switches between A/B/C/JSON
- [ ] "Mark as false positive" button on each finding with reason dropdown
- [ ] Re-audit CTA is visible and prominent
- [ ] Before/after comparison works for re-audits
- [ ] WCAG 2.1 AA compliant
- [ ] Mobile responsive
- [ ] No methodology, no test details, no internal metadata visible to builder

---

### WU-13: Account & Dashboard

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-09 (design system) |
| **Blocks** | Nothing |

**Objective:** Account system with Supabase Auth. Dashboard shows audit history with trend lines.

**Outputs:**
- `src/app/dashboard/page.tsx` — Audit history, trend lines
- `src/app/auth/login/page.tsx` — Login (GitHub OAuth + email)
- `src/app/auth/signup/page.tsx` — Signup
- `src/lib/auth.ts` — Supabase Auth helpers
- `src/components/dashboard/audit-list.tsx`
- `src/components/dashboard/trend-chart.tsx`

**Acceptance Criteria:**
- [ ] GitHub OAuth login works
- [ ] Email + magic link login works
- [ ] Dashboard shows list of past audits with scores
- [ ] Score trend chart for repeated audits of same URL
- [ ] API key generation for MCP/CLI cloud mode

---

**HUMAN REVIEW GATE 4:** Review all frontend pages, emotional design moments, copy button UX, celebration-first flow.

---

## Phase 5: Integration Surfaces (Week 6) — Parallel Work

### WU-14: MCP Server — PHASE 2 (not in Phase 0 scope)

> **Scope note:** This WU is included here for architecture foresight and dependency planning. It is NOT a Phase 0 deliverable and is NOT part of Gate 5. See `docs/CANONICAL-BUILD-SCOPE.md` Section 8. Build this only after Phase 0 ships and human explicitly promotes it.

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 3 |
| **Dependencies** | WU-06 (pipeline) |
| **Blocks** | Nothing |
| **Phase** | **Phase 2 — NOT current scope** |

**Objective:** MCP server for agent consumption. Enables the full loop: builder's coding agent calls Alien Eyes MCP → gets findings → fixes → calls re-audit → confirms.

**Tools:**
- `audit_url` — Start a new audit. Returns audit ID.
- `get_status` — Get audit status (pending/running/complete).
- `get_findings` — Get findings in Format JSON (default) or Format B/C.
- `get_score` — Get satisfaction score with confidence interval.
- `re_audit` — Trigger re-audit of previously audited URL.
- `dispute_finding` — Mark a finding as false positive (with reason).

**Outputs:**
- `src/mcp/server.ts` — MCP server implementation
- `src/mcp/tools.ts` — Tool definitions
- `src/mcp/auth.ts` — API key authentication
- `docs/MCP-SPEC.md` — Tool documentation for agent consumption

**Acceptance Criteria:**
- [ ] All 6 tools implemented and documented
- [ ] Auth via API key
- [ ] Returns Format JSON by default
- [ ] dispute_finding stores feedback in database
- [ ] Server starts without errors

---

### WU-15: REST API

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-06 (pipeline) |
| **Blocks** | WU-07b (CLI cloud mode) |

**Endpoints:**
- `POST /api/audit` — Start audit. Body: `{ url, options }`. Returns `{ id, status }`.
- `GET /api/audit/:id` — Get audit status/results.
- `GET /api/audit/:id/findings` — Get findings. Query: `format=a|b|c|json`.
- `POST /api/audit/:id/re-audit` — Trigger re-audit.
- `POST /api/audit/:id/findings/:findingId/dispute` — Mark false positive.

**Outputs:**
- `src/app/api/audit/route.ts`
- `src/app/api/audit/[id]/route.ts`
- `src/app/api/audit/[id]/findings/route.ts`
- `src/app/api/audit/[id]/re-audit/route.ts`
- `src/app/api/audit/[id]/findings/[findingId]/dispute/route.ts`
- `docs/API-SPEC.md` — OpenAPI spec

**Acceptance Criteria:**
- [ ] All endpoints return proper HTTP status codes
- [ ] Rate limiting per API key
- [ ] Input validation (URL format, options)
- [ ] Error responses in JSON format
- [ ] OpenAPI spec generated

---

### WU-16: Re-Audit System

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-06 (pipeline) |
| **Blocks** | Nothing |

**Objective:** Blind re-audit with delta comparison. The re-audit is a first-class product, not a discount check.

**Key Design Decision:** Re-audit runs BLIND — no reference to previous results during the audit. Delta comparison is a separate operation AFTER the blind audit completes. This prevents bias.

**Outputs:**
- `src/lib/re-audit/blind-audit.ts` — Run fresh audit ignoring previous results
- `src/lib/re-audit/delta-compare.ts` — Compare findings: fixed, regressed, new, unchanged
- `src/lib/re-audit/targeted.ts` — Option to re-audit specific dimensions only (cheaper)
- `src/lib/re-audit/scheduled.ts` — Cron trigger for continuous monitoring subscribers

**Acceptance Criteria:**
- [ ] Blind re-audit produces independent results (no reference to previous)
- [ ] Delta comparison correctly classifies: fixed, regressed, new, unchanged
- [ ] Targeted re-audit runs only specified dimensions
- [ ] Scheduled re-audit triggers on cron

---

## Phase 6: Polish & Deploy (Weeks 7-8)

### WU-17: Error Handling & Edge Cases

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | All prior WUs |

**Covers:**
- Graceful degradation when primitives fail (partial results)
- URL validation edge cases (internationalized domains, punycode)
- Timeout handling with informative messages
- Rate limiting enforcement
- Error tracking integration (Sentry or similar)

---

### WU-18: SEO/MEO & Accessibility (Our Own Site)

| Field | Value |
|-------|-------|
| **Agent** | Codex (ChatGPT 5.4) |
| **Estimated Hours** | 2 |
| **Dependencies** | WU-10, WU-12 (pages to optimize) |

**Covers:**
- All pages WCAG 2.1 AA
- Semantic HTML throughout
- JSON-LD structured data
- OG tags, meta descriptions
- Sitemap, robots.txt
- "Eat our own cooking" — run Alien Eyes against Alien Eyes

---

### WU-19: Testing

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 3 |
| **Dependencies** | All prior WUs |

**Covers:**
- Unit tests for all primitives (mock inputs)
- Integration tests for pipeline
- Renderer parity tests
- Dogfood regression test
- False positive lifecycle tests
- **Gauge R&R:** Audit 10 sites 3x each, measure repeatability

---

### WU-20: Deploy

| Field | Value |
|-------|-------|
| **Agent** | Opus 4.6 |
| **Estimated Hours** | 2 |
| **Dependencies** | All prior WUs, all tests passing |

**Covers:**
- Vercel deployment (Next.js frontend)
- Railway/Fly.io deployment (workers)
- Supabase production project
- Upstash Redis for BullMQ
- Environment variables
- DNS setup
- Monitoring/alerting
- Alpha invite system (50 users)

---

**HUMAN REVIEW GATE 5:** Full end-to-end test, deploy approval, alpha launch decision.

---

## Agent Accountability Matrix

| WU | Agent | Can Start After | Must Complete Before | Handoff To |
|----|-------|----------------|---------------------|------------|
| WU-00 | Opus | — | Gate 1 | All |
| WU-00a | Opus | WU-00 | Gate 1 | WU-01 |
| WU-00b | Opus | WU-00 | Gate 1 | WU-01, WU-02 |
| WU-01 | Opus | Gate 1 | Gate 2 | WU-06 |
| WU-01.5 | Opus | WU-01 | Gate 2 | WU-02 |
| WU-02 | Codex | WU-01.5, Gate 1 | Gate 2 | WU-03, WU-06 |
| WU-03 | Opus | WU-02, WU-05 | Gate 2 | WU-04, WU-06 |
| WU-04 | Codex | WU-03 | Gate 2 | WU-06, WU-12 |
| WU-05 | Opus | WU-00, Gate 1 | Gate 2 | WU-02, WU-03 |
| WU-06 | Opus | Gate 2 | Gate 3 | WU-07, WU-08 |
| WU-07a | Codex | WU-06 | Gate 3 | WU-08 |
| WU-07b | Codex | WU-07a, WU-15 | — | — |
| WU-08 | Opus | WU-07a | Gate 3 | — |
| WU-09 | Opus | WU-00 | Gate 4 | WU-10-13 |
| WU-10 | Codex | WU-09 | Gate 4 | — |
| WU-11 | Codex | WU-09, WU-06 | Gate 4 | — |
| WU-12 | Opus | WU-09, WU-03, WU-04 | Gate 4 | — |
| WU-13 | Codex | WU-09 | Gate 4 | — |
| WU-14 | Opus | WU-06 | **Phase 2** (not Gate 5) | — |
| WU-15 | Codex | WU-06 | Gate 5 | WU-07b |
| WU-16 | Opus | WU-06 | Gate 5 | — |
| WU-17 | Opus | All Phase 1-5 | Gate 5 | — |
| WU-18 | Codex | WU-10, WU-12 | Gate 5 | — |
| WU-19 | Opus | All Phase 1-5 | Gate 5 | — |
| WU-20 | Opus | All, all tests | Gate 5 | — |

---

## Estimated Hours Summary

| Agent | Work Units | Hours |
|-------|-----------|-------|
| Opus 4.6 | WU-00, 00a, 00b, 01, 01.5, 03, 05, 06, 08, 09, 12, 14, 16, 17, 19, 20 | ~39h |
| Codex 5.4 | WU-02, 04, 07a, 07b, 10, 11, 13, 15, 18 | ~20h |
| **Total** | 25 work units | **~59 agent-hours** |
| **Human** | 5 review gates | **~2 hours** |
