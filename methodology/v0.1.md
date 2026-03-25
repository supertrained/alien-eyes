# Alien Eyes — Scoring Methodology v0.1

> Version: 0.1 | Pre-registered: 2026-03-10
> Status: PRE-REGISTERED. This document is frozen before any audits run under this version.
> Purpose: Define exactly what is measured, how it is scored, and how scores are combined. Published for transparency.
> Implements: Architecture Decision #6 (Methodology Versioning) and Stolen Mechanism #6 (Pre-registered Endpoints)

---

## Why Pre-Register?

Clinical trials pre-register their endpoints before the trial runs. This prevents unconscious p-hacking: adjusting methodology after seeing results to make them look better. Alien Eyes pre-registers its scoring methodology for the same reason.

**What is public (Principle 11 — tiered transparency):**
- This document: what we measure, how we score, how we combine scores
- Dimension definitions and rubrics
- Scoring formula and weight rationale

**What is private (Principle 2 — show findings, never methodology):**
- Specific test scenarios and scenario grammar
- Prompt templates used by primitives
- The exact sequence and combination of tests run

---

## 1. Audit Dimensions (V1)

Alien Eyes v0.1 evaluates 6 dimensions. Each dimension produces a score (0-100) and a set of findings.

| Dimension | Code | What It Measures | LLM Required? | Ownership Required? |
|-----------|------|-----------------|---------------|---------------------|
| SEO | `seo` | Technical SEO: canonical URLs, meta tags, heading hierarchy, robots.txt, sitemap, structured data, OG tags | Partially (judgment calls) | No |
| Accessibility | `accessibility` | WCAG 2.1 AA: color contrast, alt text, keyboard nav, ARIA, form labels, focus management, skip links | Partially (quality judgment) | No |
| Security Surface | `security` | External-visible security: CSP, HSTS, mixed content, cookie attributes, exposed secrets, X-Frame-Options | Minimal (classification) | **Yes** |
| Performance | `performance` | Core Web Vitals, TTFB, load time, page weight, render-blocking resources | **No** (fully deterministic) | No |
| Agent-Nativeness | `agent-nativeness` | Parity, granularity, composability, CRUD completeness, structured outputs, error handling | Yes (judgment) | **Yes** |
| Copy & UX | `copy-ux` | CTA clarity, trust signals, dead-end pages, error states, value prop clarity, navigation coherence | Yes (judgment) | No |

**Quick Check (free tier):** Runs SEO + Performance + Accessibility only. Deterministic checks only (no LLM). Sub-60-second.

**Full Audit (paid tier):** Runs all 6 dimensions. LLM-powered analysis where noted.

---

## 2. Per-Dimension Scoring

### 2.1 Scoring Scale

Each dimension is scored 0-100 based on findings:

| Score Range | Label | Meaning |
|-------------|-------|---------|
| 90-100 | Excellent | No CRITICAL or HIGH findings. ≤2 MEDIUM findings. |
| 75-89 | Good | No CRITICAL findings. ≤1 HIGH finding. ≤5 MEDIUM findings. |
| 50-74 | Needs Work | No CRITICAL findings. 2+ HIGH or 6+ MEDIUM findings. |
| 25-49 | Poor | 1+ CRITICAL or 3+ HIGH findings. |
| 0-24 | Critical | Multiple CRITICAL findings or systemic failures. |

### 2.2 Finding Severity Weights

Findings reduce the dimension score from 100:

| Severity | Point Deduction | Rationale |
|----------|----------------|-----------|
| CRITICAL | -25 points | Blocks core functionality, security risk, or catastrophic SEO impact |
| HIGH | -12 points | Significant user/agent experience degradation |
| MEDIUM | -5 points | Meaningful improvement opportunity |
| LOW | -2 points | Minor polish or optimization |

**Floor:** Dimension score cannot go below 0.

**Confidence adjustment:** If finding confidence < 0.9, the deduction is multiplied by the confidence score. A MEDIUM finding at 0.7 confidence deducts 3.5 points instead of 5.

