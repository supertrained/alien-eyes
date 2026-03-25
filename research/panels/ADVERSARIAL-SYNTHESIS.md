# Adversarial Expert Panel Synthesis — Alien Eyes Primitives

> Date: 2026-03-13
> Panels: 7 (35 experts total)
> Scope: All 6 audit primitives + crawl/QA infrastructure
> Method: Each panel independently critiqued code, audited supertrained.ai, and rated 1-10
> Status: COMPLETE — ready for implementation prioritization

---

## Composite Ratings

| Dimension | Panel Rating | Experts | Verdict |
|-----------|-------------|---------|---------|
| Crawl/QA Infrastructure | **3.8-5.5/10** | 10 | Types excellent; Playwright underused (R1); infrastructure resilience gaps (R2) |
| Security | **3.0/10** | 5 | Ownership gate kills free tier; extracts 6 headers, uses 2 |
| Accessibility | **2.8/10** | 5 | No color contrast; hardcoded patterns; no AXTree |
| SEO | **2.2/10** | 5 | Uses ~10% of collected data; `structuredData` field never referenced; `_crawl` param unused |
| Copy-UX | **2.6/10** | 5 | Keyword matching fundamentally flawed; 0% detection rate |
| Agent-Nativeness | **2.4/10** | 5 | Ownership gate blocks all checks; no endpoint probing |
| Performance | **1.8/10** | 5 | renderBlockingCount false positive; zero CWV; response headers never read |

**Weighted Average: 2.4/10**

### The Common Theme

Every panel independently reached the same conclusion: **the architecture and type system are significantly above average, but the primitives use a fraction of the data and capabilities available to them.** The extraction layer collects rich signals. The primitives ignore most of them. The Playwright browser is launched but used as a `curl` replacement.

---

## Cross-Cutting Issues (Unanimous Across 3+ Panels)

### CC-1: `waitUntil: 'domcontentloaded'` Must Change to `networkidle` + Stability Check
- **Panels:** Crawl/QA (5/5), Performance (referenced), Accessibility (referenced)
- **Impact:** Every primitive inherits partial-render data. JS-rendered content invisible.
- **Fix:** Change `page-collector.ts:97` to `networkidle`, add DOM stability wait.
- **Effort:** 1 hour

### CC-2: Cheerio on Raw HTML Must Be Replaced With `page.evaluate()` + `page.accessibility.snapshot()`
- **Panels:** Crawl/QA (5/5), Accessibility (5/5), SEO (3/5), Copy-UX (3/5)
- **Impact:** Link discovery misses SPA routes. Accessibility extraction misses computed roles/names. Headings miss JS-rendered content.
- **Fix:** Post-render extraction via Playwright's in-browser APIs.
- **Effort:** 4-8 hours

### CC-3: Core Web Vitals Declared But Never Collected
- **Panels:** Performance (5/5), Crawl/QA (5/5)
- **Impact:** `lcpMs: undefined` and `cls: undefined` in every audit. Performance scoring uses stubs.
- **Fix:** Inject PerformanceObserver via `page.evaluate()` for LCP, CLS, FID/INP.
- **Effort:** 2-3 hours

### CC-4: Ownership Gate Over-Applied
- **Panels:** Security (5/5), Agent-Nativeness (5/5)
- **Impact:** Security returns zero findings for free tier. Agent-nativeness returns zero findings for free tier. Two entire dimensions produce no value for unverified users.
- **Fix:** Tiered gate — public posture (unverified) vs specific exploitation details (verified).
- **Effort:** 1-2 days

### CC-5: Keyword Matching Is Not Signal Detection
- **Panels:** Copy-UX (5/5), Agent-Nativeness (5/5), SEO (2/5)
- **Impact:** CTA detection matches word presence, not conversion intent. Trust detection matches topics, not persuasion architecture. Agent-nativeness matches "api" in text, not actual API endpoints.
- **Fix:** Structural DOM analysis (element types, positions, roles) not text pattern matching.
- **Effort:** 2-4 days across Copy-UX and Agent-Nativeness

