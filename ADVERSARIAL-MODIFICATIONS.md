# Consolidated Adversarial Review Modifications

> Date: 2026-03-07
> Source: Two independent adversarial reviews, consolidated into 25 modifications
> Scope: PRODUCT-SPEC.md, GO-TO-MARKET.md, CLAUDE.md

---

## Summary

Two adversarial reviews produced 9 CRITICAL, 10 HIGH, and 9 MEDIUM findings. After consolidation, 25 distinct modifications remain. Many findings overlapped (both reviews flagged free-tier abuse, scope sprawl, false positive targets, Cloudflare/SPA reality, and validation overclaiming). This document specifies the exact change for each.

---

## FILE 1: PRODUCT-SPEC.md

---

### MOD-001: Downgrade validation language from "VALIDATED" to "demonstrated in prototype"

**Source findings:** Review 2 C1 ("VALIDATED means N=1 on your own site")

**Affected sections:** Header (line 4), Section 2 title & body (lines 40-95), Section 6 Validated vs Assumed table (lines 373-380), Section 7 Unique Capabilities (lines 399-416), Section 8 value props, Section 11 Assumption 3 (lines 757-770), Section 12 Roadmap (line 792), Appendix B title (line 909)

**Resolution:** Make three changes throughout the document:

1. Change the header (line 4) from:
```
> Status: Validated Prototype -- Discovery complete, dogfood loop proven on production site
```
to:
```
> Status: Prototype Demonstrated -- Discovery complete, dogfood loop demonstrated on own production site (N=1). External validation pending.
```

2. In Section 2 (line 42), change:
```
> This section documents what was proven in production on March 5-6, 2026.
```
to:
```
> This section documents what was demonstrated on our own production site on March 5-6, 2026. This is a proof of concept (N=1, own codebase, single tech stack, single coding agent). External validation with diverse sites, stacks, and builders is required before claiming product-market validation.
```

3. Add a new subsection after "What This Proves" (after line 95, before Section 3):

```
### What This Does NOT Prove

The dogfood test was a necessary first step, not a sufficient one. The following remain untested:

| Gap | Why It Matters |
|-----|---------------|
| Non-Next.js stacks | Format B may not produce the same fix rate on Rails, Django, WordPress, or static sites |
| Non-Claude-Code agents | Cursor, Windsurf, Copilot may interpret Format B differently |
| Sites we did not build | The builder agent had implicit context about the supertrained.ai codebase |
| Sites with bot protection | Cloudflare, Akamai, Vercel bot protection were not present on the test target |
| SPA-heavy applications | React/Vue/Angular SPAs with client-side rendering present different crawling challenges |
| Sites larger than 45 pages | Scaling behavior of the audit pipeline is unknown |
| Non-technical builders | The dogfood "builder" was a sophisticated coding agent operated by the product creator |
| Agent-nativeness dimensions | The test focused on human-experience dimensions (SEO, a11y, analytics), not AN scoring |
| MCP/API delivery path | Findings were delivered via clipboard paste, not programmatically |
| Multiple independent testers | N=1 tester on N=1 site. Replication is needed. |
```

4. Throughout the document, change all instances of `**VALIDATED**` and `**(VALIDATED)**` to `**DEMONSTRATED (N=1)**` except where the word "validated" is used in a generic sense (e.g., "validation plan"). This applies to lines 90-91, 304, 306, 309, 310, 366, 368, 370, 371, 407, 428, and 759.

---

### MOD-002: Add evidence bundle requirement to feedback payload

**Source findings:** Review 1 C2 ("No evidence bundle = hallucinated findings trigger bad auto-fixes")

**Affected section:** Section 4 (The Feedback Payload), lines 166-256

**Resolution:** Add new subsection after "Payload Ingredients" table (after line 188):

```
### Evidence Bundle (Required Per Finding)

Every finding MUST include an evidence bundle that proves the finding is real, not hallucinated. Findings without evidence are suppressed from agent-facing output. CRITICAL-severity findings without 100% evidence completeness are blocked from Format B / Format JSON export (they appear in Format A with an "unverified" flag for human review).

| Evidence Type | Required? | Purpose |
|--------------|-----------|---------|
| URL where observed | Always | Reproducibility |
| Timestamp of observation | Always | Temporal anchoring |
| DOM snapshot or response body | For UI/content findings | Proof of state at test time |
| Screenshot | For visual findings | Human-verifiable evidence |
| HTTP response headers/status | For technical findings | Machine-verifiable evidence |
| Confidence score with provenance | Always | How certain, and why (which test, which run, which model judged it) |
| Reproduction steps | For behavioral findings | Allows builder to manually verify before acting |

**Design rule:** If we cannot produce evidence for a finding, the finding does not exist. The audit may note "area of concern, could not verify" but it does not enter the numbered finding list.
```

Also add to "Payload Ingredients" table (line 180) a new row 8:

```
| 8 | **Evidence** | Machine-verifiable proof this finding is real | "Screenshot: canonical tag in page source showing href='https://supertrained.ai/' on /services page" |
```

---

### MOD-003: Reduce V1 delivery surfaces from 4 to 2

**Source findings:** Review 1 C3 ("V1 scope unrealistic -- SaaS/MCP/CLI/API = 4 products"), Review 2 M5 ("Surface sprawl -- 4 surfaces in V1 = 4 products")

**Affected section:** Section 10 (Scope and Boundaries), lines 639-644

**Resolution:** Replace the delivery surfaces block (lines 639-646):

