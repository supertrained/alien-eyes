# Alien Eyes — Scenario Grammar Design

> Version: 1.0 | Date: 2026-03-10
> Status: DESIGNED. Grammar defined with 5 axes and composable primitives. NOT yet implemented.
> Purpose: Define how test scenarios are composed from primitives to create 10^6+ unique configurations that can't be gamed.
> Implements: Stolen Mechanism #3 (Scenario Grammar from Chaos Engineering + Mystery Shopping)

---

## Why a Grammar?

A static test list can be gamed: study the list, pass the tests, ship a bad product. A scenario grammar composes tests from primitives, creating unique configurations for every audit. The builder cannot predict exactly which scenarios will run, so they can't selectively optimize for our tests.

**Analogy:** A grammar generates sentences. "The [adjective] [noun] [verb] the [object]" generates thousands of unique sentences. Our scenario grammar generates thousands of unique test configurations from composable primitives.

---

## The Five Axes

Every audit scenario is composed by selecting one value from each of 5 axes:

### Axis 1: Persona (Who is using the product?)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `first-time-visitor` | No prior context, no account, arrives from search/social | Navigation, onboarding, trust signals |
| `returning-user` | Has used the product before, may have an account | Login flow, personalization, data persistence |
| `mobile-user` | Using a phone, touch-based, possibly on slow network | Responsive design, tap targets, load time |
| `screen-reader-user` | Using NVDA/VoiceOver, keyboard-only navigation | ARIA, heading hierarchy, focus management |
| `keyboard-user` | No mouse, tab navigation only | Focus order, skip links, keyboard shortcuts |
| `slow-connection-user` | 3G or throttled connection | Performance, progressive loading, offline states |
| `non-english-user` | Primary language is not English | i18n, content clarity, locale handling |
| `ai-agent` | MCP client, API consumer, or LLM browsing | Structured data, API quality, error responses |
| `search-crawler` | Google, Bing, or AI search engine crawler | SEO, structured data, canonical URLs, robots |
| `security-researcher` | Looking for common vulnerabilities | Headers, cookies, exposed secrets, auth patterns |

### Axis 2: Entry Point (How do they arrive?)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `homepage` | Direct navigation to root URL | Hero, value prop, primary CTA |
| `deep-link` | Direct link to a specific page (blog post, product, etc.) | Page context without site context |
| `search-result` | Arriving from Google/Bing SERP | Meta description accuracy, landing page relevance |
| `social-share` | Arriving from shared link on social media | OG tags, preview accuracy, landing experience |
| `api-discovery` | Agent discovering API endpoints | API documentation, schema, error handling |
| `sitemap-crawl` | Systematic crawl via sitemap.xml | Sitemap completeness, URL structure |
| `random-page` | Random page from the crawl | Navigation consistency, standalone page quality |

### Axis 3: Intent (What are they trying to do?)

| Primitive | Description | Affects |
|-----------|-------------|---------|
| `understand-offering` | Trying to understand what this product does | Value prop clarity, information architecture |
| `evaluate-pricing` | Comparing pricing, looking for costs | Pricing page, hidden fees, comparison |
| `sign-up` | Creating an account or starting a trial | Signup flow, form validation, error states |
| `find-support` | Looking for help, docs, or contact | Support page, documentation, contact options |
| `complete-task` | Trying to accomplish the product's core purpose | Core flow, error handling, completion states |
| `leave` | Trying to delete account, cancel, or export data | Data portability, account deletion, dark patterns |
| `integrate` | Agent trying to use the product's API/MCP | API docs, authentication, structured responses |

### Axis 4: Dimension Focus (What quality dimension to emphasize?)

| Primitive | Description | Weight |
|-----------|-------------|--------|
| `seo-focus` | Emphasize SEO signals | SEO checks get 2x weight |
| `accessibility-focus` | Emphasize accessibility | Accessibility checks get 2x weight |
| `security-focus` | Emphasize security surface | Security checks get 2x weight |
| `performance-focus` | Emphasize performance | Performance checks get 2x weight |
| `agent-focus` | Emphasize agent-nativeness | AN checks get 2x weight |
| `ux-focus` | Emphasize copy and UX | Copy-UX checks get 2x weight |
| `balanced` | Equal weight across all dimensions | Default |