### CC-6: Hardcoded Site-Specific Patterns
- **Panels:** Accessibility (5/5), SEO (3/5), Copy-UX (2/5)
- **Impact:** `cloneicp|snowthere` regex, services page meta check, Calendly-specific check. These work for supertrained.ai and nowhere else.
- **Fix:** Generalize to pattern classes (e.g., "heading with empty textContent but containing img").
- **Effort:** 2-4 hours

---

## P0: Must Fix Before Next Audit (Zero or Minimal New Infrastructure)

These use data already collected or require trivial code changes. Combined effort: ~3-5 days.

| # | Fix | Primitive | What Changes | Effort | Expert Consensus |
|---|-----|-----------|-------------|--------|-----------------|
| P0-1 | Change `waitUntil` to `networkidle` + DOM stability | Crawl | `page-collector.ts:97` | 1h | 10/10 (Crawl + Perf) |
| P0-2 | Fix `renderBlockingCount` — exclude async/defer scripts | Performance | `page-summarizer.ts:72` | 1h | 5/5 (Performance) |
| P0-3 | Use all 6 already-extracted security headers | Security | `security.ts` — add X-Frame, X-Content-Type, Referrer, Permissions checks | 4h | 5/5 (Security) |
| P0-4 | Expand tracking domain list from 2 to 50+ | Security | `security-extractor.ts` — replace regex with maintained domain list | 4h | 4/5 (Security) |
| P0-5 | Split security ownership gate into tiered disclosure | Security | Unverified: header grades. Verified: specific findings. | 8h | 5/5 (Security) |
| P0-6 | Remove hardcoded site-specific patterns | Accessibility, SEO | Replace `cloneicp\|snowthere`, services-page check with generic patterns | 2h | 5/5 (Accessibility) |
| P0-7 | Add color contrast checking | Accessibility | Extract computed colors via `page.evaluate()` or inject axe-core | 8h | 5/5 (Accessibility) |
| P0-8 | Add structured data validation | SEO | Use already-collected `structuredData` — validate JSON-LD schema | 4h | 4/5 (SEO) |
| P0-9 | Add title/description length checks | SEO | Already have `title` and `metaTags.description` — check character counts | 1h | 5/5 (SEO) |
| P0-10 | Replace keyword CTA/trust checks with structural detection | Copy-UX | DOM-based: buttons in hero, blockquotes with attribution, logo grids | 8h | 5/5 (Copy-UX) |
| P0-11 | Remove agent-nativeness ownership gate for passive checks | Agent-Native | Endpoint probing, robots.txt, structured data are publicly observable | 4h | 5/5 (Agent-Native) |

**Total P0 effort: ~45 hours (~6 days)**

---

## P1: High Impact — Needs Minor New Extraction (1-2 weeks)