FROM:
```
**Delivery surfaces (V1):**

- SaaS web interface (primary)
- MCP server (for agent integration)
- CLI (for CI/CD integration)
- REST API (for programmatic access)

All four surfaces run the same audit primitives and produce identical findings.
```

TO:
```
**Delivery surfaces (V1):**

- SaaS web interface (primary) -- URL paste, dashboard, clipboard copy
- REST API (secondary) -- programmatic access, enables future surfaces

**Deferred to Phase 1:**
- CLI (for CI/CD integration) -- thin wrapper over REST API
- MCP server (for agent integration) -- thin wrapper over REST API

Rationale: The SaaS web interface is the validated experience (clipboard copy). The REST API is the necessary backend that enables CLI and MCP later. Building 4 surfaces in V1 is building 4 products. Build 2, validate them, then add CLI and MCP as thin wrappers.
```

Also update the Progressive Unlock Model (lines 677-704) to move Level 3 (MCP/API integrated) items to Phase 1 scope, keeping Level 0-2 for V1.

---

### MOD-004: Add abuse prevention to free tier design

**Source findings:** Review 1 C1 ("Free-audit model can be weaponized"), Review 2 C3 ("Free tier + no account + Opus = cost amplification attack")

**Affected section:** Section 3 (Business Outcome), lines 117-118; Section 9 (Principles), Principle 8 lines 560-566; Section 10 (Scope), lines 678-681

**Resolution:**

1. In the pricing table (line 117), change:
```
| First audit | $0 | First audit of any URL is free. This IS the marketing. No account required. |
```
to:
```
| First audit | $0 | First audit of any URL is free. This IS the marketing. Requires email verification + Turnstile CAPTCHA. Rate limited: 3 free audits per email per 30 days, 1 concurrent audit per IP. Free tier uses Haiku/Sonnet only (no Opus). |
```

2. In Principle 8 (line 560-566), add after "Limitations on speed and frequency, not on insight quality.":
```
However, the free tier must be hardened against abuse. Protections: (a) Cloudflare Turnstile on audit submission, (b) email verification required (disposable email domains blocked), (c) per-IP rate limiting (1 concurrent audit, 5 per hour), (d) per-email budget (3 free audits per 30 days), (e) free tier uses Haiku for classification and Sonnet for analysis (no Opus), (f) per-domain budget cap ($5 max LLM spend per free audit, abort if exceeded), (g) audit results expire after 7 days for unverified users. These protections preserve the viral loop (the first audit IS the marketing) while preventing cost amplification attacks.
```

3. In the Progressive Unlock Model (line 678-681), change Level 0 from:
```
Level 0: URL paste
  - No account required for first audit
```
to:
```
Level 0: URL paste
  - Email verification + Turnstile CAPTCHA required for first audit
  - Rate limited: 3 free audits per email per 30 days
```

---

### MOD-005: Add privacy/compliance framework

**Source findings:** Review 1 C5 ("Privacy/compliance conflicts with viral sharing"), Review 2 C4 ("Publishing security findings for unowned sites = legal/ethical time bomb")

**Affected section:** Section 9 (Principles), Principle 10 (lines 574-578); Section 10 (Scope); Section 11 (Risks), Risk 4 (lines 729-732)

**Resolution:**

1. Add a new Principle 14 after Principle 13 (after line 597):

```
### 14. Default private. Publish by choice.

*Resolves: Privacy/compliance conflict with viral sharing. Legal risk of exposing security findings for unowned sites.*

Audit results are private by default. The builder explicitly opts in to make results shareable. Security-category findings are NEVER included in public/shared reports unless the builder has verified domain ownership (DNS TXT record or meta tag). Shared reports auto-redact: API keys, internal URLs, server versions, authentication details, and PII detected in screenshots or DOM snapshots.

Data retention: audit artifacts (screenshots, DOM snapshots) are retained for 90 days for paying customers, 7 days for free tier, then permanently deleted. Builders can request immediate deletion (DSAR-compatible). GDPR: no personal data is stored beyond email for authentication; audit data is product data, not personal data, but we treat it with the same care. CCPA: opt-out of data sharing for Rhumb benchmarks is available in account settings.

Ownership verification is required for: (a) security-category findings in shared reports, (b) aggressive scanning modes, (c) recurring/scheduled audits. Verification methods: DNS TXT record, HTML meta tag, or file upload to root path.
```

2. Expand Risk 4 (lines 729-732) to add:

```
*Additional mitigation (from adversarial review):* Security-category findings require ownership verification before appearing in any shared or public output. Implement a takedown mechanism: if a site owner reports that an unauthorized party published their audit results, we remove the shared report within 24 hours and flag the account. Legal review of ToS to ensure indemnification for external scanning.
```

---

### MOD-006: Tighten false positive targets

**Source findings:** Review 1 H3 ("Alpha FP target too loose -- 15% in auto-fix loop = catastrophic"), Review 2 H5 ("FP tolerance contradicts persona research -- 15% = 2.25 wrong per audit")

**Affected section:** Section 11 (Risks), Risk 1 (lines 712-717)

**Resolution:** Add after the existing mitigation text (after line 717):

```
*False positive targets (from adversarial review):* The alpha exit criteria of "FP rate below 15%" is too loose. At 15 findings per audit, 15% = 2.25 false findings. Expert users (Diana, Viktor) reject tools permanently after 2 bad findings. Revised targets:

| Severity | FP Target (Alpha) | FP Target (Launch) | FP Target (Month 6) |
|----------|-------------------|-------------------|---------------------|
| CRITICAL | <1% | <0.5% | <0.1% |
| HIGH | <3% | <2% | <1% |
| Overall | <10% | <8% | <5% |

A CRITICAL false positive that triggers an auto-fix is the worst possible failure mode -- it causes the coding agent to break working functionality. CRITICAL findings must carry near-zero FP risk, enforced by the evidence bundle requirement (MOD-002).
```

