# Alien Eyes Security Primitive -- Adversarial Expert Panel

> Date: 2026-03-13
> Panel Type: Adversarial review of `src/primitives/security.ts`
> Methodology: 5 independent security experts review current implementation, perform their own audit of supertrained.ai, rate the primitive 1-10
> Target: supertrained.ai (Next.js on Vercel, GA4, Meta Pixel, LinkedIn Insight, Clarity, Supabase, Calendly)
> Source Code: `src/primitives/security.ts` (73 lines), `src/lib/extraction/security-extractor.ts` (84 lines)

---

## Table of Contents

1. [Panel Composition](#panel-composition)
2. [Expert 1: Dr. Amara Osei -- HTTP Security Headers](#expert-1-dr-amara-osei)
3. [Expert 2: Lena Karjalainen -- Privacy & Compliance](#expert-2-lena-karjalainen)
4. [Expert 3: Rafael Dominguez -- Application Security (OWASP)](#expert-3-rafael-dominguez)
5. [Expert 4: Mei-Ling Chen -- Supply Chain & Third-Party Risk](#expert-4-mei-ling-chen)
6. [Expert 5: Dmitri Volkov -- Infrastructure Security](#expert-5-dmitri-volkov)
7. [Consensus: The Ownership Gate Debate](#consensus-the-ownership-gate-debate)
8. [Consensus Recommendations](#consensus-recommendations)
9. [Scoring Summary](#scoring-summary)

---

## Panel Composition

| # | Expert | Domain | Background |
|---|--------|--------|------------|
| 1 | Dr. Amara Osei | HTTP Security Headers | OWASP Foundation contributor, created SecurityHeaders.com scoring methodology, 15 years in browser security at Mozilla and Google. Published research on CSP bypass patterns. |
| 2 | Lena Karjalainen | Privacy & Compliance (GDPR/CCPA) | Former Finnish Data Protection Authority technical investigator. Now principal privacy engineer at a consent management platform. Led enforcement cases involving pre-consent tracking. |
| 3 | Rafael Dominguez | Application Security (OWASP) | OWASP Top 10 contributor, former HackerOne bug bounty leader (top 100 globally). 12 years pentesting SaaS products. Specializes in Next.js and Vercel attack surfaces. |
| 4 | Mei-Ling Chen | Supply Chain & Third-Party Risk | Author of "The SRI Manifesto," led supply chain security at Datadog. Wrote the W3C subresource integrity specification addendum. Expert on JavaScript dependency attacks. |
| 5 | Dmitri Volkov | Infrastructure Security | Former Cloudflare security engineer, TLS/DNS specialist. Maintains SSL Labs grading methodology. Built DNS security monitoring at a major CDN. |

---

## Expert 1: Dr. Amara Osei

### Role: HTTP Security Headers

### Reaction to Current Implementation

**What is correct:**
- Checking CSP existence is the right starting point. Missing CSP is the single most impactful header gap.
- Checking HSTS existence is correct. Without it, the first request to a domain is vulnerable to interception.
- Cookie attribute checking is well-structured. The filter for `!secure || !httpOnly || sameSite === null` catches the three most common cookie misconfigurations.
- The confidence values (0.98 CSP, 0.95 HSTS, 0.93 cookies) are reasonable for deterministic checks.

**What is naive:**
- **CSP existence is not CSP quality.** The primitive checks `!summary.securityHeaders.csp` -- a simple boolean. But a CSP of `default-src *` or `script-src 'unsafe-inline' 'unsafe-eval'` is arguably *worse* than no CSP, because it creates a false sense of security. The extractor already captures the full CSP string -- it is right there in `csp: string | null` -- but the primitive throws away all the information and checks only for null.
- **HSTS existence without quality.** An HSTS header with `max-age=0` actively *disables* HSTS. `max-age=300` (5 minutes) is functionally useless. The industry standard minimum is `max-age=31536000` (1 year), with `includeSubDomains` and `preload` as graduated improvements. Again, the extractor captures the full string. The primitive ignores it.
- **Four collected-but-unchecked headers.** The extractor already collects `xFrameOptions`, `xContentTypeOptions`, `referrerPolicy`, and `permissionsPolicy`. The primitive checks zero of them. These are already in `PageSummary.securityHeaders`. This is not a data collection problem -- it is a "nobody wrote the if-statements" problem. This is the lowest-hanging fruit in the entire codebase.
- **Severity is wrong for CSP.** The primitive marks missing CSP as `high`. The methodology doc (Section 7) marks it as `medium`. These disagree. The methodology is the pre-registered source of truth. The code is wrong.
- **Severity is wrong for HSTS.** The primitive marks missing HSTS as `medium`. The methodology agrees. But the methodology ALSO lists "No HTTPS (HTTP only)" as CRITICAL -- and the primitive never checks for it. A site served over plain HTTP is a catastrophic failure that the primitive completely misses.

**My audit of supertrained.ai:**

Actual headers observed on 2026-03-13:

```
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://assets.calendly.com https://www.clarity.ms https://snap.licdn.com https://connect.facebook.net https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://assets.calendly.com https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://calendly.com https://*.clarity.ms https://px.ads.linkedin.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com; frame-src https://calendly.com https://www.youtube.com; worker-src 'self' blob:
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
permissions-policy: camera=(), microphone=(), geolocation=()
referrer-policy: strict-origin-when-cross-origin
```

| Finding | Severity | Details |
|---------|----------|---------|
| CSP allows `'unsafe-inline'` and `'unsafe-eval'` in script-src | HIGH | These two directives essentially gut CSP's XSS protection. `'unsafe-inline'` allows injected `<script>` tags to execute. `'unsafe-eval'` allows `eval()`, `Function()`, `setTimeout(string)`. Together they reduce CSP to a resource-loading allowlist, not an XSS defense. The fix is to use nonces (`'nonce-{random}'`) instead of `'unsafe-inline'` and eliminate `'unsafe-eval'`. |
| CSP allows `img-src https: http:` | MEDIUM | The `http:` in img-src permits mixed content images. An attacker on the network path could inject tracking pixels or replace images with misleading content over HTTP. Should be `img-src 'self' data: blob: https:` (remove `http:`). |
| CSP uses wildcard subdomains (`https://*.supabase.co`, `https://*.google-analytics.com`, etc.) | LOW | Wildcard subdomains in connect-src expand the attack surface. Any subdomain of `google-analytics.com` or `supabase.co` becomes a valid exfiltration target. Prefer specific subdomains where possible. |
| No `report-uri` or `report-to` in CSP | LOW | Without reporting, CSP violations go undetected. You never learn about blocked attacks or misconfigured rules. Add `report-to` pointing to a Report URI or similar service. |
| HSTS is excellent | PASS | `max-age=63072000` (2 years) with `includeSubDomains` and `preload` is textbook. Ready for HSTS preload list submission. No finding. |
| X-Frame-Options: DENY | PASS | Correct. Prevents clickjacking. (Redundant with CSP `frame-ancestors` if that were present, but defense-in-depth is appropriate.) |
| Missing `frame-ancestors` in CSP | LOW | CSP does not include `frame-ancestors 'none'` to complement X-Frame-Options. While X-Frame-Options works, `frame-ancestors` in CSP is the modern standard and supports more granular control. |

**The Alien Eyes primitive would report:** CSP is present, HSTS is present. **Zero findings.** The actual security posture has at least 2 meaningful issues (unsafe-inline/eval in script-src, http: in img-src). The primitive would produce a perfect score for a CSP that has the two most commonly exploited weaknesses.

### Top 5 Checks to Add

| # | Check | Data Source | Implementation | Severity |
|---|-------|-------------|----------------|----------|
| 1 | **CSP quality analysis** | `securityHeaders.csp` (already collected) | Parse CSP string. Flag `'unsafe-inline'` in script-src (HIGH), `'unsafe-eval'` in script-src (HIGH), `default-src *` (CRITICAL), `http:` in any src directive (MEDIUM), wildcard domains (LOW). No new extraction needed. | HIGH-CRITICAL |
| 2 | **HSTS quality analysis** | `securityHeaders.hsts` (already collected) | Parse HSTS string. Flag `max-age < 31536000` (MEDIUM), missing `includeSubDomains` (LOW), missing `preload` (LOW), `max-age=0` which disables HSTS (HIGH). No new extraction needed. | MEDIUM-HIGH |
| 3 | **X-Content-Type-Options check** | `securityHeaders.xContentTypeOptions` (already collected) | Check for `nosniff` value. Missing = browsers may MIME-sniff responses, enabling content-type attacks. No new extraction needed. | LOW |
| 4 | **Referrer-Policy check** | `securityHeaders.referrerPolicy` (already collected) | Flag if missing (MEDIUM), or if set to `unsafe-url` or `no-referrer-when-downgrade` which leak full URLs (LOW). Recommend `strict-origin-when-cross-origin` or `no-referrer`. No new extraction needed. | LOW-MEDIUM |
| 5 | **Permissions-Policy check** | `securityHeaders.permissionsPolicy` (already collected) | Flag if missing (LOW). Parse value to identify which features are unrestricted. Camera, microphone, geolocation should be denied unless explicitly needed. No new extraction needed. | LOW |

### Tools/Frameworks We Should Reference

- **SecurityHeaders.com** -- the de facto standard for header grading. Their scoring methodology is public. Alien Eyes should produce comparable findings for header quality.
- **Mozilla Observatory** -- free API (`https://observatory.mozilla.org/api/v2/analyze?host=example.com`). Covers CSP, CORS, cookies, HSTS, redirections, SRI, X-Content-Type-Options, X-Frame-Options. Could be used as a validation baseline.
- **CSP Evaluator (Google)** -- open-source CSP parser that identifies bypasses. Published research on CSP bypass patterns. Their taxonomy of CSP weaknesses should inform our quality analysis.

### Rating: 3/10

The primitive checks 2 of 12 items from its own methodology rubric. It ignores 4 headers it already collects. It does not analyze the quality of the 2 headers it does check. The methodology lists "No HTTPS" as CRITICAL -- the primitive never checks it. The CSP check would give a perfect score to a site using `unsafe-inline` and `unsafe-eval`. This is a skeleton, not a security primitive.

---

## Expert 2: Lena Karjalainen

### Role: Privacy & Compliance (GDPR/ePrivacy/CCPA)

### Reaction to Current Implementation

**What is correct:**
- Pre-consent tracking detection is the single most important privacy check. The primitive includes it. This is the check that generates the most enforcement actions in the EU right now. Good instinct.
- The implementation correctly identifies Google Analytics and Google Syndication as tracking domains. These are the two highest-enforcement-risk third-party services.

**What is naive:**
- **The pre-consent check is too narrow.** The extractor (`security-extractor.ts`, line 36) pattern-matches only `google-analytics.com` and `googlesyndication.com`. But the site loads: Meta Pixel (`connect.facebook.net`), LinkedIn Insight Tag (`snap.licdn.com`, `px.ads.linkedin.com`), Microsoft Clarity (`www.clarity.ms`), and Google Ads conversion tracking. ALL of these are tracking services under GDPR/ePrivacy. ALL require consent before firing. The regex misses 4 out of 6 tracking services on this one site.
- **No distinction between consent-requiring and non-consent-requiring requests.** Under ePrivacy Directive Article 5(3) and GDPR Article 6, the distinction is not "is it third-party?" but "does it store/access information on the user's device for a non-essential purpose?" First-party analytics without cookies (e.g., Plausible, Fathom) may not require consent. Google Analytics with cookies always does. The check should classify by behavior, not just domain.
- **Cookie check does not distinguish session-essential from tracking.** The primitive flags ALL cookies missing Secure/HttpOnly/SameSite equally. But a session cookie missing HttpOnly is a security issue (session hijack risk). A tracking cookie missing SameSite is a privacy issue (cross-site tracking). A strictly-necessary cookie missing SameSite=Lax is a configuration issue. The `CookieInfo` type already has `isTracking: boolean` -- the primitive ignores it.
- **No check for cookie consent mechanism existence.** A site with no consent banner at all is a more fundamental compliance failure than a site with pre-consent tracking (which at least *has* a consent mechanism that fires too late). The primitive should check whether a consent management mechanism exists.
- **No check for cookie banner dark patterns.** Regulators now enforce against: pre-checked consent boxes, "Accept All" without equally-prominent "Reject All", color manipulation to push toward acceptance, and consent walls. These are high-enforcement-risk findings.

**My audit of supertrained.ai:**

| Finding | Severity | Details |
|---------|----------|---------|
| Pre-consent tracking: Meta Pixel | MEDIUM | `connect.facebook.net` loads before consent. Meta Pixel sets `_fbp` cookie and sends user data to Meta's servers. Requires explicit consent under GDPR Article 6(1)(a). This is the exact scenario that led to the Austrian Schrems II enforcement actions. |
| Pre-consent tracking: LinkedIn Insight | MEDIUM | `snap.licdn.com` and `px.ads.linkedin.com` load scripts before consent. LinkedIn Insight Tag tracks page views and enables retargeting. |
| Pre-consent tracking: Microsoft Clarity | MEDIUM | `www.clarity.ms` loads before consent. Clarity records session replays and heatmaps -- highly invasive. The CNIL fined organizations for similar session recording without consent. |
| DMARC at pct=5 | LOW | The DMARC record is `p=quarantine; pct=5` -- only 5% of failing messages are quarantined. This is appropriate during rollout but should be increased to `pct=100` once monitoring confirms legitimate mail is not affected. At 5%, 95% of spoofed emails pass through. |
| SPF uses `~all` (softfail) instead of `-all` (hardfail) | LOW | `v=spf1 include:_spf.google.com ~all` means unauthorized senders are marked but not rejected. Combined with DMARC at pct=5, email spoofing has a 95%+ success rate. |
| Cookie consent implementation exists but uses custom code | LOW | The site uses a custom localStorage-based consent mechanism (`st-cookie-consent`) rather than a certified CMP. Custom implementations are harder to maintain, audit, and defend to regulators. Google Consent Mode v2 integration is present, which is good. |

**The Alien Eyes primitive would report:** Pre-consent tracking detected (one generic finding). It would miss the 3 specific tracking services beyond Google Analytics, miss the email security issues, and miss the DMARC/SPF weakness. The finding it DOES produce would be accurate but underspecified -- it would not tell the builder which services to defer.

### Top 5 Checks to Add

| # | Check | Data Source | Implementation | Severity |
|---|-------|-------------|----------------|----------|
| 1 | **Expanded pre-consent tracker list** | `networkSummary.thirdPartyDomains` (already collected) | Maintain a list of known tracking domains: `*.facebook.net`, `*.fbcdn.net`, `*.doubleclick.net`, `*.linkedin.com`, `snap.licdn.com`, `*.clarity.ms`, `*.hotjar.com`, `*.analytics.google.com`, `*.googleadservices.com`, `*.google-analytics.com`, `*.googlesyndication.com`, `*.tiktok.com`, `*.pinterest.com`. Flag each individually in the finding so the builder knows what to defer. | MEDIUM |
| 2 | **Tracking vs. essential cookie classification** | `securityHeaders.cookies` (already collected, has `isTracking`) | Use the existing `isTracking` boolean on `CookieInfo`. Separate findings: tracking cookies missing consent gating (MEDIUM/privacy) vs. session cookies missing HttpOnly (HIGH/security). The primitive currently treats all cookies identically. | MEDIUM-HIGH |
| 3 | **Consent mechanism existence check** | New extraction: detect consent banner/CMP | Check for known CMP scripts (OneTrust, Cookiebot, Osano, Complianz, custom). Check for `cookieconsent`, `consent-banner`, Consent Mode calls. Missing = site has no consent mechanism at all. | HIGH |
| 4 | **Individual tracker enumeration in findings** | `networkSummary.thirdPartyDomains` (already collected) | Instead of one generic "pre-consent tracking" finding, produce one finding PER tracking service detected. This makes the finding actionable -- builder knows exactly which script tag to wrap in consent logic. | N/A (quality) |
| 5 | **Cookie scope analysis** | New extraction: parse cookie Domain attribute | Check if cookies are set with overly broad domain scope (e.g., `.supertrained.ai` includes all subdomains). Flag cookies whose domain is broader than necessary. | LOW |

### Tools/Frameworks We Should Reference

- **Cookiebot scanner** -- free crawl that produces a full cookie audit with consent classification per cookie. Industry standard for compliance audits.
- **2GDPR** -- automated GDPR compliance scanner that checks consent mechanisms, data processing disclosures, cookie behavior.
- **Blacklight (The Markup)** -- open-source tracker detection tool. Identifies trackers, fingerprinting, session recording, keylogging, canvas fingerprinting. The tracker domain list is public and maintained.

### Rating: 3/10

The pre-consent check is the right instinct but the regex catches 2 of 6+ common tracking services. The cookie check ignores the tracking/essential distinction that is already in the type system. The primitive produces one generic finding where a competent privacy audit would produce 4-6 specific, individually actionable findings. The ownership gate means unverified users see none of this, but pre-consent tracking is not a weaponizable finding -- it is publicly observable information that every privacy scanner on earth already reports.

---

## Expert 3: Rafael Dominguez

### Role: Application Security (OWASP)

### Reaction to Current Implementation

**What is correct:**
- The ownership gate is a reasonable *starting point* for the weaponization problem. I understand the fear: an attacker runs Alien Eyes against a target, gets a list of security weaknesses, then exploits them. However, the gate is implemented as a binary kill switch -- all or nothing. This is too crude.
- The SSRF defense in `url-validator.ts` is solid. Double DNS resolution with rebinding detection is above average. The blocked IP ranges cover RFC1918, link-local, loopback, and cloud metadata (169.254.169.254). This is better than most commercial scanners.
- The `InputSanitizer` integration in `BasePrimitive` shows defense-in-depth thinking.

**What is naive:**
- **The `usesLLM: true` property is a lie.** The security primitive declares `usesLLM = true` but contains zero LLM calls. Every check is deterministic. This misrepresents the primitive's cost profile and behavior to the orchestrator.
- **No mixed content detection.** OWASP classifies mixed content as A05:2021 (Security Misconfiguration). A site served over HTTPS that loads scripts, stylesheets, or images over HTTP creates a downgrade attack vector. The extractor already has `networkRequests` with full URLs -- checking for `http://` resources on an `https://` page is trivial. The methodology lists this as HIGH severity. The primitive does not check it.
- **No exposed secrets detection.** The methodology lists "Exposed secrets in HTML/JS (API keys, tokens)" as CRITICAL severity. The primitive does not check it. The `CrawledPage` type includes raw `html` and `consoleLogs` which could contain leaked keys. Pattern matching for common API key formats (AWS: `AKIA[0-9A-Z]{16}`, Stripe: `sk_live_`, Supabase: `eyJ...`, GitHub: `ghp_`) is deterministic and high-value.
- **No open redirect detection.** Links containing `?redirect=`, `?next=`, `?url=` with user-controllable values are OWASP A01:2021 (Broken Access Control) findings. The `links` array in `PageSummary` contains all discovered links -- checking for redirect patterns is deterministic.
- **CORS wildcard not checked.** The actual supertrained.ai headers include `access-control-allow-origin: *`. On a public content site this is acceptable. On a site with authenticated API endpoints (this site has Supabase backend), a wildcard CORS header can enable credential theft from any origin. The primitive should flag `access-control-allow-origin: *` when the site has authenticated endpoints.
- **The cookie check has a false positive pattern.** The primitive flags ALL cookies missing HttpOnly. But some cookies (like theme preference, locale, consent state) are legitimately read by client-side JavaScript and SHOULD NOT have HttpOnly. The check should flag missing HttpOnly only on cookies that appear to be session/auth cookies (by name pattern: `sb-*`, `session`, `auth`, `token`, `sid`).

**My audit of supertrained.ai:**

| Finding | Severity | Details |
|---------|----------|---------|
| CSP permits `'unsafe-inline'` + `'unsafe-eval'` in script-src | HIGH | This is the #1 CSP bypass. Any XSS vector can execute arbitrary JavaScript. The CSP provides no protection against the attack it was designed to prevent. |
| `access-control-allow-origin: *` on all responses | MEDIUM | Wildcard CORS on a site with Supabase backend (authenticated API at `/api/*`). If any API endpoint returns sensitive data and checks cookies for auth, any website can read that response. The 404 page, the homepage, AND the API routes all return `access-control-allow-origin: *`. Verify whether API routes with authentication also return this header. |
| Vercel deployment hash exposed in URLs | LOW | All static assets include `?dpl=dpl_8xbBH4ViJrb2rNuJJPV9Se1TFG7G` -- a Vercel deployment identifier. This leaks deployment timing and enables enumeration of previous deployments. Not a vulnerability per se, but unnecessary information disclosure. |
| No `security.txt` | LOW | Neither `/security.txt` nor `/.well-known/security.txt` exists. RFC 9116 defines this as the standard way for security researchers to report vulnerabilities. Without it, researchers may not report findings or may disclose publicly. |
| Server header discloses platform | LOW | `server: Vercel` confirms the hosting platform. Combined with Next.js version detection (from `/_next/` paths and chunk patterns), an attacker can narrow their exploit search. |
| robots.txt discloses API structure | LOW | `Disallow: /api/` confirms API endpoints exist at that path, which is useful reconnaissance for attackers. However, this is standard practice and the security benefit of hiding it is minimal. |

**The Alien Eyes primitive would report:** Zero findings (ownership gate blocks all output for unverified users). Even with ownership verified: CSP present (no deeper check), HSTS present (no deeper check). The CORS wildcard, unsafe CSP directives, missing security.txt, and server information disclosure would all be missed.

### Top 5 Checks to Add

| # | Check | Data Source | Implementation | Severity |
|---|-------|-------------|----------------|----------|
| 1 | **Mixed content detection** | `CrawledPage.networkRequests` (already collected) | For each page served over HTTPS, check if any network requests use HTTP. Exclude `localhost` and `127.0.0.1` (development). Script/stylesheet mixed content = HIGH. Image/font mixed content = MEDIUM. | HIGH |
| 2 | **Exposed secrets in HTML** | `CrawledPage.html` (already collected) | Regex scan for common API key patterns: `AKIA[0-9A-Z]{16}` (AWS), `sk_live_[a-zA-Z0-9]+` (Stripe), `ghp_[a-zA-Z0-9]{36}` (GitHub), `xoxb-` (Slack), `sk-[a-zA-Z0-9]{32,}` (OpenAI). Exclude public IDs (GA IDs, public Supabase anon keys are intentionally public). | CRITICAL |
| 3 | **CORS configuration analysis** | New extraction: capture `access-control-allow-origin` header | Flag `access-control-allow-origin: *` when the site has authenticated endpoints (detected by presence of auth cookies, Supabase integration, or `/api/` routes). Flag `access-control-allow-credentials: true` with wildcard origin as CRITICAL. | MEDIUM-HIGH |
| 4 | **security.txt presence** | New extraction: HTTP request to `/.well-known/security.txt` | Simple existence check. Missing = LOW severity finding with recommendation to add contact information for vulnerability reporting. | LOW |
| 5 | **Console error leak detection** | `CrawledPage.consoleLogs` (already collected) | Scan console errors for leaked credentials, stack traces with internal paths, database connection strings, or internal IP addresses. These commonly appear during error states. | MEDIUM-HIGH |

### Tools/Frameworks We Should Reference

- **OWASP ZAP** -- the most widely-used free web app security scanner. Its passive scan rules cover everything we check plus 40+ additional checks. The rule set is public and can inform our check list.
- **Retire.js** -- JavaScript library vulnerability database. Checks loaded JS against CVE database. Identifies known-vulnerable versions of jQuery, Angular, React, etc.
- **Nuclei** (by ProjectDiscovery) -- template-based vulnerability scanner. Thousands of community templates for common misconfigurations. The template format provides good inspiration for structured check definitions.

### Rating: 2/10

The primitive has 4 checks. Its own methodology rubric defines 12. That is 33% coverage of its own spec. It misses 3 items the methodology classifies as HIGH or CRITICAL (no-HTTPS, mixed content, exposed secrets). The `usesLLM: true` declaration is factually incorrect. The cookie check has a false positive pattern that will fire on legitimate non-session cookies. For an "alien perspective" security auditor, this sees almost nothing.

---

## Expert 4: Mei-Ling Chen

### Role: Supply Chain & Third-Party Risk

### Reaction to Current Implementation

**What is correct:**
- The `thirdPartyDomains` extraction in `NetworkSummary` is a good foundation. Knowing which external services a site depends on is step one of supply chain analysis.
- The cookie `isTracking` classification attempts to distinguish functional from tracking cookies by name pattern. This is directionally correct.

**What is naive:**
- **No Subresource Integrity (SRI) checking.** This is THE supply chain security mechanism for the web. When a site loads a script from a CDN (`googletagmanager.com`, `connect.facebook.net`, etc.), the CDN can serve a modified script -- either through compromise, insider threat, or legal compulsion. SRI pins the expected hash of the script, so any modification causes the browser to refuse loading. The supertrained.ai site loads scripts from 6+ third-party domains with zero SRI hashes. This is not checked.
- **No third-party script inventory.** The primitive knows third-party domains exist but does not enumerate them as findings. A site loading 15 third-party scripts has a fundamentally different risk profile than one loading 2. Each additional third-party script is an additional supply chain dependency, an additional data sharing relationship, and an additional potential failure point. The `thirdPartyDomains` list should be surfaced as informational context.
- **No known-vulnerable library detection.** JavaScript libraries with known CVEs are the web equivalent of running unpatched software. Retire.js maintains a database of vulnerable client-side libraries. The `CrawledPage.networkRequests` already captures all loaded scripts -- checking their names/paths against a vulnerability database is high-value.
- **No source map exposure check.** Source maps (`.js.map` files) expose the full original source code of a web application, including variable names, comments, internal paths, and potentially hardcoded secrets. They should never be accessible in production. A HEAD request to `{script_url}.map` for each loaded script would detect this.
- **No `.env` / sensitive file exposure check.** Common misconfiguration: deploying with `.env`, `.git/HEAD`, `wp-config.php`, `config.json`, etc. accessible. The supertrained.ai check returned 404 for `.env` (correct), but the primitive does not check this at all.

**My audit of supertrained.ai:**

| Finding | Severity | Details |
|---------|----------|---------|
| Zero SRI on third-party scripts | MEDIUM | Scripts loaded from `googletagmanager.com`, `connect.facebook.net`, `snap.licdn.com`, `www.clarity.ms`, `assets.calendly.com` have no `integrity` attributes. A compromise of any of these CDNs (or a successful DNS hijack) would allow arbitrary code execution in the context of the site. The 2024 Polyfill.io supply chain attack affected 100,000+ sites for exactly this reason. |
| 6 third-party script dependencies | LOW (informational) | The site loads executable JavaScript from 6 external domains. Each is a trust relationship with that vendor's security posture. This is within normal range for a marketing site but should be documented. |
| No source maps detected | PASS | None of the `/_next/static/chunks/*.js` files had accessible `.map` files. Next.js production builds correctly omit them. |
| `.env` not exposed | PASS | `/.env` returns 404. |
| External resource loading from non-HTTPS origin | MEDIUM | The CSP allows `img-src http:`, meaning images can be loaded over unencrypted HTTP. While no actual HTTP image loads were observed, the policy permits them. |

**The Alien Eyes primitive would report:** Zero findings (no SRI check, no third-party inventory, no vulnerable library detection, no source map check, no sensitive file check). Even the CORS wildcard and CSP quality issues would be missed.

### Top 5 Checks to Add

| # | Check | Data Source | Implementation | Severity |
|---|-------|-------------|----------------|----------|
| 1 | **SRI presence on third-party scripts** | New extraction: check `integrity` attribute on `<script>` and `<link>` tags with cross-origin `src`/`href` | For each `<script src="https://...">` where the origin differs from the page origin, check for `integrity` attribute. Missing = MEDIUM. Missing on known high-value targets (tag managers, analytics) = HIGH since these execute arbitrary code. | MEDIUM-HIGH |
| 2 | **Third-party dependency count and enumeration** | `networkSummary.thirdPartyDomains` (already collected) | Surface the list as informational context. Flag if count exceeds thresholds: >10 = LOW advisory, >20 = MEDIUM. Classify each as: analytics, advertising, CDN, functionality, unknown. | LOW-MEDIUM |
| 3 | **Known-vulnerable library detection** | `CrawledPage.networkRequests` (URLs of loaded scripts) | Match loaded script URLs and extracted version strings against Retire.js database (available as JSON). jQuery, Angular, React, Lodash, Moment.js are the most common offenders. | HIGH |
| 4 | **Source map exposure** | New extraction: HEAD request for `{script_url}.map` | For each JavaScript file loaded, check if a corresponding `.map` file is accessible (returns 200). Accessible source maps in production = MEDIUM (information disclosure). | MEDIUM |
| 5 | **Sensitive file exposure** | New extraction: HEAD requests for common sensitive paths | Check `/.env`, `/.git/HEAD`, `/.git/config`, `/wp-config.php`, `/config.json`, `/package.json`, `/.DS_Store`, `/backup.sql`, `/debug.log`. Any 200 response = HIGH-CRITICAL depending on file. | HIGH-CRITICAL |

### Tools/Frameworks We Should Reference

- **Retire.js** -- the standard for client-side JavaScript vulnerability detection. Database is maintained by the security community, available as JSON, and used by OWASP ZAP, Burp Suite, and most commercial scanners.
- **Snyk** -- broader dependency vulnerability database covering both client-side and server-side. Commercial API but the vulnerability data is high quality.
- **SRI Hash Generator** (srihash.org) -- reference implementation. Useful for generating expected hashes in remediation guidance.
- **Wappalyzer** -- technology detection library that identifies frameworks, CMS, CDNs, analytics tools. The `CrawlResult.detectedStack` field should use this.

### Rating: 2/10

Supply chain security is completely absent. No SRI check. No vulnerable library detection. No sensitive file exposure scan. No source map check. The primitive has the data it needs for a basic third-party inventory (`thirdPartyDomains`) but does nothing with it. Given that the Polyfill.io attack in 2024 was the most impactful web security incident of the year and affected sites with exactly this profile (marketing sites loading many third-party scripts), the absence of SRI checking is a significant gap.

---

## Expert 5: Dmitri Volkov

### Role: Infrastructure Security (TLS/DNS)

### Reaction to Current Implementation

**What is correct:**
- The URL Validator's SSRF defense is genuinely well-implemented. Double DNS resolution with rebinding detection is not standard -- most tools do single resolution and are vulnerable to DNS rebinding attacks. The blocked IP ranges are comprehensive (RFC1918, link-local, loopback, cloud metadata).
- Checking HSTS is correct as a baseline infrastructure security signal.

**What is naive:**
- **No TLS quality assessment.** The site's TLS certificate, cipher suites, protocol versions, and certificate chain are the foundation of transport security. HSTS forces HTTPS, but if the underlying TLS configuration supports SSLv3 or weak ciphers, HSTS is protecting nothing. The extractor operates at the HTTP layer (response headers) and has no visibility into the TLS handshake. This is a data collection gap, not just a missing check.
- **No certificate analysis.** The supertrained.ai certificate is Let's Encrypt R13, valid until May 26, 2026. This is fine. But the primitive cannot detect: expiring certificates (< 30 days), self-signed certificates, certificates for wrong hostnames, revoked certificates, or certificates from untrusted CAs. Certificate problems cause browser security warnings that destroy user trust.
- **No DNS security assessment.** DNSSEC protects against DNS spoofing. CAA records restrict which CAs can issue certificates for the domain. Neither is checked. The supertrained.ai domain has no CAA records at all, meaning any CA on earth can issue a certificate for it.
- **No HTTP-to-HTTPS redirect check.** The primitive does not verify that `http://supertrained.ai` redirects to `https://supertrained.ai`. Without this redirect, users who type the domain without `https://` will connect over plain HTTP. The methodology lists "No HTTPS" as CRITICAL but the primitive never checks it.
- **No CORS analysis.** `access-control-allow-origin: *` is present on ALL responses including API routes. This is a Vercel default that most teams never override. For static content it is harmless. For authenticated API routes it can be catastrophic. The primitive does not check CORS at all.

**My audit of supertrained.ai:**

| Finding | Severity | Details |
|---------|----------|---------|
| No CAA DNS record | MEDIUM | No CAA record restricts certificate issuance. Any CA can issue a valid TLS certificate for `supertrained.ai`. If an attacker obtains a certificate from a different CA, they can MITM the site. Add a CAA record: `0 issue "letsencrypt.org"`. |
| DMARC enforcement at 5% | MEDIUM | `p=quarantine; pct=5` means 95% of spoofed emails are delivered normally. Combined with SPF `~all` (softfail, not hardfail), email spoofing is trivially possible. This is appropriate during rollout but should be scheduled for increase to `pct=100`. |
| Certificate SAN does not include www | LOW | The TLS certificate covers `supertrained.ai` but not `www.supertrained.ai`. If someone visits the www subdomain, they will get a certificate error. (This is likely handled by DNS redirect, so low severity.) |
| TLS certificate from Let's Encrypt (90-day lifecycle) | LOW (informational) | Let's Encrypt certificates expire every 90 days. Auto-renewal via Vercel is expected, but a renewal failure would cause the site to go offline. No action needed if Vercel manages renewal. |
| HSTS configuration is excellent | PASS | `max-age=63072000; includeSubDomains; preload` -- 2-year max-age with subdomain coverage and preload eligibility. This is the gold standard. |
| SPF record present | PASS | `v=spf1 include:_spf.google.com ~all` -- correctly includes Google Workspace. The `~all` softfail is appropriate during DMARC rollout. |
| DKIM record present | PASS | Google DKIM key is properly configured. |

**The Alien Eyes primitive would report:** Zero findings (either from ownership gate or from missing checks). The HSTS check would pass (correctly). The CAA gap, DMARC weakness, and certificate coverage gap would all be missed.

### Top 5 Checks to Add

| # | Check | Data Source | Implementation | Severity |
|---|-------|-------------|----------------|----------|
| 1 | **HTTP-to-HTTPS redirect verification** | New extraction: request `http://` version of URL | Follow HTTP URL, verify 301/308 redirect to HTTPS equivalent. Missing redirect = HIGH. Redirect to different domain = MEDIUM. The methodology lists "No HTTPS" as CRITICAL. | HIGH-CRITICAL |
| 2 | **Certificate expiration check** | New extraction: TLS handshake data | Connect to port 443, extract certificate notAfter date. Flag: <7 days = CRITICAL, <30 days = HIGH, <60 days = MEDIUM. Self-signed = HIGH. Wrong hostname = HIGH. This requires `tls.connect()` or equivalent -- not available from Playwright's HTTP layer. | CRITICAL-HIGH |
| 3 | **CORS configuration analysis** | New extraction: capture ACAO header, test with Origin header | Check `access-control-allow-origin` on main page AND API endpoints. Flag `*` with authenticated endpoints (MEDIUM). Flag `access-control-allow-credentials: true` with wildcard or reflective origin (CRITICAL). | MEDIUM-CRITICAL |
| 4 | **TLS protocol version check** | New extraction: TLS handshake data | Verify TLS 1.2+ only. Flag TLS 1.0/1.1 support (MEDIUM). Flag SSLv3 (CRITICAL). Most Vercel/Cloudflare sites will pass, but self-hosted or legacy hosting often fails. Requires external API or Node.js `tls` module. | MEDIUM-CRITICAL |
| 5 | **DNS security basics** | New extraction: DNS queries | Check for CAA record (missing = LOW). Check for DNSSEC (missing = LOW informational). These are aspirational and require DNS query capabilities that Playwright does not provide. | LOW |

### Tools/Frameworks We Should Reference

- **SSL Labs** (ssllabs.com/ssltest) -- the gold standard for TLS assessment. Free API (`https://api.ssllabs.com/api/v3/analyze?host=example.com`). Covers cipher suites, protocol versions, certificate chain, known vulnerabilities (BEAST, POODLE, Heartbleed).
- **Hardenize** -- comprehensive security assessment covering headers, TLS, DNS, email security (SPF/DKIM/DMARC) in a single scan.
- **crt.sh** -- Certificate Transparency log search. Can detect unauthorized certificates issued for a domain.

### Rating: 3/10

The primitive checks transport security at the HTTP header layer only. It has no visibility into TLS quality, certificate health, or DNS security. The HSTS check is correct but shallow (existence, not quality). The missing HTTP-to-HTTPS redirect check is notable because the methodology explicitly lists "No HTTPS" as CRITICAL severity -- this is a spec compliance failure. Infrastructure security requires data the current extractor cannot provide (TLS handshake data, DNS queries), so improvement here requires new extraction capabilities, not just new if-statements.

---

## Consensus: The Ownership Gate Debate

All five panelists addressed the ownership gate. The consensus is nuanced:

### The Gate is Correct For:
- Exposed secrets in HTML/JS (attackers could use this as a recon tool)
- Console error leak detection (internal information disclosure)
- Detailed CORS analysis (reveals API attack surface)
- Sensitive file exposure scans (probing for `.env`, `.git`, etc.)
- Detailed cookie analysis with names and values

### The Gate is Wrong For:
- **Missing/weak security headers** (CSP, HSTS, X-Frame-Options, etc.) -- These are publicly observable. Every browser developer tools panel shows them. SecurityHeaders.com, Mozilla Observatory, and dozens of free tools report them without any ownership verification. Gating these behind ownership verification means Alien Eyes produces LESS information than a free curl command. This is not preventing weaponization -- it is preventing utility.
- **Pre-consent tracking** -- Whether a site fires Google Analytics before consent is publicly observable by every visitor. Privacy regulators discover this without needing ownership verification. Blocking this finding makes Alien Eyes less useful than loading the site in Chrome DevTools.
- **SRI absence** -- Whether a site uses Subresource Integrity is visible in the HTML source code. This is not an attack vector -- it is a defensive measure. Reporting its absence helps defenders.
- **Mixed content** -- Whether a site loads HTTP resources on an HTTPS page is visible to every browser. Chrome marks these with visible warnings. Not weaponizable.

### Proposed Three-Tier Gate:

| Tier | Ownership Required? | What It Covers | Rationale |
|------|---------------------|----------------|-----------|
| **Public** | No | Header existence/quality, HSTS quality, mixed content, SRI, pre-consent tracking, third-party inventory, security.txt | Publicly observable. Available from any browser. No attack vector. |
| **Verified** | Yes | Exposed secrets, sensitive file probes, CORS analysis with auth testing, cookie analysis with names, console leak detection | Could be weaponized for reconnaissance. Information not visible to casual observers. |
| **Deep** | Yes + paid | TLS quality (via external API), DNS security, certificate analysis, vulnerable library detection | Requires active probing or external API calls. Cost-bearing. |

This preserves the anti-weaponization intent while making Alien Eyes at least as useful as the free tools it claims to replace.

---

## Consensus Recommendations

### P0 -- Must Fix (use data already collected, no new extraction needed)

These require only adding if-statements to existing data in `PageSummary.securityHeaders`:

| # | Check | Data Source | Current State | Required Change | Severity |
|---|-------|-------------|---------------|-----------------|----------|
| P0-1 | **CSP quality: `'unsafe-inline'` in script-src** | `securityHeaders.csp` | Collected, not parsed | Parse CSP string, flag `'unsafe-inline'` in `script-src` or `default-src` | HIGH |
| P0-2 | **CSP quality: `'unsafe-eval'` in script-src** | `securityHeaders.csp` | Collected, not parsed | Parse CSP string, flag `'unsafe-eval'` in `script-src` or `default-src` | HIGH |
| P0-3 | **CSP quality: `default-src *`** | `securityHeaders.csp` | Collected, not parsed | Parse CSP string, flag `*` in `default-src` | CRITICAL |
| P0-4 | **HSTS quality: `max-age` value** | `securityHeaders.hsts` | Collected, not parsed | Parse HSTS string, flag `max-age < 31536000` (MEDIUM), `max-age=0` (HIGH) | MEDIUM-HIGH |
| P0-5 | **X-Content-Type-Options check** | `securityHeaders.xContentTypeOptions` | Collected, not checked | Check for `nosniff` value | LOW |
| P0-6 | **X-Frame-Options check** | `securityHeaders.xFrameOptions` | Collected, not checked | Check for `DENY` or `SAMEORIGIN` | LOW |
| P0-7 | **Referrer-Policy check** | `securityHeaders.referrerPolicy` | Collected, not checked | Flag if missing (MEDIUM) or if `unsafe-url`/`no-referrer-when-downgrade` (LOW) | LOW-MEDIUM |
| P0-8 | **Permissions-Policy check** | `securityHeaders.permissionsPolicy` | Collected, not checked | Flag if missing (LOW) | LOW |
| P0-9 | **Expanded pre-consent tracker list** | `networkSummary.thirdPartyDomains` | Only checks 2 domains | Add: `facebook.net`, `fbcdn.net`, `doubleclick.net`, `linkedin.com`, `licdn.com`, `clarity.ms`, `hotjar.com`, `tiktok.com`, `pinterest.com`, `googleadservices.com` | MEDIUM |
| P0-10 | **Fix `usesLLM` declaration** | `security.ts` line 9 | Says `true`, is `false` | Change to `usesLLM = false` | Bug fix |
| P0-11 | **Fix CSP severity mismatch** | `security.ts` line 28 | Says `high`, methodology says `medium` | Change to `medium` (or update methodology -- one must be canonical) | Bug fix |
| P0-12 | **Reclassify ownership gate: make header checks public** | `security.ts` line 13-15 | All-or-nothing gate | Split: header checks run without ownership, probing checks require ownership | Architecture |

**Estimated effort:** 1-2 work units. P0-1 through P0-8 are string parsing. P0-9 is expanding a regex. P0-10 and P0-11 are one-line fixes. P0-12 requires restructuring the gate logic.

### P1 -- Important (add new analysis using already-collected raw data)

These require reading from `CrawlResult` fields that are already populated but not consumed by the security primitive:

| # | Check | Data Source | Required Change | Severity |
|---|-------|-------------|-----------------|----------|
| P1-1 | **Mixed content detection** | `CrawledPage.networkRequests` | For each HTTPS page, check for HTTP resource loads | HIGH |
| P1-2 | **Exposed secrets in HTML** | `CrawledPage.html` | Regex scan for API key patterns (AWS, Stripe, GitHub, OpenAI, Slack) | CRITICAL |
| P1-3 | **CORS wildcard detection** | `CrawledPage.responseHeaders` | Check `access-control-allow-origin` header value | MEDIUM |
| P1-4 | **Console error leak detection** | `CrawledPage.consoleLogs` | Scan for credentials, internal paths, connection strings | MEDIUM |
| P1-5 | **Tracking vs. essential cookie separation** | `securityHeaders.cookies[].isTracking` | Use existing `isTracking` field to produce separate findings for tracking cookies (privacy) vs. session cookies (security) | Quality |
| P1-6 | **Third-party script enumeration** | `networkSummary.thirdPartyDomains` | Surface list as informational context in findings. Flag if count > threshold. | LOW |
| P1-7 | **HTTP-to-HTTPS redirect** | New extraction: single HTTP request | Follow `http://` URL, check for 301/308 to HTTPS. Methodology lists "No HTTPS" as CRITICAL. | CRITICAL |

**Estimated effort:** 2-3 work units. P1-1 through P1-6 read from existing `CrawlResult` fields. P1-7 requires one additional HTTP request during the crawl phase.

### P2 -- Valuable (needs new data collection in extractor)

These require adding new extraction capabilities to the crawler or extractor:

| # | Check | Data Source | Required Change | Severity |
|---|-------|-------------|-----------------|----------|
| P2-1 | **SRI presence on third-party scripts** | New: parse `<script>` tags for `integrity` attribute | Add to HTML extraction: for each cross-origin script, record whether `integrity` is present | MEDIUM |
| P2-2 | **Consent mechanism existence** | New: detect CMP scripts/elements | Add to page analysis: check for known CMP patterns (OneTrust, Cookiebot, etc.) | HIGH |
| P2-3 | **Sensitive file exposure** | New: HEAD requests to common paths | Add probe phase: `/.env`, `/.git/HEAD`, `/wp-config.php`, etc. Requires ownership verification. | HIGH-CRITICAL |
| P2-4 | **Source map exposure** | New: HEAD requests for `.js.map` files | For each loaded script, check if `.map` file is accessible | MEDIUM |
| P2-5 | **Certificate expiration** | New: TLS handshake via `tls.connect()` | Node.js TLS connection to extract certificate details. Cannot use Playwright for this. | HIGH |
| P2-6 | **Known-vulnerable library detection** | New: match loaded scripts against Retire.js DB | Download Retire.js JSON database, match against script URLs and extracted version strings | HIGH |
| P2-7 | **Cookie scope analysis** | New: parse cookie `Domain` attribute | Check if cookie domain is broader than necessary | LOW |

**Estimated effort:** 3-5 work units. Each requires new extraction code and potentially new fields in `PageSummary` or `CrawlResult`.

### P3 -- Aspirational (requires external APIs or significant infrastructure)

| # | Check | Data Source | Required Change | Severity |
|---|-------|-------------|-----------------|----------|
| P3-1 | **TLS quality (cipher suites, protocol versions)** | SSL Labs API | Integration with `https://api.ssllabs.com/api/v3/analyze`. Rate-limited. Slow (30-60s per scan). | MEDIUM |
| P3-2 | **DNS security (DNSSEC, CAA)** | DNS queries via `dns.resolve()` | Node.js DNS module. Check CAA records, DNSSEC validation. | LOW |
| P3-3 | **Email security (SPF, DKIM, DMARC)** | DNS TXT record queries | Query `_dmarc.`, `_dkim._domainkey.` DNS records. Parse and grade. | LOW-MEDIUM |
| P3-4 | **Mozilla Observatory integration** | Mozilla Observatory API | Validation baseline. Compare Alien Eyes findings against Observatory score. | N/A (calibration) |
| P3-5 | **Cookie banner dark pattern detection** | LLM analysis of consent UI | Screenshot analysis of cookie consent banner for dark patterns. Requires LLM. | MEDIUM |
| P3-6 | **Certificate Transparency monitoring** | crt.sh API | Check for unauthorized certificate issuance. | LOW |

**Estimated effort:** Variable. Each requires external API integration, rate limit handling, and cost tracking.

---

## Scoring Summary

| Expert | Domain | Rating | Key Criticism |
|--------|--------|--------|---------------|
| Dr. Amara Osei | HTTP Security Headers | **3/10** | Checks existence of 2 headers, ignores quality of both. 4 collected headers not checked. Would give perfect score to CSP with unsafe-inline + unsafe-eval. |
| Lena Karjalainen | Privacy & Compliance | **3/10** | Pre-consent check catches 2 of 6+ tracking services. Ignores existing `isTracking` field on cookies. One generic finding where 4-6 specific findings are needed. |
| Rafael Dominguez | Application Security | **2/10** | 4 of 12 methodology checks implemented (33%). `usesLLM: true` is factually wrong. Misses 3 items its own methodology rates HIGH or CRITICAL. |
| Mei-Ling Chen | Supply Chain Risk | **2/10** | Supply chain security completely absent. No SRI, no vulnerable library detection, no source map check, no sensitive file check. Post-Polyfill.io, this is negligent. |
| Dmitri Volkov | Infrastructure Security | **3/10** | No TLS visibility, no certificate checks, no DNS security, no HTTP-to-HTTPS redirect. Missing check for methodology's own CRITICAL item (No HTTPS). |

**Panel Mean: 2.6/10**

**Panel Consensus:** The security primitive is a skeleton that checks 2 things (CSP existence, HSTS existence) plus 2 adjacent things (pre-consent tracking, cookie attributes). It ignores data it already collects (4 additional headers, cookie tracking classification, third-party domains, network requests, raw HTML). It disagrees with its own methodology on severity levels and LLM usage. The ownership gate, while well-intentioned, produces a worse result than running `curl -sI` on the target URL, because it returns zero findings for unverified users while `curl` at least shows the headers.

The path forward is clear: P0 items require no new data collection -- they are if-statements applied to data the extractor already provides. P0 alone would take the primitive from 2.6/10 to an estimated 5-6/10. P0 + P1 would reach 7/10. The full P0-P2 roadmap would produce a primitive competitive with free tools like SecurityHeaders.com and Mozilla Observatory, with the additional value of structured, agent-pasteable findings.

---

## Appendix A: supertrained.ai Actual Security Headers (Captured 2026-03-13)

```http
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://assets.calendly.com https://www.clarity.ms https://snap.licdn.com https://connect.facebook.net https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://assets.calendly.com https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://calendly.com https://*.clarity.ms https://px.ads.linkedin.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com; frame-src https://calendly.com https://www.youtube.com; worker-src 'self' blob:
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
permissions-policy: camera=(), microphone=(), geolocation=()
referrer-policy: strict-origin-when-cross-origin
access-control-allow-origin: *
server: Vercel
```

## Appendix B: supertrained.ai DNS Security Records (Captured 2026-03-13)

```
SPF: v=spf1 include:_spf.google.com ~all
DMARC: v=DMARC1; p=quarantine; pct=5; rua=mailto:tommeredith@supertrained.ai; ruf=mailto:tommeredith@supertrained.ai; fo=1;
DKIM: Present (Google, RSA 2048-bit)
CAA: None
DNSSEC: Not checked
```

## Appendix C: supertrained.ai TLS Certificate (Captured 2026-03-13)

```
Subject: CN=supertrained.ai
Issuer: C=US, O=Let's Encrypt, CN=R13
Valid: Feb 25 20:40:24 2026 GMT - May 26 20:40:23 2026 GMT
SAN: DNS:supertrained.ai (no www)
```