| # | Fix | Primitive | What's Needed | Effort | Consensus |
|---|-----|-----------|--------------|--------|-----------|
| P1-1 | Replace Cheerio extraction with `page.evaluate()` | Crawl | In-browser DOM queries post-render | 8h | 10/10 |
| P1-2 | Add `page.accessibility.snapshot()` for AXTree | Accessibility | One API call replaces Cheerio ARIA parsing | 4h | 7/10 |
| P1-3 | Implement Core Web Vitals via PerformanceObserver | Performance | `page.evaluate()` injection | 3h | 10/10 |
| P1-4 | Extract links from rendered DOM | Crawl | `page.$$eval('a[href]', ...)` after stabilization | 2h | 7/10 |
| P1-5 | Add retry with backoff for transient failures | Crawl | One retry for timeout/5xx errors | 2h | 4/5 (Crawl) |
| P1-6 | Structured error capture per skipped page | Crawl | Replace bare `catch` with typed error objects | 1h | 3/5 (Crawl) |
| P1-7 | Add CSP quality analysis (unsafe-inline/eval detection) | Security | Parse CSP directive, flag bypass vectors | 8h | 4/5 (Security) |
| P1-8 | Add CORS policy audit | Security | Check `access-control-allow-origin` per endpoint type | 4h | 3/5 (Security) |
| P1-9 | Add mixed content detection | Security | Flag `http://` resources on `https://` pages from network data | 2h | 4/5 (Security) |
| P1-10 | Add sensitive file probes (10 paths) | Security | `.env`, `.git/HEAD`, `security.txt`, etc. | 4h | 4/5 (Security) |
| P1-11 | Add accessible name checking for interactive elements | Accessibility | Extract computed names from AXTree | 4h | 4/5 (Accessibility) |
| P1-12 | Add WCAG success criteria references to findings | Accessibility | Tag each finding with SC number and level | 2h | 5/5 (Accessibility) |
| P1-13 | Add page-role classification | Copy-UX | Classify homepage/services/blog/legal for context-aware checks | 4h | 4/5 (Copy-UX) |
| P1-14 | Replace keyword agent-nativeness with endpoint probing | Agent-Native | HEAD requests to `/llms.txt`, `/openapi.json`, `/.well-known/ai-plugin.json` | 8h | 5/5 (Agent-Native) |
| P1-15 | Add sitemap reconciliation | SEO | Cross-reference sitemap URLs with crawled pages | 4h | 4/5 (SEO) |
| P1-16 | Multi-signal stack detection | Crawl | Combine meta generators, script patterns, headers, DOM | 6h | 3/5 (Crawl) |
| P1-17 | Mobile viewport parallel pass | Crawl | Already supported in BrowserPool; activate it | 4h | 3/5 (Crawl) |
| P1-18 | Add internal linking topology analysis | SEO | Graph analysis on link data already collected | 6h | 3/5 (SEO) |

**Total P1 effort: ~76 hours (~10 days)**

---

## P2: Valuable — Needs New Crawl Capabilities (Weeks 3-4)

| # | Fix | Primitive | What's Needed | Effort | Consensus |
|---|-----|-----------|--------------|--------|-----------|
| P2-1 | Playwright tracing for evidence bundles | Crawl | `context.tracing.start()` — replayable proof per finding | 3h | 2/5 |
| P2-2 | Network waterfall analysis (critical rendering path) | Performance | Sequence analysis on request timing data | 6h | 2/5 |
| P2-3 | ISR/SSG cache-state detection | Crawl | Check `x-nextjs-cache`, `x-vercel-cache`, `cf-cache-status` | 2h | 2/5 |
| P2-4 | Gauge R&R repeatability study (CI job) | QA | Run 10x on 5 URLs, compute finding variance | 12h | 2/5 |
| P2-5 | Benjamini-Hochberg FDR correction | Synthesis | Control false discovery rate across multi-page audits | 2h | 1/5 |
| P2-6 | JS/CSS coverage analysis | Performance | `page.coverage.startJSCoverage()` — dead code detection | 4h | 1/5 |
| P2-7 | Error page probing | Crawl/Security | Navigate to `/this-does-not-exist`, analyze response | 2h | 2/5 |
| P2-8 | Screenshot comparison for re-tests (SSIM) | Crawl | Compare before/after screenshots structurally | 6h | 1/5 |
| P2-9 | TLS configuration check | Security | Certificate expiry, protocol versions, key strength | 8h | 3/5 |
| P2-10 | Consent Mode v2 detection | Security | Distinguish "library loaded" vs "data transmitted" | 8h | 1/5 |
| P2-11 | Add Fogg Behavior Model scoring | Copy-UX | Motivation/Ability/Prompt framework encoded as checks | 8h | 2/5 |
| P2-12 | Content negotiation testing | Agent-Native | `Accept: application/json` vs `text/html` per endpoint | 4h | 2/5 |
| P2-13 | Form label association checking | Accessibility | Match `<label for>` to `<input id>` | 3h | 3/5 |
| P2-14 | Image optimization analysis | Performance | Format detection (WebP/AVIF), dimensions vs display size | 6h | 3/5 |