---

### MOD-007: Add finding resolution states for unfixable issues

**Source findings:** Review 1 H5 ("Third-party/platform-unfixable findings lack resolution path"), Review 2 M1 ("Platform-hosted sites break the fix loop")

**Affected section:** Section 4 (Feedback Payload), after the Payload Ingredients table (line 188)

**Resolution:** Add new subsection after the evidence bundle (from MOD-002):

```
### Finding Resolution States

Not all findings are equally actionable. The payload must communicate what the builder can actually do about each finding. Findings without a resolution state are assumed to be "fixable."

| State | Meaning | Example |
|-------|---------|---------|
| `fixable` | Builder can fix this in their codebase | Missing alt text, broken canonical URL |
| `mitigable` | Builder can reduce impact but not eliminate | Third-party script blocking render (can defer, can't remove) |
| `platform-limited` | Hosting platform prevents full fix | Shopify doesn't allow custom robots.txt; Wix limits header control |
| `accepted-risk` | Builder has reviewed and consciously accepts | "We know our API returns 200 for invalid auth -- it's a design choice" |
| `third-party` | Issue is in a dependency the builder doesn't control | CDN cache headers, third-party widget accessibility |

Platform detection: when the audit detects a known platform (Shopify, Wix, Squarespace, WordPress.com, Webflow), findings are automatically tagged with platform-specific resolution guidance. Findings that are unfixable on the detected platform are tagged `platform-limited` with an explanation of what the platform restricts.
```

---

### MOD-008: Address Cloudflare/bot protection and SPA reality

**Source findings:** Review 1 H1 ("Cloudflare/bot protection + SPA reality underestimated"), Review 2 H1 ("Playwright vs real internet")

**Affected section:** Section 10 (Scope), add new subsection after "What This IS NOT" (after line 659)

**Resolution:** Add:

```
### Crawlability Constraints (Real Internet Challenges)

The dogfood test ran against supertrained.ai, which has no bot protection. The real internet is different.

**Known blockers:**

| Blocker | Prevalence | Impact | Mitigation |
|---------|-----------|--------|------------|
| Cloudflare Bot Management | ~20% of web | Blocks Playwright entirely | Stealth mode (realistic headers, fingerprints, timing). If blocked: report "could not access -- bot protection detected" as a distinct outcome, NOT as "passed." |
| Akamai Bot Manager | ~10% of web | Blocks or challenges | Same as Cloudflare |
| SPAs (React/Vue/Angular) | ~40% of new sites | Content loads after JS execution | Playwright handles this natively. But: wait-for-network-idle is unreliable. Implement explicit render-complete detection. |
| Auth-walled content | ~30% of SaaS | Cannot audit behind login without credentials | V1: audit public-facing pages only. Phase 2: authenticated testing with builder-provided credentials in secure vault. |
| Sites >500 pages | ~5% of targets | Audit time/cost explosion | V1: 50-page crawl limit with intelligent sampling. Builder can specify priority pages. Phase 2: configurable limits. |

**Design rule:** "Could not verify" is a distinct state from "passed" and "failed." If we cannot crawl a page, we say so. We never infer that inaccessible content is fine.

**Supported/unsupported matrix (publish on launch):**
- Supported: Static sites, SSR sites (Next.js, Nuxt, Remix), SSG sites, WordPress (self-hosted), basic SPAs
- Partially supported: Cloudflare-protected (stealth mode, may fail), large sites (sampled), auth-walled (public pages only)
- Not supported in V1: Native mobile apps, desktop apps, IoT interfaces, sites requiring VPN/internal network access
```

---

### MOD-009: Add re-test baseline versioning and concurrency controls

**Source findings:** Review 1 H2 ("Re-test baseline breaks under concurrency")

**Affected section:** Section 10 (Scope), within "Core capabilities (V1)" (lines 624-637)

**Resolution:** Add to the core capabilities list (after line 635):

```
- **Versioned baselines** -- every audit produces an immutable snapshot (finding set, scores, DOM samples, screenshots) with a version ID. Re-audits compare against a specific baseline version, not "the last audit." Concurrent audits of the same URL are serialized (per-URL run locking) to prevent baseline corruption.
```

---

### MOD-010: Reframe moat claims around remediation outcomes

**Source findings:** Review 1 H4 ("Moat claims overstated vs incumbents"), Review 2 C2 ("Every differentiator is unbuilt"), Review 2 M4 ("Data moat requires 10K+ audits before it exists")

**Affected section:** Section 3 (Business Outcome), Competitive Moat Analysis table (lines 136-144)

**Resolution:** Replace the moat table:

FROM (lines 136-144):
```
| Moat Layer | Mechanism | Defensibility |
|-----------|-----------|---------------|
| **The feedback payload format** | The specific structure of findings that produces 100% autonomous fix rates -- validated, not guessed | High -- looks simple, took real iteration to get right |
| **Scenario grammar** | 10^6+ combinatorial test configurations, computationally intractable to game | High -- grows with every audit |
| **Agent-nativeness scoring** | First-mover in measuring how well products serve AI agents | Medium-High -- methodology can be copied but data advantage compounds |
| **Accumulated quality data** | Every audit feeds aggregate benchmarks and category calibration | High -- data moat deepens with scale |
| **Rhumb integration** | Token cost benchmarks, schema fingerprints, recency signals feed Rhumb directory | High -- exclusive first-party data source |
| **Scenario evolution** | Cross-audit pattern detection generates new test primitives from observed failure modes | High -- the system literally gets smarter with every audit |
| **Pre-registered methodology** | Published, versioned scoring protocol creates trust and prevents post-hoc manipulation | Medium -- builds institutional credibility |
```

TO:
```
| Moat Layer | Mechanism | Defensibility | Status |
|-----------|-----------|---------------|--------|
| **The feedback payload format** | The specific structure of findings that produces high autonomous fix rates -- demonstrated on 1 site, needs broader validation | Medium -- looks simple but took real iteration; copiable once documented | Demonstrated (N=1) |
| **Execution speed + Format B** | V1 moat is being first to ship a working audit-to-fix loop, not accumulated data | Medium -- time advantage only, erodes if competitors ship | V1 primary moat |
| **Scenario grammar** | Combinatorial test configurations, hard to game | High -- grows with every audit | Unbuilt (design only) |
| **Agent-nativeness scoring** | First-mover in measuring how well products serve AI agents | Medium -- methodology can be copied; data advantage only compounds after 10K+ audits | Unbuilt (design only) |
| **Accumulated quality data** | Every audit feeds aggregate benchmarks and category calibration | High -- but only meaningful after 10K+ audits. Pre-10K, this is not a moat. | Future (requires scale) |
| **Rhumb integration** | Token cost benchmarks, schema fingerprints, recency signals feed Rhumb directory | Medium-High -- exclusive first-party data source, but Rhumb is also pre-launch | Future (requires Rhumb) |
| **Remediation outcome data** | Track which findings actually get fixed and whether fixes hold -- this is the moat competitors cannot replicate without the loop | High -- uniquely generated by the audit-fix-retest loop | Partially demonstrated |
| **Pre-registered methodology** | Published, versioned scoring protocol creates trust and prevents post-hoc manipulation | Medium -- builds institutional credibility | Unbuilt |

**Honest moat assessment:** At launch, our moat is execution speed and the demonstrated Format B loop. The data moat, scenario grammar, and AN scoring moat are future-state. Claiming them now is premature. The unique long-term moat is remediation outcome data -- knowing which findings get fixed and whether fixes hold -- because this can only be generated by operating the loop at scale.
```

---

### MOD-011: Add AEO/GEO/MEO definition requirement

**Source findings:** Review 2 H4 ("AEO/GEO/MEO has no definition -- no rubric, no data points")

**Affected section:** Section 10 (Scope), within the core audit dimensions table (lines 614-622)

**Resolution:** Change the SEO/AEO/GEO/MEO row in the dimensions table:

FROM:
```
| SEO / AEO / GEO / MEO | Technical SEO, answer engine optimization, citation-worthiness, embedding/semantic quality |
```

TO:
```
| SEO | Technical SEO: canonical URLs, meta tags, structured data, sitemap, robots.txt, Core Web Vitals, internal linking, mobile-friendliness |
| AEO (Answer Engine Optimization) | Content structured for AI answer extraction: FAQ schema, direct-answer paragraphs in first 150 words, HowTo schema, question-answer pairs. Measured by: presence of answer-ready content structures, schema markup completeness, snippet eligibility signals. **Requires: 2-page rubric with data points, validated with 3+ SEO professionals before launch.** |
| GEO (Generative Engine Optimization) | Content optimized for citation by generative AI: statistical claims with sources, named expert quotes, authoritative tone, unique data/research, fluency signals. Measured by: citation-worthiness score based on factors from GEO research (Aggarwal et al.). **Requires: 2-page rubric, validated with SEO pros.** |
| MEO (Meaning Engine Optimization) | Semantic coherence for embedding models: consistent terminology, concept clustering, entity relationships, topical authority signals. Measured by: embedding space analysis of site content. **Requires: 2-page rubric. This is the most speculative dimension -- may be deferred to Phase 1 if rubric cannot be validated.** |
```

---

### MOD-012: Resolve methodology transparency conflict

**Source findings:** Review 1 M1 ("Principle conflict -- show findings never methodology vs publish methodology")

**Affected section:** Section 9 (Principles), Principle 2 (lines 520-527) and Principle 11 (lines 581-584)

**Resolution:** Add clarification to Principle 2 (after line 527):

```
**Clarification on transparency tiers:** "Show findings, never methodology" applies to per-audit output -- the individual audit report does not reveal which specific tests were run or in what order (this prevents gaming). However, the general scoring methodology IS published (Principle 11) -- dimension definitions, weight ranges, statistical approach, and scoring philosophy are transparent. The distinction: we publish WHAT we measure and HOW we score, but not the SPECIFIC SCENARIOS run on any given audit. Analogy: a university publishes its grading rubric but does not publish the exam questions in advance.
```

---

### MOD-013: Add emotional design / coach mode

**Source findings:** Review 1 M2 ("Emotional UX risk for solo builders")

**Affected section:** Section 9 (Principles), Principle 4 (lines 536-540)

**Resolution:** Add after Principle 4's existing text (after line 540):

```
**Coach mode (default for first-time users):** The first audit experience must not overwhelm. Before presenting the full finding list, show a 3-step action plan: (1) "Here's the one thing to fix first" (highest-impact finding), (2) "Here are 2-3 quick wins" (LOW findings with fast fixes), (3) "Here's the full picture" (expandable full report). The framing is progress-oriented ("3 things to improve") not deficit-oriented ("12 things wrong"). Expert users can disable coach mode in settings.
```

