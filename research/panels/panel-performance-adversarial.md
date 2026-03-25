# Adversarial Expert Panel: Performance Primitive

> Date: 2026-03-13
> Panel Type: Adversarial Review (5 experts)
> Subject: `src/primitives/performance.ts` -- current implementation and design gaps
> Live Audit Target: supertrained.ai (Next.js on Vercel, GA4, Tailwind CSS 4)
> Methodology: Each expert independently reacts, audits, and recommends
> Crawl Data Available: `CrawlResult` (network requests with size/duration/type, console logs, response headers, HTML, meta tags, load timing) and `PageSummary` (PerformanceMetrics with loadTimeMs, ttfbMs, domContentLoadedMs, totalWeightBytes, renderBlockingCount, optional lcpMs/cls)

---

## Panel Composition

| # | Name | Title | Credentials | Perspective |
|---|------|-------|-------------|-------------|
| 1 | **Dr. Philip Walton** | Staff Engineer, Chrome Web Platform (Core Web Vitals) | Creator of the `web-vitals` JavaScript library; authored the original Core Web Vitals definitions at Google; designed the CrUX methodology; co-author of the INP metric specification that replaced FID; led Chrome's performance measurement API design for PerformanceObserver, LCP, and CLS | Core Web Vitals measurement -- what "performance" actually means in 2026 and how to measure it correctly in synthetic environments |
| 2 | **Nolan Lawson** | Principal Engineer, Microsoft Edge (JavaScript Runtime Performance) | Built Edge DevTools performance profiler; authored `fuite` (memory leak detector for web apps); core contributor to IDB-Keyval and PouchDB; wrote the definitive analysis of web worker adoption barriers; led Microsoft's internal JS performance audit tooling for 200+ first-party web apps | JavaScript execution cost -- main thread blocking, hydration overhead, third-party script impact, long tasks |
| 3 | **Katie Hempenius** | Staff Engineer, Google Chrome (Resource Optimization) | Led the Chrome team's image optimization recommendations adopted by Next.js, Nuxt, and Angular; designed the `loading=lazy` heuristic thresholds shipped in Chrome; co-authored the AVIF adoption strategy; wrote Google's internal guidelines for font subsetting, resource hints, and HTTP/3 prioritization | Asset optimization -- images, fonts, CSS, resource loading strategies, transfer size vs render cost |
| 4 | **Andrew Galloni** | Distinguished Engineer, Cloudflare (Edge & CDN Performance) | Architected Cloudflare's edge compute platform; designed the caching heuristics used by 25% of the web; authored the `cf-cache-status` header specification; built Cloudflare's Real User Monitoring pipeline processing 50B+ requests/day; co-authored the Early Hints (HTTP 103) specification with the Chromium team | CDN, caching, and network layer performance -- TTFB decomposition, cache hit ratios, connection reuse, edge compute, HTTP/2-3 behavior |
| 5 | **Lee Robinson** | VP of Product, Vercel (Framework-Specific Performance) | Former Head of Developer Relations at Vercel; architected Next.js App Router performance profiling; built the Vercel Speed Insights product; contributor to the React Server Components streaming architecture; maintains the Next.js performance documentation and best practices; personally optimized 500+ Next.js production deployments | Next.js/React-specific performance -- App Router streaming, RSC payload size, hydration cost, chunk splitting, Vercel edge network behavior |

---

## 1. Dr. Philip Walton -- Core Web Vitals

### Reaction to Current Implementation

The performance primitive has five checks. I need to be direct: **three of the five are measuring the wrong things, one has a critical implementation bug, and only one (hydration mismatch detection) is genuinely valuable.**

**What is good:**

