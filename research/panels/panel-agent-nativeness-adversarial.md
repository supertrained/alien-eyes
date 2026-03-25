# Adversarial Expert Panel: Agent-Nativeness Primitive

> Date: 2026-03-13
> Panel Type: Adversarial Review (5 experts)
> Subject: `src/primitives/agent-nativeness.ts` — current implementation and design gaps
> Live Audit Target: supertrained.ai (unverified ownership)
> Methodology: Each expert independently reacts, audits, and recommends

---

## Panel Composition

| # | Name | Title | Credentials | Perspective |
|---|------|-------|-------------|-------------|
| 1 | **Dr. Raina Patel** | Principal Research Engineer, Google DeepMind (Agent Infrastructure) | Co-author of Toolformer paper follow-ups; led the team that designed Gemini's function-calling evaluation benchmarks; previously built Google's internal API quality scoring for 2,000+ services | Large-scale agent infrastructure; what makes APIs actually consumable by LLMs |
| 2 | **Marcus Chen** | CTO & Co-Founder, Composio (Agent Integration Platform) | Built the largest MCP/tool-use integration platform (400+ tool connectors); former Stripe API platform engineer; author of "Designing for Agents" (O'Reilly, 2026) | Real-world agent tool consumption patterns; what breaks in production |
| 3 | **Dr. Samira Abdi** | Director of AI Standards, W3C/IETF Liaison | Editor of the llms.txt specification (draft-abdi-llmstxt-01); co-chair W3C Machine-Readable Web CG; contributed to robots.txt AI extensions; former Mozilla developer relations | Emerging standards; what the specification landscape actually requires |
| 4 | **Jake Garrison** | Head of Red Team, Anthropic (External Evaluations) | Leads external model evaluation for Claude tool use; designed the benchmarks that measure whether Claude can correctly discover, authenticate, and use 500+ real APIs; former security researcher at Trail of Bits | Adversarial evaluation; what agents actually try to do when they encounter a website |
| 5 | **Elena Vasquez** | VP of Platform, Replit (Agent-Native IDE) | Architected Replit Agent's web crawling and tool discovery system; built the infrastructure that lets Replit Agent autonomously find, evaluate, and integrate APIs into generated apps; former Cloudflare Workers PM | Agent autonomy; real discovery behavior when agents encounter unknown sites |

---

## 1. Reaction to the Ownership Gate

### Dr. Raina Patel

The ownership gate on agent-nativeness is **fundamentally wrong**. It conflates two entirely different threat models: security scanning (which reasonably requires authorization) and publicly observable signals (which do not).

Every signal listed in the current agent-nativeness rubric — structured data, keyword mentions, llms.txt presence — is **already visible to any browser, any crawler, any agent**. Gating these checks behind ownership verification means the primitive returns zero findings for every unverified URL. That is not a conservative safety posture. That is a dead feature.

The security primitive gates on ownership because it reports *vulnerabilities* — information an attacker could exploit. Agent-nativeness signals are the opposite: they are advertisements. A site that publishes JSON-LD is *trying* to be discovered by machines. Hiding the assessment of that advertisement behind an ownership gate makes no sense.

**Recommendation:** Remove `requiresOwnershipVerification = true` entirely for agent-nativeness. The only sub-check that might warrant gating is active API endpoint probing (sending requests to discovered endpoints), which is not currently implemented and should be gated when it is. Passive observation of publicly served content requires no authorization.

### Marcus Chen

At Composio, we evaluate 400+ tools for agent consumption daily. None of this requires the tool owner's permission because we are evaluating **public interfaces**. The llms.txt file is literally designed to be read by any LLM. JSON-LD is designed to be read by any crawler. Robots.txt is designed to be read by any user agent.

The ownership gate transforms this primitive from "assess agent readiness" to "do nothing." I have run zero audits that would benefit from this gate. Remove it.

The one legitimate concern is disclosure: telling someone "your site has no structured data" is not a security finding. Telling someone "your API at /api/v2/users has no rate limiting" *is*. Split the primitive: passive observation is ungated; active probing is gated. This is standard responsible disclosure practice.

### Dr. Samira Abdi

From a standards perspective, the ownership gate is backwards. The entire purpose of llms.txt, robots.txt AI directives, JSON-LD, and .well-known discovery is to enable **unsolicited machine reading**. These are opt-in visibility mechanisms. The site owner has already consented to machine evaluation by publishing these files.

Gating the check means Alien Eyes cannot tell a builder "you have no llms.txt" unless they have already proven they own the site. But the builders who need this feedback most are the ones who have never heard of llms.txt. They will never verify ownership for a tool they do not yet understand.

**Hard rule:** If the signal is served over public HTTP to unauthenticated requests, the assessment of that signal requires no authorization.

### Jake Garrison

On Anthropic's external evaluation team, we assess every website Claude encounters without ownership verification. That is the entire point — we need to know what an agent experiences from the outside. Alien Eyes claims to provide "the alien perspective" but then requires insider access to deliver it. That is a contradiction.

The ownership gate makes more sense for the security primitive (where findings could enable attacks) and for active probing (where requests could trigger WAFs or cause side effects). For passive observation of public-facing agent readiness signals, it is a false constraint.

**One exception worth considering:** If Alien Eyes reports that a site advertises an API but the API returns errors, that finding could be useful to competitors. But I would classify that as a LOW severity finding with a note, not gate the entire dimension.

### Elena Vasquez

When Replit Agent encounters a new website, it performs exactly the kind of assessment your agent-nativeness primitive should do: check for structured data, look for API docs, probe for llms.txt, examine robots.txt directives, look for OpenAPI specs. It does all of this without any ownership verification. Because it is reading public content.

The gate killed the live audit of supertrained.ai. You got zero findings. A site that has llms.txt, llms-full.txt, comprehensive JSON-LD, RSS feeds, robots.txt with eight AI-specific user-agent directives, and `<link rel="alternate" type="text/plain" href="/llms.txt">` got zero feedback because the ownership box was not checked. That is a product failure, not a safety feature.

**Unanimous verdict: Remove the ownership gate for passive agent-nativeness assessment. Gate only active probing (API endpoint testing, auth flow evaluation).**

---

## 2. Reaction to the Keyword-Matching Approach

### Dr. Raina Patel

Substring matching for `['api', 'json', 'schema', 'webhook', 'sdk', 'mcp']` against visible text content is alarmingly crude. It produces both false positives and false negatives at unacceptable rates.

**False positives:** The word "API" appears in marketing copy on thousands of sites that have no actual API. "Our platform integrates with 50+ APIs" does not mean the site itself exposes an API. "JSON" appears in technical blog posts. "Schema" appears in database documentation. The word "capital" contains "api". "Jasondecoder" contains "json".

**False negatives:** A site can expose a comprehensive MCP server, OpenAPI spec, GraphQL introspection endpoint, and .well-known/ai-plugin.json without any of these keywords appearing in visible text. The keywords check *marketing copy*, not *technical implementation*.

The current check answers the wrong question. "Does the visible text mention structured interfaces?" is not a useful proxy for "Does this site expose machine-consumable interfaces?" These are completely different questions.

**What should replace it:** Direct probing of known discovery endpoints. Check if `/openapi.json`, `/api/openapi.yaml`, `/.well-known/ai-plugin.json`, `/llms.txt`, `/llms-full.txt` actually exist and return valid content. Check if `<link rel="alternate">` tags point to machine-readable formats. Check HTTP `Link:` headers for API documentation pointers. Parse `robots.txt` for AI-specific directives. These are deterministic, binary checks: the file exists and parses, or it does not.

### Marcus Chen

This is like checking whether a restaurant serves food by searching the menu for the word "food." The keyword approach is measuring marketing, not capability.

At Composio, we do not check if a tool *mentions* having an API. We check if the API *responds*. The minimum viable check for structured interface discovery:

1. Fetch `/.well-known/ai-plugin.json` — does it return valid JSON with `api.url`?
2. Fetch the URL from step 1 — does it return a valid OpenAPI/AsyncAPI spec?
3. Fetch `/llms.txt` — does it exist and follow the spec format?
4. Fetch `/robots.txt` — are there AI-specific user-agent rules?
5. Check `<link>` tags in HTML `<head>` for `rel="alternate"` with machine-readable types
6. Check for `<script type="application/ld+json">` blocks

Every one of these is a deterministic HTTP request. No LLM needed. No keyword matching. The evidence is binary: present or absent.

### Dr. Samira Abdi

The keyword approach has a deeper problem: it only checks `sanitizedTextContent`, which is visible page text after scripts and hidden elements are stripped. But the most important agent-nativeness signals live in:

- `<head>` (link tags, meta tags, JSON-LD)
- HTTP response headers (Link, X-Robots-Tag)
- Dedicated files at well-known paths (/robots.txt, /llms.txt, /sitemap.xml, /.well-known/)

None of these are "visible text content." The primitive is looking in the wrong place entirely.

The keyword list also reveals a misunderstanding of what "agent-nativeness" means. The presence of the word "API" in marketing copy tells you nothing about whether the site is agent-native. A site with no marketing copy about APIs but a clean OpenAPI spec is infinitely more agent-native than a site whose blog post mentions "API" fifty times.

### Jake Garrison

From a red team perspective, the keyword approach is trivially gameable in both directions. To score well: put "API JSON SDK MCP webhook schema" in a hidden paragraph. To score poorly: have a fully functional MCP server but never mention it in visible text.

More practically: when we evaluate whether Claude can use a website, we never look at marketing copy. We look at what the site actually serves to machine clients: structured data, API endpoints, error responses, content-type headers. The keyword check measures the site's marketing team, not its engineering team.

### Elena Vasquez

When Replit Agent encounters a site, it does not read the visible text looking for the word "API." It:

1. Parses the HTML for `<link>`, `<meta>`, and `<script type="application/ld+json">`
2. Checks response headers for `Link:` and `X-Robots-Tag`
3. Tries fetching well-known discovery paths
4. Examines any structured data for actionable schemas
5. Checks if forms have machine-parseable input contracts

The keyword check is a human heuristic incorrectly applied to machine evaluation. Replace it entirely.

**Unanimous verdict: The keyword-matching approach should be replaced with direct endpoint probing and structured data parsing. It measures marketing copy, not agent readiness.**

---

## 3. Top 5 Checks to Add (Per Expert)

### Dr. Raina Patel — Top 5

**1. Structured Data Completeness Audit**
- Not just "is JSON-LD present?" but "is it complete and accurate?"
- Parse every `<script type="application/ld+json">` block
- Validate against schema.org vocabulary (is `@type` a real schema.org type?)
- Check required properties per type (e.g., `ProfessionalService` should have `name`, `url`, `description`, `contactPoint`)
- Score: percentage of recommended properties present per type
- **Implementation:** Fetch schema.org type definitions at build time. For each JSON-LD block, parse `@type`, look up required/recommended properties, compute completeness ratio. No LLM needed — this is a deterministic schema comparison.

**2. Response Format Negotiation**
- Send requests with `Accept: application/json` and `Accept: text/html` to the same URLs
- Does the server content-negotiate? Does `/services` return JSON when asked?
- Check response `Content-Type` headers for consistency
- This directly measures Composability (Rhumb dimension)
- **Implementation:** For each page URL in the crawl, send a second request with `Accept: application/json`. Record whether the response differs from the HTML version. Score: percentage of pages that support content negotiation. Deterministic.

**3. Semantic HTML Depth Score**
- Count and classify landmark elements: `<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`
- Check heading hierarchy completeness (h1 -> h2 -> h3 in logical tree)
- Check `role` attributes and `aria-label` on interactive elements
- LLMs parse HTML. Semantic HTML is dramatically easier for LLMs to parse than div-soup.
- **Implementation:** Walk the DOM tree. Count landmark elements per page. Score heading hierarchy (0-100 based on skip count, orphan count, duplication). Deterministic — already partially available in the existing PageSummary (`ariaLandmarks`, `headings`).

**4. Machine-Readable Discovery Paths**
- Probe these endpoints with HEAD requests (lightweight, no auth needed):
  - `/.well-known/ai-plugin.json`
  - `/openapi.json`, `/openapi.yaml`, `/api-docs`
  - `/llms.txt`, `/llms-full.txt`
  - `/humans.txt`
  - `/.well-known/security.txt`
  - `/feed`, `/rss`, `/atom.xml`, `/blog/rss.xml`
- Score: count of present discovery paths out of total checked
- **Implementation:** Array of { path, description, weight }. HEAD request each. 200 = present, anything else = absent. Total score = weighted sum of present / total weight. Completely deterministic. ~15 HTTP requests, parallelizable.

**5. Entity Consistency Across Pages**
- Extract entity mentions from JSON-LD across all crawled pages
- Check: does the same entity (company name, person, service) have consistent properties across pages?
- Flag: `name: "SuperTrained"` on one page, `name: "SuperTrained AI"` on another
- This directly measures MEO Entity Consistency and feeds Rhumb's Schema Stability dimension
- **Implementation:** Collect all JSON-LD blocks. Group by `@type` + identifying field (e.g., `name`). For each group, compute property consistency: how many pages agree on each property value? Score is average consistency across entities. Partially LLM (for fuzzy matching of near-identical strings), partially deterministic.

### Marcus Chen — Top 5

**1. llms.txt Quality Assessment**
- Not just "does it exist?" but "is it useful?"
- Parse against the emerging llms.txt spec: must have `#` title line, `>` description, `##` sections
- Score: valid syntax (40%), coverage of site sections (30%), actionable URLs (20%), freshness signals (10%)
- Check llms-full.txt if referenced — is it a genuine expansion or a duplicate?
- **Implementation:** Fetch `/llms.txt`. Parse line by line against spec grammar. Check that every URL in the file returns 200. Check that the file covers all major site sections (compare URLs in llms.txt against sitemap.xml). Deterministic except for the coverage comparison which uses set intersection.

**2. API Endpoint Enumeration (Gated — Requires Ownership)**
- Parse sitemap.xml, robots.txt Disallow rules, page links, and JavaScript bundles for `/api/` paths
- For verified owners: probe discovered endpoints with OPTIONS requests to map available methods
- Score parity: can an agent do via API what a human does via UI?
- **Implementation:** Phase 1 (ungated): enumerate potential API paths from public sources. Phase 2 (gated): send OPTIONS requests and score based on method availability, response structure, error handling. This is the ONE check that legitimately requires ownership verification because it involves active probing.

**3. Robots.txt AI Policy Completeness**
- Parse robots.txt for: presence of AI-specific User-agent directives, Sitemap reference, llms.txt reference
- Score each known AI crawler: GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, CCBot, Bingbot, Anthropic-AI
- Policy categories: explicit allow, explicit disallow, no mention (inherits default), contradictory rules
- **Implementation:** Parse robots.txt into (user-agent, rule) pairs. Check against a maintained list of 15+ known AI crawlers. Score: percentage of known crawlers with explicit policy. Flag contradictions (e.g., Disallow: / but Allow: /blog for same agent). Completely deterministic.

**4. Structured Output Format Check**
- For any interactive elements (forms, calculators, search), check if the output is structured
- Does the Automation Blueprint at `/blueprint/{id}` return JSON when accessed with Accept: application/json?
- Does the RSS feed validate as RSS 2.0 or Atom?
- Do any XHR/fetch requests from the page return JSON with consistent schemas?
- **Implementation:** From the CrawlResult's NetworkEntry list, identify all `fetch`/`xhr` requests. Group by path pattern. Check Content-Type headers for `application/json`. For pages with forms, check if form submission endpoint returns structured data. Partially deterministic (header checking), partially requires active probing (form submission — gate this).

**5. Error State Agent-Readability**
- Request non-existent pages: does the 404 return structured error JSON or just an HTML error page?
- Request invalid parameters on known endpoints: structured error or stack trace?
- This is the single biggest differentiator between agent-ready and agent-hostile sites
- **Implementation:** Send GET to `/{random-uuid}`. Check response: is it JSON with error code and message, or HTML? Score: 100 for structured JSON error, 50 for HTML with clear error messaging and proper status code, 0 for generic page or wrong status code. Send requests with common invalid params to discovered endpoints. Deterministic.

### Dr. Samira Abdi — Top 5

**1. Link Relation Discovery Audit**
- Check `<link>` tags in HTML `<head>` for machine-readable alternates:
  - `rel="alternate" type="application/json"` (JSON feed)
  - `rel="alternate" type="text/plain"` (llms.txt — supertrained.ai actually has this)
  - `rel="alternate" type="application/rss+xml"` (RSS)
  - `rel="alternate" type="application/atom+xml"` (Atom)
  - `rel="api"` (rare but emerging)
  - `rel="describedby"` (schema pointer)
  - `rel="canonical"` (self-reference)
- Check HTTP `Link:` response headers for the same relations
- **Implementation:** Parse all `<link>` elements from the HTML `<head>`. Parse `Link:` response headers. Catalog by `rel` value. Score based on machine-readable format coverage. Verify each `href` returns 200. Completely deterministic.

**2. AI Crawler Policy Audit (robots.txt + HTTP headers)**
- Beyond robots.txt: check for `X-Robots-Tag` HTTP headers with AI-specific directives
- Check for `<meta name="robots">` content directives per page
- Check for `ai.txt` (proposed Anthropic standard) at `/.well-known/ai.txt`
- Flag contradictions between robots.txt rules, meta robots, and X-Robots-Tag headers
- **Implementation:** For each crawled page, extract meta robots tag, X-Robots-Tag header, and applicable robots.txt rule. Check for contradictions (e.g., robots.txt says Allow but meta says noindex). Score: consistency and completeness of AI policy. Deterministic.

**3. Structured Data Vocabulary Breadth**
- Count distinct schema.org types used across the site
- Check for industry-appropriate types (e.g., a SaaS site should have `SoftwareApplication` or `Product`, not just `WebSite`)
- Check for action types: `SearchAction`, `OrderAction`, `SubscribeAction` — can an agent take action?
- Check for `potentialAction` on Organization/WebSite (enables direct agent interaction from search results)
- **Implementation:** Collect all JSON-LD. Extract all `@type` values. Score against a type recommendations map per industry vertical (build-time configuration). Check for `potentialAction` property. Deterministic schema parsing.

**4. Sitemap Machine-Readability**
- Validate sitemap.xml against the sitemap protocol spec
- Check for `<lastmod>` accuracy (is the date plausible? Same date on all entries is suspicious)
- Check for `<changefreq>` and `<priority>` — are they differentiated or uniform?
- Check for alternate language sitemaps, image sitemaps, video sitemaps
- Check for sitemap index (for large sites)
- **Implementation:** Fetch and parse `/sitemap.xml`. Validate XML structure. Check lastmod distribution (flag if >80% of entries share the same timestamp — likely auto-generated, not real). Check priority distribution (flag if uniform). Deterministic XML parsing.

**5. Content Negotiation Breadth**
- For the homepage and 3 key pages, test:
  - `Accept: application/ld+json` — does it return just the structured data?
  - `Accept: application/json` — does it return a JSON representation?
  - `Accept: text/plain` — does it return readable text (llms.txt-style)?
  - `Accept: text/markdown` — emerging standard for LLM consumption
- Score the breadth of content types the server supports
- **Implementation:** 4 requests per sampled page (homepage + 3 highest-priority from sitemap). Record response Content-Type for each Accept header. Score = distinct supported formats / 4. Deterministic.

### Jake Garrison — Top 5

**1. Agent Discovery Simulation**
- Simulate what Claude/GPT actually does when it encounters a URL:
  1. Fetch the page
  2. Look for `<link>` tags pointing to machine-readable formats
  3. Check robots.txt for guidance
  4. Try to find an API spec
  5. Parse any structured data
  6. Try to understand what the site does and what actions are possible
- Score: at each step, was there a clear signal? Or did the agent hit a dead end?
- **Implementation:** Sequential state machine: fetch page -> parse links -> fetch robots.txt -> fetch discovered specs -> parse structured data -> summarize capabilities. At each step, record: "signal found" or "dead end." Score = signals found / total steps. The fetch steps are deterministic; the "summarize capabilities" step uses Haiku for a quick assessment.

**2. Actionability Assessment**
- Given the structured data, can an agent actually DO anything?
- Check for: `potentialAction` in JSON-LD, form elements with machine-parseable labels, documented endpoints
- Categories: read-only (agent can extract info), interactive (agent can submit data), transactional (agent can complete a purchase/signup)
- Score separately from discovery — a site can be highly discoverable but zero actionable
- **Implementation:** Parse JSON-LD for `potentialAction`, `SearchAction`, `OrderAction`. Scan forms for `action` attributes, `method`, `name`/`id` on inputs. Classify each form as structured (all inputs labeled, action URL clear) or ambiguous. Score: number of clear agent-invocable actions. Deterministic DOM parsing + light LLM for ambiguity classification.

**3. Error Response Quality for Agents**
- Not just "does the 404 page exist" but "can an agent recover from errors?"
- Check: does the error response include a `Content-Type: application/json` option?
- Does it include a machine-readable error code (not just HTTP status)?
- Does it include suggested next steps or a redirect hint?
- Does the rate limit response include `Retry-After` header?
- **Implementation:** Request `/{uuid}` (404), request a page with `Accept: application/json` (content negotiation failure), and if rate-limited, check headers. Score each error response on: proper status code (pass/fail), structured body (pass/fail), actionable guidance (pass/fail). Deterministic.

**4. Authentication Method Transparency**
- If the site has an API or interactive features: how does it communicate auth requirements?
- Does the 401/403 response explain what auth is needed?
- Is there a `WWW-Authenticate` header?
- Do API docs (if found) document auth clearly?
- Does the site expose OAuth/.well-known/openid-configuration?
- **Implementation:** Check for `/.well-known/openid-configuration` (HEAD request). If any endpoint returns 401/403, check for `WWW-Authenticate` header and response body explanation. Score: auth method clarity (0 = no information, 50 = header present, 100 = documented flow). Deterministic.

**5. Third-Party Agent Integration Evidence**
- Does the site integrate with agent platforms? Check for:
  - Zapier/Make integration pages or partner badges
  - MCP server advertisements
  - GitHub Actions/integrations
  - Slack/Discord bot presence
  - Chrome extension or native app
- Not just marketing claims but actual integration artifacts (Zapier trigger URLs, MCP endpoint manifests)
- **Implementation:** Search for known integration URLs in page links (zapier.com/apps/*, integromat/make patterns). Check for MCP manifest at known paths. Check for `<link>` to integration documentation. Score: number of verified integrations. Deterministic link analysis.

### Elena Vasquez — Top 5

**1. Machine-Readable Site Intent**
- Can an agent understand what this site IS and what it DOES in one request?
- Check: does the homepage JSON-LD fully describe the business?
- Does llms.txt exist and provide a useful summary?
- Is there a meta description that is machine-actionable (not just marketing fluff)?
- Score the information density of the first-request experience
- **Implementation:** Fetch homepage. Extract: title, meta description, JSON-LD, llms.txt (via link tag). Score each on information completeness: does the agent know what the site does (business type), what it offers (services/products), and how to engage (contact/API)? Partially LLM (for assessing whether the meta description is actionable vs. fluff), mostly deterministic.

**2. Crawlability Depth Score**
- How many clicks from homepage to reach every page in sitemap.xml?
- Are there orphan pages (in sitemap but not linked from any crawled page)?
- Is the navigation structure flat enough for efficient agent crawling?
- Do internal links use descriptive anchor text (agents use link text for navigation decisions)?
- **Implementation:** Build page graph from crawl data (each page's outbound links). Compute: max depth from homepage, orphan pages (in sitemap but unreachable), average link text length and descriptiveness. Score: lower depth = better, zero orphans = better. Deterministic graph analysis.

**3. Temporal Freshness Signals**
- Does the site communicate when content was last updated?
- Check: `<meta>` with dates, JSON-LD `dateModified`/`datePublished`, `<time>` elements, sitemap `lastmod`
- Are dates consistent (does the page say "Updated March 2026" but lastmod says 2024)?
- Agents need to know if information is current — stale data causes hallucinations
- **Implementation:** Extract all date signals from each page: meta tags, JSON-LD date properties, `<time>` elements, sitemap lastmod. Compare for consistency. Score: presence of dates (40%), consistency across signals (30%), recency (30%). Deterministic date extraction and comparison.

**4. Output Portability Assessment**
- For any tool or generator on the site: can the output be extracted by an agent?
- The Automation Blueprint at `/blueprint/{id}`: is the output copyable as structured data?
- Does the site offer PDF/JSON/CSV export of any content?
- Can an agent pipe the output to another tool?
- This directly measures Composability for Rhumb
- **Implementation:** For pages with interactive tools (identified from forms), check output format: is there a download button with structured format? Is the output wrapped in a copyable element with identifiable structure? Check for API endpoints that return the same data in JSON. Partially deterministic (DOM analysis), partially requires interaction testing (submit form, check output).

**5. Multi-Format Content Availability**
- Same content, how many machine-readable formats?
- Blog: HTML + RSS + llms.txt mention + JSON-LD Article?
- Services: HTML + JSON-LD Service + potential API listing?
- Score: average number of formats per content category
- The more formats, the more ways agents can consume the content
- **Implementation:** For each content category (blog, services, about, products), check: HTML present (baseline), JSON-LD present, RSS/Atom feed includes it, llms.txt references it, API returns it. Score: average formats per category / maximum possible formats per category. Deterministic cross-reference.

---

## 4. What Does a Truly Agent-Native Website Look Like?

### Dr. Raina Patel — The Benchmark

A truly agent-native website operates at three levels:

**Level 1: Discoverable (minimum viable)**
- robots.txt with explicit AI crawler policies
- llms.txt summarizing the site's purpose and capabilities
- JSON-LD on every page with complete, validated schema.org markup
- Sitemap.xml with accurate lastmod dates
- RSS/Atom for dynamic content
- `<link rel="alternate">` pointing to machine-readable formats
- Semantic HTML (landmarks, headings, ARIA)

**Level 2: Consumable (good)**
- Everything from Level 1, plus:
- Content negotiation (Accept: application/json returns structured data)
- OpenAPI/AsyncAPI spec for any interactive features
- Structured error responses (JSON errors with codes, not HTML 500 pages)
- Rate limit headers (X-RateLimit-Remaining, Retry-After)
- `.well-known/ai-plugin.json` describing capabilities
- Entity consistency across all pages (same organization, same properties)

**Level 3: Actionable (exceptional)**
- Everything from Levels 1-2, plus:
- MCP server endpoint for direct agent integration
- potentialAction in JSON-LD (SearchAction, OrderAction, etc.)
- Webhook documentation for event-driven agent workflows
- SDK or client library for programmatic access
- Structured output from all interactive tools (not just HTML)
- Authentication flow documented for machine consumption
- CRUD API parity with UI features

Most websites today are between Level 0 (no machine readability) and Level 1 (basic structured data). The agent-nativeness primitive should be able to differentiate across all three levels.

### Marcus Chen — The Integration Test

I evaluate agent-nativeness by one question: **Can I build a working Composio connector for this site in under an hour?**

If yes, the site is agent-native. If no, here is what is usually missing:

1. **No machine-readable capability description.** I cannot discover what the site does without reading marketing pages.
2. **No structured input contract.** I see a form, but I do not know what fields it accepts, what validation rules exist, or what the output format is.
3. **No error schema.** When my connector sends bad data, it gets HTML error pages instead of JSON with error codes.
4. **No authentication documentation.** The API exists but I cannot find how to authenticate.
5. **No versioning signals.** I build a connector today, it breaks tomorrow because the API changed with no notification.

### Dr. Samira Abdi — The Standards Stack

A truly agent-native website implements this discovery stack:

```
Layer 1: robots.txt          → Who can crawl what
Layer 2: llms.txt            → What is this site, in LLM-readable format
Layer 3: sitemap.xml         → What content exists and when it changed
Layer 4: JSON-LD             → What does each page mean (schema.org)
Layer 5: Link relations      → What machine-readable alternates exist
Layer 6: Content negotiation → Can you get structured data for any page?
Layer 7: .well-known/        → Machine discovery (ai-plugin.json, openid-config)
Layer 8: API specification   → OpenAPI/AsyncAPI for interactive features
Layer 9: MCP/tool manifest   → Direct agent tool integration
```

Each layer builds on the previous. Most sites implement layers 1, 3, and partial 4. Very few reach layer 6 or beyond.

### Jake Garrison — The Agent Walkthrough

I evaluate agent-nativeness by simulating what Claude does:

**Step 1: "What is this?"** — Can the agent determine the site's purpose from a single page load? (JSON-LD + meta description + llms.txt)

**Step 2: "What can I do?"** — Can the agent enumerate available actions? (potentialAction, forms, API docs)

**Step 3: "How do I do it?"** — Are the inputs documented? (OpenAPI, form labels, JSON schemas)

**Step 4: "Did it work?"** — Is the output structured? (JSON responses, structured error handling)

**Step 5: "What went wrong?"** — When it fails, is the error machine-parseable? (structured error codes, not HTML)

**Step 6: "What changed?"** — Can the agent detect changes over time? (lastmod, ETags, schema versioning)

If any step returns "no," the site is not agent-native at that level. The score should reflect how far through this journey the agent can get.

### Elena Vasquez — The Autonomy Test

When Replit Agent encounters a site, it needs to autonomously answer:

1. **Purpose:** What does this site/service do? (< 30 seconds to determine)
2. **Capability Map:** What specific operations are possible? (enumerate in < 60 seconds)
3. **Integration Path:** How do I programmatically interact? (find docs in < 2 minutes)
4. **Trust Assessment:** Is this service reliable? (freshness signals, uptime indicators, error quality)
5. **Cost Model:** What does it cost to use? (pricing structured data, rate limits documented)

The best agent-native sites answer all five in under 60 seconds from a cold start. The worst require a human developer to read documentation for hours.

---

## 5. Emerging Standards to Check

### Consensus List (All 5 Experts Agree These Must Be Checked)

| Standard | Path/Location | Status | Priority |
|----------|--------------|--------|----------|
| **llms.txt** | `/llms.txt` | Draft spec (draft-abdi-llmstxt-01). Adopted by ~5,000+ sites as of March 2026. | CRITICAL |
| **llms-full.txt** | `/llms-full.txt` | Extension of llms.txt for comprehensive site content. | HIGH |
| **robots.txt AI directives** | `/robots.txt` | De facto standard. GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot, ChatGPT-User, Claude-User. | CRITICAL |
| **JSON-LD (schema.org)** | In-page `<script>` | W3C Recommendation. Universal machine readability. | CRITICAL |
| **OpenAPI** | Various paths | OpenAPI 3.1 (latest). Standard API description. | HIGH |
| **Sitemap Protocol** | `/sitemap.xml` | sitemaps.org spec. Machine content inventory. | HIGH |
| **RSS/Atom** | Various paths | RFC 4287 (Atom), RSS 2.0 spec. Content syndication. | MEDIUM |

### Expert-Specific Additions

**Dr. Raina Patel:**
| Standard | Path | Status | Notes |
|----------|------|--------|-------|
| AsyncAPI | Various | AsyncAPI 3.0 spec | For event-driven APIs/webhooks |
| GraphQL Introspection | `/graphql` | Spec-defined | `{ __schema { types { name } } }` |
| JSON Schema | Referenced from OpenAPI | RFC draft | Input/output validation contracts |

**Marcus Chen:**
| Standard | Path | Status | Notes |
|----------|------|--------|-------|
| MCP Manifest | `/.well-known/mcp.json` (proposed) | Anthropic spec, evolving | Model Context Protocol tool manifest |
| `.well-known/ai-plugin.json` | `/.well-known/ai-plugin.json` | OpenAI-originated, wide adoption | ChatGPT plugin manifest |
| Webhooks catalog | Various | No standard path yet | Event type enumeration |

**Dr. Samira Abdi:**
| Standard | Path | Status | Notes |
|----------|------|--------|-------|
| `<link rel="alternate">` | HTML `<head>` | HTML spec, widely supported | Machine-readable format pointers |
| HTTP `Link:` header | Response headers | RFC 8288 | Same as `<link>` but at HTTP level |
| `X-Robots-Tag` | Response headers | Google-defined, de facto | Per-page AI crawler directives |
| `security.txt` | `/.well-known/security.txt` | RFC 9116 | Trust signal for security-conscious agents |
| `humans.txt` | `/humans.txt` | Informal standard | Supplementary to llms.txt |

**Jake Garrison:**
| Standard | Path | Status | Notes |
|----------|------|--------|-------|
| OAuth Discovery | `/.well-known/openid-configuration` | RFC 8414 | Auth flow for agent consumption |
| CORS Headers | Response headers | W3C spec | Whether cross-origin agent access works |
| CSP report-uri | Response headers | W3C spec | Indicates security monitoring maturity |

**Elena Vasquez:**
| Standard | Path | Status | Notes |
|----------|------|--------|-------|
| `<meta name="generator">` | HTML `<head>` | Informal | Stack detection for targeted advice |
| Web App Manifest | `/manifest.json` | W3C spec | App capability declaration |
| Service Worker | Referenced in HTML | W3C spec | Offline/caching capability indicator |

---

## 6. Independent Agent-Nativeness Audit of supertrained.ai

### Methodology

Each expert independently audited supertrained.ai from an agent's perspective. Evidence gathered from: homepage HTML, robots.txt, sitemap.xml, llms.txt, llms-full.txt, RSS feed, blueprint page, and .well-known probes.

---

### Dr. Raina Patel's Audit

**Overall Assessment: Surprisingly strong for Level 1. Clear gaps at Level 2-3.**

| Signal | Status | Score | Evidence |
|--------|--------|-------|----------|
| JSON-LD | Present, comprehensive | 85/100 | ProfessionalService + WebSite with founders, services, contact. Missing: `potentialAction` for search/blueprint, `dateModified`, `sameAs` for social links. |
| llms.txt | Present, high quality | 90/100 | 105 lines, covers services, pricing, products, methodology, FAQ, links. One of the best llms.txt implementations I have seen. |
| llms-full.txt | Present, exceptional | 95/100 | 523 lines. Full competitive positioning, service details, team bios, entity definitions. This is a reference implementation. |
| robots.txt | Present, AI-explicit | 92/100 | 8 AI crawler user-agents with explicit Allow. Disallow: /api/. llms.txt referenced. Minor deduction: `llms.txt:` and `llms-full.txt:` are non-standard directives — they work as comments but are not spec-compliant. |
| Sitemap | Present | 70/100 | 43 URLs. Major issue: ALL entries share the same lastmod (2026-03-11T19:14:37.577Z). This is clearly auto-generated build timestamp, not real modification dates. Agents cannot determine content freshness. |
| RSS Feed | Present, valid | 80/100 | 8 items, proper XML, categories. Missing: `<guid>` uniqueness, no `<pubDate>` on channel, no Atom self-link. |
| Link Relations | Present | 85/100 | `rel="alternate" type="text/plain" href="/llms.txt"` and `rel="alternate" type="application/rss+xml"` in `<head>`. |
| Semantic HTML | Good | 75/100 | `<main id="main-content">`, `<nav>`, implied header/footer. Missing: `<article>` on blog posts, `<section>` with `aria-label`, no `<aside>`. |
| Content Negotiation | Absent | 0/100 | No JSON responses for any page. /api returns 404. |
| .well-known | Absent | 0/100 | `/.well-known/ai-plugin.json` returns 404. No OpenAPI spec. |
| Error Handling | Unknown | —/100 | Could not test (requires active probing). |
| Entity Consistency | Good | 80/100 | "SuperTrained" used consistently in JSON-LD. Minor: some pages may say "SuperTrained" vs "SuperTrained.ai" (needs full crawl to verify). |

**Score: 65/100** — Strong Level 1 (discoverable), non-existent Level 2 (consumable) and Level 3 (actionable).

**Top Finding:** The llms.txt and llms-full.txt files are genuinely exceptional — top 1% of implementations I have reviewed. The site clearly understands LLM discoverability. But there is a cliff: the site tells agents everything about what it does, and gives them zero way to interact with it programmatically. The Automation Blueprint tool accepts natural language input but exposes no structured interface for agent consumption.

---

### Marcus Chen's Audit

**Overall Assessment: World-class documentation, zero integration surface.**

**Can I build a Composio connector?** No. There is no API to connect to. The blueprint form submits to a Next.js API route but that route is not documented, not versioned, and returns HTML.

| Category | Findings |
|----------|----------|
| **Exceptional** | llms-full.txt is 523 lines of perfectly structured, machine-parseable content. Every service has pricing. Every product has a live URL. Competitive positioning is explicit. This is the best llms-full.txt I have seen across 400+ tools evaluated. |
| **Strong** | robots.txt acknowledges 8 AI crawlers. JSON-LD correctly types the business as ProfessionalService with makesOffer. RSS feed exists and validates. |
| **Weak** | No OpenAPI spec. No API documentation. No MCP endpoint. No webhooks. No SDK. The Automation Blueprint has a form (POST to /api/blueprint) but no public API contract. |
| **Missing** | `.well-known/ai-plugin.json` (404). Content negotiation (no JSON responses). Structured error responses (unknown). potentialAction in JSON-LD (absent). Rate limit documentation (absent). |

**The Irony:** This is an AI automation agency whose website has zero agent automation surface. An agent can learn everything about SuperTrained but cannot programmatically request a blueprint, book a call, or check service availability.

**Score: 60/100** — Discovery A+, Integration F.

---

### Dr. Samira Abdi's Audit

**Overall Assessment: Standards-aware but incomplete. Strong signals of intent, weak signals of implementation.**

| Standard | Compliance | Notes |
|----------|-----------|-------|
| llms.txt | **Excellent** | Follows emerging spec format. Title line, description, sections, URLs. Referenced from robots.txt AND `<link rel="alternate">`. This is the correct discovery chain. |
| robots.txt | **Very Good** | AI crawlers named. Missing: `Claude-User` and `Anthropic-AI` (but has `ClaudeBot`). The `llms.txt:` and `llms-full.txt:` directives are non-standard — no crawler parser will recognize them. They function only as human-readable comments. Should use comment format: `# llms.txt: https://...` or rely on the `<link>` tag (which they correctly do). |
| JSON-LD | **Good** | Two blocks (ProfessionalService, WebSite). Missing: `potentialAction` (SearchAction for the blueprint tool), `sameAs` pointing to social profiles, `hasOfferCatalog` for structured pricing, `review`/`aggregateRating`. |
| Sitemap | **Compliant but deceptive** | Valid XML. But uniform `lastmod` across 43 pages is semantically meaningless. An agent trusting lastmod for freshness decisions will be misled. Either provide real modification timestamps or omit lastmod entirely. |
| RSS | **Valid** | RSS 2.0 with Atom namespace. Missing self-referential Atom link (`<atom:link rel="self">`). |
| `<link>` tags | **Good** | Correctly provides `rel="alternate"` for llms.txt and RSS. Missing: `rel="alternate" type="application/json"` for structured data endpoint. Missing: `rel="search"` pointing to OpenSearch description. |
| HTTP Headers | **Not checked** | Would need active probing. |
| `.well-known/` | **Absent** | No ai-plugin.json, no openid-configuration, no security.txt. |

**Score: 62/100** — Best-in-class llms.txt with standards-aware implementation. But stops at discovery layer; no interactive or integration standards implemented.

---

### Jake Garrison's Audit

**Overall Assessment: Agent can answer "What is this?" in 5 seconds. Cannot answer "How do I use it?" at all.**

**Agent Walkthrough Simulation:**

| Step | Question | Result | Time |
|------|----------|--------|------|
| 1 | "What is this?" | Answered immediately. JSON-LD + meta description + llms.txt provide complete business description. | 2 seconds |
| 2 | "What can I do?" | **Partial.** llms.txt lists engagement paths (blueprint, email, contact page). But no structured action surface. Agent knows it can "use the Automation Blueprint generator" but has no API contract for doing so. | 10 seconds |
| 3 | "How do I do it?" | **Failed.** No OpenAPI spec, no form input schema, no documented API endpoints. Agent would have to reverse-engineer the form submission, which is fragile and unauthorized. | Dead end |
| 4 | "Did it work?" | **Cannot test.** No structured responses to verify. | N/A |
| 5 | "What went wrong?" | **Cannot test.** No error response contract. | N/A |
| 6 | "What changed?" | **Partially.** RSS feed provides temporal signal for blog content. Sitemap lastmod is unreliable (uniform timestamps). JSON-LD lacks `dateModified`. | Degraded |

**Key Discovery:** llms.txt explicitly describes the Automation Blueprint workflow: "Describe your bottleneck at supertrained.ai/blueprint and receive a personalized Automation Blueprint in 60 seconds." This is agent-inviting language. But the actual interface is an HTML form with no API documentation. An agent reading llms.txt would expect to be able to use this tool. It cannot.

**Score: 55/100** — Outstanding discoverability undermined by zero actionability.

---

### Elena Vasquez's Audit

**Overall Assessment: The best llms.txt I have seen in production. The worst API surface for a company that builds AI agents.**

**Autonomy Test Results:**

| Question | Answer Time | Quality |
|----------|-------------|---------|
| Purpose | 3 seconds | Excellent. JSON-LD + llms.txt + meta description are redundant and consistent. |
| Capability Map | 15 seconds | Good. Services enumerated in JSON-LD (makesOffer), llms.txt, and page content. But capabilities are human services, not machine-consumable APIs. |
| Integration Path | > 5 minutes, then gave up | Failed. No API docs, no OpenAPI, no MCP, no webhooks. The only integration path is "email hello@supertrained.ai." |
| Trust Assessment | 30 seconds | Good. Trust page referenced in llms.txt. Sub-processors listed. Honest disclosures (no SOC 2 yet). |
| Cost Model | 10 seconds | Excellent. Pricing explicit in llms.txt AND JSON-LD (priceRange). Milestone-based billing documented. |

**The Paradox:** SuperTrained's llms.txt is so good that it raises expectations the site cannot meet. When I read "Use the Automation Blueprint generator at supertrained.ai/blueprint to describe a bottleneck and receive a personalized Automation Blueprint in 60 seconds," I expected a programmatic interface. The actual implementation is a web form with no API contract.

**For Rhumb AN Score dimensions:**

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Parity | 15/100 | No API surface. UI-only for all features. |
| Granularity | N/A | No API to evaluate granularity of |
| Composability | 30/100 | RSS and llms.txt are composable. Blueprint output is not — HTML only. |
| Schema Stability | 40/100 | JSON-LD exists but no versioning, no schema fingerprint. |
| Token Cost | N/A | No API to measure token cost of |
| Error Handling | 0/100 | No API, no error responses to evaluate. |
| Data Freshness | 45/100 | RSS has dates. Sitemap dates are fake (uniform). JSON-LD has no dateModified. |

**Score: 58/100** — This site is optimized for LLM retrieval (MEO), not LLM integration (agent-nativeness). Those are different things.

---

### Panel Consensus Score for supertrained.ai

| Expert | Score | Key Reason |
|--------|-------|------------|
| Dr. Raina Patel | 65/100 | Strong L1, absent L2/L3 |
| Marcus Chen | 60/100 | Best llms.txt, zero integration |
| Dr. Samira Abdi | 62/100 | Standards-aware, incomplete implementation |
| Jake Garrison | 55/100 | Discovery A+, actionability F |
| Elena Vasquez | 58/100 | MEO-optimized, not agent-native |
| **Panel Average** | **60/100** | |

**Key insight from the panel:** SuperTrained.ai is one of the most LLM-discoverable websites any expert has evaluated — the llms.txt, llms-full.txt, robots.txt AI directives, and JSON-LD implementation are genuinely exceptional. But agent-nativeness is not just discoverability. It is discoverability + consumability + actionability. The site scores ~90/100 on discovery and ~10/100 on actionability.

The current Alien Eyes primitive returned 0 findings for this site because of the ownership gate. The correct number of findings, based on this panel, is approximately 8-12:

1. **No potentialAction in JSON-LD** (MEDIUM) — Blueprint tool should have SearchAction
2. **Uniform sitemap lastmod** (LOW) — All 43 pages share one timestamp
3. **No .well-known/ai-plugin.json** (LOW) — Agent capability discovery dead end
4. **No content negotiation** (MEDIUM) — No JSON responses for any page
5. **No OpenAPI/API documentation** (MEDIUM) — Interactive features undocumented for agents
6. **Non-standard robots.txt directives** (LOW) — `llms.txt:` line is a comment, not a directive
7. **Missing JSON-LD properties** (LOW) — No sameAs, dateModified, hasOfferCatalog
8. **No structured error responses** (LOW) — 404 returns HTML, not JSON
9. **Blueprint tool has no API contract** (HIGH) — llms.txt advertises it, agents can't use it
10. **RSS feed missing best practices** (LOW) — No guid, no channel pubDate, no Atom self-link

---

## 7. Rating the Current Agent-Nativeness Primitive (1-10)

### Dr. Raina Patel: 2/10

The primitive does three things: keyword search on visible text, check for empty structured data arrays, and check for commented llms.txt in robots.txt. Of these three checks:

- The keyword search is worse than useless (false positives + false negatives)
- The structured data check is correct but shallow (present/absent, not complete/incomplete)
- The llms.txt check is oddly specific (only catches ONE pattern: commented-out reference)

And the ownership gate means none of these run for unverified URLs. The LLM supplement is a black box that may or may not generate relevant findings. The primitive effectively does nothing for the majority of audits. It also has zero connection to the Rhumb AN Score dimensions it claims to feed (Parity, Granularity, Composability, Schema Stability, Token Cost, Error Handling, Data Freshness).

### Marcus Chen: 2/10

I build integrations for a living. This primitive cannot tell me whether a site is integrable. It checks if the word "API" appears in marketing copy. That is not agent-nativeness evaluation — that is content keyword analysis misclassified as a technical assessment.

The entire approach is inverted: it looks at human-readable text when it should be examining machine-readable interfaces. It is the equivalent of evaluating a restaurant's food quality by reading the sign on the door.

The LLM supplement (Opus generating "at most 2 gaps") is too unconstrained. Without specific sub-dimensions or rubrics, the LLM will produce inconsistent, non-reproducible findings across runs.

### Dr. Samira Abdi: 3/10

I give one extra point because the check for structured data existence is directionally correct. But:

- The keyword list is not extensible and not weighted
- The structured data check does not validate content, only existence
- The llms.txt check only catches one edge case (commented-out reference in robots.txt) and misses the far more common case: llms.txt does not exist at all
- There is no check for robots.txt AI directives
- There is no check for link relations
- There is no check for content negotiation
- There is no check for .well-known discovery paths
- The methodology rubric (Section 4 of METHODOLOGY-v0.1.md) defines Parity, Granularity, Composability, CRUD Completeness, and Error Handling as sub-dimensions, but the primitive implements NONE of them

The primitive and the methodology are disconnected. The methodology describes what should be measured. The primitive measures something else entirely.

### Jake Garrison: 2/10

From an evaluation quality perspective, this primitive fails basic adversarial testing:

1. **Gameable:** Add "API JSON SDK" to a footer and the keyword check passes. The site is no more agent-native.
2. **Not reproducible:** The LLM supplement generates different findings per run. Two audits of the same site will produce different results.
3. **No evidence granularity:** The structured data check is binary (present/absent). It does not distinguish between a site with 1 JSON-LD block containing `@type: "WebSite"` and a site with 15 blocks covering every page type with full properties.
4. **Wrong scope:** The primitive checks page content but agent-nativeness is primarily about infrastructure: discovery endpoints, API contracts, error handling, content negotiation. These are not page-level properties — they are site-level properties.
5. **Gated into uselessness:** The ownership gate means this primitive produces zero output for the vast majority of audits, which means it generates zero data for calibration, which means it can never improve.

### Elena Vasquez: 3/10

An extra point for the LLM supplement, which at least has the potential to catch things the deterministic checks miss. But:

The fundamental architecture is wrong. Agent-nativeness should be evaluated at the **site level**, not the **page level**. The current implementation iterates over `PageSummary[]` and checks each page independently. But the signals that matter (robots.txt, llms.txt, .well-known, API endpoints, content negotiation) are site-wide resources, not per-page properties.

The primitive should:
1. First: check site-wide discovery resources (robots.txt, llms.txt, .well-known, sitemap)
2. Then: check page-level structured data and semantic HTML
3. Then: check interactive surface quality (error handling, content negotiation)
4. Then: assess overall agent readiness

The current implementation skips steps 1, 3, and 4 entirely and does step 2 poorly.

### Panel Consensus Rating

| Expert | Rating | Key Criticism |
|--------|--------|---------------|
| Dr. Raina Patel | 2/10 | Disconnected from Rhumb dimensions it feeds |
| Marcus Chen | 2/10 | Checks marketing, not capability |
| Dr. Samira Abdi | 3/10 | Disconnected from its own methodology rubric |
| Jake Garrison | 2/10 | Gameable, not reproducible, wrong scope |
| Elena Vasquez | 3/10 | Wrong architecture (page-level vs site-level) |
| **Panel Average** | **2.4/10** | |

---

## 8. Consolidated Recommendations (Priority Order)

### CRITICAL (Must Fix Before Shipping)

**C1. Remove the ownership gate for passive checks.**
The gate prevents the primitive from producing any output for unverified URLs. Since all current checks examine publicly observable signals, the gate is unnecessary and renders the entire primitive inoperable for the default use case. Reserve gating for active probing only (API endpoint testing, form submission).

**C2. Replace keyword matching with direct endpoint probing.**
Current: substring search for "api", "json" etc. in visible text.
Replace with: HEAD requests to known discovery paths (`/llms.txt`, `/.well-known/ai-plugin.json`, `/openapi.json`, etc.). This is deterministic, not gameable, and measures actual capability rather than marketing claims. No LLM needed. ~15 HTTP requests, parallelizable.

**C3. Restructure as site-level evaluation, not page-level iteration.**
Current: loops over `PageSummary[]` and checks each page.
Replace with: site-level assessment that examines robots.txt, llms.txt, sitemap, .well-known as primary signals, then page-level structured data as secondary signals. The CrawlResult already has `robotsTxtStatus` — extend this pattern.

**C4. Implement the methodology's own rubric.**
The pre-registered methodology (METHODOLOGY-v0.1.md, Section 4) defines 5 sub-dimensions: Parity, Granularity, Composability, CRUD Completeness, Error Handling. The primitive implements zero of these. Either implement them or remove them from the methodology. Shipping a primitive that contradicts its own published rubric is a credibility problem.

### HIGH (Should Fix Before Launch)

**H1. Add llms.txt quality assessment (not just existence check).**
The current primitive only checks for a commented-out reference in robots.txt. It should: (a) check if `/llms.txt` exists and returns 200, (b) validate basic structure (title, description, sections), (c) check URL validity within the file, (d) compare coverage against sitemap.xml.

**H2. Add robots.txt AI policy completeness scoring.**
Parse robots.txt for known AI crawlers (15+ user-agents). Score: percentage with explicit policy. Flag contradictions between robots.txt, meta robots, and X-Robots-Tag headers. This is entirely deterministic.

**H3. Add structured data completeness scoring (not just existence).**
Current check: `structuredData.length === 0`. Replace with: parse each JSON-LD block, validate @type against schema.org, check required/recommended property completeness per type, check for potentialAction, check entity consistency across pages.

**H4. Add machine-readable discovery path inventory.**
Probe 10-15 well-known paths with HEAD requests. Score: percentage of discovery paths that return 200. This directly feeds Rhumb's Composability dimension.

**H5. Constrain the LLM supplement with specific sub-dimensions.**
Current prompt: "Find at most two agent-nativeness gaps in parity, composability, or machine readability." This is too vague. Provide the LLM with the specific sub-dimension rubric and ask it to evaluate each one. This produces reproducible, comparable findings across audits.

### MEDIUM (Should Fix Before Scale)

**M1. Add content negotiation testing.** Send `Accept: application/json` to sampled pages. Score whether the server returns structured data.

**M2. Add sitemap quality assessment.** Validate lastmod distribution (flag uniform timestamps), check priority differentiation, verify all URLs return 200.

**M3. Add Link relation audit.** Parse `<link>` tags and HTTP `Link:` headers for machine-readable format pointers. Score coverage.

**M4. Add temporal freshness signal assessment.** Cross-reference dates from JSON-LD, sitemap, `<time>` elements, meta tags. Flag inconsistencies.

**M5. Add error response quality check (gated).** For verified owners: probe 404 and invalid-parameter responses. Score: structured JSON errors vs HTML error pages.

---

## 9. Proposed Architecture for Rebuilt Primitive

```typescript
// Site-level assessment, not page-level iteration
export class AgentNativenessPrimitive extends BasePrimitive {
  readonly name = 'agent-nativeness';
  readonly dimension = 'agent-nativeness' as const;
  readonly requiresOwnershipVerification = false;  // CHANGED
  readonly usesLLM = true;

  async run(crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];

      // Phase 1: Site-level discovery (deterministic, no auth needed)
      findings.push(...await this.checkDiscoveryEndpoints(crawl));
      findings.push(...this.checkRobotsTxtAiPolicy(crawl));
      findings.push(...this.checkLlmsTxtQuality(crawl));
      findings.push(...this.checkSitemapQuality(crawl));

      // Phase 2: Page-level structured data (deterministic)
      findings.push(...this.checkStructuredDataCompleteness(summaries));
      findings.push(...this.checkEntityConsistency(summaries));
      findings.push(...this.checkSemanticHtmlDepth(summaries));
      findings.push(...this.checkLinkRelations(summaries));

      // Phase 3: Interactive surface (partially gated)
      findings.push(...await this.checkContentNegotiation(crawl));
      if (config.ownershipVerified) {
        findings.push(...await this.checkErrorResponses(crawl));
        findings.push(...await this.checkApiEndpoints(crawl));
      }

      // Phase 4: LLM synthesis (constrained by sub-dimensions)
      if (config.tier === 'full_audit') {
        findings.push(...await this.llmAssessSubDimensions(summaries));
      }

      return findings;
    });
  }
}
```

---

## 10. Final Statement

**Dr. Raina Patel:** The agent-nativeness primitive is the most important dimension Alien Eyes evaluates — it is the product's core differentiator and the primary data source for Rhumb. It deserves the most engineering investment and currently has the least. Fix the gate, fix the methodology alignment, and build the discovery endpoint probing. Those three changes transform a 2/10 into a 7/10.

**Marcus Chen:** The llms.txt quality check alone would be more valuable than everything the primitive currently does. Sites are adopting llms.txt faster than any web standard since robots.txt. Being the tool that tells builders "your llms.txt is missing these sections" or "these URLs in your llms.txt are broken" is an immediate, concrete, valuable product feature.

**Dr. Samira Abdi:** The standards landscape is moving fast. By the time Alien Eyes launches, there will likely be a W3C working group for machine-readable web discovery. Build the primitive to be extensible: a registry of "discovery checks" where each check has a path, a validator, and a weight. New standards can be added without modifying the primitive's core logic.

**Jake Garrison:** The single most impactful change is removing the ownership gate. Every day it stays, the primitive generates zero data, which means zero calibration, which means zero improvement. You cannot iterate on a primitive that never runs. Ship it ungated, collect data, then decide what (if anything) needs gating based on actual false positive and abuse patterns.

**Elena Vasquez:** The agent-nativeness primitive should be the one primitive that works in Quick Check (free tier). It is entirely deterministic — no LLM needed for discovery endpoint probing, robots.txt parsing, structured data validation, or link relation auditing. Making it free-tier gives every site owner a reason to run Alien Eyes and generates the data you need to improve the methodology. Gate the LLM synthesis behind Full Audit, but the deterministic checks should run on every audit.

---

## Appendix: Evidence Artifacts

### supertrained.ai Discovery Endpoints Tested

| Endpoint | Status | Content |
|----------|--------|---------|
| `/robots.txt` | 200 | 8 AI crawlers, sitemap ref, llms.txt ref |
| `/llms.txt` | 200 | 105 lines, comprehensive |
| `/llms-full.txt` | 200 | 523 lines, exceptional |
| `/sitemap.xml` | 200 | 43 URLs, uniform lastmod |
| `/blog/rss.xml` | 200 | 8 items, valid RSS 2.0 |
| `/.well-known/ai-plugin.json` | 404 | Not found |
| `/api` | 404 | Not found (robots.txt Disallow: /api/) |
| `/openapi.json` | Not tested | — |
| `/.well-known/openid-configuration` | Not tested | — |

### JSON-LD Types Found

| Type | Properties Present | Properties Missing |
|------|-------------------|-------------------|
| ProfessionalService | name, url, logo, description, slogan, foundingDate, numberOfEmployees, areaServed, priceRange, founder, knowsAbout, makesOffer, contactPoint | potentialAction, sameAs, hasOfferCatalog, dateModified, aggregateRating, review |
| WebSite | name, url, description | potentialAction (SearchAction), sameAs, dateModified |
| Person (x2) | name, jobTitle | sameAs, url, image |
| Service (x4) | name | description, provider, areaServed, offers |
| Offer (x4) | itemOffered | price, priceCurrency, availability |

### Link Relations Found in `<head>`

| Rel | Type | Href |
|-----|------|------|
| alternate | text/plain | /llms.txt |
| alternate | application/rss+xml | /blog/rss.xml |
| icon | image/x-icon | /favicon.ico |
| canonical | — | (not reported) |

### Missing Link Relations

| Rel | Type | Purpose |
|-----|------|---------|
| alternate | application/json | Structured data endpoint |
| search | application/opensearchdescription+xml | OpenSearch discovery |
| api | — | API documentation |
| describedby | application/schema+json | Schema pointer |
