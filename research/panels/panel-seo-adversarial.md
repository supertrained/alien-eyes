# Alien Eyes SEO Primitive -- Adversarial Expert Panel

> Date: 2026-03-13
> Panel Type: SEO Specialist Review
> Subject: Alien Eyes `SeoPrimitive` (src/primitives/seo.ts)
> Audit Target: supertrained.ai (live, March 13 2026)
> Panelists: 5 SEO specialists covering Technical SEO, Content SEO, International/Enterprise SEO, Core Web Vitals/Page Experience, and Structured Data/Schema
> Format: Each expert delivers independent assessment with their own audit of supertrained.ai, then cross-references

---

## Panel Roster

| # | Name | Title | Credentials |
|---|------|-------|-------------|
| 1 | **Aleyda Solis** | International SEO Consultant & Founder, Orainti | Author of "SEO for the AI Era" (O'Reilly, 2025). Creator of the SEO FOMO newsletter (95K+ subscribers). Google Search Central advisory panel member. Built international SEO frameworks for 200+ enterprise migrations. Speaker at 300+ conferences (BrightonSEO, SearchLove, SMX). Specializes in technical crawlability, hreflang, indexation control, and JavaScript rendering for search. |
| 2 | **Kevin Indig** | VP of SEO & Content Strategy, Shopify | Former Director of SEO at Atlassian and G2. Creator of the "Growth Memo" newsletter. Built the SEO infrastructure serving 45M monthly organic sessions at Shopify. Pioneered topical authority measurement at scale. Published research on semantic gap analysis and content-market fit scoring. Expert in content architecture, internal linking topology, and cannibalization detection. |
| 3 | **Martin Splitt** | Senior Developer Advocate (Search), Google | Former member of Google's Search Relations team. Creator of the "JavaScript SEO" video series. W3C Web Sustainability Working Group participant. Led the Rendering team's developer outreach. Deep expertise in how Googlebot renders JavaScript frameworks, hydration impact on indexing, Core Web Vitals measurement methodology, and the intersection of web performance and search ranking. |
| 4 | **Barry Adams** | Technical SEO Consultant & Founder, Polemic Digital | 20 years in technical SEO. Former SEO lead at News UK (The Times, The Sun). Creator of the "Type of Search" taxonomy used by major news publishers. Expert in crawl budget optimization, log file analysis, edge SEO (Cloudflare Workers, Vercel Edge Middleware), and rendering behavior. Built technical SEO audit frameworks used by 50+ agencies. Specializes in what automated tools miss vs. manual crawl analysis. |
| 5 | **Martha van Berkel** | CEO & Co-Founder, Schema App | W3C Schema.org Community Group participant. Former Bing Webmaster Tools advisory board. Built Schema App's enterprise structured data platform used by Fortune 500 companies. Published research on structured data's impact on rich results, AI training data, and knowledge graph integration. Leading authority on JSON-LD implementation, schema validation, and the role of structured data in AEO/GEO. |

---

## Expert 1: Aleyda Solis (Technical SEO & Crawlability)

### 1. Reaction to Current 9 Checks

**What is solid:**
- The canonical URL checks (missing + wrong) are the right foundation. The `isWrongCanonical()` function correctly normalizes URLs by stripping trailing slashes, hashes, and query strings before comparison. This is better than many production SEO tools that do naive string matching.
- Checking for duplicate titles across pages is correct and the `normalizePageIdentity()` helper properly deduplicates URL variants.
- The severity assignments are reasonable: wrong canonical as CRITICAL, missing canonical as MEDIUM. I would personally elevate wrong canonical even further -- it is the single most destructive technical SEO issue because it actively tells search engines to ignore the page.

**What is naive:**
- The stale meta description check (lines 68-83) is hardcoded to `/services` with specific regex patterns for "workflow automation|custom ai agents|managed ai operations" vs "revenue signal sprint|demand capture sprint|reliability sprint." This only works for supertrained.ai. It is not a generalizable SEO check -- it is a regression test for one site. This should be either removed entirely or replaced with a semantic comparison between meta description content and page body content (which would require the LLM layer).
- The `hasDuplicateBrand()` function splits only on `|` (pipe). Real title separators include `|`, `-`, `--`, `:`, and `>`. The title "Generative Engine Optimization (GEO): What It Is and How to Do It | Supertrained | SuperTrained" on supertrained.ai would be caught because it uses pipes, but a title like "About - SuperTrained - SuperTrained" would not. The function name overpromises.
- The heading gap check is simplistic. It flags `h1 -> h3` as a gap but does not flag multiple `<h1>` elements on a single page (a common SEO issue), does not flag the absence of any `<h1>` at all, and does not flag a page starting with `<h2>` instead of `<h1>`.

**What is missing that shocks me:**
- **No robots.txt analysis.** The CrawlResult literally contains `robotsTxtStatus` and the primitive ignores it entirely. If robots.txt blocks pages, that is an immediate indexation issue.
- **No sitemap validation.** The crawl discovers pages. The sitemap lists pages. Comparing these two sets is one of the most valuable technical SEO checks: pages in sitemap but not crawlable (broken sitemap), pages crawlable but not in sitemap (orphaned from sitemap), and sitemap URLs returning non-200 status codes. This is free cross-referencing that requires zero new data.
- **No status code analysis.** The PageSummary contains `statusCode`. A page returning 404, 500, or 3xx is a fundamental crawlability problem. The primitive never looks at it.
- **No internal linking analysis.** The PageSummary contains `links` with `href`, `text`, and `isInternal`. Internal linking topology is the #1 tool site owners have to distribute PageRank and signal content hierarchy. Orphaned pages (no internal links pointing to them), thin anchor text, and excessive link equity dilution are all detectable from data already in the PageSummary.
- **No meta robots/noindex detection.** A `<meta name="robots" content="noindex">` tag on a page that should be indexed is a CRITICAL issue. The `metaTags` object in PageSummary contains all meta tags. This check is trivially implementable.
- **No title length validation.** The methodology document (Section 5) explicitly lists "Title tag present, unique, <60 chars" as a check. The primitive does not implement it. Titles over 60 characters get truncated in SERPs.

### 2. My Audit of supertrained.ai

Running my own technical SEO audit against the live site as of March 13, 2026:

**Finding T1: Blog post canonicals point to /blog index page (CRITICAL)**

The blog post "What Is the Drudgery Tax?" at `/blog/what-is-the-drudgery-tax` has `<link rel="canonical" href="https://supertrained.ai/blog">`. This tells Google that the article is a duplicate of the blog index page. Google will likely deindex the individual blog post and only rank the /blog listing page. Since blog posts are the site's primary content marketing vehicle, this may affect all 8 blog posts -- which would collapse the site's entire content marketing indexation.

The current primitive would detect this via `isWrongCanonical()` and flag it correctly. **This one the primitive catches.** But it would only flag it as a per-page issue, not identify the systemic pattern (all blog posts may share this misconfiguration).

**Finding T2: og:title and og:description fall back to homepage defaults on multiple pages (HIGH)**

Pages observed with generic homepage OG tags:
- `/drudgery-tax`: og:title = "SuperTrained | AI Automation Agency", og:description = "Boutique AI automation agency..."
- `/trust`: og:title = "SuperTrained | AI Automation Agency", og:description = "Boutique AI automation agency..."

These pages have correct, page-specific `<title>` and `<meta name="description">` tags but their Open Graph equivalents fall back to site-wide defaults. This means every social share of the Trust Center or Drudgery Tax Calculator shows "AI Automation Agency" instead of the actual page content.

The current primitive checks for missing og:title and duplicate og:descriptions, but does NOT check for og:title or og:description that duplicates the homepage values when the page's own `<title>` differs. The pattern is: `og:title !== title` on a non-homepage page where og:title equals the homepage's og:title.

**Finding T3: /generative-engine-optimization title contains duplicate brand with casing mismatch (MEDIUM)**

Title: "Generative Engine Optimization (GEO): What It Is and How to Do It | Supertrained | SuperTrained"

This contains "Supertrained" and "SuperTrained" -- the brand name appears twice with different casing. The current `hasDuplicateBrand()` lowercases before comparison and would catch this. **The primitive catches this one.**

**Finding T4: Services page meta description references valid but potentially misaligned service taxonomy (MEDIUM)**

The /services meta description reads: "Workflow Automation, Custom AI Agents, Managed AI Ops, and Fractional AI Department. From discovery to deployment to ongoing optimization. Pricing from $10K."

The page content now organizes around a "Discover / Build / Run" methodology. The meta description mentions the service categories correctly (they still appear as section headers on the page), but the primary framing has shifted. The current hardcoded check (lines 68-83) looks for "revenue signal sprint|demand capture sprint|reliability sprint" in the body text, which no longer matches. The hardcoded check is fragile and depends on specific strings that may not be present as the site evolves.

**Finding T5: All 40 sitemap URLs share identical lastmod timestamp (MEDIUM)**

Every URL in sitemap.xml shows `2026-03-11T19:14:37.577Z`. This is a build-time generation artifact from Next.js. Google has stated that identical lastmod dates across all URLs signals "we don't trust this sitemap's freshness information." The sitemap becomes effectively useless for prioritizing crawl freshness. Each page should have its own actual last-modification date.

The current primitive cannot detect this because it never reads sitemap data. The CrawlResult collects sitemap URLs but the SEO primitive ignores them entirely.

**Finding T6: JSON-LD structured data contains stale service names (MEDIUM)**

The `ProfessionalService` schema on every page lists `makesOffer: ["Custom AI Agents", "Workflow Automation", "Managed AI Operations", "Fractional AI Department"]`. Yet the services page now presents offerings through a Discover/Build/Run methodology with different names: "AI Marketing Systems" appears as a Build Phase service. The structured data should reflect the current service taxonomy, not the legacy one.

The current primitive does not analyze structured data content for consistency with on-page content. The LLM layer might catch this, but the prompt is generic ("Find at most two SEO-quality issues") and does not specifically instruct comparison of structured data against visible content.

**Finding T7: No hreflang tags despite "areaServed: Worldwide" in schema (LOW)**

The site declares worldwide service area in its JSON-LD but has no `<link rel="alternate" hreflang="x">` tags. For a site currently serving only English content, this is not urgent. But it means the site explicitly tells Google it serves worldwide audiences while providing no language/region targeting signals. If the site ever adds localized content, the absence of hreflang from day one will create indexation confusion.

### 3. Top 5 Checks I Would Add

**Check 1: Meta robots / noindex detection (Deterministic -- zero new data)**

```
For each page in summaries:
  1. Read metaTags['robots']
  2. If contains 'noindex': flag as CRITICAL (confidence 0.98)
  3. If contains 'nofollow' on a page with internal links: flag as HIGH (confidence 0.95)
  4. If contains 'none': flag as CRITICAL (confidence 0.98)
  5. Check X-Robots-Tag in responseHeaders (from CrawlResult) for same directives
```

Data needed: `metaTags['robots']` (already in PageSummary), `responseHeaders` (in CrawlResult). Severity: CRITICAL if noindex is on a page that should be indexed. Implementation: Deterministic. 10 lines of code.

**Check 2: Status code analysis (Deterministic -- zero new data)**

```
For each page in summaries:
  1. If statusCode === 404: flag as HIGH (page in sitemap but returns 404)
  2. If statusCode >= 500: flag as CRITICAL (server error)
  3. If statusCode === 301/302: flag as MEDIUM (redirect chain in sitemap or nav)
  4. If statusCode === 410: flag as LOW (intentionally removed)
For internal links across all pages:
  1. Cross-reference link destinations with crawled page status codes
  2. Internal links to 404 pages: flag as MEDIUM per broken link
```

Data needed: `statusCode` (already in PageSummary). Severity: varies. Implementation: Deterministic.

**Check 3: Sitemap-crawl cross-reference (Deterministic -- needs minor extraction)**

```
1. Parse sitemap URLs (already discovered in crawl)
2. Compare against crawled page URLs
3. Pages in sitemap but not crawled: flag as MEDIUM (possible crawl blocks, robots exclusions)
4. Pages crawled but not in sitemap: flag as LOW (missing from sitemap)
5. Sitemap URLs returning non-200: flag as HIGH
6. All sitemap lastmod dates identical: flag as MEDIUM (useless freshness signal)
```

Data needed: Sitemap URL list (CrawlResult discovers these but does not expose them as a structured field), crawled page URLs + status codes. Needs a `sitemapUrls` field on CrawlResult. Severity: MEDIUM for most findings. Implementation: Deterministic.

**Check 4: Internal link graph analysis (Deterministic -- zero new data)**

```
1. Build adjacency graph from all pages' internal links
2. Orphaned pages: pages crawled but no other crawled page links to them. Flag as MEDIUM.
3. Link equity concentration: if >50% of internal links point to <5 URLs, flag as LOW (over-concentration)
4. Pages with zero outbound internal links (dead ends): flag as MEDIUM
5. Anchor text analysis: internal links with empty text, "click here," or "read more": flag as LOW
```

Data needed: `links[]` (already in PageSummary). Severity: MEDIUM. Implementation: Deterministic. This is pure graph analysis on data already collected.

**Check 5: Title and description quality validation (Deterministic + LLM)**

```
Deterministic:
  1. Title missing: flag as HIGH (confidence 0.98)
  2. Title > 60 characters: flag as LOW (confidence 0.92)
  3. Title < 20 characters: flag as LOW (confidence 0.85)
  4. Meta description > 160 characters: flag as LOW (confidence 0.90)
  5. Meta description < 70 characters on key pages: flag as LOW (confidence 0.80)
  6. Duplicate meta descriptions across pages: flag as MEDIUM (confidence 0.90)

LLM (full_audit only):
  7. Compare meta description semantic meaning against sanitizedTextContent
  8. If description promises content the page doesn't deliver: flag as MEDIUM (confidence 0.75)
  9. Compare og:title against page title -- if og:title matches homepage while title doesn't: flag as MEDIUM
```

Data needed: All already in PageSummary. Implementation: Deterministic for length/duplication, LLM for semantic comparison.

### 4. Tools/Frameworks/Data Sources We Are Ignoring

- **Screaming Frog / Sitebulb** -- Industry-standard crawl-based SEO audit tools. Their check lists (300+ items in Screaming Frog) represent decades of accumulated SEO knowledge. We should map our checks against their categories.
- **Google Search Console API** -- Real indexation data (which pages Google actually indexed, which have errors, which queries drive traffic). We cannot access this without site owner credentials, but we should document this as a data gap.
- **CrUX (Chrome User Experience Report)** -- Real-user performance data that Google uses for rankings. Available via the CrUX API for domains with sufficient traffic. Free, public data.
- **IndexNow / Google Indexing API** -- Real-time indexation state. Not directly useful for auditing but relevant context.
- **Ahrefs/Semrush/Moz** -- Backlink profiles, domain authority, keyword rankings. These are external signals we cannot measure from crawl data alone but represent the majority of what SEO professionals evaluate.
- **Google's URL Inspection API** -- Programmatic access to Google's rendering and indexation status per URL. Requires Search Console verification.

### 5. Rating: 3/10

The primitive catches the most catastrophic issue (wrong canonicals) and a few housekeeping items (missing og:title, duplicate titles). But it misses fundamental technical SEO signals that are already present in the data it receives: status codes, robots meta, sitemap validation, internal linking, title length. These are not aspirational features requiring new infrastructure -- they are 20-line deterministic checks on data already in PageSummary and CrawlResult. A professional SEO audit tool that ignores status codes and has no sitemap cross-referencing is not ready for production use.

---

## Expert 2: Kevin Indig (Content SEO & Topical Authority)

### 1. Reaction to Current 9 Checks

**What is good:**
- The architecture of running deterministic checks first and then optionally layering LLM analysis is the right approach. Most SEO tools either do everything deterministically (missing nuance) or everything with AI (expensive, slow, inconsistent). The hybrid is correct.
- Checking for duplicate og:descriptions across pages is a signal most tools miss. Social sharing metadata is often an afterthought, and catching generic templated values is genuinely useful.

**What is missing that matters for content SEO:**

This primitive is entirely focused on **metadata hygiene**. It checks tags -- canonical, description, og:title, headings. It does NOT evaluate the content itself in any meaningful way. For a tool positioning itself as "the alien perspective," the most valuable thing an outsider can do is tell you whether your content actually covers what it claims to cover. This primitive cannot do that.

Specific gaps:

1. **No thin content detection.** The methodology document lists "Content thin-ness (< 200 words on key pages)" as a check. The primitive does not implement it. The `sanitizedTextContent` field exists in PageSummary. A word count check is trivial.

2. **No topical coherence analysis.** A page titled "Generative Engine Optimization" should have semantically related terms: "AI search," "citation," "semantic density," etc. Whether those terms are present is a content quality signal. The primitive has `sanitizedTextContent` and does nothing with it in deterministic mode.

3. **No content-metadata alignment.** The most valuable content SEO check is: "Does the meta description accurately represent what the page contains?" This requires comparing `metaTags.description` against `sanitizedTextContent`. The LLM layer could do this but the prompt is too vague -- it says "find SEO-quality issues" without specifically directing the model to check content-metadata alignment.

4. **No keyword cannibalization detection.** When two pages target the same search intent (e.g., `/meo` and `/blog/what-is-meo`), they compete against each other in search results. Detecting title similarity across pages is a start (the duplicate title check), but cannibalization happens at the intent level, not the literal title level.

5. **No internal linking context.** The primitive ignores the `links[]` array entirely. Anchor text is the strongest on-page signal of what a page is about. If every internal link to `/services` uses the anchor text "Learn more" instead of "AI automation services," that is a missed ranking opportunity.

### 2. My Audit of supertrained.ai

**Finding C1: Content-metadata mismatch pattern across service-adjacent pages (HIGH)**

The `/drudgery-tax` page has:
- og:title: "SuperTrained | AI Automation Agency" (homepage default)
- og:description: "Boutique AI automation agency..." (homepage default)
- page title: "Drudgery Tax Calculator | SuperTrained"
- meta description: "Calculate how much repetitive work costs your team annually..."

The page-specific title and description are correct, but the OG tags fall back to homepage defaults. This is a templating bug in the Next.js layout -- the OG tags are likely set at a layout level and individual pages fail to override them. The pattern suggests it affects multiple pages beyond just `/drudgery-tax` and `/trust`.

The current primitive checks for missing og:title (it is not missing -- it is wrong) and duplicate og:descriptions (it would catch the duplicated text but not identify it as a "fallback to homepage" pattern vs. intentional reuse).

**Finding C2: Blog content cluster has no internal linking hub (MEDIUM)**

The blog index at `/blog` lists 8 articles. But the articles themselves do not link to each other. For a content cluster strategy to work (which is what the MEO/GEO/AEO articles represent), articles must interlink to establish topical authority. The GEO article should link to the MEO article and vice versa. The "Drudgery Tax" article should link to case studies that demonstrate drudgery tax elimination.

The current primitive has access to `links[]` on every page but never analyzes cross-page internal linking patterns.

**Finding C3: Thin content on interactive tool pages (MEDIUM)**

The `/drudgery-tax` calculator page and `/blueprint` interactive tool page have very little static text content (approximately 150-200 words each). Google's helpful content update penalizes thin pages. Interactive tools that generate content dynamically are fine for users but problematic for crawlers that only see the initial static HTML.

The current primitive has `sanitizedTextContent` but does not measure word count. A 200-word threshold for key pages (non-legal, non-contact) would catch this.

**Finding C4: Topical overlap creates cannibalization risk between /meo, /generative-engine-optimization, and blog posts (MEDIUM)**

- `/meo` targets: "Meaning Engine Optimization"
- `/generative-engine-optimization` targets: "Generative Engine Optimization"
- Blog posts on the same topics exist or are likely (the blog has "What Is Generative Engine Optimization?" and "GEO vs. SEO" articles)

These pages cover heavily overlapping topics. The /generative-engine-optimization landing page and any blog version of the same topic will compete for the same queries. The landing page is 2,400 words. Google must choose which to rank -- and may choose neither if it considers them near-duplicates.

The current primitive detects duplicate titles (exact match only) but cannot detect semantic cannibalization. This would require either: (a) LLM-powered semantic similarity scoring between page summaries, or (b) a simpler heuristic: pages with >3 overlapping H2 headings covering the same subtopics.

**Finding C5: FAQ structured data on /meo but questions don't appear in page headings (LOW)**

The /meo page has FAQPage schema with 4 questions, but these questions are not rendered as visible headings on the page. Google has increasingly penalized "invisible FAQ" implementations where the structured data describes content that is not prominent in the page itself. This is a content-schema alignment issue.

### 3. Top 5 Checks I Would Add

**Check 1: Thin content detection (Deterministic -- zero new data)**

```
For each page in summaries:
  wordCount = sanitizedTextContent.split(/\s+/).length
  If page is NOT legal/privacy/terms/contact:
    If wordCount < 200: flag as MEDIUM (confidence 0.88)
    If wordCount < 50: flag as HIGH (confidence 0.92)
  If page IS a blog post:
    If wordCount < 500: flag as MEDIUM (confidence 0.85)
```

Data needed: `sanitizedTextContent` (already in PageSummary), URL pattern to classify page type. Implementation: Deterministic. 15 lines.

**Check 2: Content-metadata semantic alignment (LLM -- zero new data)**

```
For full_audit tier:
  For each page:
    1. Extract first 200 words of sanitizedTextContent
    2. Compare against metaTags.description
    3. Ask Sonnet: "Does this meta description accurately represent the page content?
       Rate alignment 1-10. If < 5, identify the mismatch."
    4. If alignment < 5: flag as MEDIUM (confidence from LLM)
    5. Same check for og:description vs content
```

Data needed: Already in PageSummary. Implementation: LLM layer. Adds 1 Sonnet call per page.

**Check 3: OG tag homepage-fallback detection (Deterministic -- zero new data)**

```
1. Identify homepage (URL path = '/')
2. Record homepage og:title and og:description
3. For every non-homepage page:
   If og:title === homepage_og_title AND page.title !== homepage_title:
     flag as MEDIUM (confidence 0.92) -- "OG title falls back to homepage default"
   If og:description === homepage_og_description AND page.metaTags.description !== homepage_description:
     flag as MEDIUM (confidence 0.92) -- "OG description falls back to homepage default"
```

Data needed: Already in PageSummary. Implementation: Deterministic. 20 lines. This catches the supertrained.ai pattern where `/trust`, `/drudgery-tax`, and others inherit homepage OG tags.

**Check 4: Internal link anchor text quality (Deterministic -- zero new data)**

```
For all pages, aggregate internal links:
  Build map: destination_url -> [anchor_texts]
  For each destination:
    If >50% of anchor texts are generic ("Learn more", "Click here", "Read more", "See details"):
      flag as LOW (confidence 0.82)
    If >50% of anchor texts are empty (image links without alt):
      flag as MEDIUM (confidence 0.88)
    If destination has zero inbound internal links from crawled pages:
      flag as MEDIUM (confidence 0.90) -- orphaned page
```

Data needed: `links[]` (already in PageSummary). Implementation: Deterministic.

**Check 5: Heading-based cannibalization heuristic (Deterministic + LLM)**

```
Deterministic:
  For every pair of pages:
    h2_overlap = count of identical or near-identical H2 headings
    If h2_overlap >= 3: flag as LOW (confidence 0.7) -- "potential topic overlap"

LLM (full_audit):
  For flagged pairs:
    Ask Sonnet: "These two pages have overlapping headings. Do they target
    the same search intent? If yes, which should be the canonical version?"
  If yes: elevate to MEDIUM (confidence from LLM)
```

Data needed: `headings[]` (already in PageSummary). Implementation: Deterministic heuristic + LLM confirmation.

### 4. Tools/Frameworks We Are Ignoring

- **Clearscope / SurferSEO / MarketMuse** -- Content optimization tools that score content against SERP competitors. They define the "content quality" standard that most SEO professionals use. We cannot replicate their SERP analysis without external data, but we can approximate topical coverage scoring using the LLM layer.
- **Google Natural Language API** -- Entity extraction and salience scoring. Would let us identify whether a page's primary entities match its title/description intent.
- **TF-IDF / BM25 on crawled content** -- We have `sanitizedTextContent` for every page. Computing term frequency across the site corpus would reveal keyword concentration, cannibalization, and topical gaps without any external data.
- **Internal link equity modeling (PageRank approximation)** -- With the link graph already in PageSummary data, we could compute an approximate PageRank distribution across pages. This would reveal which pages the site's own architecture treats as important vs. which are orphaned.

### 5. Rating: 2/10

This primitive audits metadata. It does not audit content. For an SEO tool in 2026, metadata hygiene is table stakes -- the real value is in content quality, topical authority, and search intent alignment. The primitive has all the data it needs to do content analysis (sanitizedTextContent, headings, links) and ignores all of it. The LLM layer's prompt is too vague to compensate. A content-blind SEO auditor is like a restaurant inspector who checks the menu but never tastes the food.

---

## Expert 3: Martin Splitt (Core Web Vitals, Page Experience & JavaScript SEO)

### 1. Reaction to Current 9 Checks

**What is architecturally correct:**
- Running Playwright to get the rendered DOM is exactly right for JavaScript-heavy sites. Googlebot uses a Chromium-based renderer, so crawling with Playwright gives you parity with what Google actually sees. Many SEO tools still check server-rendered HTML only and miss client-side hydrated content entirely.
- The crawl-first architecture (ADR-002) where a single browser session captures everything and then primitives analyze the result is the correct approach. It mirrors how Googlebot works: render once, analyze everything from the rendered state.

**What misunderstands how Google Search works:**

1. **Heading hierarchy "gaps" are not an SEO issue.** The check at lines 96-106 flags pages where headings skip levels (h1 -> h3). Google's John Mueller has stated repeatedly that heading levels do not need to be sequential for SEO purposes. Googlebot uses headings as content structure signals but does not penalize gaps. An h1 followed by an h3 is perfectly fine. This check produces false positives for SEO (it may have accessibility value, but that belongs in the accessibility primitive, not the SEO primitive).

   The heading hierarchy check should be MOVED to the accessibility primitive (where it is an actual WCAG SC 1.3.1 concern) and REMOVED from the SEO primitive. In the SEO primitive, the heading checks should be: (a) missing h1, (b) multiple h1 elements on a single page (still debated but a common recommendation), (c) h1 content that does not align with the page's title tag.

2. **The OG tag checks are not SEO.** og:title, og:description, and og:image affect social sharing previews (Facebook, LinkedIn, Slack, Twitter cards). They have zero direct impact on Google Search ranking or indexation. Google does not read Open Graph tags for ranking purposes. These checks are valid -- they belong in a "social sharing" or "distribution quality" dimension, not in the SEO primitive. Including them inflates the SEO finding count with non-SEO issues.

3. **The `confidence` scores are arbitrary.** The canonical missing check has confidence 0.95. Why not 0.98? Or 1.0? A deterministic check that finds a missing canonical tag is either correct or not -- the confidence should be 1.0 for the detection and the severity should reflect the ambiguity (maybe the page intentionally has no canonical). Mixing detection confidence with "is this actually a problem?" confidence in one number makes the score uninterpretable.

**What is missing from a Core Web Vitals / page experience perspective:**

4. **No CWV-SEO integration.** The PerformanceMetrics type includes `lcpMs` and `cls`, but the SEO primitive never looks at them. Since November 2023, Core Web Vitals (LCP, CLS, INP) are a confirmed Google ranking signal. A page with LCP > 2.5s has a measurable ranking disadvantage. The SEO primitive should at minimum flag pages where CWV metrics cross Google's "poor" thresholds, since this directly impacts search ranking.

5. **No JavaScript rendering analysis.** The primitive does not compare the server-rendered HTML (what Googlebot first sees) against the client-rendered DOM (what Playwright captures after hydration). If critical SEO content (titles, h1, meta descriptions, structured data) only appears after JavaScript execution, that content may not be indexed because Googlebot's rendering queue has delays of hours to days. The CrawlResult has both `html` (raw) and the rendered state -- comparing them would be tremendously valuable.

### 2. My Audit of supertrained.ai

**Finding M1: Animated counters render as zero in server-side HTML (HIGH)**

The homepage statistics section ("20 hrs/week saved," "$50K+/yr recovered," "80% reduction") renders as "0 hrs/week," "$0K+/yr," and "0%" in the initial HTML. These values only animate to their real numbers after JavaScript executes and the viewport scrolls to their position.

Googlebot renders JavaScript but with a delay. The initial server-rendered HTML contains zero values. If Googlebot processes the page before the counters animate (which depends on viewport simulation), it indexes the zero values. This means Google's knowledge graph and featured snippets would show "0 hrs/week saved" as a factual claim about the company's results.

The current audit from March 5 caught this as Finding 4 (accessibility). But the SEO primitive does not detect it because it has no mechanism to compare initial server-rendered content against post-JavaScript content. The data exists in CrawlResult: `html` (server-rendered) is available alongside the Playwright-captured state.

**Finding M2: React hydration errors on /blog, /work, /blueprint (MEDIUM)**

Console error `#418` (hydration mismatch) indicates the server-rendered HTML disagrees with the client-rendered React tree. From Google's perspective, this means:
- The content Googlebot indexes (server-rendered) may differ from what users see (client-rendered)
- The hydration failure causes React to discard the SSR tree and re-render, which wastes the SSR performance benefit and increases LCP

The current primitive has no mechanism to read console errors. The PageSummary contains `consoleSummary` with `errorCount` and `sampleErrors`. A check for hydration-specific errors (React #418, #423, #425) would be valuable because these directly impact SEO through content discrepancy and performance degradation.

**Finding M3: No INP (Interaction to Next Paint) measurement (LOW)**

INP replaced FID as a Core Web Vital in March 2024. The PerformanceMetrics type includes `lcpMs` and `cls` but not INP. Since INP is now a ranking signal, its absence means we cannot provide a complete CWV assessment for SEO. INP requires user interaction simulation (click, tap, keystroke) to measure, which makes it harder than LCP/CLS but not impossible with Playwright.

**Finding M4: Render-blocking resources delay First Contentful Paint (LOW)**

The PerformanceMetrics includes `renderBlockingCount` and the homepage reportedly loads quickly (TTFB 16ms). But across the 40-page site, individual pages may have different render-blocking behavior. The SEO primitive does not surface render-blocking resources as an SEO concern despite their direct impact on CWV scores and therefore ranking.

### 3. Top 5 Checks I Would Add

**Check 1: Server-rendered vs. client-rendered content comparison (Deterministic -- needs minor new extraction)**

```
For each page:
  1. Parse the raw HTML (from CrawlResult.pages[].html) to extract:
     - <title>
     - <meta name="description">
     - <h1>
     - JSON-LD structured data
     - Text content of first 1000 characters
  2. Compare against PageSummary values (from rendered DOM)
  3. If title differs: flag as HIGH (confidence 0.95)
  4. If h1 differs: flag as HIGH (confidence 0.95)
  5. If structured data differs: flag as MEDIUM (confidence 0.90)
  6. If body text content <50% overlap: flag as MEDIUM (confidence 0.85)
```

Data needed: CrawlResult.pages[].html (already collected) + PageSummary (already extracted). Needs a helper function to parse raw HTML for comparison. Implementation: Deterministic HTML parsing comparison.

**Check 2: Console error to SEO impact classification (Deterministic -- zero new data)**

```
For each page:
  If consoleSummary.errorCount > 0:
    For each sampleError:
      If matches /hydration|#418|#423|#425/: flag as MEDIUM (confidence 0.85)
        reason: "React hydration mismatch may cause content discrepancy between server and client"
      If matches /ChunkLoadError|Loading chunk/: flag as MEDIUM (confidence 0.80)
        reason: "Code splitting failure may leave content un-rendered"
```

Data needed: `consoleSummary` (already in PageSummary). Implementation: Deterministic pattern matching. 10 lines.

**Check 3: CWV threshold crossing (Deterministic -- zero new data)**

```
For each page:
  If performanceMetrics.lcpMs > 4000: flag as HIGH severity for SEO (confidence 0.92)
  If performanceMetrics.lcpMs > 2500: flag as MEDIUM severity for SEO (confidence 0.90)
  If performanceMetrics.cls > 0.25: flag as HIGH severity for SEO (confidence 0.90)
  If performanceMetrics.cls > 0.1: flag as MEDIUM severity for SEO (confidence 0.88)
  Note: These are separate from the performance primitive -- here we flag them
  specifically as ranking signals. The performance primitive measures them as UX concerns.
  The SEO primitive connects them to search ranking impact.
```

Data needed: `performanceMetrics` (already in PageSummary). Implementation: Deterministic. Needs coordination with performance primitive to avoid duplicate findings (add to causalChain).

**Check 4: Missing H1 or multiple H1 detection (Deterministic -- zero new data)**

```
For each page:
  h1Count = headings.filter(h => h.level === 1).length
  If h1Count === 0: flag as MEDIUM (confidence 0.92)
  If h1Count > 1: flag as LOW (confidence 0.80)
  If h1Count === 1 AND page.title exists:
    If h1 text shares <30% words with title: flag as LOW (confidence 0.70)
    reason: "H1 and title tag target different topics"
```

Data needed: `headings[]` and `title` (already in PageSummary). Implementation: Deterministic.

**Check 5: Page indexability composite signal (Deterministic -- zero new data)**

```
For each page:
  indexabilityScore = 100
  If metaTags['robots'] contains 'noindex': indexabilityScore = 0 (CRITICAL)
  If canonical points elsewhere: indexabilityScore -= 50 (covered by existing check)
  If statusCode !== 200: indexabilityScore -= 40
  If page has zero inbound internal links: indexabilityScore -= 20
  If page is not in sitemap: indexabilityScore -= 10

  This composite score gives a single number for "can Google actually index this page?"
  Flag as: CRITICAL if 0, HIGH if < 30, MEDIUM if < 60
```

This is a meta-check that synthesizes multiple signals into one finding rather than reporting 5 separate low-severity findings. It addresses the problem of finding atomization -- where 5 small issues that individually score LOW combine to make a page effectively un-indexable.

### 4. Tools/Frameworks We Are Ignoring

- **Google's Mobile-Friendly Test API** -- Programmatic check for mobile rendering issues. Free, public API.
- **Lighthouse SEO audit** -- Google's own SEO checklist. Running Lighthouse programmatically via Playwright would give us Google's perspective on SEO issues. Free, already Chromium-based, easily integrable.
- **Web Vitals JS library** -- Google's official library for measuring CWV in the field. Could be injected via Playwright to get accurate measurements.
- **Rich Results Test API** -- Google's validator for structured data eligibility for rich results. Free, public API. Would tell us whether the JSON-LD on supertrained.ai actually qualifies for rich results.
- **Googlebot rendering comparison** -- Google's Web Rendering Service (WRS) uses Chromium, but with specific configurations (no cookies, no localStorage, specific viewport). Our Playwright setup should match these constraints when crawling for SEO purposes.

### 5. Rating: 3/10

The primitive treats SEO as a metadata checklist from 2015. In 2026, SEO is a page experience signal that encompasses performance, rendering, content quality, and structured data. The primitive has all of this data available (PerformanceMetrics, consoleSummary, sanitizedTextContent, structuredData, links) and only looks at metaTags and headings. The heading gap check is a false positive factory for SEO specifically. The OG checks do not belong in this dimension. The architecture is correct but the check suite is a decade behind the state of the art.

---

## Expert 4: Barry Adams (Crawlability, Log File Analysis & Technical Debt)

### 1. Reaction to Current 9 Checks

**What I respect:**
- The `isWrongCanonical()` implementation is well-engineered. Normalizing both URLs through the URL constructor, stripping hashes and query strings, and removing trailing slashes before comparison handles the most common false positive scenarios. Most SEO tools either do strict string matching (too many false positives) or ignore canonicals entirely.
- The code quality is clean. Each check is a discrete conditional block. Adding new checks is straightforward. The architecture does not fight you.

**What an experienced technical SEO auditor would never accept:**

1. **The primitive never reads the CrawlResult.** Look at line 11: `async run(_crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig)`. The first parameter is prefixed with underscore -- it is intentionally unused. The crawl-level data (robotsTxtStatus, detectedStack, pagesSkipped, totalDurationMs) is completely ignored. This is like doing a building inspection and ignoring the foundation.

   The `robotsTxtStatus` field tells us whether robots.txt was found, not found, or blocked some pages. If robots.txt is missing, that is a finding. If it blocks pages that should be indexed, that is a finding. If the crawl skipped pages (`pagesSkipped > 0`), that affects the completeness of our analysis and should at minimum be noted.

2. **No redirect chain detection.** The crawl follows redirects to reach final URLs, but the primitive never checks whether pages redirect. A redirect chain (A -> B -> C -> D) wastes crawl budget and dilutes link equity. Google follows up to 5 redirects but each hop reduces the signal strength. Redirect chains are detectable from CrawlResult's network requests or from status codes.

3. **No URL structure analysis.** The primitive processes whatever URLs it receives but never evaluates URL quality: excessively long URLs (>200 characters), URLs with session parameters, URLs with uppercase characters (case-sensitive duplicate risk), URLs with encoded spaces or special characters. These are free deterministic checks on the URL string itself.

4. **No crawl depth analysis.** Pages that are 4+ clicks from the homepage get crawled less frequently by Google. The link graph in PageSummary data allows computing click depth from the homepage to every page. Deep pages with important content should be flagged.

5. **No response header analysis for SEO.** The CrawlResult contains `responseHeaders`. SEO-relevant headers include: `X-Robots-Tag` (can noindex a page without a meta tag), `Link:` header (can specify canonical via HTTP header), `Vary:` (affects how Google caches pages), and cache-control directives. None are checked.

### 2. My Audit of supertrained.ai

**Finding B1: Sitemap declares 40 URLs but comparison pages may return 404 (HIGH)**

The sitemap at `supertrained.ai/sitemap.xml` lists 40 URLs including several `/compare/*` pages. At least one comparison page (`/compare/supertrained-vs-deloitte`) returned 404 when fetched. A sitemap containing 404 URLs tells Google "we're sending you to pages that don't exist," which degrades Google's trust in the sitemap's reliability. Google will eventually stop prioritizing the sitemap's URLs for crawling.

The current primitive cannot detect this because it never cross-references sitemap URLs against crawled page status codes. The data is there -- it just is not used.

**Finding B2: All blog post URLs use a flat /blog/* structure with no date or category segmentation (LOW)**

URLs like `/blog/what-is-the-drudgery-tax` and `/blog/what-is-generative-engine-optimization` are at the same level. For 8 posts this is fine. For a content strategy that plans to scale (which the site's investment in GEO/MEO content suggests), a flat blog URL structure will eventually create hundreds of pages at the same level, making it harder to signal topical hierarchy through URL structure.

This is an informational finding, not an error. The primitive has no mechanism for "informational" or "advisory" severity.

**Finding B3: robots.txt llms.txt reference points to llms-full.txt for both entries (MEDIUM)**

The robots.txt shows both `llms.txt` and `llms-full.txt` references pointing to the same URL (`https://supertrained.ai/llms-full.txt`). The `llms.txt` reference should point to `/llms.txt` (the summary version) and `llms-full.txt` should point to `/llms-full.txt` (the detailed version). This suggests the implementation was not completed correctly. Earlier audit from March 5 noted these were commented out -- they have since been uncommented but both point to the full version.

The current primitive does not read robots.txt content.

**Finding B4: No pagination signals on blog listing (MEDIUM)**

The `/blog` page lists all 8 articles on a single page with no pagination. This is fine for 8 articles. But the page has no `rel="next"` / `rel="prev"` signals, and no indication of whether this is paginated. As the blog grows, the absence of pagination architecture means the index page will either become very long (bad for performance) or will need to add pagination later (creating a migration challenge).

**Finding B5: Multiple comparison pages in sitemap but potentially non-functional (MEDIUM)**

The sitemap lists 6 comparison pages (`/compare/*`). If any of these return non-200 status codes, they waste Google's crawl budget and degrade sitemap trustworthiness. The SEO primitive needs to surface status code issues for sitemap-listed pages specifically, not just crawled pages generally.

### 3. Top 5 Checks I Would Add

**Check 1: robots.txt analysis (Deterministic -- zero new data)**

```
From CrawlResult.robotsTxtStatus:
  If 'not_found': flag as MEDIUM (confidence 0.95)
  If 'blocked_some_pages': flag as HIGH (confidence 0.90)
    Detail: list which crawled page URLs are disallowed

Additional (needs robotsTxt raw content or parsed rules):
  If robots.txt blocks CSS/JS: flag as HIGH
  If robots.txt has conflicting rules: flag as MEDIUM
  If sitemap directive is missing: flag as LOW
```

Data needed: `robotsTxtStatus` already in CrawlResult. Full robots.txt parsing would need a new field (`robotsTxtContent` or `robotsTxtRules`).

**Check 2: URL quality analysis (Deterministic -- zero new data)**

```
For each page URL:
  If URL length > 200 chars: flag as LOW (confidence 0.85)
  If URL contains uppercase: flag as LOW (confidence 0.80)
    reason: "URLs are case-sensitive; uppercase creates duplicate risk"
  If URL contains consecutive hyphens (---): flag as LOW (confidence 0.75)
  If URL contains encoded spaces (%20): flag as LOW (confidence 0.85)
  If URL contains query parameters on what appears to be a content page:
    flag as MEDIUM (confidence 0.80)
  If URL depth > 4 directories: flag as LOW (confidence 0.75)
```

Data needed: Page URLs (already available). Implementation: Deterministic string analysis.

**Check 3: Crawl completeness analysis (Deterministic -- zero new data)**

```
From CrawlResult:
  If pagesSkipped > 0:
    flag as LOW (confidence 0.90)
    Detail: "N pages discovered but not crawled (page limit reached).
    Audit covers M of M+N total pages."

  crawlCoverage = pages.length / (pages.length + pagesSkipped)
  If crawlCoverage < 0.5: flag as MEDIUM (confidence 0.85)
    reason: "Less than half the site was audited. Findings may be incomplete."
```

Data needed: `pages.length` and `pagesSkipped` (already in CrawlResult). Implementation: Deterministic.

**Check 4: Response header SEO signals (Deterministic -- needs minor new extraction)**

```
For each CrawledPage in CrawlResult:
  If responseHeaders['X-Robots-Tag'] contains 'noindex': flag as CRITICAL (confidence 0.98)
  If responseHeaders['Link'] contains rel="canonical": compare with <link> canonical
    If they differ: flag as HIGH (confidence 0.95)
  If responseHeaders['Vary'] contains 'User-Agent':
    flag as LOW (confidence 0.80)
    reason: "Serving different content per user-agent may cause indexation discrepancies"
```

Data needed: `responseHeaders` is in CrawledPage but not in PageSummary. The primitive currently receives only PageSummary. Either the primitive needs access to CrawlResult (currently unused), or responseHeaders need to be promoted to PageSummary.

**Check 5: Click depth from homepage (Deterministic -- zero new data)**

```
1. Identify homepage (URL path = '/')
2. Build directed graph: page -> linked pages (using links[].isInternal)
3. BFS from homepage
4. For each page, compute minimum click depth
5. If click depth >= 4: flag as LOW (confidence 0.80)
6. If click depth >= 6: flag as MEDIUM (confidence 0.85)
7. If page is unreachable from homepage (infinite depth): flag as HIGH (confidence 0.90)
   reason: "Orphaned page: no path from homepage through internal links"
```

Data needed: `links[]` (already in PageSummary). Implementation: Deterministic BFS.

### 4. Tools/Frameworks We Are Ignoring

- **Screaming Frog's crawl configuration** -- The industry standard for technical SEO crawling. Its 300+ built-in checks represent the accumulated wisdom of 15 years of SEO auditing. We should literally go through Screaming Frog's check categories and map each one to our implementation status.
- **Server log file analysis** -- The ultimate truth about how Google crawls a site. We cannot access this from outside, but acknowledging this gap is important for setting user expectations.
- **DeepCrawl / Lumar** -- Enterprise crawl tools that analyze JavaScript rendering, crawl budget, and redirect chains at scale. Their architecture (crawl, then analyze) matches ours.
- **Yoast/RankMath SEO plugin checks** -- While these are WordPress-specific, their check lists (readability score, keyword density, internal linking suggestions) represent what site owners expect from an "SEO check."
- **Chrome DevTools Protocol (CDP)** -- Direct access to rendering, network, and performance data. Playwright wraps CDP, but some SEO-specific data (e.g., preload scanner behavior, resource priority hints) is only accessible through direct CDP calls.

### 5. Rating: 2/10

The primitive has a CrawlResult parameter and throws it away with an underscore. It has PageSummary data with status codes, links, performance metrics, console errors, network data, and structured data -- and reads only metaTags, headings, and titles. This is a primitive that was written to catch the 12 findings from the supertrained.ai dogfood audit, not to be a generalizable SEO auditor. The hardcoded `/services` stale description check (lines 68-83) confirms this: it is a site-specific regression test masquerading as an SEO check. To be production-ready, this primitive needs to start using the rich data it already receives.

---

## Expert 5: Martha van Berkel (Structured Data, Schema.org & Rich Results)

### 1. Reaction to Current 9 Checks

**What is correct:**
- The architecture of receiving `structuredData` in the PageSummary is the right foundation. Structured data is increasingly the interface between websites and AI systems -- not just Google, but ChatGPT, Perplexity, Claude, and every other system that consumes web content.

**What is entirely missing:**

The primitive receives `structuredData: any[]` in every PageSummary and **never reads it.** Not a single line of the 228-line file references `structuredData`. This is an enormous gap for an SEO primitive in 2026.

Structured data analysis should be one of the largest components of the SEO primitive. Here is what is missing:

1. **No structured data presence check.** The methodology document (Section 5) lists "Structured data present (JSON-LD)" as a MEDIUM severity check. The primitive does not implement it. A page with no structured data in 2026 is leaving rich results, knowledge graph entries, and AI citation opportunities on the table.

2. **No structured data validation.** Schema.org has required and recommended properties for every type. A `ProfessionalService` without `name`, `address`, or `telephone` is technically valid but practically useless. A `BlogPosting` without `author`, `datePublished`, or `headline` will not qualify for rich results.

3. **No structured data-content consistency.** The JSON-LD on supertrained.ai lists services as "Custom AI Agents, Workflow Automation, Managed AI Operations, Fractional AI Department." The page content has evolved. The structured data has not. This is invisible to users but visible to every machine consumer of the page.

4. **No rich result eligibility check.** Google requires specific schema types with specific required properties to trigger rich results (FAQ, HowTo, Article, Product, Review, etc.). Having structured data is not enough -- it must meet Google's requirements, which are stricter than Schema.org's base spec.

5. **No cross-page structured data consistency.** On supertrained.ai, every page repeats the same ProfessionalService block. But the /about page adds Person schemas for team members that do not appear on other pages. The /method page has a HowTo schema. The /meo page has Article + FAQPage schemas. There is no cross-page index showing what structured data exists where, whether entities are consistently described, and whether relationships between entities are maintained.

6. **No structured data for AEO/GEO/MEO relevance.** Structured data is the primary mechanism for Answer Engine Optimization. A well-structured FAQPage schema directly creates Google FAQ rich results and feeds AI answer engines. The primitive has no awareness of this.

### 2. My Audit of supertrained.ai

**Finding S1: JSON-LD ProfessionalService lists stale service names site-wide (HIGH)**

Every page on the site includes:
```json
"makesOffer": [
  "Custom AI Agents",
  "Workflow Automation",
  "Managed AI Operations",
  "Fractional AI Department"
]
```

But the /services page now organizes offerings as "Discover / Build / Run" with specific service categories: "AI Marketing Systems" appears as a Build Phase service. The structured data describes a service taxonomy the site no longer uses in its primary navigation.

This matters because: (a) Google's Knowledge Graph extracts `makesOffer` to populate entity panels, (b) AI answer engines use structured data as ground truth, and (c) the disconnect between on-page content and structured data may reduce Google's trust in the structured data.

The current primitive ignores structuredData entirely.

**Finding S2: Blog posts lack dateModified in Article schema (MEDIUM)**

The blog post "What Is the Drudgery Tax?" has Article schema with `author`, `publisher`, `datePublished`, and `keywords`. But it does not include `dateModified`. Google uses `dateModified` to display freshness indicators in search results. Without it, Google cannot distinguish between an article published in February 2026 and one that was updated yesterday. Additionally, `articleBody` and `wordCount` are absent, which reduces the structured data's utility for AI systems that consume article content programmatically.

**Finding S3: No BreadcrumbList schema on most pages (MEDIUM)**

The blog post pages have BreadcrumbList schema (Home > Insights > Article), but the main site pages (/services, /about, /method, /work) do not. BreadcrumbList is one of the most impactful structured data types for search -- it directly creates breadcrumb rich results in Google SERPs, replacing the raw URL display with a navigable path. This is a low-effort, high-impact addition.

**Finding S4: /meo FAQPage questions may not fully match visible page content (MEDIUM)**

The /meo page has FAQPage schema with 4 questions. Google's structured data guidelines explicitly state that FAQ content must be "visible to the user on the page." If the FAQ schema describes content that is not prominently displayed (e.g., hidden behind accordions or not present at all), Google will issue a manual action or silently ignore the structured data.

The current primitive cannot check this because it does not compare structuredData content against sanitizedTextContent.

**Finding S5: No sameAs links for entity disambiguation (LOW)**

The Person schemas on /about list team members with `name` and `jobTitle` but the `sameAs` property only includes LinkedIn and X profiles for the founders. For entity disambiguation in knowledge graphs, `sameAs` should include: LinkedIn profile, X/Twitter profile, personal website, Crunchbase profile, and any other authoritative sources. Without these, Google's Knowledge Graph cannot confidently link "Tom Meredith, Co-Founder of SuperTrained" to the correct real-world entity.

**Finding S6: Homepage structured data has ProfessionalService but no LocalBusiness signals (LOW)**

The site uses `ProfessionalService` schema, which is correct. But it omits `address`, `geo`, `openingHours`, and `areaServed` (the JSON-LD has `areaServed: "Worldwide"` as a string, but Schema.org expects a `Place` or `GeoShape` object). For a service business, adding at minimum a virtual office address or service area definition helps qualify for local search and Google Business Profile integration.

### 3. Top 5 Checks I Would Add

**Check 1: Structured data presence and type classification (Deterministic -- zero new data)**

```
For each page:
  If structuredData.length === 0:
    If page is homepage: flag as HIGH (confidence 0.95)
    If page is blog post: flag as MEDIUM (confidence 0.92)
    If page is service/product page: flag as MEDIUM (confidence 0.90)
    Else: flag as LOW (confidence 0.85)

  For each structuredData block:
    Classify type: Organization, Article, FAQPage, HowTo, Product, BreadcrumbList, etc.
    Record: { page, types_present }

  Cross-page:
    If blog posts lack Article/BlogPosting: flag as MEDIUM
    If FAQ pages lack FAQPage: flag as MEDIUM
    If service pages lack Service or Product: flag as LOW
```

Data needed: `structuredData` (already in PageSummary). Implementation: Deterministic type checking.

**Check 2: Schema.org required property validation (Deterministic -- zero new data)**

```
For each structuredData block, validate against required properties:

  Article/BlogPosting:
    Required: headline, author, datePublished, publisher
    Recommended: dateModified, image, articleBody, wordCount
    If missing required: flag as MEDIUM (confidence 0.92)
    If missing recommended: flag as LOW (confidence 0.85)

  ProfessionalService/Organization:
    Required: name, url
    Recommended: logo, contactPoint, address, sameAs, description
    If missing required: flag as HIGH (confidence 0.95)
    If missing recommended: flag as LOW (confidence 0.85)

  FAQPage:
    Required: mainEntity[].name, mainEntity[].acceptedAnswer.text
    If questions < 3: flag as LOW (confidence 0.80)
      reason: "FAQPage with fewer than 3 questions is unlikely to earn rich results"

  BreadcrumbList:
    Required: itemListElement[].name, itemListElement[].item
    If list has only 1 element: flag as LOW (confidence 0.85)
```

Data needed: `structuredData` (already in PageSummary). Implementation: Deterministic property checking against a schema type -> required properties map.

**Check 3: Structured data vs. on-page content consistency (LLM -- zero new data)**

```
For full_audit tier:
  For each page with structuredData:
    Extract entity names, descriptions, and claims from structuredData
    Extract same from sanitizedTextContent
    Ask Sonnet: "Compare these two representations. Are the service names,
    descriptions, and factual claims consistent? List any discrepancies."
    If discrepancies found: flag as MEDIUM (confidence from LLM)

  Special case: FAQPage
    For each FAQ question in structuredData:
      Check if question text appears in sanitizedTextContent
      If not found: flag as HIGH (confidence 0.90)
        reason: "FAQ schema describes content not visible on the page (Google guideline violation)"
```

Data needed: `structuredData` + `sanitizedTextContent` (already in PageSummary). Implementation: LLM for semantic comparison.

**Check 4: Cross-page entity consistency (Deterministic -- zero new data)**

```
Across all pages:
  Extract all Organization/ProfessionalService blocks
  Check: name, description, makesOffer, founder, numberOfEmployees
  If any property differs between pages:
    flag as MEDIUM (confidence 0.88)
    Detail: "Organization description varies across pages: homepage says X,
    services page says Y"

  Extract all Person blocks
  Check: name, jobTitle, sameAs
  If same person has different jobTitles on different pages:
    flag as LOW (confidence 0.82)
```

Data needed: `structuredData` across all summaries (already available). Implementation: Deterministic cross-referencing.

**Check 5: BreadcrumbList coverage and consistency (Deterministic -- zero new data)**

```
For each page:
  hasBreadcrumb = structuredData.some(sd => sd['@type'] === 'BreadcrumbList')
  If NOT hasBreadcrumb AND page is not homepage:
    flag as LOW (confidence 0.85)

  If hasBreadcrumb:
    Validate: final breadcrumb item matches current page URL
    Validate: first breadcrumb item is homepage
    Validate: path is consistent with actual site navigation
    Cross-reference with other pages' breadcrumbs for consistency
```

Data needed: `structuredData` (already in PageSummary). Implementation: Deterministic.

### 4. Tools/Frameworks We Are Ignoring

- **Google's Rich Results Test (API)** -- The definitive validator for whether structured data qualifies for rich results. Available as a free API. This is the ground truth -- our internal validation is an approximation.
- **Schema.org validator** -- Validates JSON-LD against the full Schema.org vocabulary. Catches type misuse, deprecated types, and property violations.
- **Bing Markup Validator** -- Similar to Google's but with Bing-specific requirements. Bing powers DuckDuckGo, Yahoo, and several AI systems.
- **Google's Structured Data Markup Helper** -- Not directly useful for auditing, but its type definitions and required property lists should be our reference for building Check 2.
- **Schema App's structured data testing methodology** -- A published taxonomy of structured data issues ranked by impact on rich results, knowledge graph, and AI answer engines. This taxonomy should inform severity classification.
- **Knowledge Graph API** -- Google's public API for querying the Knowledge Graph. Would let us check whether entities in the site's structured data actually resolve to real Knowledge Graph entries.

### 5. Rating: 1/10

The primitive receives `structuredData: any[]` in every PageSummary and never references it. Not once. The methodology document explicitly lists "Structured data present (JSON-LD)" as a MEDIUM severity check. The primitive does not implement it. Structured data is the foundation of AEO, the bridge to GEO, and the machine-readable layer that AI systems use to understand web content. In 2026, ignoring structured data in an SEO audit is like ignoring meta tags in 2010. This is the single largest gap in the primitive.

---

## Consensus Findings

### Rating Summary

| Expert | Specialty | Rating | Primary Complaint |
|--------|-----------|--------|-------------------|
| Aleyda Solis | Technical SEO | 3/10 | Ignores status codes, robots.txt, sitemap, internal links, title length -- all available in existing data |
| Kevin Indig | Content SEO | 2/10 | Audits metadata only, never evaluates content despite having sanitizedTextContent |
| Martin Splitt | CWV / JS SEO | 3/10 | Heading gap check produces false positives, OG checks are not SEO, ignores CWV-ranking connection |
| Barry Adams | Crawlability | 2/10 | CrawlResult parameter is literally unused (underscore prefix), site-specific hardcoded checks |
| Martha van Berkel | Structured Data | 1/10 | structuredData field exists in every PageSummary and is never referenced |

**Panel Average: 2.2/10**

### Universal Agreement

All five experts independently identified the same structural problem: **the primitive has access to rich, multi-signal data (CrawlResult + PageSummary) and only reads 4 fields from PageSummary: title, metaTags, headings, and (for duplicate detection) og:description.** It ignores: structuredData, links, images, sanitizedTextContent, statusCode, performanceMetrics, consoleSummary, networkSummary, and the entire CrawlResult object.

The primitive was written to catch the specific 12 findings from the March 5 supertrained.ai dogfood audit. It succeeds at that. It is not yet a generalizable SEO primitive.

---

## Consensus Recommendations

### P0: Must fix now -- zero new data needed

These checks use data ALREADY in PageSummary or CrawlResult. No new crawl capabilities, no new extraction, no external APIs. Pure logic on existing inputs.

| # | Check | Data Source | Type | Severity | Est. LOC |
|---|-------|-------------|------|----------|----------|
| P0-1 | **Structured data presence check** -- flag pages with zero JSON-LD | `structuredData` (PageSummary) | Deterministic | MEDIUM-HIGH | 15 |
| P0-2 | **Status code analysis** -- flag 404, 5xx, 3xx pages | `statusCode` (PageSummary) | Deterministic | HIGH-CRITICAL | 10 |
| P0-3 | **Meta robots noindex detection** -- flag noindexed pages | `metaTags['robots']` (PageSummary) | Deterministic | CRITICAL | 8 |
| P0-4 | **Title length validation** -- flag >60 char and missing titles | `title` (PageSummary) | Deterministic | LOW-MEDIUM | 10 |
| P0-5 | **Thin content detection** -- flag pages with <200 words | `sanitizedTextContent` (PageSummary) | Deterministic | MEDIUM | 12 |
| P0-6 | **Missing H1 / multiple H1 detection** | `headings` (PageSummary) | Deterministic | MEDIUM | 8 |
| P0-7 | **OG tag homepage-fallback detection** -- flag non-homepage pages where OG tags match homepage defaults | `metaTags` (PageSummary) | Deterministic | MEDIUM | 20 |
| P0-8 | **Remove hardcoded /services stale description check** -- replace with nothing (the LLM layer is the right place for content-metadata comparison) | N/A | Removal | N/A | -15 |
| P0-9 | **Move heading gap check to accessibility primitive** -- it is a WCAG concern, not an SEO ranking signal | N/A | Refactor | N/A | 0 (move) |
| P0-10 | **Duplicate meta description detection** -- already in methodology, not yet implemented (only og:description is checked for duplication) | `metaTags['description']` (PageSummary) | Deterministic | MEDIUM | 15 |
| P0-11 | **Use CrawlResult** -- read `robotsTxtStatus`, `pagesSkipped`, `detectedStack` | `CrawlResult` (first parameter, currently unused) | Deterministic | MEDIUM | 20 |

**Estimated total for P0: ~100 lines of new code, ~15 lines removed.**

### P1: Important -- needs minor new extraction or cross-referencing

These checks need data that exists in the system but is not currently passed to the SEO primitive, or need a small new extraction step.

| # | Check | What is Needed | Type | Severity | Est. LOC |
|---|-------|---------------|------|----------|----------|
| P1-1 | **Internal link graph analysis** -- orphaned pages, click depth, anchor text quality | `links[]` (already in PageSummary) -- needs graph construction | Deterministic | MEDIUM | 60 |
| P1-2 | **Sitemap-crawl cross-reference** -- pages in sitemap but not crawled and vice versa | Needs `sitemapUrls: string[]` field on CrawlResult (minor extraction addition) | Deterministic | MEDIUM-HIGH | 40 |
| P1-3 | **Structured data required property validation** -- check Article has author/date, Organization has name/url | `structuredData` (PageSummary) + schema type -> required properties map | Deterministic | MEDIUM | 80 |
| P1-4 | **Cross-page entity consistency** -- same Organization described differently on different pages | `structuredData` across all summaries | Deterministic | MEDIUM | 40 |
| P1-5 | **Response header SEO signals** -- X-Robots-Tag, Link canonical, Vary: User-Agent | Needs access to CrawlResult.pages[].responseHeaders (primitive currently only receives PageSummary) | Deterministic | HIGH | 30 |
| P1-6 | **CWV threshold crossing for SEO** -- flag pages where LCP/CLS cross Google's "poor" thresholds as ranking-impacting | `performanceMetrics` (PageSummary) -- needs coordination with performance primitive to avoid duplicates | Deterministic | MEDIUM | 15 |
| P1-7 | **Console error SEO impact** -- flag React hydration errors, chunk load failures as indexation risks | `consoleSummary` (PageSummary) | Deterministic | MEDIUM | 15 |
| P1-8 | **BreadcrumbList coverage** -- flag pages without breadcrumb schema | `structuredData` (PageSummary) | Deterministic | LOW | 20 |

### P2: Valuable -- needs new crawl capabilities

These checks require new data that is not currently collected during the crawl.

| # | Check | What is Needed | Type | Severity |
|---|-------|---------------|------|----------|
| P2-1 | **Server-rendered vs. client-rendered content comparison** | Parse CrawlResult.pages[].html (raw HTML) and compare key SEO elements against rendered PageSummary | Deterministic | HIGH |
| P2-2 | **Redirect chain detection** | Track redirect hops during crawl (status codes 301/302/307/308 before final resolution) | Deterministic | MEDIUM |
| P2-3 | **Sitemap lastmod analysis** -- flag identical timestamps, future dates, missing dates | Parse sitemap XML content (needs sitemap content, not just URL list) | Deterministic | MEDIUM |
| P2-4 | **Hreflang validation** -- check for hreflang tags, validate reciprocal links | Extract `<link rel="alternate" hreflang>` tags (needs hreflang extractor) | Deterministic | HIGH (international sites) |
| P2-5 | **robots.txt rule parsing** -- validate rules, check for CSS/JS blocking | Parse robots.txt content (needs raw text, not just status) | Deterministic | MEDIUM |
| P2-6 | **INP measurement** -- simulate user interactions and measure Interaction to Next Paint | Playwright interaction simulation (click, type) + Performance Observer API | Deterministic | MEDIUM |
| P2-7 | **Semantic keyword cannibalization** -- detect pages targeting same intent | Compute text similarity between page pairs using TF-IDF or embeddings | LLM or embedding model | MEDIUM |

### P3: Aspirational -- needs external data sources

These checks require data from third-party APIs or services.

| # | Check | External Source | Value |
|---|-------|----------------|-------|
| P3-1 | **Rich Results Test validation** | Google Rich Results Test API (free) | Definitive answer on whether structured data qualifies for rich results |
| P3-2 | **CrUX real-user performance data** | Chrome UX Report API (free) | Real user CWV data that Google uses for ranking |
| P3-3 | **Google Search Console indexation status** | Google Search Console API (requires owner verification) | Which pages Google actually indexed, crawl errors, indexation issues |
| P3-4 | **Mobile-Friendly Test** | Google Mobile-Friendly Test API (free) | Google's own mobile rendering assessment |
| P3-5 | **Backlink profile analysis** | Ahrefs/Moz/Majestic API (paid) | Domain authority, referring domains, link quality |
| P3-6 | **Knowledge Graph entity resolution** | Google Knowledge Graph API (free) | Whether entities in structured data resolve to real Knowledge Graph entries |
| P3-7 | **SERP feature tracking** | Third-party SERP API (paid) | Whether the site actually appears in rich results, featured snippets, etc. |
| P3-8 | **Competitor content gap analysis** | Clearscope/SurferSEO API (paid) | How content coverage compares against ranking competitors |

---

## Architectural Observations

### The hasDuplicateBrand function needs generalization

The current implementation only splits on `|`. Real-world title separators include `|`, `-`, `--`, `:`, `>`, and `\u2014` (em dash). The function should split on any of these.

### The LLM prompt is too vague

The current prompt is: "Find at most two SEO-quality issues that deterministic checks may miss." This gives the model no direction. A better prompt would enumerate the specific categories to evaluate: "Evaluate content-metadata alignment, topical coherence, structured data-content consistency, and internal linking quality. Report at most two issues that the deterministic checks below have not already flagged: [list of deterministic checks already run]." Passing the already-generated findings to the LLM prevents redundant reporting.

### The primitive should use CrawlResult

The `_crawl` parameter should be used. At minimum for: `robotsTxtStatus`, `pagesSkipped`, and sitemap data. The underscore prefix should be removed and the parameter should be read.

### Confidence scores need a principled framework

Several experts noted that confidence scores on deterministic checks are arbitrary (0.95 here, 0.98 there, 0.84 elsewhere). A principled framework: deterministic checks that detect presence/absence of an element should have confidence 1.0 for detection. The uncertainty should live in severity classification (is the absence actually a problem?) via the conservative severity rule, not in detection confidence.

### The methodology document promises checks the primitive does not implement

The methodology Section 5 (SEO Dimension Rubric) lists 12 checks. The primitive implements 9 (with 2 being incorrect: heading gap is not SEO, and the stale description check is site-specific). The methodology promises: title <60 chars, robots.txt present, sitemap.xml present and valid, structured data present, duplicate meta descriptions, internal linking quality, and content thinness. None of these are implemented.

This is a methodology-implementation gap that would fail the pre-registration principle (Stolen Mechanism #6): the methodology was frozen before audits run, but the implementation does not honor it.

---

## Summary

The SEO primitive sits at **2.2/10** not because the architecture is wrong -- the architecture is excellent. The CrawlResult + PageSummary + Envelope pipeline is well-designed. The type system is clean. The separation of deterministic and LLM checks is correct. The problem is coverage: the primitive only uses ~10% of the data available to it.

The P0 recommendations add approximately 100 lines of deterministic code on data already collected. They would bring the primitive to approximately 5/10 -- functional for basic technical SEO. The P1 recommendations (another ~300 lines) would bring it to approximately 7/10 -- competitive with automated tools like Lighthouse SEO. The P2 and P3 recommendations would bring it to 9/10 -- competitive with professional-grade tools like Screaming Frog + Ahrefs.

The most impactful single change: **use the structuredData field.** It is present in every PageSummary, it is never read, and structured data analysis is the bridge between traditional SEO and the AEO/GEO/MEO dimensions that Alien Eyes positions as a differentiator.