The hydration mismatch check (check 5) is excellent. It detects a real performance problem that most auditing tools miss -- hydration errors cause React to discard the server-rendered DOM and re-render from scratch on the client, which can double or triple time-to-interactive. The regex pattern covering both the React error number (#418) and the descriptive text is thorough. I would raise this from `medium` to `high` severity because the performance impact of a full client re-render is substantial.

**What is naive:**

Check 1 (page load time > 4000ms) measures `loadTimeMs`, which is calculated as `Date.now() - startedAt` wrapping `page.goto()` with `waitUntil: 'domcontentloaded'`. This is not a user-centric metric. It measures how long Playwright waited for the DOMContentLoaded event, which tells you almost nothing about the user experience. A page can fire DOMContentLoaded in 800ms and still have a 6-second LCP because the hero image loads late. Conversely, a page can take 3 seconds to DOMContentLoaded but have an 800ms FCP because it streams content progressively. The threshold of 4000ms is also arbitrary -- it does not correspond to any established performance benchmark.

Check 2 (TTFB > 1000ms) is better-grounded but uses the wrong threshold. Google's CWV guidelines define TTFB "good" as under 800ms, "needs improvement" as 800ms-1800ms, and "poor" as over 1800ms. The 1000ms threshold falls in the middle of the "needs improvement" range without acknowledging that range exists. More importantly, TTFB from a synthetic Playwright crawl varies wildly depending on where the crawler runs (geographic distance to the origin/edge server). A site served from Vercel's edge network will have sub-100ms TTFB from a US-based crawler but 800ms+ from Southeast Asia. Without recording the geographic context, the TTFB measurement is not reproducible.

Check 3 (page weight > 2MB) is reasonable as a rough heuristic but ignores the critical distinction between *transferred* bytes and *decoded* bytes. A 3MB page where 2.5MB is gzip-compressed to 400KB on the wire is vastly different from a 3MB page of uncompressed images. The check also does not distinguish between resources loaded during initial render and resources lazy-loaded after interaction. A page that loads 500KB initially and lazy-loads 2MB of images below the fold is performant, but this check would flag it.

**What is a critical bug:**

Check 4 (render-blocking count > 8) is **fundamentally broken** for any modern web framework. The implementation counts ALL `script` and `stylesheet` network requests:

```typescript
renderBlockingCount: page.networkRequests.filter((request) =>
  request.resourceType === 'script' || request.resourceType === 'stylesheet'
).length
```

This counts async scripts, deferred scripts, dynamically injected scripts, and module scripts -- none of which are render-blocking. On a Next.js site using App Router, every route generates multiple async chunk files. The supertrained.ai homepage alone loads 6+ async JavaScript chunks plus a single CSS file. The primitive would report ~7 "render-blocking" resources when the actual render-blocking count is likely 1 (the CSS file). On a page with more routes discovered during load, this number climbs to 15-20, producing a false positive every time.

In Playwright, the `request.resourceType()` method returns `'script'` for ALL script requests regardless of their loading strategy. To determine whether a script is actually render-blocking, you must either:
1. Parse the HTML for `<script>` tags and check for `async`, `defer`, `type="module"`, or dynamic injection
2. Use the Chrome DevTools Protocol (CDP) to access `Page.getResourceTree()` or the `Audits.getEncodedResponse` domain
3. Check the `initiator` chain -- scripts loaded by other async scripts are not render-blocking

The current approach cannot distinguish render-blocking from non-blocking resources and will produce false positives on every modern site.

**What is entirely missing:**

The primitive does not measure Core Web Vitals. At all. This is like building a blood pressure monitor that measures temperature -- it is measuring *something*, but not the thing that matters. LCP, CLS, and INP are the three metrics that Google uses for search ranking signals and that the industry has standardized on for user-centric performance measurement. The `PerformanceMetrics` type already has optional fields for `lcpMs` and `cls`, but the crawl engine never populates them and the primitive never checks them.

FCP (First Contentful Paint) is also absent. It is the single most important "speed" metric for user perception because it measures when the user first sees *anything* on screen. `loadTimeMs` (DOMContentLoaded timing) is not a substitute.

### Audit of supertrained.ai

If I were auditing supertrained.ai using proper Core Web Vitals methodology, here is what I would find:

**LCP (Largest Contentful Paint):** The hero section contains text content ("We build the AI your team actually needs") that is server-rendered via React Server Components. With Vercel's edge network and streaming SSR, the LCP element is likely the hero text or a hero image. Given the 3 preloaded WOFF2 font files, LCP is gated on font download -- text is invisible (or shows fallback) until the custom font loads. Likely LCP: 1.2-2.5s from US locations (good to needs-improvement), potentially 3-4s from distant regions. The font preloads are correct but the number of custom fonts (Inter, Lora, Caveat -- 3 variable fonts) is aggressive.

**CLS (Cumulative Layout Shift):** Next.js Image component prevents layout shift from images by reserving space. However, the font swap from system fallback to custom fonts (Inter, Lora, Caveat) will cause measurable CLS. Variable fonts have different metrics than system fonts -- line heights, character widths, and descender heights all shift. With 3 custom fonts loading, I would expect CLS of 0.05-0.15 depending on how much visible text is above the fold. The `font-display: swap` strategy (standard for Next.js font optimization) guarantees a layout shift when fonts load; `font-display: optional` would eliminate it at the cost of sometimes showing the fallback.

**INP (Interaction to Next Paint):** With consent-gated analytics (GA4, Google Ads tag), the main thread is relatively clean before consent. After consent, the gtag.js bundle plus any tracking pixel initialization could introduce 100-200ms of main thread work. The site appears to be content-heavy rather than interaction-heavy, so INP is likely fine (sub-200ms) for most interactions.

**Third-party script cost:** GA4 (`gtag/js`), Google Ads conversion tracking (`AW-17995744944`). The CLAUDE.md mentions Meta Pixel, LinkedIn Insight Tag, and Microsoft Clarity, but the live crawl did not detect these -- either they are consent-gated and not loading in a clean profile, or they were removed. If all four third-party scripts load simultaneously post-consent, I would expect 300-500ms of main thread blocking in aggregate. This is the single largest performance risk for the site.

**Font optimization:** 3 variable WOFF2 fonts preloaded is aggressive. Each variable font file is typically 80-150KB. That is 240-450KB of font data competing with critical CSS and JS for bandwidth. For a business site, Inter (body) + one accent font is sufficient. Three fonts is a design choice with a measurable performance cost.

**What the current primitive would report for supertrained.ai:**
- Load time: Likely under 4000ms on a fast connection -- no finding.
- TTFB: Under 1000ms from Vercel edge -- no finding.
- Page weight: Likely 1-2.5MB depending on images loaded -- borderline, may or may not trigger.
- Render-blocking count: Would count 6-8 async JS chunks + 1 CSS file = 7-9 resources. **False positive** if it exceeds 8.
- Hydration mismatch: Clean profile, properly implemented SSR -- no finding.

**What the primitive misses on supertrained.ai:**
- Font-induced CLS (the biggest real performance issue on this site)
- LCP gated on font loading (real user impact)
- Third-party script main thread cost (after consent)
- No measurement of streaming SSR benefit (React Server Components)
- Opportunity: Image formats are mixed (WebP + AVIF + SVG) -- AVIF where available is correct, but no check for whether optimal formats are served

### Top 5 Checks to Add

**1. Core Web Vitals: LCP (Largest Contentful Paint)**

This is the single most important missing check.

- **What to collect:** Inject a `PerformanceObserver` via `page.evaluate()` before navigation that observes `'largest-contentful-paint'` entries. After `page.goto()` completes and a short idle period, retrieve the last LCP entry's `startTime`.
- **Playwright implementation:**
  ```typescript
  await page.evaluate(() => {
    window.__ae_lcp = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      window.__ae_lcp = last.startTime;
      window.__ae_lcp_element = last.element?.tagName + '.' + last.element?.className;
      window.__ae_lcp_url = last.url || null; // image URL if LCP is an image
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  // ... navigate ...
  const lcp = await page.evaluate(() => ({
    value: window.__ae_lcp,
    element: window.__ae_lcp_element,
    url: window.__ae_lcp_url
  }));
  ```
- **Thresholds:** Good: <=2500ms (no finding). Needs improvement: 2500-4000ms (medium). Poor: >4000ms (high).
- **Evidence:** Include the LCP element tag/class and source URL (if image) in the finding. This tells the builder *what* to optimize.
- **Confidence:** 0.92 -- synthetic LCP correlates well with field LCP for server-rendered sites but may diverge for heavily personalized content.

**2. Core Web Vitals: CLS (Cumulative Layout Shift)**

- **What to collect:** Inject a `PerformanceObserver` for `'layout-shift'` entries before navigation. Sum entries where `hadRecentInput === false` using the session window approach (gap > 1s or window > 5s starts a new session; report the max session value).
- **Playwright implementation:**
  ```typescript
  await page.evaluate(() => {
    window.__ae_cls_entries = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__ae_cls_entries.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: entry.sources?.map(s => ({
              node: s.node?.tagName,
              previousRect: s.previousRect,
              currentRect: s.currentRect
            }))
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  // ... navigate, wait for load + 3s idle ...
  const clsData = await page.evaluate(() => window.__ae_cls_entries);
  // Compute max session window in the primitive
  ```
- **Thresholds:** Good: <=0.10 (no finding). Needs improvement: 0.10-0.25 (medium). Poor: >0.25 (high).
- **Evidence:** Include the shifting elements and their rects. This is critical -- "CLS is 0.18" is useless without "the h1 shifted 40px down when Inter font loaded."
- **Confidence:** 0.88 -- synthetic CLS is lower than field CLS because synthetic tests do not scroll, interact, or trigger delayed layout shifts. Note this in the finding.

**3. First Contentful Paint (FCP)**

- **What to collect:** Inject `PerformanceObserver` for `'paint'` entries or read `performance.getEntriesByName('first-contentful-paint')`.
- **Playwright implementation:**
  ```typescript
  const fcp = await page.evaluate(() => {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : null;
  });
  ```
- **Thresholds:** Good: <=1800ms (no finding). Needs improvement: 1800-3000ms (medium). Poor: >3000ms (high).
- **Why it matters:** FCP is the first signal to the user that the page is loading. If FCP is late but LCP is acceptable, the problem is likely render-blocking CSS or font loading. If both are late, the problem is server response time.

**4. Long Tasks Detection**

- **What to collect:** `PerformanceObserver` for `'longtask'` entries (tasks > 50ms on the main thread).
- **Playwright implementation:**
  ```typescript
  await page.evaluate(() => {
    window.__ae_long_tasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__ae_long_tasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name
        });
      }
    }).observe({ type: 'longtask', buffered: true });
  });
  ```
- **Thresholds:** >=3 long tasks during initial load: low finding. Any long task >200ms: medium. Any long task >500ms: high.
- **Why it matters:** Long tasks directly cause INP failures and jank. They reveal third-party script cost, hydration cost, and framework overhead. The *count* and *total duration* of long tasks during page load is the best synthetic proxy for INP.

**5. Resource Hint Audit (preload, preconnect, prefetch)**

- **What to collect:** Parse HTML `<head>` for `<link rel="preload|preconnect|prefetch|dns-prefetch|modulepreload">`. Cross-reference with actual network requests to find: (a) preloaded resources that were never used (wasted bandwidth), (b) critical resources that should be preloaded but are not (late discovery), (c) missing preconnect for third-party domains.
- **Implementation:** Parse from `page.html` using cheerio (already a dependency). Compare against `networkRequests` to find orphaned preloads and late-discovered critical resources.
- **Thresholds:** Unused preload: low. LCP image not preloaded: medium. Third-party origin with >3 requests and no preconnect: low.
- **Why it matters:** Resource hints are free performance -- they cost nothing when used correctly but waste bandwidth when orphaned. An LCP image without a preload is one of the most common causes of slow LCP.

### Tools/Frameworks Being Ignored

- **CrUX API (Chrome User Experience Report):** Free API that provides real-user field data for any origin with sufficient traffic. This is the ground truth for Core Web Vitals. Alien Eyes should cross-reference synthetic results with CrUX data when available. If the site has CrUX data showing "good" LCP but the synthetic test shows "poor" LCP, the finding confidence should drop significantly.
- **web-vitals.js library:** The standard library for measuring CWV in JavaScript. Rather than hand-rolling PerformanceObserver injection, bundle web-vitals and inject it. It handles all the edge cases (session windows for CLS, element attribution for LCP, interaction measurement for INP).
- **Lighthouse CI:** The industry-standard synthetic performance audit. It measures everything this primitive attempts plus 50 more signals. The question is whether Alien Eyes should wrap Lighthouse or build independent measurement. My recommendation: build independent measurement for the primitive (keeps control), but offer Lighthouse CI as a complementary data source for the Full Audit tier.
- **WebPageTest API:** The gold standard for waterfall analysis, filmstrip comparison, and connection simulation. WPT can test from multiple geographic locations, which solves the TTFB reproducibility problem.
- **HTTP Archive (BigQuery):** Baseline percentile data for every metric. Without knowing that the median LCP is 2.4s and the 75th percentile is 3.8s, threshold choices are arbitrary.

### Rating: 2/10

Two checks that are reasonable in principle (TTFB, page weight) but with wrong thresholds and missing nuance. One check that is valuable (hydration mismatch). One check that measures the wrong thing (load time as DOMContentLoaded). One check with a critical false-positive bug (render-blocking count). Zero Core Web Vitals. The primitive is measuring 1990s web performance metrics in a 2026 product. It needs a fundamental redesign, not incremental improvements.

---

## 2. Nolan Lawson -- JavaScript Runtime Performance

### Reaction to Current Implementation

I have spent a career measuring what JavaScript actually costs at runtime. Looking at this primitive, I see a common pattern: measuring the *symptoms* of performance problems (slow load, heavy page) without measuring the *cause* (what is the main thread doing?).

**What is good:**

The hydration mismatch check is the one check here that identifies a *cause*. When React hydration fails, the entire component tree re-renders on the client. On a large page, this can mean 200-500ms of main thread work that produces zero visible change. The fact that this check exists shows the right instinct -- measure framework-specific pathologies, not just generic timing.

The confidence values are appropriately calibrated. The hydration check at 0.96 confidence is correct -- if the console says "hydration mismatch," it is a hydration mismatch. The page weight check at 0.89 is also appropriate -- weight is a proxy, not a direct measurement of user impact.

**What is naive:**

The load time check conflates network time with compute time. A page that takes 3500ms to reach DOMContentLoaded because of a slow API call is a completely different problem from a page that reaches DOMContentLoaded in 1200ms but then spends 2300ms parsing and executing JavaScript. The first is a backend problem. The second is a frontend problem. The primitive cannot distinguish them because it measures only the outer wall-clock time.

The page weight check counts total bytes without segmenting by type. On supertrained.ai, the weight breakdown is roughly: HTML/RSC payload (~50-80KB), CSS (~30KB), JavaScript (~200-350KB across chunks), fonts (~300KB for 3 variable fonts), images (variable, 200KB-1.5MB depending on viewport). The JavaScript weight is the most dangerous because it must be parsed, compiled, and executed -- every byte of JS costs 2-4x more than a byte of image in terms of main thread time. A 2MB page that is 1.8MB of optimized images and 200KB of JS is fine. A 2MB page that is 1.5MB of JS and 500KB of images is a disaster. The primitive treats them identically.

**What is a critical bug:**

The render-blocking count issue has already been identified. I want to add a subtlety: even if you fix it to only count truly render-blocking resources (by parsing `<script>` tags for async/defer/module attributes), the *count* of blocking resources is less important than their *total size* and *execution time*. One render-blocking script of 500KB is worse than five render-blocking scripts of 5KB each, because modern browsers can download them in parallel (HTTP/2 multiplexing) but must execute them sequentially on the main thread. The metric should be *total render-blocking bytes* and *estimated execution time*, not count.

**What is entirely missing:**

**Main thread work measurement.** This is the single most important signal for JavaScript performance and it is completely absent. Playwright can measure main thread work through several mechanisms:

1. **Long Tasks API** -- already discussed by Dr. Walton. This is the most practical.
2. **CDP `Performance.getMetrics()`** -- returns `ScriptDuration`, `TaskDuration`, `LayoutDuration`, `RecalcStyleDuration`, and `JSHeapUsedSize`. These are available via Playwright's CDP session and decompose where time is being spent.
3. **CDP `Tracing`** -- full Chrome trace that can be analyzed for main thread breakdown. Heavy but definitive.

Without main thread measurement, the primitive cannot answer the question "is this page slow because of JavaScript?" It can only say "this page loaded in X milliseconds," which is like diagnosing a patient's illness by measuring how long they waited in the waiting room.

**Third-party script isolation.** The primitive has access to `networkRequests` with full URLs but does not analyze third-party scripts separately. Third-party JS (analytics, pixels, chat widgets, A/B testing) is the most common cause of real-world performance degradation and the hardest for builders to control. On supertrained.ai, Google Analytics (gtag.js) is loaded post-consent, but the primitive does not measure its impact separately.

### Audit of supertrained.ai

**JavaScript budget analysis:**

The site loads approximately 6 JavaScript chunks. Next.js App Router with React Server Components means the JS payload is primarily the React runtime, the RSC client, and interactive component code. The RSC architecture sends data as a streaming payload (`__next_f` format) rather than full component trees, which reduces JavaScript needed for initial render.

Estimated JS transfer: ~200-350KB compressed (600KB-1MB uncompressed). For a site of this complexity (marketing pages, form components, analytics), this is within acceptable bounds for Next.js but is still 2-3x what a static site generator would produce.

**Main thread analysis (estimated based on stack):**

- React hydration: ~80-150ms for a marketing page with limited interactivity
- Font parsing (3 variable fonts): ~30-60ms
- CSS parsing (Tailwind, single file): ~10-20ms
- GA4 initialization (post-consent): ~50-100ms
- Total estimated main thread work during load: ~170-330ms

This is acceptable but could be tighter. The biggest optimization opportunity is reducing from 3 fonts to 2.

**Third-party script assessment:**

GA4 is consent-gated, which is correct. The gtag.js bundle is approximately 80-120KB compressed. Post-consent, it initializes synchronously and processes any queued events. If Meta Pixel, LinkedIn Insight, and Clarity are also loaded post-consent (as the CLAUDE.md implies but the live crawl did not detect), the combined post-consent JS is approximately 300-500KB, adding 200-400ms of main thread work.

The critical insight: **the Alien Eyes crawl uses a clean browser profile with no cookies, so consent-gated scripts never load.** This means the primitive systematically underestimates JavaScript cost for returning visitors who have accepted consent. The crawl sees the best-case performance, not the common-case performance.

**Hydration cost:**

With React Server Components, only interactive "client components" require hydration. If the site correctly uses `'use client'` sparingly (forms, interactive widgets, analytics), the hydration cost is minimal. If entire page layouts are client components, the cost is much higher. The primitive has no way to measure this distinction.

**What the current primitive would find:** Likely nothing. Load time under 4s, TTFB under 1s on Vercel edge, page weight borderline, render-blocking count incorrectly inflated. The real performance story (3 custom fonts, consent-gated analytics cost, main thread budget) is invisible.

### Top 5 Checks to Add

**1. Main Thread Total Blocking Time (TBT)**

TBT is the sum of the "blocking" portion of all long tasks (each long task's duration minus 50ms). It is the best synthetic proxy for INP and directly measures JavaScript execution cost.

- **What to collect:** Use CDP `Performance.getMetrics()` to retrieve `TaskDuration` and `ScriptDuration`. Alternatively, compute from Long Tasks API entries.
- **Playwright implementation:**
  ```typescript
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  // ... navigate and wait for idle ...
  const metrics = await cdp.send('Performance.getMetrics');
  const taskDuration = metrics.metrics.find(m => m.name === 'TaskDuration')?.value ?? 0;
  const scriptDuration = metrics.metrics.find(m => m.name === 'ScriptDuration')?.value ?? 0;
  // TBT from long tasks:
  const tbt = longTasks.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0);
  ```
- **Thresholds:** TBT <= 200ms: good (no finding). 200-600ms: medium. >600ms: high.
- **Why it matters:** TBT directly answers "how much does JavaScript block the main thread during page load?" Page weight and load time are proxies. TBT is the measurement.

**2. Third-Party Script Impact Isolation**

- **What to collect:** From `networkRequests`, segment scripts by first-party vs third-party (different origin from the page URL). For each third-party domain, compute: total transfer size, total count, whether any are render-blocking.
- **Implementation:** Group `networkRequests` where `resourceType === 'script'` by origin. Flag origins where total size > 100KB or count > 5.
- **Thresholds:** Third-party JS > 300KB total transfer: medium. Any third-party script in the critical path (loaded before DOMContentLoaded, not async/deferred): high.
- **Evidence:** List each third-party domain with byte count and script count. This gives the builder an actionable list of what to defer, remove, or replace.

**3. JavaScript Transfer Size Budget**

Separate from total page weight, measure JavaScript specifically because JS has asymmetric cost (parse + compile + execute, not just decode + render like images).

- **What to collect:** Sum `size` for all `networkRequests` where `resourceType === 'script'`.
- **Thresholds:** JS total <= 300KB compressed: good. 300-500KB: low. 500KB-1MB: medium. >1MB: high.
- **Evidence:** Include the top 5 largest scripts by size. On Next.js, this reveals whether the framework overhead or custom code is the dominant cost.

**4. Uncompressed Resource Detection**

- **What to collect:** For each network request, check response headers for `content-encoding` (gzip, br, zstd). The `responseHeaders` are already available in `CrawledPage`. Any text-based resource (HTML, CSS, JS, JSON, SVG) served without compression is a free optimization win.
- **Implementation:** Cross-reference `networkRequests` with page `responseHeaders`. For text resources > 1KB without `content-encoding`, flag.
- **Thresholds:** Any uncompressed text resource > 10KB: medium. Multiple uncompressed resources: high.
- **Note:** This requires adding `content-encoding` to the per-request data collection (currently only the page's `responseHeaders` are stored, not per-request headers). This is a data collection gap.

**5. Console Error Budget**

- **What to collect:** Already available in `consoleLogs`. Count errors that are not hydration mismatches (those are handled separately). JavaScript runtime errors during page load indicate broken functionality that also wastes main thread time (error handling, stack trace generation, potential re-renders from error boundaries).
- **Thresholds:** 0 errors: good. 1-3 non-critical errors: low. 4+ errors or any error containing "TypeError," "ReferenceError," "failed to fetch": medium.
- **Why it matters:** Console errors are the cheapest signal available. They are already collected. The primitive already scans for hydration errors. Extending this to a general error budget costs zero additional data collection.

### Tools/Frameworks Being Ignored

- **Chrome DevTools Protocol (CDP):** Playwright exposes CDP sessions. The `Performance` domain provides `ScriptDuration`, `TaskDuration`, `LayoutDuration`, `JSHeapUsedSize` -- all immediately usable without additional dependencies. The `Tracing` domain provides full Chrome traces. This is free data that the primitive does not use.
- **`fuite` (memory leak detection):** Not applicable for single-page audits, but for multi-page crawls of SPAs, detecting growing heap between navigations is a strong signal of memory leaks in React state management.
- **Source map analysis:** If source maps are publicly accessible (common in Next.js development deployments, rare in production), they reveal the actual module dependency tree and bundle composition. Checking for exposed source maps is also a security finding.
- **Coverage API:** CDP `Profiler.startPreciseCoverage` measures how much of each JS file is actually executed during page load. On average, 50-70% of JS shipped to a page is unused on that specific page. This is the most actionable optimization signal for JavaScript performance.

### Rating: 2/10

The primitive detects one real issue (hydration mismatch) and four signals that range from imprecise to broken. It has no concept of main thread cost, no third-party isolation, no JavaScript-specific budget, and cannot distinguish between compute-bound and network-bound slowness. The render-blocking count bug means it actively produces false positives. The crawl engine collects rich network data (sizes, durations, resource types) that the primitive almost entirely ignores.

---

## 3. Katie Hempenius -- Resource Optimization

### Reaction to Current Implementation

I focus on what browsers actually download, decode, and render. The performance primitive treats resources as an undifferentiated blob measured by total weight. This misses the entire optimization surface.

**What is good:**

The total page weight check exists and has a defensible threshold (2MB). The direction is correct -- page weight matters. But the implementation is a blunt instrument.

The hydration check is well-targeted. From an asset optimization perspective, hydration failures cause the browser to throw away the server-rendered DOM (including any already-decoded images and laid-out text) and rebuild everything. The performance cost of this is not just JavaScript execution but also image re-decode, layout recalculation, and paint operations.

**What is naive:**

The page weight check counts bytes without distinguishing resource types. Here is why this matters with concrete numbers:

| Resource Type | Cost per byte (decode) | Cost per byte (render) | Cost per byte (main thread) |
|---------------|----------------------|----------------------|----------------------------|
| Image (raster) | Low (hardware decoder) | Low (compositor) | Near-zero |
| Image (SVG) | Medium (XML parse) | Medium (paint ops) | Low-Medium |
| JavaScript | High (parse + compile) | N/A | Very High (execution) |
| CSS | Medium (parse + cascade) | High (layout + paint) | Medium |
| Font | Low (decode) | High (text layout) | Low |
| HTML | Low (parse) | Medium (DOM construction) | Low |

A megabyte of AVIF images costs roughly 1/10th the main thread time of a megabyte of JavaScript. The 2MB threshold penalizes image-heavy visual sites (portfolios, e-commerce) while giving a pass to JS-heavy SPAs that happen to be under 2MB.

The render-blocking check (ignoring its counting bug) also conflates CSS and JavaScript. A render-blocking stylesheet is expected and often desirable -- the browser needs CSS to render anything. The critical question for CSS is not "is it blocking?" but "is it *unnecessarily large*?" Inlining critical CSS and deferring the rest is the optimization, not eliminating blocking stylesheets.

**What is entirely missing:**

**Image optimization analysis.** Images are typically 50-70% of total page weight and the easiest resource to optimize. The crawl engine collects image `NetworkEntry` records with `size`, and `PageSummary` has `ImageInfo` with `src`, `width`, and `height`. But the primitive does not analyze:

- Format efficiency: Are images served as AVIF/WebP or legacy JPEG/PNG?
- Sizing accuracy: Are images decoded at display dimensions or oversized? (A 2000px-wide image displayed at 400px wastes 96% of its pixels.)
- Lazy loading: Are below-the-fold images lazy-loaded?
- LCP image priority: Is the LCP image preloaded? Does it use `fetchpriority="high"`?

**Font optimization analysis.** The crawl collects font network entries. On supertrained.ai, 3 variable WOFF2 fonts are preloaded. But the primitive does not check:

- Font count: More than 2 font families is a red flag.
- Font format: WOFF2 is required; WOFF1/TTF/OTF are suboptimal.
- Subsetting: Are fonts subsetted to used Unicode ranges?
- `font-display` strategy: `swap` causes CLS; `optional` avoids CLS but may show fallback.
- Preload correctness: Are font preloads actually used? (Orphaned preloads waste bandwidth.)

**CSS optimization analysis.** A single CSS file on supertrained.ai is fine for initial load, but the primitive does not measure CSS size, unused CSS percentage, or whether critical CSS is inlined.

### Audit of supertrained.ai

**Image audit:**

The site uses a mix of AVIF (headshots: `tom.avif`, `josh.avif`), WebP (hero images: `cloneicp-hero.webp`, `snowthere-hero.webp`), and SVG (logos). This is a good format strategy -- AVIF for photographic content, WebP for hero/marketing images, SVG for vector logos.

However, several optimization opportunities exist:

1. **AVIF everywhere photographic:** The hero images (`cloneicp-hero.webp`, `snowthere-hero.webp`) are WebP but could be AVIF, saving approximately 20-30% more bytes. Since AVIF browser support is now >94% globally, the fallback chain is unnecessary for most users.

2. **Next.js Image optimization:** The site uses `/_next/image?url=` for some images, which provides automatic format negotiation (serves AVIF to supporting browsers, WebP to others). But static images referenced directly (e.g., in CSS backgrounds or direct `<img>` tags without the Next.js Image component) miss this optimization.

3. **Responsive images:** Next.js Image generates `srcset` with multiple widths. The question is whether the `sizes` attribute accurately reflects the display width at each breakpoint. An incorrect `sizes` attribute causes the browser to download an image larger than needed.

4. **LCP image preload:** If the LCP element is a hero image, it should have `<link rel="preload" as="image">` in the `<head>`. The current preloads are for fonts only. If the LCP image is loaded via `/_next/image`, it is fetched via JavaScript (not discoverable in HTML), which delays its start by the time it takes to parse and execute the relevant JS chunk.

**Font audit:**

3 custom fonts (Inter, Lora, Caveat) as variable WOFF2 with preloads.

| Font | Estimated Size | Usage | Assessment |
|------|---------------|-------|-----------|
| Inter | ~100-150KB | Body text | Required. Variable font is correct. |
| Lora | ~80-120KB | Headings (serif contrast) | Defensible design choice but adds weight. |
| Caveat | ~60-90KB | Accent/handwriting for personality | Luxury. Used sparingly. Costs 60-90KB for visual flair. |

Total font weight: ~240-360KB. For comparison, the median website loads ~100KB of fonts. This site loads 2-3x the median.

Recommendations:
- **Keep Inter** (essential for body text legibility).
- **Evaluate Caveat** -- if used on fewer than 5 elements, consider removing it entirely or using a system handwriting font (`cursive`). The 60-90KB cost is disproportionate to usage.
- **Subset all fonts** to Latin + common punctuation if not already done. Variable font subsetting reduces file size by 20-40%.
- **Check `font-display`** -- if using `swap`, accept the CLS trade-off or switch to `optional` for Caveat (if the accent font does not render, users will not notice; if Inter does not render, they will).

**CSS audit:**

Single CSS file with Tailwind. Tailwind's production purge should eliminate unused classes. Estimated size: 20-40KB compressed. This is efficient.

One concern: Tailwind 4 uses a new engine. If the purge configuration is misconfigured, the CSS file could be much larger (100KB+). The primitive should check CSS file size as a signal.

**What the current primitive would find:** Potentially a page weight finding if total exceeds 2MB on image-heavy pages (case study pages with multiple screenshots). The render-blocking false positive. Nothing about image formats, font loading strategy, or CSS efficiency.

### Top 5 Checks to Add

**1. Image Format Efficiency Audit**

- **What to collect:** For each `networkRequests` entry where `resourceType === 'image'`, extract `contentType` and `size`. Cross-reference with `PageSummary.images` for display dimensions.
- **Implementation:**
  ```typescript
  for (const req of page.networkRequests.filter(r => r.resourceType === 'image')) {
    const contentType = req.contentType.toLowerCase();
    const isModernFormat = contentType.includes('avif') || contentType.includes('webp') || contentType.includes('svg');
    if (!isModernFormat && req.size > 10_000) {
      // Flag: non-modern image format over 10KB
    }
  }
  ```
- **Thresholds:** Any raster image > 50KB served as JPEG/PNG when AVIF/WebP is possible: low. LCP image in non-optimal format: medium. Total legacy format images > 500KB: medium.
- **Evidence:** List each flagged image with its URL, current format, size, and estimated savings (AVIF is typically 50% smaller than JPEG, 30% smaller than WebP).

**2. Font Loading Strategy Audit**

- **What to collect:** Count font requests from `networkRequests` (resourceType === 'font'). Parse HTML `<head>` for font preloads. Check CSS for `font-display` declarations.
- **Implementation:** Count unique font families from font request URLs. Check for preloads matching each font URL. Optionally extract `font-display` from the CSS file content.
- **Thresholds:** >3 font families: medium. >5 font families: high. Font loaded without preload and size > 50KB: low. Total font weight > 400KB: medium.
- **Evidence:** List each font with its size, whether preloaded, and its `font-display` value.

**3. Image Sizing Accuracy**

- **What to collect:** For each image in `PageSummary.images` with `width` and `height`, compare the intrinsic dimensions against the display dimensions. The intrinsic dimensions can be obtained from the image `NetworkEntry` URL parameters (Next.js Image includes `w=` width parameter) or by injecting `naturalWidth`/`naturalHeight` measurement via `page.evaluate()`.
- **Implementation:**
  ```typescript
  const imageSizing = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: img.clientWidth,
      displayHeight: img.clientHeight,
      loading: img.loading, // 'lazy' or 'eager'
      fetchpriority: img.getAttribute('fetchpriority'),
      inViewport: img.getBoundingClientRect().top < window.innerHeight
    }));
  });
  ```
- **Thresholds:** Image decoded at >2x display dimensions (accounting for devicePixelRatio): low per image, medium if >3 images. Below-fold image without `loading="lazy"`: low. Above-fold image with `loading="lazy"` (counterproductive -- delays LCP candidate): medium.
- **Evidence:** Per-image report with natural vs display dimensions and bytes wasted.

**4. Resource Transfer Efficiency**

- **What to collect:** For each resource type, compute average compression ratio by comparing `content-length` header (if available) vs actual transfer size. Check for `content-encoding: br` (Brotli) vs `gzip` vs none.
- **Implementation:** Group `networkRequests` by type. For text resources (html, css, js), check if Brotli is used (optimal) or only gzip (suboptimal for static assets).
- **Thresholds:** Any text resource > 10KB without Brotli on a CDN-served site: low. Any text resource > 10KB without any compression: medium.
- **Note:** This requires collecting per-request response headers, which is a data collection gap (currently only page-level `responseHeaders` are stored). This should be added to `NetworkEntry`.

**5. Critical Resource Chain Analysis**

- **What to collect:** Build a dependency chain: HTML -> CSS (render-blocking) -> fonts (referenced in CSS) -> LCP image (referenced in HTML/CSS). Measure the total chain depth.
- **Implementation:** From the network waterfall (using `durationMs` and request start times, which would need to be added to `NetworkEntry`), identify: (a) the critical chain length (number of sequential dependent requests before first render), (b) the critical chain latency (sum of sequential request durations on the critical path).
- **Thresholds:** Critical chain > 4 sequential requests: medium. Critical chain latency > 2000ms: high.
- **Why it matters:** Preloading, HTTP/2 push, and Early Hints exist to flatten critical chains. A deep chain means the browser is discovering resources too late because each resource references the next (HTML references CSS, CSS references fonts, JS references API data).

### Tools/Frameworks Being Ignored

- **Squoosh/libvips:** Could be integrated to compute *actual* savings for each image (re-encode to AVIF, measure size difference). Too heavy for real-time use but could power an "estimated savings" number in findings.
- **`content-visibility: auto`:** CSS property that enables native lazy rendering of off-screen content. The primitive does not check for it, but it is one of the highest-impact single CSS properties for long pages.
- **HTTP/3 detection:** Checking `alt-svc` headers or QUIC negotiation. HTTP/3 provides meaningful performance improvements for high-latency connections. Vercel supports it; the primitive should note whether it is active.
- **`fetchpriority` attribute:** The most impactful resource hint shipped in recent years. An LCP image with `fetchpriority="high"` loads significantly faster. The primitive should check for its presence on the LCP element.
- **Bundle analysis tools (webpack-bundle-analyzer, next-bundle-analyze):** These require build access, not just external observation, so they are outside Alien Eyes' scope. But the primitive could note if source maps are exposed, enabling external bundle analysis.

### Rating: 2/10

The primitive treats all bytes equally, all resource types equally, and all loading strategies equally. It does not measure image format efficiency, font loading strategy, CSS optimization, or resource dependency chains -- any of which individually would be more valuable than the current total weight check. The render-blocking bug means its one resource-specific check actively misinforms. The crawl engine collects per-request `contentType`, `size`, `durationMs`, and `resourceType` that would power most of my recommended checks, but the primitive reads none of this data.

---

## 4. Andrew Galloni -- CDN & Caching Performance

### Reaction to Current Implementation

I look at performance from the network layer up: what left the server, how it traveled, and what arrived at the browser. The performance primitive operates almost entirely at the browser layer and ignores the network layer completely.

**What is good:**

The TTFB check exists and measures something real. TTFB is the first signal of server and network health. The instinct to check it is correct.

The crawl engine stores `responseHeaders` per page, which is the richest source of CDN and caching intelligence. Response headers tell you whether content is edge-cached (`cf-cache-status`, `x-vercel-cache`), what caching policy is set (`cache-control`, `etag`, `last-modified`), whether compression is active (`content-encoding`), and what protocol is in use (`alt-svc` for HTTP/3).

**What is naive:**

The TTFB check uses a single threshold (1000ms) without context. TTFB is the sum of:

1. DNS lookup (~10-50ms, cached after first request)
2. TCP connection (~10-50ms, reused via keep-alive)
3. TLS handshake (~10-50ms, resumed after first connection)
4. Request transmission (~1-5ms)
5. Server processing time (variable)
6. Response first byte transmission (~10-50ms)

On a CDN-served site like supertrained.ai (Vercel), TTFB for edge-cached content should be under 100ms from nearby PoPs. TTFB of 200-500ms on a CDN-served site indicates a cache miss (origin fetch). TTFB of 1000ms+ on a CDN-served site indicates either a cold start (serverless function cold boot), an upstream API call in the critical path, or geographic distance to the nearest edge PoP.

The primitive flags TTFB > 1000ms as a medium finding with no distinction between "slow origin server," "cache miss," "cold start," and "geographic distance." These are entirely different problems with entirely different solutions:

- Slow origin: optimize backend code or database queries.
- Cache miss: check cache-control headers and purge strategy.
- Cold start: use edge runtime, reduce function size, or keep-warm.
- Geographic: verify CDN edge coverage and edge caching policy.

Without decomposing TTFB, the finding is not actionable.

**What is entirely missing:**

**Cache analysis.** The `responseHeaders` are collected but never analyzed for caching signals. On any CDN-served site, cache behavior is the #1 determinant of consistent performance. An edge-cached page loads in 50-150ms from anywhere in the world. A cache-miss page that falls through to the origin loads in 200-2000ms depending on origin location and processing time.

The headers that reveal caching behavior:
- `cache-control`: `max-age`, `s-maxage`, `stale-while-revalidate`, `no-store`, `private`, `public`
- `x-vercel-cache`: `HIT`, `MISS`, `STALE`, `BYPASS`, `PRERENDER`
- `cf-cache-status`: `HIT`, `MISS`, `EXPIRED`, `BYPASS`, `DYNAMIC`
- `age`: seconds since the response was generated at the edge
- `etag` / `last-modified`: conditional request support

A page with `cache-control: no-store` is served fresh from the origin on every request. A page with `cache-control: public, max-age=31536000, immutable` is served from edge cache indefinitely. These two pages have performance profiles that differ by an order of magnitude.

**Compression analysis.** Already discussed by Nolan and Katie. The `content-encoding` header (gzip, br, zstd) on each response reveals whether compression is active. Brotli provides 15-20% better compression than gzip for text assets. Vercel serves Brotli by default; other hosts may not.

**HTTP version detection.** HTTP/2 enables multiplexing (parallel requests over one connection), header compression (HPACK), and server push (mostly deprecated). HTTP/3 adds QUIC (0-RTT connection resumption, no head-of-line blocking). The performance difference between HTTP/1.1 and HTTP/2 is dramatic for sites with many resources. The primitive does not check which protocol is in use.

### Audit of supertrained.ai

**CDN behavior analysis:**

Supertrained.ai is deployed on Vercel. Vercel's edge network serves content from the nearest PoP (30+ global locations). Based on the stack:

- **Static assets** (`/_next/static/`): Served with `cache-control: public, max-age=31536000, immutable`. These are content-addressed (filename hash = content hash), so they are cached forever and invalidated by new deployments generating new filenames. This is optimal.

- **Next.js Image optimization** (`/_next/image`): Served with `cache-control: public, max-age=60, must-revalidate` by default. Images are optimized at the edge on first request, then cached. First request for a new image incurs optimization latency (200-500ms). Subsequent requests are fast.

- **HTML pages** (`/`, `/services`, `/blog/*`): Depends on the rendering strategy. If using `generateStaticParams` (static generation), pages are pre-rendered and served from CDN with long cache times. If using server-side rendering, pages are generated per-request with shorter cache times. The RSC streaming format (`__next_f`) suggests dynamic rendering with streaming, which means either ISR (Incremental Static Regeneration) or on-demand SSR.

- **API routes** (`/api/*`): Typically `cache-control: no-store` unless explicitly configured. Every request hits the serverless function.

**What I would check (and the primitive cannot):**

1. **Cache hit ratio:** Of all page requests in the crawl, how many returned `x-vercel-cache: HIT` vs `MISS`? On a well-configured Vercel site, the ratio should be >80% for marketing pages. If it is <50%, the ISR/revalidation configuration needs work.

2. **Static asset caching:** Do `/_next/static/` resources have `immutable` in their `cache-control`? This prevents conditional requests (304 Not Modified) which still incur a round-trip.

3. **Compression check:** Does every text response have `content-encoding: br` (Brotli)? Vercel serves Brotli when the client supports it. The Playwright browser supports Brotli, so every text response should be Brotli-compressed.

4. **HTTP/3 availability:** Check the `alt-svc` header for `h3` or `h3-29`. Vercel supports HTTP/3; if the `alt-svc` header is missing, something is wrong.

5. **Edge function cold start:** If any page has TTFB > 500ms but subsequent requests to the same page have TTFB < 100ms, that is a cold start pattern. The first request warms the function; subsequent requests are fast.

**Specific findings for supertrained.ai:**

- **Likely good:** Static assets cached forever with content hashing. Brotli compression active. HTTP/2 minimum, likely HTTP/3 available.
- **Potential issue:** If using App Router with `dynamic = 'force-dynamic'` or per-request data fetching (Supabase queries at request time), HTML pages may have `x-vercel-cache: MISS` on every request, negating edge caching benefits. This would show as inconsistent TTFB (sometimes 80ms, sometimes 800ms).
- **Potential issue:** First-visit image optimization latency. The first user to request `/_next/image?url=tom.avif&w=384&q=75` waits for Vercel to optimize the image. The primitive does not distinguish first-optimization from cached-optimization requests.

**What the current primitive would find:** TTFB likely under 1000ms from a US-based crawler hitting Vercel's edge -- no finding. Zero insights about caching behavior, compression, CDN configuration, or protocol version. The richest performance data source (response headers) goes completely unread.

### Top 5 Checks to Add

**1. Cache-Control Header Analysis**

- **What to collect:** From `CrawledPage.responseHeaders`, extract `cache-control`, `x-vercel-cache` (or equivalent CDN header), `age`, `etag`, `last-modified`.
- **Implementation:**
  ```typescript
  for (const page of crawl.pages) {
    const cc = page.responseHeaders['cache-control'] ?? '';
    const vercelCache = page.responseHeaders['x-vercel-cache'];
    if (cc.includes('no-store') || cc.includes('no-cache')) {
      // Page is not cached at edge -- check if it should be
      if (isStaticMarketingPage(page)) {
        // Finding: static content served without edge caching
      }
    }
    if (vercelCache === 'MISS' || vercelCache === 'BYPASS') {
      // Finding: cache miss on what should be a cached page
    }
  }
  ```
- **Thresholds:** Marketing/content page with `no-store` or `no-cache`: medium. Cache miss on pre-renderable content: low. All pages cache-miss (no edge caching at all): high.
- **Evidence:** Include the actual `cache-control` and CDN cache-status header values. Include the `age` header if present (shows how stale the cached copy is).

**2. TTFB Decomposition**

Replace the single TTFB check with a decomposed analysis.

- **What to collect:** Use CDP `Network.requestWillBeSent` and `Network.responseReceived` events to capture timing breakdown for the document request: DNS, connection, TLS, waiting (server processing), receiving.
- **Playwright implementation:**
  ```typescript
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  let documentTiming: any = null;
  cdp.on('Network.responseReceived', (params) => {
    if (params.type === 'Document') {
      documentTiming = params.response.timing;
    }
  });
  // navigate ...
  // documentTiming contains: dnsStart, dnsEnd, connectStart, connectEnd,
  // sslStart, sslEnd, sendStart, sendEnd, receiveHeadersStart, receiveHeadersEnd
  ```
- **Thresholds:** Server processing (sendEnd to receiveHeadersStart) > 500ms: medium. DNS > 100ms: low (suggests missing DNS prefetch). TLS > 100ms: low (suggests missing TLS session resumption).
- **Evidence:** Include the full timing breakdown in the finding. "TTFB is 1200ms" is not actionable. "TTFB is 1200ms: DNS 5ms, TCP 15ms, TLS 20ms, server processing 1140ms, transfer 20ms" tells the builder exactly where to look.

**3. Static Asset Cache Efficiency**

- **What to collect:** For each `networkRequests` entry with `resourceType` of `script`, `stylesheet`, or `font`, check if the URL contains a content hash (pattern: `[a-f0-9]{8,}` in the filename). Content-hashed assets should have `cache-control` with `immutable` and a long `max-age`.
- **Implementation:** Regex-match network request URLs for content hashes. Cross-reference with response caching headers (requires per-request header collection -- a data gap).
- **Thresholds:** Content-hashed asset without `immutable`: low. Non-hashed static asset (cache-busting via query string instead of filename hash): medium.
- **Why it matters:** Immutable content-hashed assets eliminate conditional requests entirely. Query-string cache busting (`style.css?v=123`) is inferior because some CDNs and proxies strip or ignore query strings.

**4. Compression Audit**

- **What to collect:** For each text-based `networkRequests` entry (HTML, CSS, JS, JSON, SVG, XML), check `content-encoding` response header. Requires per-request response headers (data gap).
- **Implementation:** Flag any text resource > 1KB without `content-encoding`. Flag any text resource using `gzip` when `br` (Brotli) is available (check `accept-encoding` in the request).
- **Thresholds:** Text resource > 10KB without compression: medium. Text resource > 100KB without compression: high. Gzip-only when Brotli is available on a CDN: low.
- **Evidence:** Estimated savings (Brotli is typically 15-20% smaller than gzip, 60-80% smaller than uncompressed).

**5. Connection Count and Domain Sharding Analysis**

- **What to collect:** From `networkRequests`, count unique origins (protocol + domain + port). HTTP/2 multiplexes all requests over a single connection per origin; additional origins require additional connections (DNS + TCP + TLS overhead each).
- **Implementation:** Group requests by origin. Count origins with >1 request.
- **Thresholds:** >6 distinct third-party origins: low. >10 origins: medium. Any origin with only 1 request and that request is < 5KB: low (the connection overhead exceeds the resource value).
- **Why it matters:** Each additional origin costs 100-300ms for the first request (DNS + TCP + TLS). Preconnect (`<link rel="preconnect">`) can mitigate this. The primitive should cross-reference origins with preconnect declarations.

### Tools/Frameworks Being Ignored

- **WebPageTest:** The only tool that provides accurate TTFB decomposition, connection view, and waterfall analysis from multiple geographic locations. The Alien Eyes primitive would benefit enormously from a single WebPageTest run per audit to get real geographic performance data.
- **CrUX API:** Real-user TTFB distribution for the origin. If CrUX shows p75 TTFB < 200ms but the synthetic test shows 900ms, the synthetic result is an outlier (geographic distance, cold start, etc.).
- **HTTP/2 and HTTP/3 feature detection:** The `SETTINGS` frame in HTTP/2 and the `QUIC` transport in HTTP/3 provide different multiplexing and prioritization capabilities. The primitive should at minimum detect which HTTP version is in use.
- **Vercel Analytics / Speed Insights API:** If the site uses Vercel, the Speed Insights API provides server-side performance data (function execution time, edge cache hit ratio, cold start frequency) that complement synthetic measurement. This is available via the Vercel REST API with a project token.
- **`Server-Timing` header:** An official W3C header for exposing server-side timing metrics. If present, it provides decomposed server processing time (database queries, API calls, rendering). The primitive does not check for it.

### Rating: 1/10

I am being harsh because the primitive has access to the most valuable network-layer data (`responseHeaders` on every crawled page, `networkRequests` with sizes and durations) and uses almost none of it. The TTFB check is the closest thing to network-layer analysis, and it uses a single threshold without decomposition, geographic context, or caching awareness. Cache-control headers are the single most impactful performance lever for CDN-served sites, and the primitive does not read them. A primitive that has access to response headers but does not analyze caching behavior is like having a stethoscope but not listening to the heart.

---

## 5. Lee Robinson -- Framework-Specific Performance (Next.js/React)

### Reaction to Current Implementation

I have personally optimized hundreds of Next.js deployments. The most common performance problems are framework-specific: incorrect rendering strategies, excessive client components, RSC payload bloat, and hydration overhead. The current primitive has exactly one framework-specific check (hydration mismatch) and four generic checks that ignore the framework entirely.

**What is good:**

The hydration mismatch detection is the single most valuable check in this primitive for Next.js sites. It catches a real problem that is invisible in Lighthouse audits and difficult to reproduce without a clean browser profile (which Alien Eyes correctly uses). The regex pattern is well-constructed -- it catches React error #418, the "didn't match" text, and the general "hydration" keyword. I would add one more pattern: `#425` (server/client component mismatch in React 19) and `Suspense` boundary errors.

The architecture decision to detect framework via `__NEXT_DATA__` in the HTML is correct. The `detectedStack` array enables framework-specific analysis. But the performance primitive does not read `detectedStack` at all. It runs the same five generic checks regardless of whether the site is WordPress, Next.js, or a static HTML file. This is a fundamental missed opportunity.

**What is naive:**

The load time measurement uses `waitUntil: 'domcontentloaded'`, which has framework-specific implications. In Next.js App Router with React Server Components:

1. The initial HTML response is a streaming RSC payload that begins rendering immediately.
2. `DOMContentLoaded` fires when the initial HTML is fully parsed, but Suspense boundaries may still be resolving.
3. Content inside `<Suspense>` boundaries streams in after `DOMContentLoaded`, so the user sees progressive loading that the metric does not capture.
4. Using `waitUntil: 'networkidle'` would wait for streaming to complete but inflates the measurement with post-render analytics and lazy-loaded content.

Neither `domcontentloaded` nor `networkidle` is the right measurement for streaming SSR. The correct measurement is "when did the largest visible content element finish rendering?" -- which is LCP.

The page weight check is particularly misleading for Next.js App Router. RSC payloads are streamed as `text/x-component` format with `__next_f` markers. These payloads are serialized React trees that the client framework interprets. They look like large text blobs in the network waterfall but are actually efficient (no JavaScript execution, just DOM patching). Counting RSC payload bytes the same as JavaScript bytes overstates the cost.

**What is a critical bug:**

The render-blocking count bug is especially severe for Next.js. Here is what happens on a Next.js App Router page:

1. One CSS file is truly render-blocking (the compiled Tailwind output).
2. The framework runtime chunks (react, react-dom, app-router) are loaded with `async` attributes via Next.js's built-in script optimization.
3. Route-specific chunks are dynamically imported.
4. None of the JavaScript chunks except possibly a small inline bootstrap are render-blocking.

The current code counts all of these as render-blocking. On a Next.js site with 15 pages in the route manifest, the primitive might count 20+ "render-blocking" resources when the actual number is 1 (the CSS file) or at most 2-3 (CSS + small inline scripts for the streaming bootstrap).

This is not just a false positive -- it is **actively misleading**. It tells the builder "you have too many render-blocking resources" when Next.js is actually doing the right thing by code-splitting and loading scripts asynchronously. The builder who follows this advice and tries to reduce the count will either break their build or waste hours investigating a non-problem.

**What is entirely missing:**

**RSC payload analysis.** React Server Components send a custom streaming format that the client interprets. The size and composition of this payload directly affects First Contentful Paint and streaming performance. On a well-optimized Next.js site, the RSC payload should be small (20-50KB per page). Bloated payloads (>100KB) indicate that too much data is being serialized into the component tree (embedding entire database records, passing large JSON objects as props, etc.).

The RSC payload is visible in network requests as responses with content type containing `text/x-component` or `RSC` markers. The primitive has access to these network entries but does not analyze them.

**Client component boundary analysis.** In Next.js App Router, the `'use client'` directive marks the boundary between server and client components. Everything below a `'use client'` boundary must be hydrated on the client, which means downloading the component code, executing it, and attaching event listeners. The optimal pattern is `'use client'` only on leaf components (buttons, forms, interactive widgets). The anti-pattern is `'use client'` on layout or page components, which forces the entire subtree to hydrate.

This cannot be fully analyzed from outside (you need the source code), but indirect signals exist:
- JavaScript bundle size per route (large bundles suggest excessive client components)
- Hydration time (measurable via Performance API -- the time between HTML parse completion and React hydration completion)
- Console warnings from React about client/server mismatches

**Route-level performance variance.** The primitive treats all pages in the crawl equally, but Next.js sites have dramatically different performance characteristics per route:
- Static pages (generated at build time): sub-100ms TTFB, fully cached
- ISR pages (revalidated periodically): first-request may be slow, subsequent requests fast
- Dynamic pages (SSR per request): TTFB depends on data fetching
- API routes: entirely different performance profile

The primitive should group pages by their rendering strategy (detectable from response headers: `x-vercel-cache`, `x-nextjs-cache`, `cache-control` patterns) and report performance per group.

### Audit of supertrained.ai

**Framework detection:**

Next.js App Router with React Server Components confirmed by:
- `__NEXT_DATA__` in HTML (though this may be minimal in App Router)
- `__next_f` streaming payload format
- `/_next/static/chunks/` path pattern for code-split bundles
- `dpl=dpl_8xbBH4ViJrb2rNuJJPV9Se1TFG7G` Vercel deployment ID

**Rendering strategy analysis:**

The homepage uses streaming SSR (RSC payload visible). This suggests either:
- `dynamic = 'force-dynamic'` (SSR every request)
- ISR with `revalidate` parameter (static-ish with periodic refresh)
- On-demand revalidation (static until explicitly invalidated)

The `x-vercel-cache` header would reveal which strategy is active. Without it, I can only observe that the streaming format is present, which means the content is not fully static (pre-rendered pages use a different delivery format).

**Bundle analysis:**

The site loads 6+ JavaScript chunks on the homepage. Based on the filenames (content hashes), these are:
- React runtime chunk
- App Router client runtime
- Root layout client components
- Homepage-specific components
- Shared component chunks (used across routes)
- Analytics/consent management

Total estimated JS: ~250-350KB compressed. For a marketing site with forms, analytics, and interactive components, this is within acceptable bounds but at the higher end. A well-optimized Next.js marketing site should aim for <200KB compressed JS on the initial page load.

**Specific findings:**

1. **Consent management in client component:** The consent banner and GA4 integration require client-side JavaScript (`'use client'`). If the consent component is in the root layout, it forces hydration of the layout on every page. This is the correct trade-off (consent must be interactive) but adds hydration cost to every page.

2. **Three custom fonts via `next/font`:** Next.js's font optimization (`next/font`) automatically generates `@font-face` declarations with `font-display: swap` and preload links. With 3 variable fonts (Inter, Lora, Caveat), this generates 3 preload tags and 3 font-face declarations. The optimization is correct, but the quantity of fonts is a design debt, not a framework issue.

3. **Image optimization via `next/image`:** The site correctly uses Next.js Image component for responsive, format-negotiated, lazy-loaded images. The AVIF/WebP mix is good. The one concern: Next.js Image defaults to `loading="lazy"` for all images. If the hero image uses `next/image` without `priority={true}`, it will be lazy-loaded, which delays LCP. The `priority` prop adds `fetchpriority="high"` and removes `loading="lazy"`.

4. **RSC payload on navigation:** Client-side navigation between pages fetches RSC payloads. If each page's RSC payload is large (>50KB), navigation feels slow. The primitive does not measure navigation performance, only initial page load.

**What the current primitive would find:** False positive on render-blocking count (Next.js async chunks counted). Possibly a borderline page weight finding. Miss all framework-specific issues (rendering strategy, RSC payload size, client component boundaries, font optimization, image priority).

### Top 5 Checks to Add

**1. Framework-Aware Render-Blocking Analysis (Fix the Bug)**

Replace the current render-blocking count with a framework-aware implementation.

- **What to collect:** Parse the HTML `<head>` and `<body>` for `<script>` and `<link rel="stylesheet">` tags. For scripts, check for `async`, `defer`, `type="module"`, or dynamic injection (no `src` in HTML, loaded via `document.createElement`). For Next.js specifically, check the `_next/static/` path pattern -- these are always async.
- **Playwright implementation:**
  ```typescript
  const renderBlocking = await page.evaluate(() => {
    const blocking: string[] = [];
    // Scripts: only truly blocking ones (no async, no defer, no module, in head)
    document.querySelectorAll('head script[src]').forEach(s => {
      if (!s.hasAttribute('async') && !s.hasAttribute('defer') && s.getAttribute('type') !== 'module') {
        blocking.push(s.getAttribute('src') ?? 'inline');
      }
    });
    // Stylesheets: all <link rel="stylesheet"> are blocking unless media="print" or disabled
    document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
      if (l.getAttribute('media') !== 'print' && !l.hasAttribute('disabled')) {
        blocking.push(l.getAttribute('href') ?? 'inline');
      }
    });
    return blocking;
  });
  ```
- **Thresholds:** >3 truly render-blocking resources: medium. >6: high. This replaces the current count of 8 with realistic thresholds.
- **Evidence:** List each blocking resource with its URL and size. Distinguish CSS (expected) from JS (problematic).
- **Priority:** P0 -- this is the critical bug fix.

**2. Next.js Rendering Strategy Detection**

- **What to collect:** For each crawled page on a detected Next.js site, check response headers for `x-vercel-cache` (HIT/MISS/STALE/BYPASS/PRERENDER), `x-nextjs-cache`, and `cache-control` patterns.
- **Implementation:**
  ```typescript
  if (crawl.detectedStack?.includes('next.js')) {
    for (const page of crawl.pages) {
      const vercelCache = page.responseHeaders['x-vercel-cache'];
      const strategy = inferRenderingStrategy(vercelCache, page.responseHeaders['cache-control']);
      // strategy: 'static' | 'isr' | 'ssr' | 'unknown'
      if (strategy === 'ssr' && isStaticContent(page)) {
        // Finding: page uses SSR when it could be static or ISR
      }
    }
  }
  ```
- **Thresholds:** Marketing page using SSR instead of static/ISR: medium (unnecessary server cost + slower TTFB). All pages SSR with no caching: high.
- **Why it matters:** The most common Next.js performance mistake is defaulting to SSR for content that changes infrequently. Switching from SSR to ISR with `revalidate: 3600` can reduce TTFB from 500ms to 50ms.

**3. Hydration Check Enhancement (React 19 + RSC)**

Extend the current hydration check for the React 19 / App Router era.

- **What to collect:** In addition to the current hydration mismatch regex, detect:
  - React Error #425 (server/client component type mismatch)
  - `Suspense` boundary fallback errors
  - "Text content did not match" warnings (common with date/time rendering)
  - `useEffect` running during SSR warnings
- **Implementation:** Extend the regex:
  ```typescript
  const reactErrors = page.consoleLogs.filter((entry) =>
    /hydration|react error #(418|425|423)|didn't match|text content does not match|suspense.*fallback|client.*server.*mismatch/i.test(entry.message)
  );
  ```
- **Also inject measurement:**
  ```typescript
  // Measure time from DOMContentLoaded to React hydration complete
  const hydrationTime = await page.evaluate(() => {
    return performance.getEntriesByName('react-hydration-complete')[0]?.startTime ?? null;
  });
  ```
- **Thresholds:** Any hydration error: medium (current). Multiple hydration errors on the same page: high. Hydration time > 500ms: medium.

**4. JavaScript Chunk Analysis (Next.js Specific)**

- **What to collect:** For Next.js sites, analyze the JavaScript chunk loading pattern. Group chunks by type:
  - Framework chunks (`_next/static/chunks/framework-*.js`) -- React runtime
  - Webpack runtime (`_next/static/chunks/webpack-*.js`) -- module loader
  - Page chunks (`_next/static/chunks/pages/*.js` or `_next/static/chunks/app/*.js`) -- route code
  - Vendor chunks (`_next/static/chunks/node_modules/*.js`) -- dependencies
  - Shared chunks (`_next/static/chunks/commons-*.js`) -- cross-route shared code
- **Implementation:** From `networkRequests`, filter by `_next/static/chunks/` pattern. Classify by filename pattern. Compute total size per category.
- **Thresholds:** Total first-load JS > 300KB compressed: medium. Framework chunk > 150KB: medium (suggests React 19 not tree-shaken properly). Any single chunk > 200KB compressed: medium (indicates a code-splitting failure).
- **Evidence:** Breakdown of JS budget by category. This is the most actionable output -- "your vendor chunk is 180KB and contains three charting libraries but this page has no charts."

**5. `next/image` and `next/font` Configuration Audit**

- **What to collect:** For Next.js sites, verify correct usage of the framework's built-in optimization primitives.
  - **Images:** Check if `/_next/image` is used (Image component). If raw `<img>` tags reference images > 10KB, the Image component is not being used. Check for `fetchpriority="high"` on above-fold images (indicates `priority={true}` prop). Check for `loading="lazy"` on above-fold images (indicates missing `priority` prop -- bug).
  - **Fonts:** Check font preload tags in `<head>`. Verify WOFF2 format. Count font families. Check for `font-display` in CSS.
- **Implementation:** Combine HTML parsing (from crawled `html`) with network request analysis.
- **Thresholds:** Above-fold image without `fetchpriority="high"`: medium (delays LCP). Raw `<img>` for images > 10KB on a Next.js site: low (missing optimization). >3 font families: low.
- **Why it matters:** Next.js provides excellent built-in optimization, but it requires correct configuration. The most common mistakes are missing `priority` on LCP images and using raw `<img>` instead of `next/image`.

### Tools/Frameworks Being Ignored

- **Next.js Bundle Analyzer (`@next/bundle-analyzer`):** External-only observation cannot replicate this, but the primitive can approximate it by analyzing chunk sizes and patterns.
- **Vercel Speed Insights:** Real-user performance data specific to the Next.js deployment. If accessible, this provides ground truth for framework-specific performance.
- **React DevTools Profiler:** Measures component render times and re-render counts. Not available externally, but the primitive could detect if React DevTools' profiling hooks are accidentally left enabled in production (a common mistake that adds overhead).
- **`next info` CLI output:** Provides framework version, config details, and dependency tree. Not accessible externally.
- **Sentry/DataDog Performance Monitoring:** If the site uses performance monitoring, the `Server-Timing` header may expose backend timing data.

### Rating: 2/10

One good check (hydration mismatch) that needs enhancement for React 19. Four generic checks that ignore the framework entirely, including one that actively produces false positives on every Next.js site (render-blocking count). The primitive does not use `detectedStack` to enable framework-specific analysis, does not analyze RSC payloads, does not check rendering strategies, and does not verify correct usage of Next.js's built-in optimization primitives (next/image, next/font). It is a framework-agnostic primitive auditing a framework-specific world.

---

## Consensus Scoring

| Expert | Rating | Rationale |
|--------|--------|-----------|
| Dr. Philip Walton | 2/10 | Zero Core Web Vitals; measuring 1990s metrics |
| Nolan Lawson | 2/10 | No main thread measurement; no JS isolation |
| Katie Hempenius | 2/10 | Resources treated as undifferentiated blob |
| Andrew Galloni | 1/10 | Rich header data collected and never analyzed |
| Lee Robinson | 2/10 | Framework-agnostic in a framework-specific world |
| **Panel Average** | **1.8/10** | |

---

## Consensus Recommendations

### P0 -- Must Fix (Critical Bugs)

**P0-1: Fix render-blocking count (CRITICAL FALSE POSITIVE)**

The current implementation counts ALL scripts and stylesheets as render-blocking. On any modern framework (Next.js, Nuxt, SvelteKit, Remix), this produces a false positive every time because these frameworks code-split and async-load JavaScript by design.

**Fix:** Replace `networkRequests.filter()` with HTML DOM inspection that checks `<script>` tags for `async`, `defer`, `type="module"` attributes, and `<link rel="stylesheet">` tags for `media="print"` or `disabled`. On Next.js sites, `_next/static/chunks/` scripts are always async.

**Implementation effort:** Small. Requires `page.evaluate()` or cheerio HTML parsing (already a dependency).

**P0-2: Replace load time metric with FCP + LCP**

`loadTimeMs` (DOMContentLoaded timing) is not a user-centric metric. It does not correlate with user-perceived speed and is misleading for streaming SSR sites where content appears progressively before `DOMContentLoaded` fires.

**Fix:** Inject `PerformanceObserver` before navigation to collect FCP and LCP. These are the standard user-centric speed metrics. The `PerformanceMetrics` type already has optional `lcpMs` field -- populate it.

**Implementation effort:** Medium. Requires `page.evaluate()` injection before `page.goto()` and retrieval after load. The `web-vitals` library can simplify this.

### P1 -- Important (Core Missing Capabilities)

**P1-1: Collect and check CLS**

CLS is the third Core Web Vital and the one most commonly caused by issues this primitive should detect (font loading, unsized images, dynamically injected content). The `PerformanceMetrics` type already has optional `cls` field.

**Fix:** Inject `PerformanceObserver` for `layout-shift` entries. Compute max session window CLS. Include shifting elements in evidence.

**Implementation effort:** Medium. Same injection pattern as LCP. Session window calculation is ~20 lines.

**P1-2: Analyze response headers for caching behavior**

The crawl engine already collects `responseHeaders` for every page. This data reveals CDN cache status, cache-control policy, compression, and HTTP version -- the most impactful performance signals for CDN-served sites. The primitive reads none of it.

**Fix:** For each crawled page, extract and analyze: `cache-control`, CDN cache-status headers (`x-vercel-cache`, `cf-cache-status`), `content-encoding`, `server-timing`. Report: pages with no caching, pages with cache misses, pages without compression.

**Implementation effort:** Small. Data already collected. Requires header parsing and threshold logic only.

**P1-3: Break page weight into per-resource-type budgets**

Total page weight is a blunt metric. JavaScript bytes cost 2-4x more than image bytes in main thread time. Font bytes cause CLS. CSS bytes gate first render.

**Fix:** Using `networkRequests` (already available with `resourceType` and `size`), report weight per type: JS total, CSS total, image total, font total, other total. Apply type-specific thresholds.

**Implementation effort:** Small. Data already collected and typed. Requires grouping and per-type threshold logic.

**P1-4: Collect Long Tasks for main thread analysis**

Long Tasks (>50ms) are the primary cause of jank, slow interactions, and poor INP. They are the direct signal for "is JavaScript blocking the main thread?" Total Blocking Time (sum of long task durations minus 50ms each) is the best synthetic proxy for INP.

**Implementation effort:** Medium. Requires `PerformanceObserver` injection (same pattern as CWV). Computation is straightforward.

**P1-5: Add framework-specific checks using `detectedStack`**

The crawl engine already detects the framework via `detectedStack`. The performance primitive ignores this entirely. For Next.js sites, add: rendering strategy detection (SSR vs ISR vs static from response headers), chunk analysis (JS budget by category from `_next/static/chunks/` URLs), `next/image` and `next/font` usage verification, RSC payload size measurement.

**Implementation effort:** Medium-Large. Requires conditional logic based on detected framework. Each framework-specific check is individually small but the aggregate is substantial.

### P2 -- Valuable (Significant Improvements)

**P2-1: Image format efficiency audit**

Check whether raster images are served in modern formats (AVIF/WebP). Flag legacy JPEG/PNG images > 50KB. Check whether the LCP image (once LCP measurement is added) is preloaded and uses `fetchpriority="high"`.

**Data requirement:** Already available in `networkRequests` (contentType, size, resourceType for images).

**P2-2: Font loading strategy audit**

Count font families, total font weight, preload status, and `font-display` strategy. Flag >3 font families, >400KB total font weight, or fonts without preloads.

**Data requirement:** Available in `networkRequests` (font entries with sizes). Preloads detectable from HTML `<head>`. `font-display` requires CSS parsing.

**P2-3: Third-party script impact isolation**

Separate first-party from third-party scripts. Report per-origin JS size and count. Flag origins contributing >100KB or >5 scripts. Note that consent-gated scripts are invisible in clean-profile crawls (document this limitation).

**Data requirement:** Already available in `networkRequests` (URL, size, resourceType).

**P2-4: TTFB decomposition**

Replace the single TTFB threshold with a decomposed analysis showing DNS, connection, TLS, and server processing time. Use CDP `Network.requestWillBeSent` timing data.

**Data requirement:** Requires CDP session (Playwright supports this). New data collection.

**P2-5: Resource hint audit (preload/preconnect/prefetch)**

Parse HTML `<head>` for resource hints. Cross-reference with actual network requests. Flag: unused preloads (wasted), critical resources without preloads (missed opportunity), third-party origins without preconnect (delayed connection).

**Data requirement:** HTML parsing (cheerio, already a dependency) + network request cross-reference.

### P3 -- Aspirational (Future Enhancements)

**P3-1: CrUX API integration**

Cross-reference synthetic measurements with real-user field data from the Chrome User Experience Report. If CrUX data is available for the origin, use it to calibrate confidence scores. Synthetic-only findings where CrUX shows "good" should have reduced confidence.

**Dependency:** CrUX API key, external HTTP request during analysis.

**P3-2: Geographic performance testing**

Run the same audit from multiple geographic locations to measure CDN consistency. A site that performs well from US-East but poorly from APAC has a CDN configuration problem, not an application problem.

**Dependency:** Worker infrastructure in multiple regions (Railway/Fly.io support this).

**P3-3: Navigation performance (SPA transitions)**

For framework sites with client-side routing, measure the performance of navigating between pages (RSC payload fetch + render), not just initial page load. This is particularly important for Next.js App Router where link prefetching and RSC streaming determine navigation speed.

**Dependency:** Requires clicking links during crawl and measuring transition timing. Significant crawl engine change.

**P3-4: CDP Performance.getMetrics() integration**

Expose Chrome's built-in performance counters: `ScriptDuration`, `TaskDuration`, `LayoutDuration`, `RecalcStyleDuration`, `JSHeapUsedSize`. These provide a complete decomposition of where browser time is spent.

**Dependency:** CDP session. Small implementation but adds significant diagnostic power.

**P3-5: Coverage API for unused JavaScript measurement**

Use CDP `Profiler.startPreciseCoverage` to measure what percentage of shipped JavaScript is actually executed during page load. Industry average is 50-70% unused. This is the most precise signal for "your JS bundles contain dead code."

**Dependency:** CDP session. Adds ~200ms overhead per page. Should be opt-in for Full Audit tier only.

---

## Data Collection Gaps

The panel identified several capabilities that require changes to the crawl engine, not just the primitive:

| Gap | Where | What to Add | Priority |
|-----|-------|-------------|----------|
| Core Web Vitals injection | `page-collector.ts` | Inject PerformanceObserver before navigation; retrieve LCP, CLS, FCP after load | P0 |
| Per-request response headers | `NetworkEntry` type + `page-collector.ts` | Store `content-encoding`, `cache-control` per request (currently only page-level) | P1 |
| CDP session access | `page-collector.ts` | Expose CDP for Performance.getMetrics, Network timing decomposition, Long Tasks | P1 |
| Request start time | `NetworkEntry` type | Add `startTimeMs` to enable waterfall reconstruction and critical chain analysis | P2 |
| Script loading attributes | `page-collector.ts` or primitive | Collect `async`, `defer`, `type` from `<script>` tags (HTML parse, not network) | P0 (for render-blocking fix) |
| CSS `font-display` extraction | Primitive or summarizer | Parse CSS content for font-face declarations | P2 |

---

## Summary

The performance primitive as implemented is a **skeleton with one good bone (hydration mismatch detection) and four broken ones**. The critical render-blocking bug produces false positives on every modern framework site. The absence of Core Web Vitals measurement means the primitive does not measure what the industry defines as "web performance" in 2026. The rich data already collected by the crawl engine (per-request sizes, durations, types, response headers) goes almost entirely unused.

The good news: the architecture is sound. The crawl engine collects the right data. The `PerformanceMetrics` type already has optional fields for `lcpMs` and `cls`. The `detectedStack` array exists for framework-specific logic. The `responseHeaders` are stored. The primitives infrastructure (BasePrimitive, evidence bundles, finding schema) is well-designed. The path from 1.8/10 to 7/10 is straightforward engineering work, not architectural redesign.

**Estimated effort to reach 7/10:**
- P0 fixes (render-blocking bug + CWV injection): ~8-12 hours
- P1 additions (caching, per-type budgets, long tasks, framework checks): ~16-24 hours
- Total: ~24-36 hours of focused implementation

**The single most impactful change:** Inject `PerformanceObserver` before navigation and collect LCP, CLS, and FCP. This single change transforms the primitive from "generic timing checks" to "Core Web Vitals auditor" and addresses the primary criticism from every panelist.
