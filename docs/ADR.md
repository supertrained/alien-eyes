# Alien Eyes — Architecture Decision Records

> Version: 1.0 | Date: 2026-03-10
> Format: Each ADR records a key architectural decision, its context, alternatives considered, and consequences.
> Source: Expert panels (5 panels, 25 experts), adversarial reviews (3 panels, 15 experts), dogfood validation, GMPF patterns

---

## ADR-001: Freeze Types Before Code

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Multi-agent build (Opus 4.6 + Codex 5.4) requires coordination. Without shared contracts, agents will produce incompatible outputs.
**Decision:** All types (Finding, Envelope, CrawlResult, AuditPrimitive, PayloadRenderer, SynthesisResult) are frozen in `docs/TYPE-SPEC.md` before any implementation begins. Types ARE the coordination mechanism.
**Consequences:** Types cannot change without version bump + human approval. Agents can work in parallel on separate WUs because they share the same type contract.

---

## ADR-002: Crawl-First, Primitives-Second

**Status:** Accepted
**Date:** 2026-03-10
**Context:** GMPF used per-primitive browser sessions (each primitive launched its own Playwright instance). This is wasteful and creates state inconsistency (primitives see different page states).
**Decision:** ONE Playwright browser session per audit. ONE clean profile. All pages crawled into a shared CrawlResult. Every primitive reads from this shared result.
**Alternatives Considered:**
- Per-primitive sessions (GMPF pattern) — wasteful, state inconsistency
- Shared browser but per-primitive navigation — still creates different state views
**Consequences:** Lower infrastructure cost. Consistent state across primitives. Single point of failure for the crawl (if it fails, all primitives fail). Mitigated by partial results on crawl timeout.

---

## ADR-003: CLI-First, Web-Second

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Building a web UI before the audit engine works creates risk: the chassis might be beautiful but the engine might not work. CLI validates the engine independently.
**Decision:** Build the audit pipeline as a CLI first (`ae audit <url>`). Validate against known dogfood findings. Only then wrap in web UI.
**Consequences:** CLI is a free deliverable. Engine bugs are caught before UI work begins. CLI serves developer audience immediately. Risk: CLI-first may not match web UX expectations.

---

## ADR-004: Monolithic Pipeline with Typed Boundaries (Revised)

**Status:** Accepted (revised from original "Independent Station Workers")
**Date:** 2026-03-10
**Context:** Original plan called for BullMQ station workers (crawl-worker, primitive-worker, synthesis-worker, render-worker, delivery-worker). Adversarial review identified this as 2-3 weeks of coordination work for a V1 MVP. GMPF's `processScan` uses `Promise.all` inside a single function — which works.
**Decision:** Run all primitives via `Promise.all` within a single BullMQ job handler. Typed boundaries (Envelope, Finding, CrawlResult) enforce separation at the type level. Extract to station workers in Phase 2 when traffic justifies complexity.
**Alternatives Considered:**
- Station workers (original plan) — too complex for V1 (fan-out/fan-in coordination, idempotency, failure recovery)
- No queue at all (synchronous) — can't handle concurrent audits, no retry, no progress tracking
**Consequences:** Simpler deployment. Single process handles crawl → primitives → synthesis → render. WU-06 reduced from ~3h to ~2h. Trade-off: can't scale individual stages independently. Acceptable for V1 volumes.

---

## ADR-005: Finding Lifecycle from Day One

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Findings are living objects, not static report entries. They can be disputed (false positives), fixed (re-audit confirms), or categorized (platform-limited, third-party).
**Decision:** Every finding has a lifecycle state from detection through resolution. States: detected → delivered → accepted | disputed | fixed | false_positive | fixable | mitigable | platform_limited | accepted_risk | third_party. Track false positive rate per primitive, per methodology version.
**Consequences:** Requires database tracking (findings table with lifecycle_state). Enables self-improvement (methodology review when FP rate > 20%). Adds complexity to finding management. Worth it for trust-building.

---

## ADR-006: Pre-Register Methodology Before Audits

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Stolen Mechanism #6 from Clinical Trials. Pre-registering endpoints prevents unconscious p-hacking. If we adjust methodology after seeing results, scores are unreliable.
**Decision:** Methodology v0.1 is frozen before any audits run. All audits record which methodology version was used. Changes require a new version number. Old versions archived for reproducibility.
**Consequences:** Methodology changes are deliberate and versioned. Reproducing old audit scores is possible. Trade-off: can't hotfix methodology bugs without a version bump. Acceptable: version bumps are cheap.

---