### 2.3 Severity Classification Criteria

**CRITICAL — one or more of:**
- Blocks the primary purpose of the product (signup broken, core feature non-functional)
- Creates immediate security exposure (credentials in HTML, no HTTPS)
- Destroys search indexability site-wide (canonical to homepage, noindex on all pages)
- Causes data loss or corruption
- Affects all users on all pages

**HIGH — one or more of:**
- Significantly degrades experience for a major user segment (mobile users, screen reader users)
- Creates meaningful security weakness (missing CSP, insecure cookies)
- Blocks important but non-primary functionality
- Causes silent failures that users can't diagnose

**MEDIUM — one or more of:**
- Noticeable quality gap that affects some users
- Missing industry-standard feature (alt text on images, skip-to-content link)
- Performance issue that degrades but doesn't block usage
- Missing metadata that affects discoverability

**LOW — one or more of:**
- Minor optimization opportunity
- Best practice that's missing but doesn't cause user-facing problems
- Cosmetic or informational issue

### 2.4 Conservative Severity Rule

When severity classification is ambiguous, **always classify DOWN**. A finding that might be HIGH or MEDIUM is classified MEDIUM. This prevents false CRITICAL findings that could trigger destructive auto-fixes.

---

## 3. Composite Scores

### 3.1 Satisfaction Score

The overall satisfaction score represents: "How likely is a first-time visitor (human or agent) to accomplish what this product exists to enable?"

**Formula:**
```
satisfaction = weighted_average(dimension_scores, weights)
```

**Dimension weights (v0.1):**

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| SEO | 0.15 | Affects discoverability, not direct experience |
| Accessibility | 0.20 | Fundamental to inclusive experience |
| Security | 0.15 | Critical but surface-level in V1 |
| Performance | 0.15 | Directly affects experience |
| Agent-Nativeness | 0.15 | Key differentiator; weight may increase in future versions |
| Copy & UX | 0.20 | Most directly measures user outcome achievement |

**Confidence interval:** Single-run evaluation. Confidence interval estimated as ±5 points for deterministic dimensions, ±10 points for LLM-evaluated dimensions. The interval is calculated as the weighted average of per-dimension intervals.

### 3.2 Human-Native Composite

```
human_native = weighted_average([seo, accessibility, performance, copy_ux], [0.2, 0.3, 0.2, 0.3])
```

Represents: "How well does this product serve human visitors?"

### 3.3 Agent-Nativeness Composite

```
agent_nativeness = agent_nativeness_dimension_score
```

In V1, this is the raw dimension score. In future versions, it will incorporate sub-dimensions (parity, granularity, composability, CRUD completeness).

---

## 4. Agent-Nativeness Rubric (V1)

Based on Every.to's 5 properties. Scored per sub-dimension:

| Sub-Dimension | What We Check | Score Criteria |
|---------------|--------------|----------------|
| **Parity** | Does the API/MCP expose the same capabilities as the UI? | 100% = full parity. Each missing API capability deducts 10 points. |
| **Granularity** | Are operations atomic or bundled? | 100% = all operations are the smallest meaningful unit. Bundled operations deduct 5 points each. |
| **Composability** | Are outputs structured and pipeable? | 100% = JSON/structured responses with consistent schema. HTML-only responses deduct 15 points. |
| **CRUD Completeness** | Can agents Create, Read, Update, Delete every entity? | 100% = full CRUD per entity. Each missing CRUD operation deducts 5 points. |
| **Error Handling** | Are error responses structured with explicit codes and messages? | 100% = JSON errors with code + message. HTML errors deduct 15 points. Ambiguous errors deduct 10 points. |

**Agent-Nativeness Score =** average of sub-dimension scores.

**Note:** This rubric is UNVALIDATED. It must be tested with 2+ agent framework teams during alpha and refined based on whether the scoring correlates with actual agent success rates.

---

## 5. SEO Dimension Rubric (V1)