**Total P2 effort: ~74 hours (~9 days)**

---

## P3: Aspirational — External APIs / Major Infrastructure

| # | Fix | Effort | Notes |
|---|-----|--------|-------|
| P3-1 | CrUX API integration for field CWV data | 4h | Real user data from Chrome UX Report |
| P3-2 | JavaScript library CVE correlation (Retire.js approach) | 24h | Extract versions from URLs/content, match against NVD |
| P3-3 | DNS security (CAA, DNSSEC, SPF/DMARC) | 16h | External DNS queries |
| P3-4 | Route manifest extraction per framework | 8h | Next.js `__NEXT_DATA__`, Nuxt `__NUXT__`, etc. |
| P3-5 | CSP Evaluator integration | 16h | Per-directive grading, bypass feasibility |
| P3-6 | Certificate Transparency monitoring (crt.sh) | 8h | Detect unauthorized certificate issuance |
| P3-7 | Property-based testing (fast-check) | 12h | Generate random valid HTML, verify extraction correctness |
| P3-8 | Synthetic ground truth corpus (50 test sites) | 40h | Manually verified issues for precision/recall measurement |
| P3-9 | axe-core integration as a headless engine | 8h | Industry-standard automated accessibility testing |
| P3-10 | Schema.org vocabulary validation | 8h | Validate JSON-LD against schema.org definitions |

---

## Architecture Recommendations (Cross-Panel)

### 1. The Extraction Layer Is the Bottleneck

Every primitive panel said the same thing: the extraction layer determines the ceiling. Improving extractors improves all primitives simultaneously. Priority order:
1. Switch to `page.evaluate()` for DOM queries (benefits ALL primitives)
2. Add `page.accessibility.snapshot()` (benefits Accessibility, Copy-UX, Agent-Nativeness)
3. Inject PerformanceObserver for CWV (benefits Performance)
4. Expand security header analysis (benefits Security)

### 2. The Quick Check Tier Should Cover More

Current Quick Check (free): SEO + Performance + Accessibility (deterministic only, no LLM).

Panels recommend adding to Quick Check:
- **Security posture grade** (headers are publicly observable — no LLM needed)
- **Agent-nativeness discovery endpoints** (deterministic HTTP HEAD requests — no LLM needed)
- **Performance CWV** (browser API, not LLM)

This makes the free tier genuinely useful and generates calibration data for paid tiers.

### 3. Findings Should Carry Framework References

- Accessibility: WCAG success criteria (e.g., `1.4.3` for contrast)
- Security: OWASP category (e.g., `A05:2021` for Security Misconfiguration)
- SEO: Google Search Central reference
- Performance: Core Web Vitals threshold reference

This adds credibility and makes findings actionable for teams with compliance requirements.

### 4. The Measurement System Needs Characterization (Before Scale)

The metrology expert (Crawl/QA panel) made a compelling case: before serving external users, run a basic repeatability study. 10 URLs, 3 runs each, measure finding-set Jaccard similarity. If same-URL runs produce different findings, the confidence scores are meaningless. This is a CI job, not a product feature.

---

## Implementation Roadmap

### Sprint 1 (Week 1): Foundation Fixes
Focus: Crawl reliability + data extraction quality
- P0-1: `networkidle` + stability
- P0-2: Fix renderBlockingCount
- P0-6: Remove hardcoded patterns
- P1-1: `page.evaluate()` extraction
- P1-2: AXTree integration
- P1-3: Core Web Vitals collection
- P1-4: Rendered DOM link extraction
- P1-5: Retry with backoff
- P1-6: Structured error capture