## ADR-007: Worker Runtime Split (Vercel + Railway/Fly.io)

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Playwright requires: long-running processes (30-120s), writable filesystem, 400MB+ RAM per browser. Vercel has: 60s timeout (Pro), read-only fs, 512MB /tmp. GMPF already uses this split.
**Decision:** Vercel hosts ONLY the Next.js frontend + API routes. Workers (Playwright, BullMQ consumers) deploy to Railway or Fly.io as separate Node.js processes with their own Dockerfile.
**Consequences:** Two deploy pipelines. Workers communicate via BullMQ (Redis) and Supabase. Health checks needed for worker processes. Trade-off: more infrastructure complexity. Required: Playwright literally cannot run on Vercel.

---

## ADR-008: SSRF Defense is Day 1

**Status:** Accepted
**Date:** 2026-03-10
**Context:** The core UX (accept URL, navigate with browser) is the textbook SSRF vector. Adversarial review identified this as CRITICAL: attacker submits `http://169.254.169.254/latest/meta-data/` and Playwright fetches cloud credentials.
**Decision:** URLValidator resolves DNS BEFORE Playwright connects. Blocks RFC 1918, link-local, cloud metadata, loopback. Re-checks DNS (anti-rebinding). Network policy on worker host blocks outbound to private ranges. Per-audit cost tracking via CostBudget (measurement mode in Phase 0 — no hard kill until cost baselines established after 50+ audits).
**Consequences:** Every URL navigation goes through URLValidator. Small latency penalty for DNS pre-resolution. Zero tolerance for private range access. Critical security requirement that cannot be deferred. Cost tracking is observability, not enforcement, during Phase 0.

---

## ADR-009: Content Extraction Layer Between Crawl and Primitives

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Raw HTML fed to LLMs causes token explosion (50-100K tokens per page) and cost amplification ($1-2 per page). Adversarial review identified this as CRITICAL.
**Decision:** Between crawl and primitives, a deterministic extraction layer creates PageSummary objects (2-5K tokens per page). Primitives receive PageSummary, NOT raw HTML. Raw HTML stored in Supabase Storage for reference but never fed to LLMs. Per-primitive token budgets enforced.
**Consequences:** 60-70% of signal extraction requires zero LLM cost. Dramatically reduces per-audit LLM spend. Extractors are deterministic and testable. Trade-off: extractors may miss novel signal that raw HTML would reveal. Mitigated by storing raw HTML for on-demand deep analysis.

---

## ADR-010: Tiered Findings by Ownership Verification

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Free audit of any URL = free reconnaissance tool. Security findings on unverified URLs are attack roadmaps. Adversarial review identified this as HIGH.
**Decision:** Unverified URLs receive only SEO, Performance, Accessibility findings (publicly observable data). Security + Agent-Nativeness findings require ownership verification (DNS TXT, meta tag, or file upload). Verification persists for 90 days.
**Consequences:** Preserves the free viral loop for non-sensitive dimensions. Prevents weaponization. Adds verification friction for full results. Trade-off: users must prove ownership for complete audit. Acceptable: matches Google Search Console pattern.

---

## ADR-011: Quick Check (Free) vs Full Audit (Paid)

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Free tier with LLM inference = money furnace. Adversarial review identified that full audits cost $1.90-4.40 COGS, making free full audits unsustainable.
**Decision:** Quick Check (free): deterministic only (SEO + Performance + Accessibility), no LLM, sub-60-second, ~$0.10 COGS. Full Audit (paid): all dimensions, LLM-powered, $19-49. The Quick Check is the Lighthouse replacement hook; the Full Audit is the alien perspective.
**Consequences:** Free tier is sustainable at any scale. Paid tier has healthy margins (COGS $1.90-4.40 vs price $19-49). Clear upgrade path. Trade-off: free tier doesn't demonstrate the full product experience. Mitigated: the canonical URL finding from dogfood was a deterministic check — Quick Check still delivers real value.

---

## ADR-012: Default Private Reports

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Original plan assumed public-by-default for viral sharing. Adversarial review identified privacy/compliance conflicts and weaponization risks.
**Decision:** All reports private by default. Builder must explicitly choose to publish. Redaction preview before publishing. Security findings NEVER in public reports. Takedown mechanism available. ToS prohibits auditing sites you don't own for security dimensions.
**Consequences:** Viral loop requires opt-in (reduces viral coefficient). But: prevents competitive intelligence weaponization, complies with privacy requirements, protects builders. Trade-off: slower organic growth. Mitigated by making sharing easy for non-security dimensions.