| Check | Type | Severity if Missing |
|-------|------|-------------------|
| Canonical URL correct (self-referencing) | Deterministic | CRITICAL (if all pages point to homepage) / MEDIUM (individual pages) |
| Meta description present and unique | Deterministic | MEDIUM |
| Title tag present, unique, <60 chars | Deterministic | MEDIUM (missing) / LOW (too long) |
| OG tags present (og:title, og:description, og:image) | Deterministic | LOW |
| Heading hierarchy valid (h1 → h2 → h3, no skips) | Deterministic | LOW |
| robots.txt present | Deterministic | LOW |
| Sitemap.xml present and valid | Deterministic | MEDIUM |
| Structured data present (JSON-LD) | Deterministic | MEDIUM |
| Duplicate titles across pages | Deterministic | MEDIUM |
| Duplicate meta descriptions across pages | Deterministic | LOW |
| Internal linking quality | LLM (Sonnet) | MEDIUM |
| Content thin-ness (< 200 words on key pages) | Deterministic + LLM | MEDIUM |

---

## 6. Accessibility Dimension Rubric (V1)

| Check | Type | Severity if Failing |
|-------|------|-------------------|
| Images missing alt text | Deterministic | MEDIUM |
| Decorative images with non-empty alt | Deterministic | LOW |
| Form inputs without labels | Deterministic | HIGH |
| Missing skip-to-content link | Deterministic | MEDIUM |
| Missing ARIA landmarks (<main>, <nav>, <header>) | Deterministic | MEDIUM |
| Heading hierarchy violations | Deterministic | LOW |
| Color contrast below 4.5:1 for text | Deterministic | HIGH |
| Color contrast below 3:1 for large text | Deterministic | MEDIUM |
| Keyboard navigation blocked | LLM (assessment) | HIGH |
| Focus management issues | LLM (assessment) | MEDIUM |
| Screen reader flow quality | LLM (Sonnet) | MEDIUM |

---

## 7. Security Surface Rubric (V1)

**Requires ownership verification.** Unverified URLs receive no security findings.

| Check | Type | Severity if Failing |
|-------|------|-------------------|
| No HTTPS (HTTP only) | Deterministic | CRITICAL |
| Missing Content-Security-Policy | Deterministic | MEDIUM |
| Missing Strict-Transport-Security | Deterministic | MEDIUM |
| Missing X-Content-Type-Options | Deterministic | LOW |
| Missing X-Frame-Options | Deterministic | LOW |
| Missing Referrer-Policy | Deterministic | LOW |
| Cookies without HttpOnly | Deterministic | MEDIUM |
| Cookies without Secure flag | Deterministic | MEDIUM |
| Cookies without SameSite | Deterministic | LOW |
| Mixed content (HTTP resources on HTTPS page) | Deterministic | HIGH |
| Exposed secrets in HTML/JS (API keys, tokens) | Pattern match + Haiku | CRITICAL |
| Tracking before consent | Deterministic | MEDIUM |

---

## 8. Performance Rubric (V1)

Fully deterministic. No LLM cost.

| Check | Type | Threshold | Severity if Failing |
|-------|------|-----------|-------------------|
| Page load time | Deterministic | > 5s = MEDIUM, > 10s = HIGH | MEDIUM-HIGH |
| TTFB | Deterministic | > 800ms = MEDIUM, > 2000ms = HIGH | MEDIUM-HIGH |
| Page weight | Deterministic | > 3MB = MEDIUM, > 10MB = HIGH | MEDIUM-HIGH |
| Render-blocking resources | Deterministic | > 3 = MEDIUM, > 8 = HIGH | MEDIUM-HIGH |
| Unoptimized images (> 500KB) | Deterministic | Per image | LOW |
| No compression (gzip/brotli) | Deterministic | — | MEDIUM |
| LCP > 2.5s | Deterministic | — | MEDIUM |
| CLS > 0.1 | Deterministic | — | MEDIUM |

---