**Outcome:** Crawl engine goes from 3.8 to ~7. Every downstream primitive benefits.

### Sprint 2 (Week 2): Primitive Upgrades
Focus: Use data already collected
- P0-3: All 6 security headers
- P0-4: 50+ tracking domains
- P0-7: Color contrast
- P0-8: Structured data validation
- P0-9: Title/description lengths
- P0-10: Structural CTA/trust detection
- P1-7: CSP quality analysis
- P1-8: CORS audit
- P1-9: Mixed content
- P1-11: Accessible names
- P1-12: WCAG SC references

**Outcome:** Each primitive goes from 2-3 to ~5-6. Detection rate jumps dramatically.

### Sprint 3 (Week 3): Gate Redesign + New Capabilities
Focus: Unblock free tier value + new checks
- P0-5: Tiered security gate
- P0-11: Agent-nativeness gate fix
- P1-10: Sensitive file probes
- P1-13: Page-role classification
- P1-14: Agent-nativeness endpoint probing
- P1-15: Sitemap reconciliation
- P1-16: Multi-signal stack detection
- P1-17: Mobile viewport pass
- P1-18: Internal linking topology

**Outcome:** Free tier has genuine security + agent-nativeness value. All primitives at ~7/10.

### Sprint 4 (Week 4): Quality + Measurement
Focus: Confidence in the tool's own output
- P2-1: Playwright tracing for evidence
- P2-3: ISR/SSG cache detection
- P2-4: Gauge R&R repeatability study
- P2-5: BH FDR correction
- P2-7: Error page probing
- P2-13: Form label checking
- P2-14: Image optimization

**Outcome:** Tool can demonstrate its own accuracy. Evidence bundles are replayable. Measurement uncertainty is characterized.

---

## Panel Documents Index

| Panel | File | Rating | Experts |
|-------|------|--------|---------|
| SEO | `research/panels/panel-seo-adversarial.md` | 2.2/10 | 5 |
| Performance | `research/panels/panel-performance-adversarial.md` | 1.8/10 | 5 |
| Accessibility (Round 1) | `research/panels/panel-accessibility-audit.md` | 2.8/10 | 5 |
| Accessibility (Round 2) | `research/panels/panel-accessibility-adversarial.md` | 1.8/10 | 5 |
| Security | `research/panels/panel-security-adversarial.md` | 3.0/10 | 5 |
| Copy-UX | `research/panels/panel-copy-ux-adversarial.md` | 2.6/10 | 5 |
| Agent-Nativeness | `research/panels/panel-agent-nativeness-adversarial.md` | 2.4/10 | 5 |
| Crawl/QA Infrastructure (R1+R2) | `research/panels/panel-crawl-qa-adversarial.md` | 3.8-5.5/10 | 10 |

---

## The Blunt Summary

45 experts across 9 panels (some dimensions with 2 rounds) gave the same diagnosis:

**The architecture is an 8. The implementation is a 3.**

The types are frozen, well-designed, and carry the right fields. The methodology is pre-registered. The evidence bundle requirement is correct. The pipeline structure is sound. The security infrastructure (URLValidator, InputSanitizer, SSRF defense) is mature.

But the primitives implement 10-15% of what the architecture enables. The crawl engine launches a $400M browser automation framework and uses it as `curl`. Six security headers are extracted and two are checked. The accessibility extractor parses HTML with Cheerio when `page.accessibility.snapshot()` returns the actual computed accessibility tree. Performance metrics have `undefined` for the two most important fields (LCP, CLS). The copy-UX primitive uses keyword matching — the approach that died with AltaVista.

The gap between design and implementation is the finding. Close it and this is a credible product. Ship it as-is and the first paying customer will see the same thing the panels saw: findings that are both incomplete and unreliable, from a tool that has the architecture to be much better.

The good news: most P0 fixes use data already collected. The extraction layer is rich. The primitives just need to read what's already there.