---

### MOD-014: Add dependency risk operationalization

**Source findings:** Review 1 M3 ("Dependency risk not operationalized")

**Affected section:** Section 11 (Risks), add new Risk 6

**Resolution:** Add after Risk 5 (after line 737):

```
**Risk 6: Critical dependency failure (LLM providers, Playwright, Supabase).**

The audit pipeline depends on external services. If any fails, audits fail.

*Mitigation:*
- LLM provider failover: if primary provider (Anthropic) returns errors for >5 minutes, route to fallback (OpenAI). Canary test: send a classification prompt every 60 seconds; if 3 consecutive failures, trigger failover.
- Playwright: browser pool with circuit breaker. If >20% of browser launches fail in a 5-minute window, pause new audits and alert.
- Supabase: read replicas for audit history. If primary is down, audits can still run but results queue for storage.
- SLO targets: 99.5% audit completion rate (measured weekly). If completion drops below 98%, pause new free-tier audits to preserve paid-tier reliability.
```

---

### MOD-015: Add badge anti-gaming measures

**Source findings:** Review 1 M4 ("Badge can be gamed")

**Affected section:** Section 12 (Roadmap), Phase 3 (line 879) where "Tested by Alien Eyes" badge is mentioned

**Resolution:** Add after the badge mention in Phase 3:

```
**Badge integrity:** The "Tested by Alien Eyes" badge is a signed artifact containing: audit timestamp, scope hash (which dimensions were tested), minimum score thresholds met, and expiry date (90 days). The badge links to a verification endpoint that confirms authenticity. Expired badges display as "last tested [date]" in gray. Badges cannot be self-issued -- they require a passing audit within the last 90 days.
```

---

### MOD-016: Add builder pushback product mechanism

**Source findings:** Review 2 M2 ("Builder pushback has no product mechanism")

**Affected section:** Section 9 (Principles), Principle 13 (lines 592-597)

**Resolution:** Add after Principle 13's existing text (after line 597):

```
**Product mechanisms for pushback:**
- **"Mark as false positive" button** on every finding in Format A (dashboard). Requires a one-line reason. Feeds back into scoring calibration.
- **Disagreement path in Format B/JSON:** when a coding agent encounters a finding it believes is incorrect, it can respond with a structured disagreement (finding ID + reason). The system records this and flags the finding for human review.
- **MCP disagreement endpoint:** `POST /findings/{id}/dispute` with reason field. Returns acknowledgment and updates finding status to "disputed."
- **Aggregated FP data:** if >30% of builders dispute the same finding pattern, the scenario that produces it is flagged for review and potential retirement.
```

---

### MOD-017: Define scenario grammar concretely

**Source findings:** Review 2 M3 ("Scenario grammar is hand-wave -- define axes and primitives")

**Affected section:** Section 7 (Positioning), Unique Capability #3 (line 405); also Appendix A (lines 894-906)

**Resolution:** Add a new subsection in Appendix A after the existing mechanism table (after line 906):

```
### Scenario Grammar: Concrete Definition

The scenario grammar composes tests from axes and primitives. Each audit assembles a unique combination.

**Axes (dimensions of variation):**

| Axis | What Varies | Example Values |
|------|------------|---------------|
| Persona | Who is using the product | First-time visitor, returning user, screen reader user, mobile user, AI agent, search crawler |
| Entry point | How they arrive | Direct URL, Google search result, social media link, deep link, API call |
| Device/viewport | What they're using | iPhone SE, iPad, Desktop 1920px, Pixel 7, headless browser |
| Network condition | Connection quality | Fast 4G, Slow 3G, offline-then-online, high latency |
| Intent | What they're trying to do | Find pricing, complete signup, read documentation, evaluate for integration, extract structured data |

**Primitives per axis (examples, not exhaustive):**

- Persona axis: 6 primitives (first-time, returning, accessibility, mobile-first, agent, crawler)
- Entry point axis: 5 primitives (direct, search, social, referral, API)
- Device axis: 8 primitives (3 mobile, 2 tablet, 2 desktop, 1 headless)
- Network axis: 4 primitives (fast, slow, intermittent, offline)
- Intent axis: 10+ primitives (varies by detected site type)

**Combinatorial space:** 6 x 5 x 8 x 4 x 10 = 9,600 combinations from just these 5 axes. Adding more axes (authentication state, language, time of day) expands to 10^5+. Each audit samples 15-30 combinations, making the specific test matrix unpredictable.

**One complete example scenario:**
"A first-time visitor arrives via Google search on an iPhone SE over slow 3G, trying to find pricing. The audit checks: does the pricing page load within 5 seconds? Is the pricing visible above the fold? Can the user navigate from search landing to pricing in <3 taps? Does the pricing page have structured data for AI extraction?"
```

---

---

## FILE 2: GO-TO-MARKET.md

---

### MOD-018: Revise unit economics with realistic cost model

**Source findings:** Review 1 C4 ("Unit economics ignore failure costs"), Review 2 C5 ("LLM cost estimates 3-5x too low")

**Affected section:** Section 6 (Unit Economics), lines 619-698

**Resolution:**

1. Replace the Cost Per Audit table (lines 624-630):

