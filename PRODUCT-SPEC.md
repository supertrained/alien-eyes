# Alien Eyes -- Product Specification

> Version: 3.0 | Date: 2026-03-07
> Status: Demonstrated Prototype (N=1) -- Core loop proven on one site, one stack, one builder. Discovery complete. Pre-alpha.
> Authors: Teresa Torres, April Dunford, Bob Moesta, Marty Cagan, Clayton Christensen (simulated expert synthesis)
> Validation: 2-loop dogfood test on supertrained.ai (March 5-6, 2026). See Section 2A for scope limitations.

---

## 1. PRODUCT VISION

### One-Sentence Vision

**The independent quality layer that tells builders -- and their agents -- whether the thing they shipped actually works for the people and machines trying to use it.**

### The Alien Perspective Thesis

If an alien civilization observed how humans build digital products in 2026, they would find one fact genuinely bizarre: the entity that builds the product is also the entity that decides whether the product is good. The builder writes the tests, runs the tests, interprets the tests, and declares victory. This is like a student writing their own exam, grading it, and issuing themselves a diploma.

This structural self-deception persists for two reasons. First, external validation of software has historically been expensive, slow, and enterprise-only -- penetration tests, SOC 2 audits, accessibility consultants, QA agencies. The average builder can't afford it. Second, until now, the only consumers of digital products were humans, and human experience testing at least had established (if inadequate) tools.

But a new class of consumer has arrived: AI agents. Agents now use APIs, navigate websites, consume MCP servers, and evaluate tools before integrating them. No established methodology exists for measuring whether a product works well for these machine consumers. Agent-nativeness is an entirely new quality dimension, and nobody is measuring it.

Alien Eyes must exist because the builder-tests-their-own-work paradigm is structurally incapable of catching what matters, and the new agent consumer class has no quality signal at all.

### What World Does This Create If We Succeed?

A world where every digital product has a continuously updated, independently verified quality profile -- visible to both the humans who use it and the agents that integrate with it. Where "is this tool any good?" has a real answer backed by evidence, not marketing copy. Where a solo builder gets the same quality insight that today costs a Fortune 500 company $80K in annual audits. Where AI agents can make informed trust decisions about the tools they use, and where builders who invest in quality can prove it.

### Time Horizons

**1-Year Vision (2027):** Alien Eyes is the go-to quality check for solo builders and agent framework developers. Paste a URL, get a dual-scored report (human + agent) with narrative findings. The agent-to-agent fix loop works: Claude Code calls Alien Eyes, gets structured findings, fixes autonomously, re-tests. Audit data feeds Rhumb's AN Scores. 10,000+ audits run. Word of mouth in indie hacker and AI developer communities is the primary growth channel.

**3-Year Vision (2029):** Alien Eyes is the independent quality standard for digital products. The scoring methodology is published and peer-reviewed. Enterprise companies use it for continuous compliance monitoring. Agent frameworks embed it as their internal quality engine. "Tested by Alien Eyes" is a recognized trust signal. The accumulated quality data across 1M+ audits creates the most comprehensive benchmark dataset for digital product quality ever assembled. Non-web products (APIs, CLIs, MCP servers) represent 40%+ of audits.

**5-Year Vision (2031):** Alien Eyes scores are infrastructure -- as expected as an SSL certificate or a privacy policy. Agent-native products are scored before they enter any tool registry. Regulatory frameworks reference Alien Eyes's methodology for compliance verification. The quality data feeds an ecosystem of downstream products (Rhumb directory, benchmarking reports, insurance underwriting, investment due diligence). Alien Eyes has become what credit scores are to lending: an imperfect but essential independent quality signal that the market couldn't function without.

---

## 2. VALIDATION EVIDENCE

> This section documents what was proven in production on March 5-6, 2026. The dogfood test audited supertrained.ai -- a live Next.js site deployed on Vercel -- and then fed findings into a coding agent (Claude Code) to close the fix loop. This is not a theoretical exercise. Every claim below has a commit, a deploy, or a build log behind it.

### The Dogfood Test

**Target:** supertrained.ai (Next.js 16, React 19, Tailwind 4, Supabase, deployed on Vercel)

**Method:** Playwright browser testing in audit mode, findings generated as structured payload, payload pasted into a separate Claude Code session acting as "the builder."

### Loop 1 (March 5, 2026)

- Audited supertrained.ai using Playwright-driven browser testing
- Found **12 real findings**: 1 CRITICAL, 1 HIGH, 5 MEDIUM, 5 LOW
- **Critical finding:** Canonical URLs on all pages pointing to the homepage, destroying SEO indexability for the entire site
- Generated "Format B" condensed payload -- no file paths, just: what is wrong, what should happen, severity
- Builder agent (Claude Code in regular coding mode) received the payload via paste
- Builder fixed **all 12 of 12 findings**
- Builder located the correct files across **22+ source files** without any file path hints
- Build passed with **0 errors**, 45 static pages generated successfully

### Loop 2 (March 6, 2026)

- Re-audited the live deployed site (post-fix Vercel deploy)
- Found: **8 fully fixed**, 3 partially fixed, 0 not fixed
- Found **5 new issues** (2 MEDIUM, 2 LOW, 1 INFO) -- introduced by fixes or missed in the first audit
- Generated 8-item payload (3 partials + 5 new)
- Builder fixed all 8, correctly triaged 2 items as "no action needed"
- Builder **pushed back on 1 false positive**: cookie consent banner was flagged as missing, but was actually working -- the audit used stale Playwright state where cookies had been previously declined
- **Result:** Site went from "critical SEO issue destroying indexability" to clean in 2 loops

### What This Proves

These are not hypotheses. They are observed facts from a production test.

**1. The clipboard IS the product.**
Format B (condensed, no file paths, no methodology, no scores) produced 12/12 correct fixes. The builder agent did not need file paths, did not need scores, did not need executive summaries. It needed: what is wrong, where, what should happen instead, and severity. The most important design decision in this entire product is what gets copied to the clipboard.

**2. The loop converges.**
Two iterations took a real production site from "critical SEO issue destroying indexability" to clean. This is not a demo. This is the product experience: audit, fix, re-audit, verify. The loop converges within 2-3 iterations for a real site with real issues.

**3. Format B is sufficient as the default.**
File-aware Format C (condensed + file paths) may be unnecessary as the default output. Builder agents are capable of finding the correct files from problem descriptions alone. 22+ files were correctly located and modified without any path hints. Format C remains valuable for GitHub-connected workflows, but it is not required for the core loop to work.

**4. Builder pushback is a feature, not a bug.**
The builder agent caught our false positive (cookie consent banner). This means the audit-fix loop is self-correcting. The builder is not a passive consumer of findings -- it is a critical check on audit accuracy. This self-correction mechanism should be designed into the product, not treated as an edge case.

**5. False positives from stale browser state are a real risk.**
The cookie consent false positive was caused by Playwright inheriting state from a previous session where the user had declined cookies. Every audit must use clean/incognito browser profiles. This is not optional -- stale state produces false findings that erode trust.

**6. Assumption 3 is DEMONSTRATED (N=1).**
The agent-to-agent fix loop (audit tool generates findings, coding agent fixes autonomously, re-audit verifies) is not a theoretical possibility. It was demonstrated in production with real fixes deployed to a live site serving real users. The autonomous fix rate was 100% (12/12 in Loop 1, 6/8 in Loop 2 with 2 correctly triaged as no-action-needed).

**7. Re-audits surface new issues, not just verify old fixes.**
Loop 2 found 5 new issues that did not exist in Loop 1. Some were introduced by the fixes themselves; others were masked by the original issues. This proves that re-auditing is not just verification -- it is a new audit from a new baseline. The re-audit is a first-class product, not a discount check.

### 2A. WHAT THIS DOES NOT PROVE

The dogfood test was N=1 on a single site built by the same team that designed Alien Eyes. These are the specific gaps:

| Untested Variable | Why It Matters | Validation Plan |
|-------------------|---------------|-----------------|
| Stranger's sites | Builder knew the codebase intimately; Claude Code had 37 rounds of prior context | Alpha: 20+ external sites, zero prior context |
| Non-Next.js stacks | All fixes were in a Next.js/React/Tailwind codebase | Alpha: Rails, Django, Go, WordPress, Shopify sites |
| Machine-generated findings | Dogfood findings were hand-crafted by a human using Playwright, not by the automated pipeline | Pre-alpha: automated pipeline must reproduce 10/12 known findings |
| Non-Claude-Code agents | Only Claude Code was tested as the builder agent | Alpha: test with Cursor, Windsurf, Lovable, Bolt |
| Complex finding types | Findings were mostly SEO/metadata/accessibility — no logic bugs, race conditions, or auth bypasses | Alpha: track fix rate by finding complexity tier |
| Willingness to pay real money | No transaction data exists | Alpha: 10+ paid audits at $19-49 |
| Sites with bot protection | supertrained.ai has no Cloudflare/WAF | Alpha: test against 3+ Cloudflare-protected sites |
| Platform-hosted sites | All fixes were in source code; Squarespace/Wix/Shopify builders can't fix most findings | Alpha: include 5+ platform-hosted sites, track fixability rate |
| False positive rate at scale | 1/8 findings in Loop 2 was false positive (12.5%) — one sample, not a rate | Alpha: target <10% overall, <1% CRITICAL |
| Concurrent audits | Only one audit ran at a time | Engineering: test concurrent audit isolation |

**Terminology convention:** Throughout this document, "demonstrated" means proven in the dogfood test (N=1). "Validated" requires confirmation across 10+ external sites, 3+ tech stacks, and 5+ independent builders. Until alpha exit criteria are met, the product thesis is **demonstrated, not validated**.

---

## 3. BUSINESS OUTCOME (Our Outcome)

### What Success Looks Like

Alien Eyes becomes the independent quality standard for digital products in the agent economy. Specifically:

- **Revenue:** $2M ARR within 18 months, driven by usage-based pricing with strong expansion revenue as builders move from free audits to paid tiers
- **Market position:** The only product that scores agent-nativeness alongside human experience -- this is the wedge that creates the category
- **Data moat:** Every audit generates data that improves scoring accuracy, feeds Rhumb, and creates aggregate benchmarks -- each new audit makes every future audit more valuable
- **Network effect:** As more products are scored, the benchmark data becomes more meaningful, which attracts more products to be scored

### Revenue Model and Growth Thesis

**Primary model: Loop-based pricing**

The validation proved that the loop IS the product. Pricing must support looping, not single audits. A builder who audits once gets value; a builder who audits, fixes, and re-audits gets 10x value. Pricing should make re-testing the obvious next action, not a purchase decision.

| Tier | Price | What You Get |
|------|-------|-------------|
| Quick Check (free) | $0 | SEO + Performance + Accessibility only. Deterministic checks, no LLM. Sub-60-second. Requires email verification + Turnstile. 1 per email per 30 days, 3 per IP per 24 hours. |
| Full Audit (paid) | $19-49 | All dimensions including LLM-powered analysis. The alien perspective. Requires account. |
| Re-test same URL (within 7 days) | $5-9 | Baseline exists, comparison is the value. Before/after diff. Cheaper for us (baseline cached). |
| Monthly plan | $29/month + $5/audit | Unlimited re-tests within 7 days. Best for active builders shipping frequently. |
| Professional | $49-99/audit | PDF export, executive summary, white-label option |
| Team | $99-199/month + per-audit | Bulk operations, team dashboards, Jira/Linear integration |
| Enterprise | Custom | CI/CD integration, compliance mapping, SLA, DPA/BAA, dedicated support |
| Data exchange | Free Quick Checks | Agent frameworks get free evaluation in exchange for anonymous data that feeds Rhumb |

**Free tier abuse prevention:** The Quick Check (free) tier runs only deterministic checks — no LLM inference, no Opus/Sonnet calls. This caps free-tier COGS at ~$0.10/audit (browser + compute only). Email verification + Cloudflare Turnstile + per-IP rate limiting prevent bot abuse. Full Audit (paid) requires account with payment method on file. Per-audit LLM cost is tracked and logged (soft warning at $5); hard caps deferred until 50+ real audits establish cost baselines (see CANONICAL-BUILD-SCOPE Section 7).

**Why re-tests are cheaper:** (a) cheaper for us -- the baseline scan, screenshots, and DOM snapshots already exist, so the re-test is a comparison operation, not a full crawl; (b) the comparison (what changed, what improved, what regressed) is where value compounds; (c) making re-tests cheap drives the loop behavior that IS the product experience.

**Growth thesis:** The free first audit creates viral awareness (builders share results). The loop experience -- audit, fix, re-audit, see improvement -- creates habitual usage. The agent-nativeness score is the hook no competitor offers. Expansion revenue comes from: (a) builders upgrading to monthly plans as they ship more frequently, (b) consultants white-labeling, (c) enterprises embedding in CI/CD, (d) agent frameworks licensing data.

**Revenue milestone targets (base / target / upside):**

| Milestone | Base Case | Target Case | Upside Case |
|-----------|-----------|-------------|-------------|
| Month 3 | $1K MRR | $3K MRR | $5K MRR |
| Month 9 | $5K MRR | $15K MRR | $50K MRR |
| Month 18 | $20K MRR | $50K MRR | $170K MRR |

Base case assumes: 2% free-to-paid conversion, 25% re-audit rate, no consultant channel. Plan to base case. Celebrate target. Upside requires all channels firing simultaneously.

### Competitive Moat Analysis

| Moat Layer | Mechanism | Defensibility | Status |
|-----------|-----------|---------------|--------|
| **The feedback payload format** | Structure of findings that produces high autonomous fix rates — demonstrated at 100% (N=1) | Medium — looks simple, easily copied once published | **Demonstrated** |
| **Remediation outcome data** | Verified fix rates, time-to-fix, fix-by-severity across thousands of audits | High — requires volume no new entrant has | **Unbuilt** (requires 1,000+ audits) |
| **Cross-product pattern database** | Anonymized finding patterns across all audited products ("67% of Next.js sites have X") | High — data moat deepens with scale | **Unbuilt** (requires 10,000+ audits) |
| **Scenario grammar** | Composable test primitives, computationally intractable to game | Medium-High — grows with every audit | **Unbuilt** (grammar undefined) |
| **Agent-nativeness scoring** | First-mover in measuring how well products serve AI agents | Medium — methodology can be copied | **Unvalidated** |
| **Rhumb integration** | Token cost benchmarks, schema fingerprints feed Rhumb directory | Medium-High — exclusive first-party data source | **Unbuilt** |
| **Pre-registered methodology** | Published, versioned scoring protocol creates trust | Medium — builds institutional credibility | **Designed, not published** |

**Honest moat assessment:** The V1 moat is execution speed and the feedback payload format. The long-term moat is remediation outcome data and cross-product patterns — but these require 1,000-10,000+ audits to exist. Until then, a well-funded competitor or a coding agent with browser access can replicate most feature-level behavior. The structural advantage is separation of concerns (the tool that builds cannot also test) and the accumulation of cross-product calibration data that no single-project agent can have.

### Key Metrics

**North Star:** Number of findings that result in verified fixes (measures actual value delivery, not vanity usage)

**Leading indicators:**
- Audits run per week (adoption)
- Re-audit rate within 7 days (the loop is working -- validated as the core behavior)
- Free-to-paid conversion rate (value demonstration)
- Agent API calls as % of total audits (agent adoption)
- Score improvement on re-audit (outcomes delivered)
- Autonomous fix rate from structured payload (agent capability signal)

**Lagging indicators:**
- MRR / ARR (revenue)
- Net Revenue Retention (expansion)
- Audit data volume feeding Rhumb (ecosystem value)
- Category benchmark coverage (market authority)

---

## 4. THE FEEDBACK PAYLOAD

> This is the most important design section in this document. The dogfood test proved that what gets copied to the clipboard determines whether the product delivers value. The payload format is not a presentation detail -- it is the core product.

### The Insight

A coding agent does not need scores, methodology explanations, marketing language, benchmarks, executive summaries, or disclaimers. It needs to know what is wrong and how to verify it is fixed. Every word in the payload that is not one of those things is noise that degrades fix accuracy.

The dogfood test validated that a condensed payload with no file paths produced a 100% autonomous fix rate across 22+ files. The builder agent found the correct files from problem descriptions alone. This means the payload's job is to describe the problem precisely enough that any competent agent can locate and fix it -- not to do the agent's job of finding the code.

### Payload Ingredients (Ordered by Impact)

Every finding in every format must contain these ingredients. They are ordered by their contribution to fix success:

| # | Ingredient | Purpose | Example |
|---|-----------|---------|---------|
| 1 | **What is wrong** | Specific observable behavior, not a category label | "Canonical URL on /services points to / instead of /services" |
| 2 | **Where** | URL, endpoint, page section, or component | "/services, /blog/*, /about -- all 45 static pages" |
| 3 | **What should happen instead** | The expected behavior, stated concretely | "Each page's canonical URL should be its own URL path" |
| 4 | **Why it matters** | Who is affected and how | "Search engines treat all pages as duplicates of the homepage, destroying indexability for the entire site" |
| 5 | **How to verify** | A concrete check the agent can run after fixing | "Run next build, then check any non-homepage route's <link rel=canonical> in the HTML output" |
| 6 | **Severity** | So the agent knows what to fix first | "CRITICAL -- affects all 45 pages, blocks organic discovery" |
| 7 | **Causal chain** | When findings interact, show the connection | "This interacts with Finding #3 (missing hreflang): fixing canonicals first simplifies hreflang implementation" |

### What Coding Agents Do NOT Need

These are anti-patterns validated by the dogfood test. Including them in the agent-facing payload adds noise without improving fix rates:

- Marketing language or branding ("Alien Eyes's comprehensive analysis found...")
- Scores or percentages ("Your SEO score is 43/100")
- Methodology explanations ("We tested this by running 47 Playwright scenarios...")
- Benchmarks or comparisons ("Sites in your category average...")
- Executive summaries ("Overall, your site has significant issues...")
- Disclaimers ("This is not legal advice...")
- Encouragement or tone-softening ("Great job on your performance scores!")

These belong in the human-facing formats (Format A, PDF). They do not belong in Format B or Format JSON.

### The Four Formats

Every finding exists once in a canonical internal form. It renders into four formats for four audiences. The canonical form contains all 7 ingredients plus internal metadata (test ID, timestamp, confidence level, scenario that produced it). The formats are views, not separate data.

**Format A: Structured (Human Dashboard)**

Full findings organized by dimension, with narrative context, severity badges, before/after screenshots, score summaries, and trend charts. This is for the SaaS web interface where humans browse, understand, and prioritize.

Audience: Humans reviewing results in the Alien Eyes dashboard.

**Format B: Condensed (Clipboard for Coding Agents) -- DEMONSTRATED (N=1)**

Terse numbered list. Each finding is 3-5 lines. No file paths. No methodology. No scores. Just the 7 ingredients in compressed form. Designed to be pasted directly into a coding agent's context window.

This is the format that produced 12/12 correct fixes in the dogfood test.

Example (from the actual dogfood payload):

```
1. CRITICAL | Canonical URLs point to homepage
   All pages set <link rel="canonical" href="https://supertrained.ai/">
   instead of their own URL. Every page is treated as a duplicate of the
   homepage by search engines.
   FIX: Set canonical to the page's own canonical URL path.
   VERIFY: Build site, check any non-homepage route's canonical tag.
```

Audience: Builders pasting into Claude Code, Cursor, Windsurf, or any coding agent.

**Format C: File-Aware (GitHub-Connected)**