## 9. Copy & UX Rubric (V1)

| Check | Type | Severity if Failing |
|-------|------|-------------------|
| Missing or unclear value proposition on homepage | LLM (Sonnet) | HIGH |
| Dead-end pages (no CTA, no navigation) | Deterministic + LLM | MEDIUM |
| Error states with no helpful message | LLM (Sonnet) | MEDIUM |
| Navigation inconsistency across pages | LLM (Sonnet) | MEDIUM |
| Trust signals absent (no social proof, no credentials) | LLM (Sonnet) | LOW |
| CTA clarity (can user understand what happens when they click?) | LLM (Sonnet) | MEDIUM |
| Mobile UX issues (tap targets, text sizing) | Deterministic + LLM | MEDIUM |

---

## 10. What We Do NOT Score (V1)

These are explicitly out of scope for methodology v0.1:

| Not Scored | Why |
|-----------|-----|
| AEO (Answer Engine Optimization) | Rubric not validated by SEO professionals (Assumption 5) |
| GEO (Generative Engine Optimization) | Same as above |
| MEO (Meaning Engine Optimization) | Same as above |
| Visual design quality | Subjective; would require human judgment at scale |
| Brand voice consistency | Subjective |
| Business model viability | Out of scope |
| Legal compliance (GDPR, CCPA) | Requires legal expertise; liability risk |
| Email deliverability | Requires sending test emails; out of V1 scope |
| API quality (beyond agent-nativeness) | Requires API specification input; V1 is URL-first |

---

## 11. Confidence Scoring

Every finding has a confidence score (0-1):

| Confidence | Meaning | Action |
|-----------|---------|--------|
| 0.9-1.0 | High confidence — deterministic check or strong LLM consensus | Include in all formats |
| 0.7-0.89 | Moderate confidence — LLM evaluation with some ambiguity | Include in Format A/JSON, flag in Format B as "verify manually" |
| 0.5-0.69 | Low confidence — ambiguous or edge case | Include in Format A/JSON only, flagged "low confidence" |
| < 0.5 | Very low confidence — likely noise | Excluded from all formats. Logged internally for calibration. |

**CRITICAL severity findings require confidence >= 0.9.** A finding cannot be both CRITICAL and low-confidence. If the LLM is unsure, it must classify at HIGH or lower.

---

## 12. Multi-Run Averaging (DEFERRED to v0.2)

Methodology v0.1 uses **single-run evaluation**. This means:
- One audit run per URL per request
- Confidence intervals estimated (not measured)
- No cross-run consistency guarantee

**Planned for v0.2:**
- 2-of-3 averaging (StrongDM pattern): run the audit 3 times, require 2/3 agreement on each finding
- Measured confidence intervals based on actual cross-run variance
- Higher cost (~3x), higher accuracy

---

## 13. False Positive Tracking

Every false positive report feeds methodology improvement:

| Metric | Target (Alpha) | Target (Launch) |
|--------|----------------|-----------------|
| Overall FP rate | < 10% | < 5% |
| CRITICAL FP rate | < 1% | < 0.5% |
| Per-primitive FP rate | < 15% | < 10% |

**Methodology review trigger:** If any primitive's FP rate exceeds 20%, that primitive's rubric is reviewed and updated. The methodology version number increments.

---

## 14. Methodology Evolution

| Version | Date | Changes |
|---------|------|---------|
| v0.1 | 2026-03-10 | Initial pre-registration. 6 dimensions. Single-run. |
| v0.2 | (planned) | Add AEO/GEO/MEO (if validated). Add multi-run averaging. |
| v0.3 | (planned) | Refine weights based on 1,000+ audits. Add new dimensions. |

**Rules for version changes:**
1. New version required for: weight changes, new dimensions, severity reclassifications, rubric changes
2. New version NOT required for: bug fixes in deterministic checks, prompt improvements that don't change what's measured
3. All audits record which methodology version was used
4. Old methodology versions are never deleted — they're archived for reproducibility