FROM:
```
| Component | Cost | Notes |
|-----------|------|-------|
| LLM inference (4-tier router) | $0.30-0.80 | Opus for judgment, Sonnet for analysis, Haiku for extraction, GPT-4o-mini for classification |
| Browser pool (Playwright) | $0.05-0.15 | Cloud browser instance, ~3 min per audit |
| Compute (Next.js workers) | $0.02-0.05 | Vercel / Railway / Fly.io |
| Supabase storage + queries | $0.01-0.02 | Postgres + file storage |
| Redis/BullMQ queue | $0.01 | Upstash serverless Redis |
| **Total COGS per audit** | **$0.40-1.00** | Depends on audit depth and model tier |
```

TO:
```
| Component | p50 Cost | p95 Cost | p99 Cost | Notes |
|-----------|----------|----------|----------|-------|
| LLM inference (4-tier router) | $1.50 | $3.50 | $6.00 | Opus for judgment (~$0.80-2.00 per audit), Sonnet for analysis (~$0.40-1.00), Haiku for classification (~$0.10-0.30). Previous estimate of $0.30-0.80 was 3-5x too low based on Opus pricing at $15/M input + $75/M output tokens. |
| Browser pool (Playwright) | $0.10 | $0.30 | $0.80 | Cloud browser, 3-8 min per audit. Retries on timeout/crash add cost. |
| Compute (Next.js workers) | $0.05 | $0.15 | $0.30 | Worker time scales with page count and dimension count. |
| Supabase storage + queries | $0.02 | $0.05 | $0.10 | Screenshots, DOM snapshots, baselines for re-test. |
| Redis/BullMQ queue | $0.01 | $0.02 | $0.03 | |
| Failed audit overhead | $0.00 | $0.50 | $2.00 | Bot-blocked crawls, timeouts, retries, partial results that still consume LLM tokens. Estimated 10-15% of audits fail or require retry. |
| Abuse/moderation overhead | $0.05 | $0.10 | $0.50 | Rate limiting enforcement, disposable email detection, CAPTCHA serving. Amortized across all audits. |
| **Total COGS per audit** | **$1.73** | **$4.62** | **$9.73** | p50 is the planning number. p95 is the pricing floor. |

**Free tier cost cap:** Maximum $3.00 LLM spend per free audit. If exceeded, abort analysis on remaining dimensions and deliver partial results. Free tier uses Haiku + Sonnet only (no Opus).

**Previous estimate correction:** The v1.0 estimate of $0.40-1.00/audit assumed minimal Opus usage and did not account for retry costs, failed crawls, or abuse overhead. The revised p50 of $1.73 is based on: (a) actual Opus pricing as of March 2026, (b) 15 findings per audit requiring ~3-5 LLM calls each, (c) 10-15% retry/failure rate.
```

2. Replace the Gross Margin table (lines 634-641) with updated numbers reflecting realistic COGS:

FROM:
```
| Tier | Price | COGS | Gross Margin | GM% |
|------|-------|------|-------------|-----|
| Free audit | $0 | $0.60 | -$0.60 | -100% |
| Re-test (same URL, 7 days) | $3-5 | $0.40 | $2.60-4.60 | 65-92% |
| Single audit (Builder) | $19-49 | $0.80 | $18.20-48.20 | 93-98% |
| Monthly + per-audit | $29 + $3/audit | $0.60/audit | $29 base + $2.40/audit | 80%+ |
| Consultant white-label | $99 + $3/audit | $0.60/audit | $99 base + $2.40/audit | 85%+ |
| Enterprise | $500+/mo | $0.80/audit | $500 base + margin | 90%+ |
```

TO:
```
| Tier | Price | COGS (p50) | Gross Margin | GM% |
|------|-------|-----------|-------------|-----|
| Free audit | $0 | $1.20 (Haiku+Sonnet, no Opus) | -$1.20 | -100% |
| Re-test (same URL, 7 days) | $5 | $1.00 (baseline exists, comparison only) | $4.00 | 80% |
| Single audit (Builder) | $29-49 | $1.73 | $27.27-47.27 | 94-96% |
| Monthly + per-audit | $29 + $5/audit | $1.73/audit | $29 base + $3.27/audit | 75%+ |
| Consultant white-label | $99 + $5/audit | $1.73/audit | $99 base + $3.27/audit | 80%+ |
| Enterprise | $500+/mo | $1.73/audit | $500 base + margin | 85%+ |

**Target blended gross margin: 70-80%** (accounting for free tier costs and p95 overruns)
```

3. Update break-even analysis (lines 687-696) with revised COGS.

---

### MOD-019: Revise revenue projections to base-case vs. upside-case

**Source findings:** Review 2 H3 ("Revenue projections require 50x validated customer base in 9 months")

**Affected section:** Section 6 (Unit Economics), revenue milestone targets (lines 129-132 in PRODUCT-SPEC, cross-referenced in GTM); also Section 8 (Metrics Dashboard), revenue metrics table (lines 823-830)

**Resolution:** In GO-TO-MARKET.md, add a new subsection in Section 6 after Break-Even Analysis:

```
### Revenue Projection Scenarios

The original revenue targets ($5K Month 3, $50K Month 9, $170K Month 18) assume aggressive growth from zero. Revised projections model three scenarios:

| Metric | Base Case | Target Case | Upside Case |
|--------|-----------|-------------|-------------|
| Month 3 MRR | $1K | $5K | $10K |
| Month 6 MRR | $5K | $15K | $35K |
| Month 9 MRR | $10K | $30K | $60K |
| Month 12 MRR | $20K | $50K | $100K |
| Month 18 MRR | $50K | $100K | $200K |
| Paying customers Month 3 | 15 | 50 | 100 |
| Paying customers Month 12 | 200 | 600 | 1,500 |

**Base case assumptions:** 15% free-to-trial conversion, 3% trial-to-paid, modest viral coefficient (0.1), no agent distribution channel in Year 1.

**Target case assumptions:** 5% free-to-paid conversion, 0.25 viral coefficient, MCP distribution contributing 10% of audits by Month 6.

**Upside case assumptions:** 8% free-to-paid conversion, 0.35 viral coefficient, agent distribution contributing 25% by Month 9, 1 enterprise customer by Month 6.

The $2M ARR target from PRODUCT-SPEC is an upside-case Month 18 number, not a base-case expectation. Plan expenses against base case. Celebrate if we hit target case.
```

Also update the metrics dashboard targets (lines 823-830) to show base/target columns instead of single targets.

---

### MOD-020: Update alpha exit criteria with tighter FP targets

**Source findings:** Review 1 H3, Review 2 H5 (both on FP targets)

**Affected section:** Section 1 (Launch Strategy), Alpha exit criteria (lines 58-63)

**Resolution:** Replace:

FROM:
```
**Alpha exit criteria:**
- Re-audit rate within 7 days exceeds 40%
- False positive rate below 15%
- At least 5 testimonials referencing specific value
- At least 3 builders willing to share results publicly
- Autonomous fix rate (when findings pasted into coding agent) exceeds 60%
```

TO:
```
**Alpha exit criteria:**
- Re-audit rate within 7 days exceeds 40%
- False positive rate below 10% overall, <1% for CRITICAL severity
- At least 5 testimonials referencing specific value
- At least 3 builders willing to share results publicly
- Autonomous fix rate (when findings pasted into coding agent) exceeds 60%
- At least 20 audits run on sites NOT built by us (external validation)
- At least 3 different tech stacks tested (not just Next.js)
```

---

### MOD-021: Add free tier abuse prevention to launch strategy

**Source findings:** Review 1 C1, Review 2 C3 (both on free-tier weaponization)

**Affected section:** Section 1 (Launch Strategy), Phase 0 Weeks 1-2 (lines 33-39)

**Resolution:** Add to the "Weeks 1-2: Build the minimum shippable product" list:

```
- Cloudflare Turnstile on audit submission
- Email verification required (disposable domain blocklist)
- Per-IP rate limiting: 1 concurrent audit, 5/hour max
- Per-email budget: 3 free audits per 30 days
- Free tier model: Haiku + Sonnet only (no Opus) with $3 LLM spend cap per audit
- Cost monitoring dashboard for free tier burn rate
```

Also change line 38 from:
```
- No account required for first audit
```
to:
```
- Email verification required for first audit (lightweight -- email + Turnstile, not full account signup)
```

---

### MOD-022: Address the "competing agent" problem honestly

**Source findings:** Review 2 H2 ("Claude Code can do 80% of this for free")

**Affected section:** Section 7 (Competitive Positioning), add new subsection after "Handling 'I Can Build This Myself'" (after line 761)

**Resolution:** Add:

```
### Handling "Claude Code Can Already Do This"

**The objection:** "I can ask Claude Code to audit my site right now for free. Why would I pay you?"

**The response:**

"You can, and you should try it. Here's what you'll find:

1. **Same blind spots.** Claude Code auditing your code has the same context as Claude Code writing your code. It knows what you intended. It doesn't know what a stranger experiences. External testing from a clean browser with no prior context is structurally different.

2. **No baseline comparison.** Claude Code runs a fresh analysis every time. It can't tell you 'this regressed since last week' or 'you're in the 73rd percentile for SaaS products.' Baselines and benchmarks require persistent data across audits.

3. **No clean browser state.** Claude Code doesn't spin up isolated Playwright instances with fresh profiles. It reads your code. We browse your site like a stranger would.

4. **No agent-nativeness scoring.** Claude Code doesn't know what makes an API agent-native. We have a scoring methodology for parity, granularity, composability, and schema stability.

5. **The separation-of-concerns problem is real.** The same tool that built the product cannot objectively test it. This is not a Claude Code limitation -- it's a structural truth about testing. The builder's context IS the blind spot.

Claude Code is an excellent coding agent. Alien Eyes is an independent auditor. They work together: we find the issues, Claude Code fixes them."

**Important:** Do NOT claim Claude Code "can't" do auditing. It can, approximately. Our positioning must be honest about what we add on top: external perspective, clean browser state, persistent baselines, agent-nativeness scoring, and separation of concerns. If Claude Code adds built-in auditing features, our response is: good, the category is validated, and we're the independent option.
```

---

### MOD-023: Downgrade validation language in GTM header and Section 0

**Source findings:** Review 2 C1 (consistent with MOD-001 but for GTM doc)

**Affected section:** Header (line 4), Section 0 (lines 9-23)

**Resolution:**

1. Change header (line 4) from:
```
> Status: Pre-launch. Product thesis validated through dogfood (supertrained.ai audit, 2 loops, 12/12 fixes).
```
to:
```
> Status: Pre-launch. Core loop demonstrated through dogfood on own site (N=1). External validation pending.
```

2. Change Section 0 closing line (line 23) from:
```
The product works. The clipboard is the product. The loop converges. Now we need to get it in front of builders.
```
to:
```
The loop worked on our own site. The clipboard is the product. Now we need to prove it works on sites we didn't build, with builders we don't know, across stacks we didn't choose.
```