Format B plus file paths and line numbers, derived from GitHub repository connection. May be unnecessary as the default (Format B alone produced 100% fix rates), but valuable for large monorepos where file discovery is expensive, for PR annotations, and for diff-aware re-audits.

Audience: Builders with GitHub-connected projects, CI/CD pipelines.

**Format JSON: Structured Data (MCP/API)**

Machine-readable JSON with all 7 ingredients plus metadata. For programmatic consumption by agents calling Alien Eyes through MCP or REST API. Includes finding IDs for re-audit correlation, confidence scores, and related finding references for causal chains.

Audience: Agents calling Alien Eyes programmatically.

### The Copy Button

The SaaS interface must have a prominent "Copy for your coding agent" button that copies Format B to the clipboard. This button is not a convenience feature. It is the primary conversion mechanism. The experience is:

1. Builder pastes URL, gets audit results (Format A on screen)
2. Builder clicks "Copy for your coding agent"
3. Builder pastes into Claude Code / Cursor / Windsurf
4. Agent fixes everything
5. Builder re-audits to verify (this is the monetization moment)

The copy button is more important than the dashboard. The dashboard exists to give the builder confidence in the findings. The copy button is where value is delivered.

---

## 5. CUSTOMER OUTCOME (Their Outcome)

### Business Outcomes by Segment

| Segment | Business Outcome We Deliver |
|---------|---------------------------|
| **Solo builders** | Ship with confidence. Know what you don't know before your users find it. Stop second-guessing whether you missed something critical. |
| **Agent frameworks** | Make informed trust decisions about tools before integrating them. Know which tools will break your agents and which ones work. |
| **Agencies / Consultants** | Replace 6-tool manual audit workflows. Deliver white-labeled quality reports that justify your rates. Win enterprise clients with credible assessments. |
| **Enterprise** | Continuous compliance signal between expensive annual audits. Quality gates that don't slow deploys. Evidence that satisfies SOC 2 and WCAG auditors. |
| **Non-technical evaluators** | Get an independent inspection of software you can't evaluate yourself. Know if your $180K agency investment was well-spent. Show your board credible quality evidence. |

### The Job to Be Done (Moesta Framework)

**The struggling moment:**

A builder has shipped something. It works -- at least, it works for them, in their browser, with their test data. But they have a nagging, specific anxiety: *what am I missing that I can't see?* They can't test their own blind spots because they don't know they have them. They've tried Lighthouse (got a wall of red scores and jargon), tried writing tests (but their tests only verify what they already thought of), tried asking friends (got polite non-answers). The feeling is: "I'm one person trying to see from every angle, and I can't."

For agents, the struggling moment is different but parallel: an agent framework needs to integrate a tool but has no reliable signal for whether the tool actually works under real conditions. The tool's README says it does X, but does it really? Under load? With edge-case inputs? With structured error responses? The agent can't afford to find out in production.

**Desired outcome:**

"I want to know the truth about my product from a perspective I structurally cannot have -- and I want that truth delivered in a form I can immediately act on."

The dogfood test validated this precisely: the builder agent received findings from a perspective it could not have (external browser testing of the deployed product) and acted on them immediately (12/12 fixes, zero errors).

**Forces of progress (pulling toward Alien Eyes):**
1. The fear of shipping something embarrassingly broken (push of the current situation)
2. The desire to feel like a professional even as a solo builder (pull of the new solution)
3. The emergence of AI agents as a consumer class that nobody knows how to serve (push of the current situation)
4. The rise of vibe coding -- builders shipping products they don't fully understand (push of the current situation)
5. Agent frameworks needing quality signals to make trust decisions (pull of the new solution)
6. **DEMONSTRATED (N=1):** The fix loop works on one site -- the builder's coding agent fixed findings autonomously (March 5-6, supertrained.ai only)

**Forces of resistance (holding them back):**
1. "I've been burned by tools that promised quality insights and delivered Lighthouse wrappers" (anxiety of the new solution)
2. "I don't want to learn another tool" (habit of the present)
3. "What if it tells me everything is wrong and I feel terrible?" (anxiety of the new solution)
4. "What if it breaks my production site with aggressive scanning?" (anxiety of the new solution)
5. "I can't afford to pay for tools that don't immediately generate revenue" (habit of the present)

### How We Know We're Delivering Value (Leading Indicators)

| Signal | What It Means |
|--------|-------------|
| Builder re-audits within 7 days | They fixed findings and want to verify -- the loop is working **(DEMONSTRATED, N=1)** |
| Builder shares report link | Results were valuable and made them look smart, not negligent |
| Agent makes MCP/API call and acts on findings | The agent-to-agent fix loop demonstrated via paste **(MCP path untested)** |
| Consultant runs 5+ audits in first month | Replaced manual workflow -- sticky usage |
| Enterprise team configures CI gate | Embedded in their process -- high switching cost |
| Score improvement on re-audit | We delivered measurable quality improvement **(DEMONSTRATED: critical to clean in 2 loops, N=1)** |
| Builder pushes back on a finding | The loop is self-correcting -- trust is high enough to disagree **(DEMONSTRATED, N=1)** |

---

## 6. OPPORTUNITY SPACE (Teresa Torres OST)

### Desired Outcome (Top of Tree)

**Builders and agents can independently verify that their digital products achieve their intended outcomes for both human and machine users.**

### Opportunity Areas

```
Desired Outcome: Independent quality verification for digital products
|
|-- OA1: Builders can't see their own blind spots
|   |-- O1.1: Solo builders don't know what they're missing (Marcus, Jaylen)
|   |-- O1.2: Experienced builders can't get fresh eyes (Diana, Priya)
|   |-- O1.3: Non-technical founders can't verify agency work (Raymond)
|   |-- O1.4: Designer-developers can't validate non-visual quality (Yuki)
|
|-- OA2: No quality signal exists for agent consumers
|   |-- O2.1: Agent frameworks have no trust signal for tools (Persona 24, 30)
|   |-- O2.2: Builders don't know if their product is agent-ready (Diana)
|   |-- O2.3: No methodology exists for measuring agent-nativeness (Dr. Mara)
|   |-- O2.4: MCP servers have no quality standard (Persona 24)
|
|-- OA3: Existing tools don't close the fix loop
|   |-- O3.1: Findings aren't actionable by coding agents (Persona 21, 26)
|   |-- O3.2: Results require expertise to interpret (Marcus, Raymond)
|   |-- O3.3: No re-test workflow validates that fixes worked (all)
|   |-- O3.4: Output format doesn't match consumer needs (Cross-gap #1)
|
|-- OA4: External validation is expensive and infrequent
|   |-- O4.1: Compliance audits cost $15-50K annually (David)
|   |-- O4.2: Pen testing is periodic, not continuous (Viktor)
|   |-- O4.3: Accessibility audits don't scale (Amara)
|   |-- O4.4: Manual QA can't keep up with shipping velocity (Ravi)
|
|-- OA5: AI search optimization has no tooling
|   |-- O5.1: SEO professionals can't measure AI visibility (Jordan)
|   |-- O5.2: Content strategists can't optimize for AI consumption (Lisa)
|   |-- O5.3: No tool measures AEO/GEO/MEO (unique to this product)
|
|-- OA6: Quality data is fragmented and siloed
|   |-- O6.1: No aggregate benchmarks exist across products (Claire, Kenji)
|   |-- O6.2: Point-in-time scores miss degradation trends (Persona 28)
|   |-- O6.3: Tool directories lack quality evidence (Rhumb integration)
```

### MVP Prioritization

**Highest-impact for MVP (Phase 0-1):**

| Opportunity | Impact | Validation Status |
|------------|--------|------------------|
| O1.1: Solo builders don't know what they're missing | Very High | **DEMONSTRATED (N=1)** -- 6 personas + dogfood test (canonical URL issue was invisible for 37 rounds of development) |
| O2.1: Agent frameworks have no trust signal | Very High | Validated -- all 10 agent personas + Rhumb research |
| O3.1: Findings aren't actionable by coding agents | High | **DEMONSTRATED (N=1)** -- Format B produced 12/12 autonomous fixes on supertrained.ai |
| O5.3: No tool measures AEO/GEO/MEO | High | Validated -- Jordan, Lisa, unique differentiator |
| O3.4: Output doesn't match consumer needs | High | **DEMONSTRATED (N=1)** -- Format B (condensed, no file paths) sufficient for Next.js/Claude Code |
| O3.3: No re-test workflow validates that fixes worked | High | **DEMONSTRATED (N=1)** -- Loop 2 found 8 fixed, 3 partial, 5 new; re-test is a first-class product |

**Validated vs Assumed (Updated):**

| Status | Opportunities |
|--------|--------------|
| **Validated in production** (dogfood test, March 5-6) | O1.1, O3.1, O3.3, O3.4 |
| **Validated** (30 personas + 5 expert panels) | O1.2, O2.1, O2.3, O4.4 |
| **Partially validated** (strong signal, needs real-user confirmation) | O2.2, O2.4, O5.1, O5.3, O6.1 |
| **Assumed** (logical from research, not directly confirmed) | O4.1, O4.2, O6.2, O6.3 |

---

## 7. POSITIONING (April Dunford -- Obviously Awesome Framework)

### Competitive Alternatives (What People Do Today)