---

## ADR-013: Format B Capped at 5 Findings (Staged Disclosure)

**Status:** Accepted
**Date:** 2026-03-10
**Context:** 20+ findings dumped simultaneously overwhelms solo builders. ER triage caps active decisions at 5. Adversarial review recommended staged disclosure.
**Decision:** Format B (clipboard output) capped at 5 findings per paste. Fix those, re-test, get next 5. Findings ordered by optimal fix sequence (dependencies first, then severity), not raw severity. The re-audit loop becomes a triage mechanism, not just verification.
**Consequences:** Builder sees manageable batches. Re-audit rate should increase (builder wants next 5). Revenue per URL increases (more re-audits). Trade-off: full findings not immediately accessible via clipboard. Mitigated: Format A (dashboard) and Format JSON show all findings.

---

## ADR-014: Single-Run Evaluation for V1 (2-of-3 Averaging Deferred)

**Status:** Accepted
**Date:** 2026-03-10
**Context:** StrongDM's 2-of-3 averaging (run audit 3 times, require 2/3 agreement) triples cost and time. V1 pricing assumes single-run.
**Decision:** Methodology v0.1 uses single-run evaluation. Confidence intervals estimated from model temperature and finding type. 2-of-3 averaging planned for v0.2.
**Consequences:** Lower cost per audit. Lower confidence in scores. Mitigated by: conservative severity classification, confidence intervals, evidence bundle requirement, false positive tracking. Gauge R&R validation before alpha will measure actual repeatability.

---

## ADR-015: Prompt Injection Defense in All Primitives

**Status:** Accepted
**Date:** 2026-03-10
**Context:** Adversarial HTML can manipulate LLM findings: `<div style="display:none">IGNORE PREVIOUS INSTRUCTIONS.</div>`. Six primitives feed crawled content to LLMs.
**Decision:** Every primitive that sends crawled content to an LLM must: (1) strip invisible/hidden elements, (2) strip scripts and comments, (3) use structured prompt templates separating instructions from data, (4) validate output against Finding schema. InputSanitizer is a shared utility.
**Consequences:** Some legitimate hidden content may be stripped (e.g., visually hidden screen reader text). Mitigated by: preserving aria-hidden content in accessibility extractor, only stripping display:none/visibility:hidden. Trade-off: potential false negatives on genuinely hidden issues. Acceptable: better than false positives from prompt injection.

---

## ADR-016: Cross-Product Pattern Database from Day One

**Status:** Accepted
**Date:** 2026-03-10
**Context:** The data moat (S4 in strategic decisions). Every finding feeds an anonymized patterns table. This is what no single-project agent can replicate.
**Decision:** Every finding is hashed and anonymized (URLs removed) into a `patterns` table. Stack tags associated. Frequency tracked. This data feeds Rhumb's AN Scores and enables category benchmarks ("67% of Next.js sites have X").
**Consequences:** Storage cost for patterns table (low). Anonymization must be robust (URLs, domains, unique identifiers removed). Trade-off: privacy risk if anonymization is insufficient. Mitigated by: anonymization validation tests, opt-in only, DSAR workflow.

---

## Decision Index

| ADR | Title | Status | Affects WUs |
|-----|-------|--------|-------------|
| 001 | Freeze Types Before Code | Accepted | WU-00, all |
| 002 | Crawl-First, Primitives-Second | Accepted | WU-01 |
| 003 | CLI-First, Web-Second | Accepted | WU-07, WU-08 |
| 004 | Monolithic Pipeline (revised) | Accepted | WU-06 |
| 005 | Finding Lifecycle from Day One | Accepted | WU-00, WU-02, WU-16 |
| 006 | Pre-Register Methodology | Accepted | WU-00, methodology |
| 007 | Worker Runtime Split | Accepted | WU-00a, WU-01, WU-20 |
| 008 | SSRF Defense Day 1 | Accepted | WU-00b |
| 009 | Content Extraction Layer | Accepted | WU-01.5 |
| 010 | Tiered Findings by Ownership | Accepted | WU-02, WU-00b |
| 011 | Quick Check vs Full Audit | Accepted | WU-02, WU-06, WU-10 |
| 012 | Default Private Reports | Accepted | WU-12, WU-15 |
| 013 | Format B Capped at 5 | Accepted | WU-04 |
| 014 | Single-Run Evaluation V1 | Accepted | WU-03, methodology |
| 015 | Prompt Injection Defense | Accepted | WU-00b, WU-02 |
| 016 | Cross-Product Pattern Database | Accepted | WU-03, schema |