---

### MOD-024: Revise metrics dashboard FP targets

**Source findings:** Review 1 H3, Review 2 H5

**Affected section:** Section 8 (Metrics Dashboard), product metrics table (lines 810-819)

**Resolution:** Change the false positive rate row:

FROM:
```
| False positive rate | <15% | <10% | <5% |
```

TO:
```
| False positive rate (overall) | <10% | <8% | <5% |
| False positive rate (CRITICAL) | <1% | <0.5% | <0.1% |
```

---

---

## FILE 3: CLAUDE.md

---

### MOD-025: Update CLAUDE.md to reflect consolidated modifications

**Source findings:** All (CLAUDE.md is the handoff document and must reflect the corrected state)

**Affected sections:** Header (line 5), Quick Context (line 11), Pricing table (lines 130-140)

**Resolution:**

1. Change header (line 5) from:
```
> Product Thesis: VALIDATED (2-loop dogfood on supertrained.ai, March 5-6, 2026)
```
to:
```
> Product Thesis: DEMONSTRATED (2-loop dogfood on own site, supertrained.ai, March 5-6, 2026. N=1, single stack, external validation pending.)
```

2. Change Quick Context (line 11), last sentence, from:
```
Outputs feed Rhumb's AN Score. Delivers as SaaS, MCP, and CLI.
```
to:
```
Outputs feed Rhumb's AN Score. V1 delivers as SaaS web + REST API. CLI and MCP deferred to Phase 1.
```

3. Replace pricing table (lines 131-139):

FROM:
```
| Tier | Price | Rationale |
|------|-------|-----------|
| First audit | Free | This IS the marketing |
| Re-test (same URL, <7 days) | $3-5 | Baseline exists, comparison is the value |
| Fresh audit (new URL) | $19-49 | Full crawl, all dimensions |
| Monthly plan | $29/mo + $3/audit | Supports habitual looping |
| Enterprise | Custom | CI/CD, compliance, SLA |
```

TO:
```
| Tier | Price | Rationale |
|------|-------|-----------|
| First audit | Free (email + Turnstile required, 3/30 days, Haiku+Sonnet only) | This IS the marketing. Hardened against abuse. |
| Re-test (same URL, <7 days) | $5 | Baseline exists, comparison is the value |
| Fresh audit (new URL) | $29-49 | Full crawl, all dimensions |
| Monthly plan | $29/mo + $5/audit | Supports habitual looping |
| Enterprise | Custom | CI/CD, compliance, SLA |
```

4. Add a new section after "What's Been Proven" (after line 28), before "Vision":

```
### What Has NOT Been Proven

- Loop works on non-Next.js stacks
- Loop works with Cursor/Windsurf (not just Claude Code)
- Loop works on sites we did not build
- Format B fix rate holds with non-technical builders
- Agent-nativeness scoring dimensions (untested in dogfood)
- MCP/API delivery path (clipboard only so far)
- Pricing willingness (no real money exchanged)
- FP rate at scale (N=1 false positive in N=2 loops is not a rate)
```

5. In the "Next" section (lines 169-173), add:

```
- [ ] Harden free tier: Turnstile, email verification, rate limiting, LLM budget caps
- [ ] Write AEO/GEO/MEO rubrics (2 pages each) and validate with SEO professionals
- [ ] Build cost model: validate LLM cost per audit with real Opus/Sonnet/Haiku pricing
- [ ] Run 20+ audits on external sites across 3+ tech stacks
```

---

## CROSS-DOCUMENT CONSISTENCY CHECKLIST

After applying all modifications, verify these are consistent across all three documents:

| Item | PRODUCT-SPEC.md | GO-TO-MARKET.md | CLAUDE.md |
|------|----------------|-----------------|-----------|
| Validation language | "Demonstrated (N=1)" | "Demonstrated (N=1)" | "DEMONSTRATED" |
| V1 delivery surfaces | SaaS + REST API | SaaS + REST API | SaaS + REST API |
| Free tier price | $0 with email + Turnstile + rate limits | $0 with same | $0 with same |
| Re-test price | $5 | $5 | $5 |
| Fresh audit price | $29-49 | $29-49 | $29-49 |
| FP target (overall) | <10% alpha, <5% Month 6 | <10% alpha, <5% Month 12 | N/A |
| FP target (CRITICAL) | <1% alpha | <1% alpha | N/A |
| COGS per audit (p50) | N/A (reference GTM) | $1.73 | N/A |
| Free tier model tier | Haiku + Sonnet | Haiku + Sonnet | Haiku + Sonnet |

---

## MODIFICATION PRIORITY

Apply in this order:

1. **MOD-001** (validation language) -- frames everything else correctly
2. **MOD-018** (unit economics) -- pricing depends on costs
3. **MOD-004** (abuse prevention) -- free tier design depends on costs
4. **MOD-003** (scope reduction) -- reduces surface area
5. **MOD-002** (evidence bundle) -- quality gate for findings
6. **MOD-006** (FP targets) -- depends on evidence bundle
7. **MOD-005** (privacy/compliance) -- standalone
8. **MOD-008** (Cloudflare/SPA) -- standalone
9. **MOD-010** (moat reframing) -- depends on validation language
10. **MOD-011** (AEO/GEO/MEO definition) -- standalone
11. **MOD-007, MOD-009, MOD-012-017** (remaining PRODUCT-SPEC changes)
12. **MOD-019-024** (remaining GTM changes)
13. **MOD-025** (CLAUDE.md) -- last, reflects final state of other docs