| Alternative | What It Is | Why It Falls Short |
|------------|-----------|-------------------|
| **Lighthouse / PageSpeed Insights** | Google's web quality audit | Web-only, no agent-nativeness, no outcome testing, no narrative findings. Produces a wall of jargon. Solo builders bounce. |
| **Axe / WAVE** | Automated accessibility checkers | Catches 30% of accessibility issues (Amara). No agent testing. No UX evaluation. |
| **OWASP ZAP / Burp Suite** | Security scanning | Security only. Requires expertise to interpret. Agent-nativeness not in scope. |
| **Screaming Frog / Ahrefs** | SEO audit tools | SEO only. No agent-nativeness. No AEO/GEO/MEO. No quality holism. |
| **Manual QA / Pen testing** | Human testers and consultants | Expensive ($15-80K), slow (weeks), infrequent (annual), doesn't scale. No agent perspective. |
| **Writing your own tests** | Unit/integration/e2e tests | Builder-perspective only. Tests verify what you thought of, not what you missed. |
| **Asking friends / beta testers** | Informal feedback | Unstructured, inconsistent, biased toward polite non-answers, no agent perspective. |
| **AI code review (Codacy, CodeRabbit)** | Automated code analysis | Inside-out (code quality), not outside-in (product quality). No agent consumer testing. |
| **DIY with coding agent** | "Use Playwright MCP to audit my site" in Claude Code/Cursor | Free, already in workflow, has codebase context. But: same blind spots as the builder's code, no cross-product calibration, non-reproducible, no accumulated patterns. |

### Unique Capabilities (What We Can Do That Alternatives Can't)

1. **Agent-consumable findings that close the fix loop.** DEMONSTRATED (N=1): Format B (condensed, no file paths) produced 12/12 autonomous fixes on one codebase. The payload format is designed so a coding agent can receive findings and fix without human intervention. **Status: Demonstrated. Ships in V1.**

2. **The re-audit as a first-class product.** DEMONSTRATED (N=1): Loop 2 surfaced 5 new issues alongside verifying 8 fixes. Re-auditing is not just confirmation -- it is a new audit from a new baseline. **Status: Demonstrated. Ships in V1.**

3. **Dual scoring: human-native + agent-nativeness.** Nobody else publicly measures how well a product serves AI agent consumers. (Some organizations may measure internally.) **Status: Unvalidated. Ships in Phase 1 after AN scoring methodology is defined and tested with 2+ agent framework teams.**

4. **Outcome inference via Steady State Hypothesis.** We don't check compliance against a list. We observe what the product does, hypothesize it should keep doing that, then try to break it. **Status: Designed, not implemented.**

5. **Scenario grammar with composable test configurations.** Composed from primitives, not static scripts. Evolves with every audit. **Status: Designed conceptually. Grammar undefined. See Section 2A.**

6. **AEO/GEO/MEO scoring.** Optimization measurement for AI search engines, generative AI citations, and embedding/vector space quality. **Status: Unvalidated. Requires 2-page rubric defining exactly what is measured, validated by 2+ SEO professionals. Does NOT ship until rubric is validated. Risk: may be shallow (just structured data checks = Screaming Frog).**

7. **Verbatim narrative from simulated user perspective.** First-person story of what it felt like to use the product. Captures signal structured data misses. **Status: Unbuilt. LLM-generated, not human-crafted.**

8. **Causal chain findings (Swiss Cheese Model).** Findings connected: Factor A + Factor B + Factor C = failure. **Status: Designed, not implemented. Causal inference from LLM analysis is uncertain.**

### Value We Deliver (So What?)

- **For solo builders:** "See your product through fresh eyes. Copy the findings, paste into your coding agent, and watch it fix what you couldn't see."
- **For agent frameworks:** "You get a trust signal for every tool in your registry -- the only one that exists."
- **For consultants:** "You replace 6 tools and 4 hours of manual work with one audit that includes AEO/GEO/MEO analysis nobody else offers."
- **For enterprises:** "You get continuous compliance evidence between annual audits, at 1/100th the cost."
- **For the market:** "For the first time, 'is this tool any good?' has a real, verifiable answer."

### Target Customer Segments (Who Cares A Lot?)

**Day 1 customers (beachhead):**
1. Solo builders who use AI coding tools (Claude Code, Cursor) -- they ship fast, don't know what they're missing, and the agent-to-agent fix loop is their natural workflow **(DEMONSTRATED, N=1)**
2. Agent framework developers who need quality signals for tool registries -- no alternative exists

**Day 30 customers (adjacent):**
3. Growth marketing consultants who need AEO/GEO/MEO analysis -- unique capability, high willingness to pay
4. Dev agency PMs who need pre-launch quality gates -- replaces nonexistent QA process

**Day 180 customers (expansion):**
5. Startup CTOs who want async quality monitoring
6. Compliance officers who need continuous compliance evidence
7. VC associates who need standardized technical due diligence

### Market Category

**What we are:** An independent quality verification service for digital products.

**Category creation opportunity:** Yes -- **Product Quality Verification**. This is distinct from:
- Testing tools (inside-out, code-level, builder-controlled)
- Monitoring tools (uptime/performance only, no quality judgment)
- Audit services (expensive, slow, human-delivered)
- SEO tools (single dimension, no agent perspective)

Alien Eyes creates a new category by combining: external perspective + dual audience (human + agent) + outcome-based evaluation + AI-powered scenario testing + continuous availability. The closest analogy is what credit agencies did for lending: created an independent quality signal that the market needed but didn't have.

The category name should communicate: independence (not built by you), quality (not just uptime), and comprehensiveness (not just one dimension). "Product Quality Verification" or "Independent Product Audit" are working candidates. The exact name deserves its own naming research round (the Rhumb naming process proved this investment pays off).

---

## 8. VALUE PROPOSITIONS BY SEGMENT

### Solo Builders

**#1 struggling moment:** "I've shipped something and I don't know what I'm missing. My tests pass but I feel anxious about what I can't see -- security, accessibility, mobile, agent-readiness. I tried Lighthouse and got jargon I couldn't act on."

**What we deliver:** Paste your URL, get a prioritized report in 5 minutes that tells you what's actually broken, what matters most, and exactly how to fix it. Click "Copy for your coding agent," paste into Claude Code or Cursor, and your agent fixes everything autonomously. Re-audit to verify. Done in two loops.

**What they'd switch from:** Lighthouse (too technical, not actionable), asking friends (too polite, inconsistent), ignoring quality (the default).

**Why they'd stay:** Every re-audit shows measurable improvement. The "your product improved from 63 to 78 this month" signal is addictive. The fresh-eyes perspective catches things they never would have found. The agent-nativeness score helps them enter a market dimension nobody else is even aware of. The copy-paste-fix loop becomes part of their shipping workflow.

### Agent Framework Developers

**#1 struggling moment:** "We have 500+ tools in our registry and users report reliability issues constantly. We have no quality signal beyond 'does it return a 200.' We can't tell users which tools are trustworthy."

**What we deliver:** A reliability and agent-nativeness score for every tool in your registry. Schema stability tracking. Error handling quality. Performance percentiles. A trust signal your agents can use at runtime to make integration decisions.

**What they'd switch from:** Basic ping monitoring, manual spot checks, user complaints as the quality signal.

**Why they'd stay:** The data compounds. Schema fingerprints detect breaking changes before users report them. Agent-nativeness scores become the selection criteria their agents use. The benchmark data is unavailable anywhere else.

### Agencies and Consultants

**#1 struggling moment:** "I spend 40% of my billable time on repetitive manual audits using 6 different tools. My clients ask about AI search optimization and I have no answers. I need white-labeled reports that justify my rates."

**What we deliver:** One tool that replaces your 6-tool audit stack. White-labeled PDF reports you can brand as your own. AEO/GEO/MEO analysis that nobody else offers -- the feature that differentiates your practice. Bulk operations for multi-client workflows.

**What they'd switch from:** Screaming Frog + Ahrefs + Lighthouse + GTmetrix + axe + manual work. 4+ hours per client audit.

**Why they'd stay:** AEO/GEO/MEO scoring is unique and becomes their competitive advantage. White-label reports look professional and save hours. Clients start requesting it by name. The tool augments their expertise rather than replacing it.

### Non-Technical Evaluators

**#1 struggling moment:** "I hired an agency to build my platform for $180K. They tell me everything is fine. I have no independent way to verify that claim. My enterprise pilot is in 2 months and I can't afford to discover problems then."

**What we deliver:** An independent inspection -- the software equivalent of a home inspector before you close on a house. Plain-English findings organized by business impact. A PDF you can attach to your investor deck or enterprise sales proposal. No technical knowledge required.