### Axis 5: Adversarial Condition (What goes wrong?)

| Primitive | Description | Tests |
|-----------|-------------|-------|
| `normal` | Everything works as expected | Baseline behavior |
| `slow-network` | Simulated 3G throttling | Progressive loading, timeouts, fallbacks |
| `js-disabled` | JavaScript turned off | Server rendering, noscript fallbacks |
| `cookies-declined` | Cookie consent declined | Functionality without tracking cookies |
| `ad-blocker` | Common ad blocker active | Analytics fallbacks, content visibility |
| `large-viewport` | Ultra-wide screen (2560px+) | Layout at extreme widths |
| `small-viewport` | Very small screen (320px) | Minimum viable responsive design |
| `outdated-browser` | Simulated older browser | Graceful degradation |

---

## Composition Rules

A scenario is a tuple: `(persona, entry_point, intent, dimension_focus, condition)`

**Example compositions:**

```
Scenario 1: (first-time-visitor, homepage, understand-offering, balanced, normal)
  → A new visitor arrives at the homepage, tries to understand what the product does.
  → Checks: value prop clarity, navigation, trust signals, load time.

Scenario 2: (screen-reader-user, deep-link, find-support, accessibility-focus, normal)
  → A screen reader user arrives at a random page, tries to find support.
  → Checks: ARIA landmarks, heading hierarchy, link text, form labels, skip links.

Scenario 3: (ai-agent, api-discovery, integrate, agent-focus, normal)
  → An AI agent discovers the API, tries to integrate.
  → Checks: API documentation, structured responses, error handling, CRUD completeness.

Scenario 4: (mobile-user, social-share, sign-up, ux-focus, slow-network)
  → A mobile user clicks a social link, tries to sign up on a slow connection.
  → Checks: OG tags match content, mobile form UX, load time under throttling, progressive loading.

Scenario 5: (first-time-visitor, homepage, evaluate-pricing, balanced, cookies-declined)
  → A visitor arrives at homepage, looks for pricing, has declined cookies.
  → Checks: pricing page accessibility, cookie consent handling, analytics fallbacks.
```

**Total possible scenarios:** 10 × 7 × 7 × 7 × 8 = **27,440 unique configurations**

With future axis expansion (more personas, entry points, conditions), this grows to 10^6+.

---

## Scenario Selection Per Audit

Not all scenarios run on every audit. The grammar selects a subset:

### Quick Check (Free Tier)

| What | How Many | Selection |
|------|----------|-----------|
| Personas | 3 fixed | first-time-visitor, mobile-user, search-crawler |
| Entry points | 2 fixed | homepage, random-page |
| Intents | 2 fixed | understand-offering, evaluate-pricing |
| Dimension focus | 1 fixed | balanced |
| Conditions | 1 fixed | normal |
| **Total scenarios** | **~12** | Deterministic, reproducible |

### Full Audit (Paid)

| What | How Many | Selection |
|------|----------|-----------|
| Personas | 5-7 selected | Mix of human + agent + accessibility personas |
| Entry points | 3-5 selected | Homepage + deep-link + at least one random |
| Intents | 3-5 selected | Understand + evaluate + complete-task + at least one |
| Dimension focus | 1 adaptive | Selected based on initial findings (Adaptive Enrichment) |
| Conditions | 2-3 selected | Normal + at least one adversarial condition |
| **Total scenarios** | **~30-60** | Partially random, not fully reproducible |

### Deterministic Mode (CI/CD)

| What | How Many | Selection |
|------|----------|-----------|
| All axes | Fixed | Seed-based deterministic selection |
| **Total scenarios** | **Same as paid** | Same seed → same scenarios → same scores |

---

## Adaptive Enrichment (Stolen Mechanism #4)

After the initial pass, the grammar adapts:

1. **Initial pass:** Run balanced scenarios across all dimensions
2. **Signal detection:** Which dimensions have the most findings?
3. **Enrichment:** Run additional scenarios focused on high-signal dimensions

**Example:** Initial pass finds 3 SEO issues and 0 performance issues.
- SEO gets 3 more focused scenarios (different personas, different entry points)
- Performance gets no additional scenarios (clean dimension)
- Total audit cost stays within budget because less time is spent on clean dimensions

---

## Steady State Hypothesis (Stolen Mechanism #1)

For each scenario, the grammar generates a hypothesis about what SHOULD happen:

```
Scenario: (first-time-visitor, homepage, understand-offering, balanced, normal)

Hypothesis: "A first-time visitor landing on the homepage should be able to understand
what the product does within 10 seconds of reading (above-fold content), identify how
to get started (primary CTA visible without scrolling), and feel confident the product
is trustworthy (trust signals present)."

Test: Does the homepage have a clear value proposition above the fold?
      Is there a visible primary CTA?
      Are trust signals present (social proof, credentials, testimonials)?
```

The audit tests whether the hypothesis holds. If it doesn't, a finding is generated.

---

## Anti-Gaming Properties

1. **Non-predictable:** With 27,440+ possible scenarios, the builder can't predict which ones will run
2. **Evolving:** New primitives are added over time (the grammar grows with every version)
3. **Adaptive:** The enrichment pass focuses on weak areas the builder can't anticipate
4. **Cross-dimensional:** A finding might come from an unexpected combination (e.g., security issue discovered via accessibility testing persona)
5. **Scenario-blind findings:** Findings describe outcomes, not tests ("your signup form doesn't give feedback" — not "in scenario 47, we tested...")

---

## Implementation Notes

### V1 Implementation (Simplified)

For V1, the grammar is implemented as configuration, not a full parser:

```typescript
interface ScenarioConfig {
  personas: PersonaPrimitive[];
  entryPoints: EntryPointPrimitive[];
  intents: IntentPrimitive[];
  dimensionFocus: DimensionFocusPrimitive;
  conditions: ConditionPrimitive[];
}

function selectScenarios(
  config: AuditConfig,
  crawlResult: CrawlResult
): ScenarioConfig {
  // Quick Check: fixed scenarios
  // Full Audit: adaptive selection based on site characteristics
  // CI/CD: seed-based deterministic selection
}
```

### V2+ Implementation (Full Grammar)

In future versions, the grammar becomes a proper composition engine with:
- Weighted random selection per axis
- Exclusion rules (some combinations are invalid)
- Priority rules (some combinations are more informative)
- Frequency tracking (ensure coverage across all primitives over time)
- Per-site memory (different scenarios on re-audit)

---

## Connection to Findings

The scenario that produced a finding is NEVER revealed in the output (Principle 2). The finding describes the outcome gap:

**What the builder sees:**
```
1. MEDIUM | Homepage value proposition unclear
   The homepage headline "Welcome to Our Platform" doesn't explain what the product does.
   A first-time visitor would need to scroll past the fold to understand the offering.
   FIX: Replace the headline with a clear value proposition (what you do + for whom + why).
   VERIFY: Read the headline — can you understand the product in 5 seconds?
```

**What the builder does NOT see:**
```
Scenario: (first-time-visitor, homepage, understand-offering, ux-focus, normal)
Hypothesis: Value proposition visible above fold within 10 seconds.
Test: Extracted above-fold text content. Fed to Sonnet with prompt: "Can a first-time
visitor understand what this product does from this text alone?" Response: "No."
```

---

## Open Questions (To Resolve During Alpha)

1. **How many scenarios per Full Audit?** Currently 30-60. Is this enough for quality? Too many for cost? Need to measure cost-per-scenario.
2. **Which combinations are invalid?** e.g., (ai-agent, homepage, sign-up) — agents don't sign up. Need exclusion rules.
3. **Does adaptive enrichment actually improve finding quality?** Need A/B test: fixed scenarios vs adaptive.
4. **Per-site memory:** Should re-audits use different scenarios? Or same scenarios for comparability?