**What they'd switch from:** Trusting the agency's word, Google PageSpeed (couldn't interpret it), hiring an expensive consultant ($5-10K for a one-time assessment).

**Why they'd stay:** The report becomes a sales asset. Enterprise prospects trust the independent assessment. Historical tracking shows improvement over time, which proves the investment is working.

### Enterprise

**#1 struggling moment:** "We spend $80K/year on compliance audits that happen once and tell us our status on that one day. Between audits, we have no continuous compliance signal. Our QA team can't keep up with shipping velocity."

**What we deliver:** Continuous compliance monitoring mapped to WCAG, SOC 2, and other frameworks. CI/CD integration that doesn't slow deploys. Quality trends across all teams. Evidence generation that external auditors accept. Drift detection: "this deploy introduced an accessibility regression."

**What they'd switch from:** Annual $40K SOC 2 audits, $15K accessibility audits, overwhelmed QA teams doing manual spot checks.

**Why they'd stay:** Continuous compliance evidence reduces audit cost and risk. Quality trends give leadership visibility. CI integration becomes part of the development workflow with high switching costs. Compliance mapping grows to cover more frameworks over time.

---

## 9. PRODUCT PRINCIPLES

These 12 principles guide every design decision. Each one resolves a specific tension surfaced during discovery. Principles marked **(REINFORCED)** were directly validated by the dogfood test.

### 1. Test outcomes, not compliance.

*Resolves: The Goodhart's Law risk identified by all 5 expert panels.*

Don't check "does this endpoint return proper error codes?" Check "can an agent successfully complete the workflow this endpoint exists to enable?" Checklists get gamed. Outcomes don't. A product that passes our tests should be genuinely good, not just technically compliant.

### 2. Show findings, never methodology. **(REINFORCED)**

*Resolves: The scenario leakage risk from Mystery Shopping and Chaos Engineering experts.*

Report the gap between expected and actual outcome with enough specificity to fix it. Never reveal the test procedure that found it. "Auth endpoint returns 200 on invalid credentials" -- not "we sent 47 malformed JWT variations." The builder can verify the finding; they cannot reverse-engineer the full test matrix.

The dogfood test confirmed: Format B contains zero methodology information. The builder agent did not need to know HOW we found the issues. It only needed to know WHAT was wrong and WHAT should happen instead.

### 3. One finding, many representations. **(REINFORCED)**

*Resolves: Cross-persona Gap #1 -- the output format spectrum.*

Every finding exists once in a canonical form. It renders differently for each consumer: encouraging narrative for Marcus, terse JSON for Diana, executive PDF for Raymond, annotated screenshot for Yuki, TikTok-ready graphic for Jaylen, structured fix instruction for Claude Code. The finding is the atom; the format is the view.

The dogfood test validated that the condensed view (Format B) is sufficient for coding agents. The canonical finding produces at least four views: Format A (dashboard), Format B (clipboard), Format C (file-aware), Format JSON (API).

### 4. Judge the product, not the builder.

*Resolves: The emotional design requirement from Marcus, Jaylen, and Yuki -- the fear of being judged.*

Distinguish intentional decisions from defects. A custom font that's render-blocking might be deliberate brand expression. An htmx app with minimal JavaScript is a valid architectural choice. Findings should say "your product does X; your users experience Y as a result" -- not "you should have done Z." When we can't tell if something is intentional, flag it as "requires human judgment" and explain why.

### 5. Be deterministic when they need it, probabilistic when we need it.

*Resolves: Cross-persona Gap #4 -- the determinism paradox.*

CI agents need identical scores for identical inputs. Comprehensive audits need randomized exploration to discover unknown failure modes. Two modes, not one compromise. Deterministic mode: locked scenarios, fixed personas, reproducible scores. Probabilistic mode: randomized personas, exploratory scenarios, satisfaction scores with confidence intervals.

### 6. Never be a single point of failure.

*Resolves: Gap #6 from the persona synthesis -- the CI agent's "on-error: proceed" requirement.*

If Alien Eyes is down, deploys must not be blocked. If a scan fails mid-audit, partial results are still delivered. Every integration has a configurable fallback. The tool is a quality signal, not a quality gate -- unless the builder explicitly opts into gating.

### 7. Gentle by default, thorough by invitation.

*Resolves: Priya's rate-limiter incident, Viktor's liability concerns, the "don't break my production" gap.*

Default scanning is read-only, gentle, and indistinguishable from a normal user browsing the site. Aggressive testing (load testing, injection testing, auth probing) requires explicit opt-in. The builder should never discover Alien Eyes is auditing them because their monitoring lit up. Scan intensity is clearly documented and controllable.

### 8. The free tier must deliver real value — measure costs before constraining them. **(REVISED 2x)**

*Resolves: Cross-persona Gap #8 -- the pricing paradox. Jaylen's $0 budget. Marcus's $0-20/mo constraint. **Also resolves: adversarial finding C1/C3 — free tier abuse and cost amplification.***

The free tier (Quick Check) runs deterministic checks only: SEO, Performance, Accessibility. No LLM inference. Sub-60-second. COGS ~$0.10/audit. This delivers real value (the canonical URL finding from the dogfood was a deterministic check) while capping abuse exposure. The full alien perspective (LLM-powered analysis, all dimensions) is the paid product.

**Abuse prevention is a Day 1 requirement, not a Phase 6 afterthought:**
- Cloudflare Turnstile on audit form (not CAPTCHA — less friction)
- Email verification via magic link before audit starts (thin identity layer, not full account)
- Rate limits: 1 free Quick Check per email per 30 days, 3 per IP per 24 hours

**Cost measurement before enforcement:**
- Phase 0 tracks all LLM costs via CostBudget (observability, not enforcement)
- No hard caps until 50+ real audits establish cost baselines
- Every LLM call records cost through the model router
- Evidence-based limits will be set after cost distributions are understood
- Free tier uses Haiku/deterministic only; Opus reserved for paid tiers (this is a model routing decision, not a cost cap)

### 9. Digital product means more than website.

*Resolves: Cross-persona Gap #7 -- the web-only blind spot.*

APIs, MCP servers, CLIs, libraries, and eventually mobile apps are in scope. Web is the entry point because URL-first is the simplest onboarding. But the architecture, data models, and scoring methodology must work for non-web products from day one. A developer API tool and a marketing website are both digital products; both deserve quality verification.

### 10. Data belongs to the builder.

*Resolves: Diana's export requirement, Viktor's data handling needs, David's compliance infrastructure gap.*

Audit results can be exported in full (JSON, PDF, CSV). Ephemeral mode stores nothing. Rhumb-bound data is anonymized and opt-in. The builder controls who sees their results. No data lock-in. No findings held hostage behind paywalls. No dark patterns around data portability.

### 11. The tool must earn expert trust without requiring expert knowledge. **(REVISED — resolves methodology transparency conflict)**

*Resolves: Cross-persona Gap #5 -- the trust paradox. **Also resolves: adversarial finding M1 — Principle 2 ("show findings, never methodology") vs Principle 11 ("publish methodology transparently") conflict.***

Diana, Amara, Viktor, and Dr. Mara will scrutinize the methodology. Marcus, Jaylen, and Raymond will never read it. Both groups must trust the tool.

**Tiered transparency resolution:**
- **Public:** What we measure (dimensions, rubrics, scoring formula). Published, versioned, auditable.
- **Private:** Specific scenario details, test primitives, prompt templates. Never revealed — prevents gaming.
- **Per-finding:** Reproducibility metadata (evidence URL, timestamp, DOM hash) so any expert can independently verify a specific finding without knowing our full test matrix.

This means Principle 2 ("show findings, never methodology") applies to the SCENARIO level — we don't reveal the specific tests. But Principle 11 applies to the METHODOLOGY level — we publish what dimensions we measure and how we score them. These are not in conflict when the layers are clearly separated.

### 12. Augment experts, never replace them.

*Resolves: Amara's replaceability fear, Tomoko's commoditization concern, Ravi's staffing justification need.*

Alien Eyes amplifies human expertise. It catches the 30% that can be automated so Amara can focus on the 70% that can't. It gives Ravi data to justify headcount. It gives Tomoko a tool that makes her more valuable, not obsolete. Positioning, messaging, and product design must consistently reinforce: this makes you better at your job, it does not do your job.

### 13. Builder pushback is a feature. **(NEW -- from dogfood, REVISED with product mechanism)**

*Resolves: The false positive risk identified as Risk #1 by all expert panels. **Also resolves: adversarial finding M2 — pushback has no product mechanism.***

The audit-fix loop is self-correcting. When the builder agent pushes back on a finding ("this is actually working correctly -- your audit used stale state"), that pushback is signal, not failure. The product must treat disagreement as valuable data.

**Product mechanism (required for V1):** Every finding in the dashboard has a "Mark as false positive" button. Requires a reason (dropdown: "working correctly," "intentional design decision," "platform limitation," "stale test data," "other" + free text). This feeds back into:
- Per-primitive false positive rate tracking
- Scoring calibration (findings with >20% dispute rate get flagged for methodology review)
- Future: MCP `dispute_finding` endpoint for structured agent-to-agent disagreement

### 14. Every finding must carry evidence. **(NEW -- from adversarial review)**

*Resolves: adversarial finding C2 — hallucinated findings can trigger destructive auto-fixes.*

Every finding includes an immutable evidence bundle: URL tested, timestamp, DOM snapshot hash, screenshot storage path, relevant request/response data, and confidence provenance (which model, what input, what reasoning). CRITICAL and HIGH findings are blocked from agent-consumable output (Format B/C/JSON) unless evidence completeness is 100%. Findings with confidence < 0.7 are flagged "confidence: low — verify manually" and excluded from Format B by default.

### 15. Findings have lifecycle states. **(NEW -- from adversarial review)**

*Resolves: adversarial findings H5/M1 — platform-unfixable findings and resolution paths.*

Every finding has a resolution state:
- **fixable** — builder can fix this in their codebase
- **mitigable** — can't fully fix, but compensating controls exist (suggest them)
- **platform-limited** — Squarespace/Wix/Shopify/etc constraint; note the platform and suggest workarounds or "contact platform support"
- **accepted-risk** — builder acknowledges and explicitly accepts
- **third-party** — caused by an embedded widget, CDN, or external service the builder doesn't control

Platform-hosted sites are detected early in the audit (stack fingerprinting). Scoring adjusts to not penalize platform limitations. Findings tagged `platform-limited` include the note: "This is a limitation of [Platform]. It does not reflect a deficiency in your implementation."

### 16. Default private. Publish by choice. **(NEW -- from adversarial review)**

*Resolves: adversarial findings C4/C5 — security findings for unowned sites, privacy/compliance conflicts with viral sharing.*

**All audit reports are private by default.** Builders must explicitly choose to publish, with a redaction preview showing what will be visible.

**Security findings (OWASP surface scan, auth patterns, data exposure) are NEVER included in public/shareable URLs.** They require:
- Authenticated access by the site owner
- Ownership verification (DNS TXT record, meta tag, or file upload) before security-dimension testing runs

**Non-security dimensions** (SEO, performance, accessibility) may be published because this information is already publicly observable.

**Data handling:**
- Raw crawl data (HTML, screenshots, console logs) deleted within 24 hours
- Anonymized patterns retained for cross-product benchmarks (opt-in)
- Builder controls who sees results; no data lock-in
- Takedown mechanism: site owner can request removal; findings deleted within 24 hours
- ToS explicitly prohibits auditing sites you don't own for security dimensions

---

## 10. SCOPE AND BOUNDARIES

### What This IS (V1 Scope)

**Entry point: URL-first with progressive unlock**

```
URL paste (simplest)
  --> GitHub repo URL (code-aware findings)
    --> MCP endpoint (agent-native evaluation)
      --> API / CLI spec (non-web products)
```

**Core audit dimensions (V1):**

| Dimension | Description |
|-----------|------------|
| Human Experience | UX paths, accessibility (WCAG 2.1 AA), mobile responsiveness, copy clarity, trust signals |
| Agent-Nativeness | Parity, granularity, composability, CRUD completeness, structured outputs, error signal quality |
| Security Surface | External-visible security (OWASP top surface-level risks, auth patterns, data exposure, cookie/header audit) |
| Performance | Core Web Vitals, TTFB, load times across devices |
| SEO / AEO / GEO / MEO | Technical SEO, answer engine optimization, citation-worthiness, embedding/semantic quality |
| Analytics & Tracking | GA4 setup, consent mode, pixel configuration |

**Core capabilities (V1):**

- Paste URL, get dual-scored report (human + agent)
- Probabilistic satisfaction score with confidence intervals
- Verbatim narrative from simulated user/agent perspective
- Causal chain findings (Swiss Cheese Model)
- **Four output formats**: Format A (dashboard), Format B (clipboard -- DEMONSTRATED N=1), Format C (file-aware), Format JSON (API)
- **"Copy for your coding agent" button** as primary conversion mechanism
- PDF export for human consumption
- Historical tracking (score trends over time)
- Free first audit (no account required)
- Re-audit with before/after comparison (the monetization moment)
- Deterministic mode for CI/CD and probabilistic mode for comprehensive audits
- **Clean/incognito browser profiles for every audit** (prevents stale-state false positives)

**Delivery surfaces (phased — adversarial review C3/M5: 4 surfaces in V1 = 4 products):**

| Surface | Phase | Rationale |
|---------|-------|-----------|
| SaaS web interface | **V1 (Phase 0)** | Primary. URL paste + clipboard output. |
| REST API | **V1 (Phase 0)** | Internal API layer the web app consumes. External access Phase 1. |
| CLI (`ae audit <url>`) | **Phase 1** | Thin wrapper over REST API. Local mode (no infra required) + cloud mode. |
| MCP server | **Phase 2** | After API is stable and pricing is validated with real money. |

All surfaces run the same audit primitives and produce identical findings. But shipping one surface well beats shipping four surfaces badly.

**Crawlability constraints (adversarial review H1):**

| Site Type | Expected Behavior | Resolution |
|-----------|------------------|------------|
| Standard sites (no bot protection) | Full crawl, all dimensions | Supported |
| Cloudflare Bot Fight Mode / WAF | Challenge page blocks Playwright | Partial support: use stealth mode + browser fingerprint randomization. If blocked, return `scan_status: blocked` with diagnostics, not false negatives. |
| SPAs (client-side rendering only) | Playwright renders JS — supported | Supported (Playwright executes JS) |
| Sites requiring auth | Cannot access behind-login content | Out of scope for V1. Phase 2: builder provides staging URL or test credentials. |
| Sites with 500+ pages | Token/cost explosion | **Page limit: 30 pages per audit (free), 50 pages (paid).** Homepage + nav-linked pages prioritized. |
| A/B testing sites | Different users see different content | Note in report: "Results reflect one variation. Your users may see different content." |
| Geo-restricted sites | Content varies by location | Audit runs from US-East by default. Note location in report. |

**"Could not verify" is distinct from "passed."** If a dimension cannot be tested (bot protection, timeout, render failure), the report shows "Unable to verify — [reason]" rather than omitting the dimension or marking it as passed.

### What This IS NOT (Out of Scope for V1)

| Explicitly Out of Scope | Why |
|------------------------|-----|
| Code analysis / static analysis | We test the product from outside, not the code from inside. This is a feature, not a limitation. |
| Penetration testing / active exploitation | Legal liability, requires explicit authorization, better left to specialists. We do surface-level security assessment. |
| Replacing human QA, accessibility auditors, or security consultants | We augment, never replace. See Principle #12. |
| Real-time monitoring / uptime monitoring | V1 is audit-on-demand. Continuous monitoring is Phase 2+. |
| Internal state testing | We test through public interfaces only. We acknowledge this limitation transparently. |
| Fixing issues | We find and report. We don't modify the builder's code or product. The builder's coding agent does the fixing. |
| Social / reputation / review analysis | Out of scope. Quality of the product, not sentiment about it. |
| Competitive intelligence beyond benchmarks | We provide category benchmarks, not competitive strategy. |

### Mobile Native Apps: Assessment

**Feasibility:** Medium-High, but with meaningful constraints.

Mobile app testing requires either (a) running app binaries in emulators/simulators or (b) testing the app's backend API layer and any web views.

**Recommendation: Hybrid approach, phased.**

- **V1 (include):** Test mobile web experiences, PWAs, and responsive design across viewport sizes. Test backend APIs that mobile apps consume. This covers React Native apps with web backends (Jaylen's use case) and any app with a web component.
- **V2 (include):** MCP/API testing covers the backend behavior of mobile apps. Add deep link testing, app store metadata validation, and API contract verification for mobile clients.
- **Deferred (Phase 3+):** Native binary testing in simulators (iOS Simulator, Android Emulator). This is technically feasible (Playwright has experimental mobile support, Appium exists) but adds significant infrastructure cost and complexity. Defer until demand validates the investment.

The Jaylen persona (vibe coder with React Native) can be partially served in V1 through API testing and web view testing. Full native app testing is a Phase 3 opportunity.

### The Progressive Unlock Model

```
Level 0: URL paste (Quick Check — free)
  - Requires email verification + Turnstile (thin identity, not full account)
  - Deterministic dimensions only: SEO, Performance, Accessibility
  - Results private by default; optional publish with redaction preview
  - No security findings without ownership verification

Level 1: Account created
  - Historical tracking, PDF export, re-audit comparison
  - Faster processing, all dimensions
  - API key issued

Level 2: GitHub connected
  - Code-aware findings (Format C: map findings to files/lines)
  - Diff-aware auditing (only test what changed)
  - PR annotations

Level 3: MCP / API integrated
  - Agent-to-agent fix loop (programmatic)
  - CI/CD pipeline integration
  - Webhook callbacks for async results
  - Batch operations

Level 4: Enterprise configured
  - Team dashboards, finding routing
  - Compliance framework mapping
  - White-label, DPA/BAA
  - SLA guarantees
```

---

## 11. RISKS AND ASSUMPTIONS

### Top 5 Risks

**Risk 1: Scoring accuracy -- false positives destroy trust immediately. (ADVERSARIAL: TIGHTENED)**
Diana and Viktor are zero-tolerance for false positives. Craig will lose credibility with his team. If 2 out of 10 findings are wrong, expert users write off the entire tool permanently. LLM-based evaluation is inherently probabilistic and non-deterministic, making false positive control the hardest engineering challenge.

**Revised FP targets (adversarial reviews H3/H5 — 15% is catastrophic in an auto-fix loop, contradicts our own persona research):**

| Severity | Alpha FP Target | Launch Target | Rationale |
|----------|----------------|---------------|-----------|
| CRITICAL | <1% | <0.5% | A single false CRITICAL finding can trigger destructive auto-edits |
| HIGH | <3% | <2% | Expert users (Diana, Viktor) reject tools with >2/10 wrong findings |
| Overall | <10% | <5% | At 15 findings/audit, 10% = 1.5 wrong findings — tolerable but not good |

**Mitigation stack:**
1. Pre-registered scoring methodology
2. Single-run evaluation for V1 (2-of-3 averaging deferred to v0.2 — adversarial M4: triples cost)
3. Confidence intervals on all findings; low-confidence findings excluded from Format B
4. Conservative severity classification (when in doubt, downgrade)
5. Evidence bundle requirement (Principle 14): CRITICAL/HIGH findings blocked without 100% evidence
6. Mandatory clean/incognito profiles for every audit run
7. Builder pushback mechanism (Principle 13): "Mark as false positive" feeds calibration
8. Per-primitive FP rate tracking with methodology review trigger at >20% dispute rate

*Update from dogfood test:* The cookie consent false positive in Loop 2 was caused by stale Playwright browser state (12.5% FP rate on that payload). The builder agent's pushback was self-correcting. This suggests FP mitigation requires both technical measures (clean state) AND systemic measures (the feedback loop).

**Measurement validation (adversarial H3 — Gauge R&R):** Before alpha launch, audit 10 sites 3 times each with identical methodology. Measure: per-finding repeatability (target >80%), severity consistency (target >90%), score standard deviation (target <5 points). If thresholds not met: increase deterministic extraction, reduce LLM judgment surface area, add temperature=0 for deterministic primitives.

**Risk 2: Goodhart's Law -- builders optimize for scores, products get worse.**
All 5 expert panelists flagged this. Studios optimize test screenings, restaurants game mystery shops, pharma companies p-hack endpoints. If builders optimize for Alien Eyes scores, the scores become meaningless.

*Mitigation:* Outcome testing (not compliance checklists). Scenario grammar with 10^6+ configurations. Score decay over time (stale scores dim). 30% exploratory scenarios per audit. Red-team our own scoring system quarterly. Longitudinal assessment encouraged over single snapshots.

**Risk 3: The "another Lighthouse wrapper" perception.**
Persona after persona said this: don't give me another Lighthouse wrapper. If the market perceives Alien Eyes as a pretty UI over existing open-source tools, it dies on launch day.

*Mitigation:* Lead with agent-nativeness scoring (nobody else has it). Lead with AEO/GEO/MEO (nobody else has it). Lead with the verbatim narrative (nobody else has it). Lead with the fix loop ("paste findings into your coding agent and it fixes everything" -- nobody else has it). Show methodology transparency. Position explicitly against Lighthouse: "Lighthouse tells you your score. We tell you whether your product works -- and then your coding agent fixes it."

**Risk 4: Legal liability from external scanning. (ADVERSARIAL: ELEVATED TO CRITICAL)**
Viktor raised this directly. Alien Eyes crawls and tests products. Adversarial reviewers identified this as a legal and ethical time bomb: nothing prevents auditing a site you don't own, and security findings on unverified URLs are attack roadmaps.

*Mitigation (revised):*
- Gentle-by-default scanning (Principle #7)
- **Security findings NEVER available for unverified URLs** (Principle 16) — SEO, performance, accessibility only for non-owners
- **Ownership verification** (DNS TXT record, meta tag, or file upload) required before security dimension testing
- ToS explicitly prohibits auditing sites you don't own for security dimensions
- **Takedown mechanism:** site owner can request removal, findings deleted within 24 hours
- Clear documentation of exactly what requests Alien Eyes sends
- robots.txt respect, User-agent identification
- Rate limiting built into the scanner
- **SSRF defense:** URLValidator resolves DNS before Playwright connects, blocks RFC 1918, link-local, cloud metadata endpoints (169.254.169.254), re-checks DNS (anti-rebinding)

**Risk 6: Cost amplification attack. (NEW -- from adversarial review)**
Free tier with no identity + LLM inference = a script submitting 1,000 URLs from rotating IPs costs us $1,000+ with zero revenue.

*Mitigation:* Free tier (Quick Check) runs deterministic checks only — no LLM. Email verification + Turnstile required. Per-IP/domain rate limits. Per-audit LLM cost tracked and logged. See Principle 8 (revised 2x) and CANONICAL-BUILD-SCOPE Section 7 for cost measurement policy.

**Risk 7: Privacy/compliance conflicts with data sharing. (NEW -- from adversarial review)**
Crawling arbitrary URLs captures PII (forms, console logs, network requests). Storing in Supabase. Feeding to LLMs. "Anonymized" web data is often re-identifiable.

*Mitigation:* Do NOT store raw console logs or network request bodies — extract signals only. Delete raw crawl data within 24 hours. Reports private by default (Principle 16). Execute DPAs with Supabase, Anthropic, OpenAI before processing external data. DSAR workflow for data subject requests.

**Risk 8: The real competitor is the builder's own coding agent. (NEW -- from adversarial review)**
A developer can type "audit my site at example.com" into Claude Code and get structurally similar output for $0. The "separation of concerns" argument is philosophically correct but easily dismissed by a solo builder.

*Honest differentiators vs. a coding agent:*
- Cross-product calibration data (but this requires 1,000+ audits — V1 moat is weak here)
- Reproducibility and consistency (coding agents give different findings each time)
- Agent-nativeness scoring (unvalidated — see Assumption 2)
- The separation of concerns is structural, not just philosophical: the tool that builds has the same blind spots as the code

*V1 honest pitch:* "We run a more thorough, reproducible audit than you'd get from asking your coding agent, and we're building toward dimensions no coding agent can evaluate."

**Risk 5: Agent-nativeness scoring methodology faces academic or industry challenge.**
Dr. Mara will evaluate our methodology with peer-review rigor. If the methodology has flaws, she'll publish about them. The AN Score only becomes an industry standard if it withstands scrutiny.

*Mitigation:* Publish the methodology. Version it. Invite academic review. Disaggregate scores with confidence intervals. Partner with researchers for validation studies. Accept that the methodology will evolve -- and build that evolution transparently through versioned protocols.

### Top 5 Assumptions -- Status Update

**Assumption 1: Solo builders will pay for external validation of their own products.**

Status: **Partially validated.** The dogfood test proved the value proposition (critical SEO issue found that was invisible through 37 rounds of development). Willingness to pay is not yet tested with real money.

Today, most solo builders ship without external quality checks. The assumption is that the combination of anxiety ("what am I missing?") + ease of use (paste URL, get results) + the fix loop (copy, paste, fixed) creates enough demand.

*Validation plan:* Run 100 free audits with solo builders from indie hacker communities. Measure: (a) what percentage return for a second audit within 7 days? (b) what percentage would pay $19-49 for faster/deeper results? (c) what do they share on social media? The conversion rate from free-to-paid and the re-audit rate within 7 days are the key signals.

**Assumption 2: Agent-nativeness scoring is a valued differentiator, not an academic curiosity.**

Status: **Unvalidated.** The dogfood test focused on human-experience dimensions (SEO, accessibility, analytics). Agent-nativeness scoring has not yet been tested in the loop.

We believe agent-nativeness is a new, important quality dimension. But do builders and agent frameworks actually care about it enough to pay?

*Validation plan:* Offer audits with and without agent-nativeness scoring. Measure whether the AN Score is cited in social shares, referenced in re-audit requests, or mentioned in upgrade conversations. Survey users: "Which dimension was most surprising/useful?" If AN Score consistently ranks in the bottom 3, the differentiator thesis is wrong.

**Assumption 3: The agent-to-agent fix loop (build > test > fix > re-test) is a real workflow, not a demo.**

Status: **Demonstrated (N=1).** March 5-6, 2026. See Section 2A for scope limitations.

Evidence:
- Loop 1: 12 findings generated, 12/12 fixed autonomously by Claude Code, 0 build errors, 45 static pages generated
- Loop 2: 8 findings generated, 6/8 fixed (2 correctly triaged as no-action-needed), builder pushed back on 1 false positive
- The builder agent found correct files across 22+ source files without file path hints
- The site went from "critical SEO issue destroying indexability" to clean in 2 loops
- Fixes were deployed to production and verified on the live site

**Important caveats (from adversarial review C1):**
- This was ONE site (supertrained.ai), ONE tech stack (Next.js), ONE builder (the Alien Eyes creator), ONE coding agent (Claude Code)
- The builder knew the codebase intimately; Claude Code had 37 rounds of prior context
- The findings were hand-crafted, not machine-generated by the automated pipeline
- The findings were mostly SEO/metadata — not logic bugs, race conditions, or auth bypasses
- This demonstrates the loop CAN work. It does not prove it works generally.

Remaining validation needed: non-Next.js stacks, strangers' codebases, machine-generated findings, Cursor/Windsurf/Lovable, complex finding types, MCP/API delivery.

**Assumption 4: Simulated user testing produces insights that real user testing validates.**

Status: **Unvalidated.**

The Stanford persona approach claims 85% accuracy vs human self-consistency. But does that translate to useful product testing insights?

*Validation plan:* Run simulated user audits on 5 products that also have real user testing data (usability studies, analytics, support tickets). Compare: do simulated findings align with real findings? Target: 70%+ alignment rate. If below 50%, the simulated testing approach needs fundamental rework.

**Assumption 5: AEO/GEO/MEO analysis is substantive enough that SEO professionals consider it real, not vaporware.**

Status: **Unvalidated.**

Jordan is the litmus test. If AEO/GEO/MEO analysis is surface-level (just checking structured data), SEO professionals will dismiss it. The analysis needs to demonstrate genuine depth: how content performs in vector space, which AI systems cite it, whether content structure supports AI consumption.

*Validation plan:* Run AEO/GEO/MEO analysis on 20 pages that 3 SEO professionals have independently assessed. Compare findings. Have the SEO professionals rate the analysis: is it novel? Is it actionable? Would they recommend it to peers? Threshold: 2 out of 3 professionals rate it "would recommend."

---

## 12. ROADMAP NARRATIVE

> Updated to reflect that we are past pure discovery. The prototype loop has been demonstrated on one production site (N=1). The roadmap now starts from a working prototype, not from zero. Revenue targets use base/target/upside scenarios per adversarial review H3.

### Phase 0: Validated Prototype to Private Alpha (Months 1-2)

**The story:** We have a working prototype that ran a real audit, produced findings that a coding agent fixed autonomously, and verified the fixes on re-audit. The prototype is manual (Playwright scripts, hand-crafted payloads). Phase 0 turns this into a repeatable, self-service product that 20-50 trusted testers can use without us in the room.

**What already exists (from dogfood validation):**
- Playwright-based browser audit capability
- Format B payload design (validated: 12/12 fix rate)
- Re-audit with before/after comparison (validated: convergence in 2 loops)
- Understanding of what coding agents need and do not need in findings
- Evidence that clean browser profiles are mandatory

**What Phase 0 builds:**
- URL-paste web interface with email verification + Turnstile (abuse prevention from Day 1)
- Automated audit pipeline (URL in, Format A + Format B + Format JSON out)
- "Copy for your coding agent" button (the primary conversion mechanism)
- **Quick Check (free):** deterministic dimensions only — SEO, accessibility, performance. No LLM. Sub-60-second.
- **Full Audit (paid):** all dimensions including LLM-powered analysis. Requires account + payment method.
- URLValidator: DNS resolution, private range blocking, rebinding defense (SSRF Day 1)
- InputSanitizer: strip hidden elements, scripts, comments before LLM ingestion (prompt injection Day 1)
- Re-audit endpoint with before/after diff
- Basic account system for historical tracking
- Incognito/clean browser profile enforcement on every audit run
- Reports private by default; optional publish with redaction preview
- Ownership verification for security dimension testing
- "Mark as false positive" button per finding (feedback mechanism)
- Evidence bundle per finding (URL, timestamp, DOM hash, screenshot path, confidence)
- PDF export for human sharing

**Who it serves:** 20-50 alpha testers. Solo builders with AI coding tools. 2-3 agent framework developers. 1-2 growth consultants.

**Alpha exit criteria (adversarial-hardened):**
- Re-audit rate within 7 days exceeds 30% (reduced from 40% — realistic for pre-PMF)
- Autonomous fix rate from Format B exceeds 60% across 20+ external sites (not just our own)
- At least 3 different tech stacks tested (not just Next.js)
- False positive rate: overall <10%, CRITICAL <1%
- At least 5 testers complete the full loop without guidance
- At least 10 paid audits completed at $19-49 (willingness-to-pay signal)
- Gauge R&R: 10 sites audited 3x each; finding repeatability >80%
- Platform-hosted sites (Shopify/Wix/Squarespace) tested; fixability rate documented

**What we learn:** Does the fix loop work for codebases we didn't build? Does the MCP delivery path work as well as clipboard paste? What false positive rate do testers experience? What's the right severity calibration?

### Phase 1: Public Launch (Months 3-5)

**The story:** Alien Eyes launches publicly with a clear message: "The independent quality check for builders and their agents. Paste a URL. Copy the findings. Your coding agent fixes everything. Re-audit to verify." The free first audit drives viral adoption -- builders share their results because the report makes them look professional. The fix loop is the hook that no other tool offers. The Hacker News launch post leads with the dogfood evidence: "We found a critical SEO issue that survived 37 rounds of expert development. The coding agent fixed it in 4 minutes."

**What's new (on top of Phase 0) — scope reduced per adversarial review C3:**
- Agent-nativeness scoring dimensions (parity, granularity, composability, CRUD completeness) — **only if Assumption 2 shows signal during alpha**
- AEO/GEO/MEO scoring dimensions — **only if rubric validated by 2+ SEO professionals (see Assumption 5)**
- CLI for CI/CD integration (`ae audit <url>`) — local mode (no infra) + cloud mode
- Deterministic mode for CI/CD (locked scenarios, reproducible scores)
- Format C (file-aware) for GitHub-connected projects
- Published scoring methodology v0.1 (versioned, auditable)
- Verbatim narrative from simulated user/agent perspective
- Cross-product pattern database begins accumulating anonymized findings
- Coach mode for first-time users (celebration-first, 3-step action plan before full technical detail — adversarial M2)
- Staged finding disclosure: cap Format B at 5 findings per paste, fix-order prioritized (adversarial M2)

**Who it serves:** 500-2,000 builders. Indie hackers, vibe coders, agency PMs, growth consultants, early agent framework adopters.

**Metric that proves it's working (base / target):**
- Audits per month: 200 (base) / 1,000 (target)
- Free-to-paid conversion: 2% (base) / 5% (target)
- Re-audit rate within 7 days: 25% (base) / 35% (target)
- False positive rate: <10% overall, <1% CRITICAL
- At least 3 tech stacks producing >60% autonomous fix rate

**What we learn:** Does the free tier drive viral sharing? Is the CI/CD integration adopted by engineering teams? Do consultants adopt white-labeling? What dimensions drive upgrade decisions? Is agent-nativeness scoring valued (Assumption 2)?

### Phase 2: Product-Market Fit (Months 6-14)

**The story:** Alien Eyes has found its audience. Solo builders use it before every launch. Agent frameworks embed it in their quality pipelines. The audit-fix-verify loop is a recognized workflow pattern. "Have you Tool Tested it?" enters the vocabulary of indie hacker communities. The scoring methodology has been reviewed by two academic groups. Revenue hits $50K MRR and accelerating.

**What's new (on top of Phase 1):**
- **MCP server** (moved from Phase 0 — ships after API is stable and pricing validated)
- **GitHub Action** published in marketplace
- Diff-aware auditing for GitHub-connected projects (only test what changed)
- Compliance framework mapping (WCAG 2.1 AA, basic SOC 2 controls)
- Team dashboards with finding routing
- Bulk operations for consultants (audit 8 clients in one click)
- Non-web product support: API spec auditing from OpenAPI/Swagger, MCP server evaluation
- Before/after comparison reports (enhanced from Phase 0 basic diff)
- Jira / Linear integration for finding-to-ticket workflow
- Webhook callbacks for async audit completion
- Category benchmarks: "Your API scores in the 73rd percentile for agent-nativeness among developer tools"
- MCP `dispute_finding` endpoint for structured agent-to-agent disagreement
- White-label for consultant reports
- Rhumb data pipeline: audit data feeds AN Scores, token cost benchmarks, schema fingerprints

**Who it serves:** 5,000-15,000 builders. Adding: startup CTOs, QA leads, dev agencies, content strategists, SEO professionals, VC associates doing due diligence.

**Metric that proves it's working (base / target):**
- MRR: $5K (base) / $15K (target)
- Net Revenue Retention: 110% (base) / 130% (target)
- Agent API/MCP calls: 10% of total (base) / 30% (target)
- At least 1 agent framework embedding (base) / 3 (target)

**What we learn:** Is the compliance mapping credible enough for enterprise? Does category benchmarking create a network effect (builders want to be scored because the benchmark exists)? Are non-web audits being adopted?

### Phase 3: Flywheel Spinning (Months 15-24)

**The story:** The flywheel is turning. Every audit generates data that improves scoring, feeds Rhumb's directory, and enriches category benchmarks. Agent frameworks send tool evaluation traffic that generates data that makes the evaluations more accurate. Consultants resell audits, which creates demand from their clients, who become direct customers. The "Tested by Alien Eyes" badge appears on product websites and tool registry listings. Competitors are appearing, but the data moat is deep -- two years of audit data across 100K+ products creates calibration accuracy that a new entrant can't match.

**What's new (on top of Phase 2):**
- Continuous monitoring mode (scheduled recurring audits, drift detection)
- Enterprise tier: SLA, DPA/BAA, advanced compliance mapping (SOC 2 Type II evidence, HIPAA surface checks)
- Schema fingerprint database (Rhumb Monitor pillar enabled)
- Authenticated testing (test behind-login flows)
- Pre-computed scores API for tool recommender agents (read-only, sub-2-second latency)
- Data exchange partnerships: agent frameworks get free evaluation in exchange for anonymized quality data
- "Tested by Alien Eyes" trust badge program
- CLI binary auditing (test command-line tools)
- Cross-audit pattern detection alerts ("This auth failure pattern appears in 34% of APIs we test")
- Research API for academic access (Dr. Mara's use case)
- Advanced white-label for agencies (custom branding, custom dimensions)
- False positive rate tracking and public reporting (builds institutional trust)

**Who it serves:** 30,000-100,000 users across all segments. Enterprise customers contributing 40%+ of revenue. Agent frameworks as a significant distribution channel.

**Metric that proves it's working (base / target):**
- Rhumb AN Scores sourced from Alien Eyes: 2,000+ products (base) / 10,000+ (target)
- Agent-triggered audits: 20% (base) / 50% (target)
- Revenue: $240K ARR (base) / $600K ARR (target) / $2M ARR (upside)
- Scoring methodology cited in at least 1 peer-reviewed publication (target)

**What we learn:** Can continuous monitoring replace or complement annual audits for enterprise? Does the trust badge create adoption pressure ("our competitors have it, we need it")? Is the data-for-free-audits exchange model sustainable for agent framework partnerships?

---

## Appendix A: The Six Stolen Mechanisms

These mechanisms were identified by the expert panel as directly applicable. They are not features -- they are architectural principles that inform how every feature is built.

| # | Mechanism | Source | Application |
|---|-----------|--------|-------------|
| 1 | **Steady State Hypothesis** | Chaos Engineering | Observe baseline behavior, hypothesize it holds, try to break it. Eliminates the need to know what the product "should" do -- we test what it DOES do. |
| 2 | **Swiss Cheese Model** | Aviation Safety | Findings as causal chains, not isolated bugs. Factor A + Factor B + Factor C = failure. Fixing any link improves the outcome. |
| 3 | **Scenario Grammar** | Chaos Engineering + Mystery Shopping | Composable test primitives assembled into unique configurations. 10^6+ combinations make gaming computationally intractable. |
| 4 | **Adaptive Enrichment** | Clinical Trials | Start testing broadly, then focus resources on informative dimensions as data accumulates. Better signal with the same compute budget. |
| 5 | **Verbatim Narrative** | Mystery Shopping + Film | First-person experience story from a simulated user. Captures signal that structured findings miss. "I was trying to find pricing..." |
| 6 | **Pre-registered Endpoints** | Clinical Trials | Freeze scoring methodology before audits run. Version it. Publish it. Never adjust mid-audit. Prevents unconscious p-hacking and builds institutional credibility. |

---

## Appendix B: Dogfood Test Raw Data

### Loop 1 Findings (March 5, 2026)

| # | Severity | Finding | Fixed? |
|---|----------|---------|--------|
| 1 | CRITICAL | Canonical URLs on all pages point to homepage | Yes |
| 2 | HIGH | Missing hreflang / language declaration issues | Yes |
| 3 | MEDIUM | Cookie consent banner not appearing | Yes |
| 4 | MEDIUM | Missing structured data on key pages | Yes |
| 5 | MEDIUM | Image alt text gaps | Yes |
| 6 | MEDIUM | Meta description issues | Yes |
| 7 | MEDIUM | Analytics configuration gaps | Yes |
| 8 | LOW | Minor accessibility issues | Yes |
| 9 | LOW | Performance optimization opportunities | Yes |
| 10 | LOW | Minor SEO issues | Yes |
| 11 | LOW | Trust signal gaps | Yes |
| 12 | LOW | Minor copy/UX issues | Yes |

**Result:** 12/12 fixed. 0 build errors. 45 static pages generated.

### Loop 2 Findings (March 6, 2026)

| Status | Count | Details |
|--------|-------|---------|
| Fully fixed | 8 | Confirmed resolved on live site |
| Partially fixed | 3 | Generated new payload items |
| Not fixed | 0 | -- |
| New issues found | 5 | 2 MEDIUM, 2 LOW, 1 INFO |
| False positive | 1 | Cookie consent (stale browser state) |
| No action needed | 2 | Correctly triaged by builder agent |

**Result:** 8-item payload generated. All actionable items fixed. 1 false positive caught by builder pushback.

---

*This specification synthesizes research from 5 expert panels (film test screening, aviation safety, clinical trials, mystery shopping, chaos engineering), 30 interview-grounded personas (20 human, 10 agent), 10 cross-persona gap analyses, a 2-loop production dogfood test on supertrained.ai (March 5-6, 2026), and 2 adversarial review panels (10 CRITICAL + 10 HIGH + 9 MEDIUM findings, consolidated March 7, 2026). It defines WHAT we are building, WHY, and provides evidence that the core loop works on one site (N=1). Technical architecture decisions are deliberately excluded and belong in a separate architecture specification.*
