# Alien Eyes -- Go-to-Market Plan

> Version: 2.0 | Date: 2026-03-07
> Status: Pre-launch. Product thesis demonstrated (N=1) through dogfood on supertrained.ai. See PRODUCT-SPEC.md Section 2A for scope limitations.
> Context: Discovery complete. Architecture influences synthesized. Two adversarial review panels integrated (March 7, 2026). No code yet.

---

## 0. THE DEMONSTRATED LOOP (N=1)

Before anything else, this is what we demonstrated (N=1, one site, one stack, one builder — see PRODUCT-SPEC.md Section 2A for what this does NOT prove):

```
Audit supertrained.ai (Next.js, our own site, hand-crafted findings)
  --> 12 real issues found (including critical canonical URL bug)
  --> Condensed findings (Format B) pasted into Claude Code
  --> 12/12 fixed. Build passed.
  --> Re-tested: 8 fully fixed, 3 partial, 5 new issues found
  --> Second paste: all resolved, 1 false positive caught by builder (12.5% FP rate)
  --> Two loops: site went from "critical SEO issue" to clean
```

The core loop works on one site. The clipboard produces correct fixes. The loop converges. These are demonstrations, not general validation. Real validation requires 20+ external sites across 3+ tech stacks during alpha.

---

## 1. LAUNCH STRATEGY

### Phase 0: Private Alpha (Weeks 1-8)

**Goal:** 50 alpha testers, 200+ audits, validate pricing, collect testimonials.

**Weeks 1-2: Build the minimum shippable product**
- URL-paste audit with core dimensions
- Format B condensed output (the validated format)
- "Copy to Builder" button
- **Quick Check (free):** SEO + Performance + Accessibility only. Deterministic, no LLM. Sub-60-second. Requires email verification + Turnstile.
- **Full Audit (paid):** All dimensions, LLM-powered. $19-49. Requires account + payment method.
- Re-test: $5-9
- Basic landing page at tooltester.dev or similar

**Weeks 3-4: Recruit alpha testers**
- Personal outreach to 50 builders from these sources:
  - Indie Hackers "Show IH" community (10 builders)
  - Claude Code / Cursor power users from X/Twitter (15 builders)
  - Buildspace / Replit / Lovable Discord communities (10 builders)
  - SuperTrained's existing network and newsletter (10 builders)
  - Agent framework developers: LangChain, CrewAI, AutoGen contributors (5 builders)
- Pitch: "I built a tool that finds issues in your product and formats them so Claude Code fixes them automatically. Want a free audit?"
- No landing page required for alpha. DM the URL, run the audit, send findings.

**Weeks 5-8: Iterate on output quality**
- Run audits, collect feedback on finding accuracy
- Track: false positive rate, re-audit rate, autonomous fix rate
- Refine scenario grammar based on real-world results
- Collect 10+ testimonials with permission to publish
- Document 3-5 anonymized case studies showing before/after scores

**Alpha exit criteria (adversarial-hardened):**
- Re-audit rate within 7 days exceeds 30%
- False positive rate: overall <10%, CRITICAL <1% (tightened from 15% — adversarial H3/H5)
- At least 5 testimonials referencing specific value
- At least 3 builders willing to share results publicly
- Autonomous fix rate exceeds 60% across 20+ external sites and 3+ tech stacks
- At least 10 paid audits completed at $19-49 (willingness-to-pay signal)
- Gauge R&R: 10 sites audited 3x each, finding repeatability >80%
- Platform-hosted sites tested (Shopify/Wix/Squarespace); fixability rate documented
- At least 3 Cloudflare-protected sites tested; scan success rate documented

### Phase 1: Public Launch (Weeks 9-12)

**Launch day is not a single event. It is a coordinated 2-week campaign across 5 channels.**

**Week 9: Pre-launch seeding**
- Publish 3 anonymized audit case studies as blog posts
- Share "how the loop works" thread on X/Twitter with real screenshots
- Submit the scoring methodology as a post to the Anthropic community
- Reach out to 5 indie hacker / AI builder newsletter authors for features
- Create a 60-second Loom demo: URL paste, results, copy, paste into Claude Code, fixes applied

**Week 10: Launch week**

| Day | Channel | Action |
|-----|---------|--------|
| Monday | X/Twitter | Launch thread. Lead with the supertrained.ai case study. "We audited our own site, found 12 issues including a critical SEO bug, pasted into Claude Code, all fixed in 2 loops." |
| Tuesday | Hacker News | "Show HN: Alien Eyes -- External audit for your product, formatted for your coding agent." Lead with methodology, not marketing. Link to the scoring methodology doc. |
| Wednesday | Reddit | Posts in r/webdev, r/SideProject, r/artificial, r/ClaudeAI. Different angle per sub: webdev gets the "vs Lighthouse" story, SideProject gets the indie hacker story, artificial gets the agent-nativeness angle. |
| Thursday | Product Hunt | Launch with the "alien perspective" framing. Maker comment explains the thesis. |
| Friday | Indie Hackers | "I built Alien Eyes and here's what I learned from 200+ audits" post. Data-heavy, transparent about what works and what doesn't. |

**Weeks 11-12: Post-launch amplification**
- Respond to every comment, question, and criticism personally
- Run free audits for anyone who asks publicly (the results ARE the marketing)
- Publish a "lessons from launch" post with real metrics
- Start the weekly "Site of the Week" public audit series

**Launch day messaging:**

Primary: "Your coding agent builds it. Who tests it?"

Supporting:
- "Lighthouse tells you your score. We tell you whether your product works."
- "Paste the findings into Claude Code. Watch it fix what you couldn't see."
- "The first external audit built for the vibe coding era."
- "Test from the outside. Fix from the inside. Repeat."

### Phase 2: Post-Launch Growth (Months 3-6)

**Goal:** 1,000 audits/month, $5K MRR, clear PMF signal.

- Launch MCP server (agents can call Alien Eyes programmatically)
- Launch CLI (`tt audit --url staging.example.com`)
- Publish GitHub Action in marketplace
- Launch consultant/agency white-label tier
- Begin Rhumb data pipeline (audit data feeds AN Scores)
- Start paid acquisition experiments (see Section 2)
- Launch the "Tested by Alien Eyes" badge program

### Phase 3: Scale (Months 6-18)

**Goal:** 10,000 audits/month, $50K MRR, agent distribution channel working.

- Enterprise tier with compliance mapping
- Continuous monitoring (scheduled recurring audits)
- Before/after comparison reports
- Category benchmarks ("73rd percentile for agent-nativeness among dev tools")
- Data exchange partnerships with agent frameworks
- Academic methodology review
- "Have you Tool Tested it?" becomes a phrase

---

## 2. CUSTOMER ACQUISITION CHANNELS

### Channel 1: Organic / Community (Day 1 -- primary channel)

**Where the builders are:**

| Community | Size | Our angle | Frequency |
|-----------|------|-----------|-----------|
| X/Twitter AI builder community | Large | Agent-nativeness, "clipboard is the product" demos | 3-5x/week |
| Indie Hackers | 100K+ | "Ship with confidence" angle, case studies | 2x/week |
| r/webdev, r/SideProject | 2M+, 350K+ | "vs Lighthouse" comparisons, free audits | 2x/week |
| Hacker News | Large | Methodology-first, technical credibility | 1-2x/month |
| Claude Code / Cursor Discord servers | 50K+ | Native integration demos, MCP server | Weekly |
| Buildspace / Replit / Lovable communities | 100K+ | Vibe coder angle, "paste and fix" | Weekly |
| Dev.to / Hashnode | Large | Technical blog posts, methodology deep dives | 2x/month |

**The play:** Don't post about Alien Eyes. Post audit RESULTS. Share real findings (anonymized or with permission). Show the before/after. Demonstrate the loop. The content IS the product demo.

**Example posts that drive signups:**
- "I ran an external audit on a Show HN project and found a critical canonical URL bug that made Google ignore 6 of 7 pages. The builder pasted the findings into Claude Code and it fixed all 12 issues."
- "Here's what 200 audits taught me about the most common mistakes vibe coders make" (data post)
- "I measured the agent-nativeness of the top 20 MCP servers. Here are the rankings." (rankings post)
- Thread: "Your site's animated counters show '0' to screen readers, search engines, and AI agents. Here's why and how to fix it in 2 minutes." (finding-as-content)

### Channel 2: Content Marketing (Week 4+)

See Section 4 for full content strategy. The key insight: **audit findings are content**. Every audit produces 8-15 findings that can be turned into standalone educational posts.

**Content-to-acquisition funnel:**
```
Finding from an audit
  --> Blog post / social post explaining the issue
  --> "Want to know if YOUR site has this? Free audit."
  --> User runs free audit
  --> Gets findings, pastes into coding agent
  --> Comes back for re-test ($5)
  --> Becomes monthly subscriber ($29/mo)
```

### Channel 3: Product-Led Growth (Day 1)

**The viral loop:**

```
Builder runs free audit
  --> Gets valuable findings
  --> Shares results (makes them look smart, not negligent)
  --> Their followers see the report
  --> Those followers run their own free audit
  --> Repeat
```

**Design requirements for virality (revised — adversarial C4/C5: default private, security redaction):**
- Results are **private by default**. Builder explicitly opts to publish via toggle with redaction preview.
- Published reports show **non-security dimensions only** (SEO, performance, accessibility). Security findings are NEVER on public URLs.
- The shared report must show enough value to trigger "I want this for MY site"
- The share page must have a clear "Audit your site" CTA
- Results must include a "powered by Alien Eyes" watermark that links to us
- The share format must make the builder look professional (not negligent)
- **Takedown mechanism:** Any site owner can request removal; findings deleted within 24 hours

**Share triggers to build into the product:**
- "Your product improved from 63 to 78 since last audit" -- share-worthy
- "Zero critical findings" -- badge they want to display
- "Agent-nativeness: 85th percentile" -- bragging rights
- Before/after comparison -- the most shareable format

### Channel 4: Agent Distribution (Month 3+)

This is the channel nobody else has. When agents can call Alien Eyes programmatically, distribution becomes algorithmic.

**MCP marketplace listing:**
- List Alien Eyes as an MCP server in the Anthropic marketplace, Smithery, glama.ai
- Agents discover it when users ask "audit my site" or "check my product"
- Every MCP call is a potential paid audit

**Agent framework partnerships:**
- LangChain / LangSmith: offer free quality evaluation of tools in their hub
- CrewAI: quality gate primitive for agent workflows
- AutoGen: pre-flight check for tool integration
- Vercel: "audit before deploy" integration

**The data exchange model:**
- Agent frameworks get free Alien Eyes evaluations of tools in their registries
- In exchange, we get anonymized quality data that feeds Rhumb AN Scores
- The framework gets better quality signals; we get distribution + data
- Both sides benefit, neither side pays cash

### Channel 5: Consultant / Agency Multiplier (Month 2+)

**The math:** One growth consultant = 10-50 client audits per month. One agency = 20-100.

**How to recruit consultants:**
- Offer 30-day free access to the white-label tier
- Run a free audit on one of their client sites as a demo
- Show them the AEO/GEO/MEO analysis (their competitive edge) — **NOTE: AEO/GEO/MEO rubric must be validated by 2+ SEO professionals before this channel activates. Do NOT recruit consultants based on an unvalidated capability.**
- Price: $99/mo + $3/audit (they bill $200-500/audit to clients)

**Why consultants stay:**
- AEO/GEO/MEO scoring differentiates their practice
- White-label reports justify their rates
- Clients start requesting audits by name
- Switching cost: all historical data and benchmarks are in Alien Eyes

**Consultant acquisition funnel:**
```
Growth consultant sees our AEO/GEO/MEO content
  --> Realizes no other tool offers this
  --> Signs up for free audit of their own site
  --> Runs audit on a client site
  --> Client is impressed
  --> Consultant upgrades to white-label
  --> Runs 10-50 audits/month
  --> Refers other consultants
```

### Channel 6: Paid Acquisition (Month 4+ -- only after organic PMF)

**Do not spend money on ads until:**
- Free-to-paid conversion rate exceeds 5%
- Re-audit rate within 7 days exceeds 40%
- CAC payback period can be modeled from organic data

**When ready, test these channels:**

| Channel | Audience | CPC Target | Expected CAC | Creative |
|---------|----------|-----------|-------------|---------|
| Google Ads | "website audit tool," "site quality check" | $2-4 | $30-50 | "Free audit. Results in 5 minutes." |
| X/Twitter Ads | AI builder community, Claude Code users | $1-3 | $20-40 | Demo video of the audit-paste-fix loop |
| Reddit Ads | r/webdev, r/SideProject | $1-2 | $15-30 | "We audited 200 sites. Here's what we found." |
| Sponsorships | AI/dev newsletters (TLDR AI, Bytes, etc.) | $500-2K/issue | $25-50 | Case study with real results |
| YouTube | Dev tutorial channels | $2K-5K/video | $30-60 | Sponsored audit of the YouTuber's project |

**CAC ceiling:** $50 for a Builder tier customer ($19-49/audit). Payback within 2 audits.

---

## 3. MARKETING MESSAGING

### Core Positioning Statement

**For** solo builders and AI coding tool users **who** ship fast but can't see their own blind spots, **Alien Eyes is** an independent quality verification service **that** audits your product from the outside -- for both human users and AI agents -- and formats findings so your coding agent can fix them immediately. **Unlike** Lighthouse, Axe, or manual QA, **Alien Eyes** tests outcomes (not checklists), scores agent-nativeness (a dimension nobody else measures), and closes the build-test-fix loop in minutes, not weeks.

### Headlines by Segment

**Solo builders / vibe coders:**
- "Your coding agent builds it. Who tests it?"
- "Paste the findings into Claude Code. Watch it fix what you couldn't see."
- "The audit that speaks Claude Code's language."
- "Ship with confidence. Know what you don't know."
- "You can't test your own blind spots. We can."
- "The quality check consultants charge thousands for. Yours in minutes."

**Agent framework developers:**
- "The trust signal your tool registry is missing."
- "Does your MCP server actually work? We tested 20. Here are the scores."
- "Agent-nativeness scoring for every tool in your registry."
- "Schema stability. Error handling. Parity. Measured."

**Growth consultants:**
- "The AEO/GEO/MEO analysis your clients are about to start asking for." *(Use ONLY after rubric validated by 2+ SEO professionals)*
- "Replace 6 tools with one audit. White-label it."
- "Your clients' AI search visibility, measured for the first time."
- "The audit dimension nobody else offers. Yet."

**Agency PMs / Non-technical founders:**
- "The home inspector for software. Independent. Thorough. In plain English."
- "Your agency says everything is fine. We'll verify."
- "An independent quality report you can attach to your investor deck."

**Startup CTOs:**
- "Quality gates that don't slow deploys."
- "Continuous quality monitoring between annual audits."
- "Your team shipped 47 PRs this month. Did quality improve or regress?"

### What We Say vs. What Competitors Say

| Topic | Lighthouse | Alien Eyes |
|-------|-----------|-------------|
| What they test | Web performance metrics | Product outcomes for humans AND agents |
| How they report | Score + jargon wall | Narrative findings you paste into your coding agent |
| Agent testing | None | First-class: parity, granularity, composability, CRUD |
| AI search | None | AEO/GEO/MEO scoring |
| Fix workflow | You figure it out | Copy findings, paste into Claude Code, fixes applied |
| False positive handling | No mechanism | Re-test loop with builder pushback as signal |
| Scope | Web only | Web, API, MCP, CLI (progressive) |
| Methodology | Closed, Google-controlled | Published, versioned, auditable |

### The "vs. Lighthouse" Narrative

This comparison will come up in every conversation. Here is the response:

**Short version:** "Lighthouse tells you your score. We tell you whether your product works."

**Longer version for HN/technical audiences:**

"Lighthouse is a valuable tool for web performance measurement. Alien Eyes is not a Lighthouse replacement -- it's a different category. Lighthouse checks compliance against Google's web metrics. Alien Eyes tests whether your product actually works for the humans and agents trying to use it.

Lighthouse doesn't test whether your signup flow has a dead end on mobile. It doesn't test whether an AI agent can successfully complete a workflow through your API. It doesn't test whether your content is structured for AI search citation. It doesn't format findings so your coding agent can fix them. It doesn't know that your canonical URL bug is causing Google to ignore 6 of your 7 pages.

We run Lighthouse as one input among many. But the output is fundamentally different: narrative findings from a simulated user's perspective, causal chains connecting related issues, and a format optimized for the build-test-fix loop with AI coding tools.

Think of Lighthouse as a thermometer. Alien Eyes is the doctor who uses the thermometer reading alongside 13 other tests and tells you what's actually wrong."

### Social Proof Strategy (Building Trust from Zero)

**Week 1-4 (Pre-launch):**
- Dogfood results: "We audited our own site and found 12 issues including a critical SEO bug"
- Methodology credibility: published scoring methodology with version history
- Builder credibility: SuperTrained agency background, Rhumb project
- Alpha tester quotes (even informal DMs, with permission)

**Month 1-2 (Launch):**
- Case studies: 3-5 anonymized before/after audits
- "X people audited their sites this week" counter on homepage
- Testimonials from alpha testers with real names and projects
- Public audit results that builders chose to share

**Month 3-6 (Growth):**
- "200+ audits run" / "1,000+ findings fixed" aggregate stats
- Named customer logos (with permission)
- "Site of the Week" public audit series (builds authority AND content)
- Community endorsements from indie hacker / AI builder communities
- Agent framework partnership logos

**Month 6+ (Authority):**
- Published methodology cited by others
- Conference talks on agent-nativeness scoring
- Academic validation or partnership
- "Tested by Alien Eyes" badges appearing on real products
- Category benchmark data referenced by analysts

---

## 4. CONTENT STRATEGY

### The Core Insight: Audit Findings ARE Content

Every audit produces 8-15 findings. Each finding is a standalone piece of educational content. The content strategy is not separate from the product -- the product generates the content.

**Content production pipeline:**
```
Audit runs on a real site
  --> 12 findings produced
  --> 3-4 findings are common enough to be educational
  --> Each becomes a blog post: "Why your animated counters show 0 to AI agents"
  --> Each blog post ends with: "Want to check if YOUR site has this issue?"
  --> CTA: free audit
```

**Monthly content volume from product usage alone:**
- 50 audits/month in alpha = 150+ unique findings
- 10% are common enough to be educational = 15 blog post topics/month
- More content than a dedicated content team could produce

### Blog / Thought Leadership Topics

**Tier 1: Foundational (publish before launch)**

| # | Topic | Purpose |
|---|-------|---------|
| 1 | "The Alien Perspective: Why the Builder Can't Test Their Own Product" | The thesis. The manifesto. Everything else derives from this. |
| 2 | "Why Your Coding Agent Builds Great Code But Can't Tell If It Works" | The separation-of-concerns insight. Why build and test must be independent. |
| 3 | "Agent-Nativeness: The Quality Dimension Nobody Is Measuring" | Introduces the AN Score concept. Positions us as category creators. |
| 4 | "AEO, GEO, MEO: The Three Layers of AI Search Optimization" | Establishes authority in a space with zero established tools. |
| 5 | "We Audited Our Own Site and Found a Critical SEO Bug" | The dogfood story. Most credible possible launch content. |

**Tier 2: Ongoing (publish weekly after launch)**

| Category | Example Topics |
|----------|---------------|
| Finding spotlights | "Why your canonical URLs might be telling Google to ignore your site" |
| | "The animated counter problem: screen readers, AI agents, and search engines all see 0" |
| | "Your hamburger menu is a dead end on mobile. Here's why." |
| Agent-nativeness | "We scored the top 20 MCP servers for agent-nativeness. Here are the results." |
| | "5 anti-patterns that make your API hostile to AI agents" |
| | "Parity, granularity, composability: what agent-native actually means" |
| AI search | "How AI answer engines decide what to cite (and why your site isn't getting cited)" |
| | "MEO explained: optimizing for embeddings, not keywords" |
| | "We measured AEO/GEO/MEO for 100 sites. Here's what the top 10% do differently." |
| Methodology | "How we test outcomes, not compliance (Steady State Hypothesis)" |
| | "Why our audit is different every time (Scenario Grammar)" |
| | "Swiss Cheese Model: why we report causal chains, not isolated bugs" |
| Industry data | "The most common issues across 500 audits" (monthly data report) |
| | "Vibe coder quality benchmarks: how AI-built sites compare" |
| | "Agent-nativeness by category: which tools are ready for the agent economy?" |

**Tier 3: Annual / one-time**
- "The State of Product Quality" annual report (when we have sufficient data)
- The scoring methodology paper (builds academic/expert trust)
- "The Alien Perspective" longform essay or short book

### The "Audit Report as Content" Playbook

**Step 1:** Run audits (the product does this naturally).

**Step 2:** Identify findings that are common across multiple sites. These are the educational content goldmine -- if 40% of sites have the same issue, a blog post about it reaches a massive audience.

**Step 3:** Write the post from the perspective of the finding, not the tool.
- BAD: "Alien Eyes found that 67% of sites have broken canonical URLs"
- GOOD: "Your canonical URLs might be telling Google to ignore 6 of your 7 pages. Here's how to check in 30 seconds."

**Step 4:** End every post with a non-aggressive CTA.
- "Want to check if your site has this issue? Run a free audit."
- Not: "Sign up for Alien Eyes today!" The education earns the right to ask.

**Step 5:** Track which posts drive the most free audits. Double down on those topics.

### SEO/AEO/GEO/MEO for Our Own Site

We must practice what we preach. Our own site should score in the top 10% across all dimensions we measure. This is both a credibility requirement and a living case study.

**SEO targets:**
- Primary keywords: "website audit tool," "product quality check," "agent-native testing," "AI site audit"
- Long-tail: "audit my site for free," "test website for AI agents," "AEO optimization tool," "MEO scoring"
- Technical: perfect Core Web Vitals, proper canonical URLs (yes, we caught this one ourselves), structured data on every page

**AEO targets:**
- Every page answers a specific question in its first 150 words
- FAQ schema on methodology page
- HowTo schema on the "how it works" page
- Content structured for AI snippet extraction

**GEO targets:**
- Statistical claims with sources (cite our own audit data)
- Quotations from named experts (alpha testers, methodology reviewers)
- Methodology documentation as a citation-worthy source
- Fluency and authority signals in all copy

**MEO targets:**
- Semantic coherence across the full site
- Consistent terminology (not alternating between "audit," "test," "check," "scan" randomly)
- Concept clustering that embedding models interpret correctly
- Entity relationships explicitly stated (Alien Eyes > made by SuperTrained > feeds Rhumb)

### Developer Documentation as Marketing

The docs ARE marketing for technical buyers (Diana persona). If the docs are thin, Diana leaves. If the docs are thorough and well-written, Diana becomes an evangelist.

**Documentation priorities:**

| Doc | Purpose | Marketing angle |
|-----|---------|----------------|
| API reference | How to use the REST API | Shows the product is serious and well-built |
| MCP integration guide | How agents consume Alien Eyes | Demonstrates agent-native practice |
| Scoring methodology | How scores are calculated | Builds trust through transparency |
| Audit dimensions explained | What each dimension measures | SEO content + educational value |
| CLI reference | How to use in CI/CD | Shows developer workflow integration |
| Changelog | What changed and when | Shows active development and responsiveness |

### The Methodology Paper

**What:** A 15-20 page document explaining the scoring methodology in academic-level detail. Versioned. Published on the website with a permanent URL. Updated with each methodology revision.

**Why:** This is the single most important trust-building asset for expert users. Diana reads it before trying the tool. Dr. Mara evaluates it before recommending it. Amara checks it before recommending to clients. Viktor verifies it before trusting security findings.

**Structure:**
1. Problem statement (the builder-tests-own-work paradigm)
2. Related work (StrongDM, Stanford personas, chaos engineering)
3. Scoring methodology (how each dimension is calculated)
4. Scenario grammar (how tests are composed)
5. Statistical approach (probabilistic scoring, confidence intervals, 2-of-3 averaging)
6. Limitations (what we don't test, known biases, false positive rates)
7. Versioning policy (how the methodology evolves)
8. Appendix: raw dimension weights and calibration data

**When:** Publish v0.1 before public launch. The methodology doesn't need to be perfect -- it needs to be transparent.

---

## 5. GROWTH MECHANICS

### Growth Mechanic 1: The Viral Loop

```
Builder runs free audit
  --> Gets 8-15 specific, actionable findings
  --> Shares results publicly ("look what I found")
  --> Their followers see the value
  --> Followers run their own free audit
  --> Repeat
```

**Why builders share:** The results make them look proactive and professional, not negligent. The framing is "I found and fixed these" not "I shipped these bugs." The share format is designed for this.

**Key design decisions for virality:**
- No login required for first audit (removing friction)
- Results on a shareable URL with OG tags optimized for social previews
- The share URL shows the builder's name/project with their permission
- "Improved from 63 to 78" is inherently share-worthy (progress narrative)
- "Zero critical findings" generates a shareable badge
- Audit count on homepage creates social proof ("47,000 audits and counting")

**Viral coefficient target:** 0.3 (every 10 users bring 3 new users). At this rate, organic growth compounds even without paid acquisition.

### Growth Mechanic 2: The Re-Test Loop

```
Audit finds 12 issues
  --> Builder pastes into coding agent
  --> Fixes applied
  --> Builder re-tests ($3-5) to verify fixes
  --> Re-test finds 3 partial fixes + 5 new issues
  --> Builder fixes again
  --> Re-tests again
  --> Clean. Score improved.
  --> Builder is now a habitual user
```

**Why this creates retention:** The re-test is the moment of highest value. The builder just invested effort in fixing issues and wants validation. The $3-5 price is low enough to be a non-decision. The score improvement is dopamine. After 2-3 loops, the builder has a mental model: "ship, then Tool Test."

**Pricing supports the loop:**
- First audit: free
- Re-test same URL within 7 days: $3-5 (cheap enough to loop)
- Fresh audit of a new URL: $19-49
- Monthly plan: $29/mo + $3/audit (for regular builders)

### Growth Mechanic 3: The Consultant Multiplier

```
One growth consultant discovers Alien Eyes
  --> Runs audit on their own site (free)
  --> Runs audit on one client site (free or $19)
  --> Client is impressed
  --> Consultant upgrades to white-label ($99/mo)
  --> Runs 10-50 audits/month on client sites
  --> Each client now knows about Alien Eyes
  --> Some clients become direct users
  --> Consultant refers other consultants
```

**The math:**
- 1 consultant = 10-50 audits/month
- Revenue: $99/mo + $3/audit x 30 audits = $189/mo average
- If a consultant refers 2 peers per quarter = exponential growth in this segment
- 50 consultants = 500-2,500 audits/month = significant data volume for benchmarks

**How to recruit the first 10 consultants:**
- Guest on 3-5 marketing / SEO podcasts with the AEO/GEO/MEO angle
- Post in GrowthHackers, Traffic Think Tank, Superpath communities
- Cold outreach to 50 consultants who tweet about SEO/AEO/GEO: "I built a tool with AEO/GEO/MEO scoring that nobody else offers. Free access for 30 days."
- Partner with one well-known SEO consultant for a co-branded "State of AEO" report

### Growth Mechanic 4: Agent Distribution

```
Agent framework lists Alien Eyes as an available MCP server
  --> Developer building with Claude Code asks "audit my site"
  --> Claude Code discovers Alien Eyes via MCP
  --> Audit runs programmatically
  --> Findings returned as structured JSON
  --> Agent fixes issues
  --> Developer re-tests
  --> Never visited our website, never saw our marketing
```

**Why this matters:** This channel grows with the agent ecosystem, not with our marketing budget. As more developers use coding agents, more agents discover Alien Eyes through MCP discovery. Every audit through this channel is fully automated -- zero acquisition cost.

**Distribution points:**
- Anthropic MCP marketplace
- Smithery (MCP server registry)
- Glama.ai (MCP directory)
- npm / PyPI packages for programmatic access
- Rhumb directory (when live) -- our own distribution channel
- GitHub Marketplace (Action for CI/CD)

**Revenue from agent channel:**
- MCP calls priced same as web audits
- API key required after first free audit
- Usage metered and billed monthly

### Growth Mechanic 5: Network Effects

```
More audits run
  --> More data accumulated
  --> Better category benchmarks ("your API scores in the 73rd percentile")
  --> Benchmarks attract more builders who want to be scored
  --> More data
  --> Better scoring accuracy
  --> More trust
  --> More audits
```

**The data moat:** After 10,000 audits, we have calibration data that no competitor can replicate without running 10,000 audits. After 100,000 audits, the benchmark data itself is a product (category reports, trend analysis, industry standards).

**When the network effect kicks in:**
- At 1,000 audits: basic benchmarks become meaningful ("average score for SaaS products")
- At 10,000 audits: percentile rankings are statistically valid
- At 100,000 audits: the benchmark data is an independent product

---

## 6. UNIT ECONOMICS

### Cost Per Audit (REVISED — adversarial C4/C5: original estimates 3-5x too low)

**Critical note:** Original COGS estimate of $0.40-1.00 was based on optimistic assumptions. Adversarial review calculated $2-5/audit for full LLM-powered audits. The revised model separates Quick Check (deterministic, cheap) from Full Audit (LLM-powered, expensive).

| Component | Quick Check (free) | Full Audit (paid) | Notes |
|-----------|-------------------|-------------------|-------|
| Browser pool (Playwright) | $0.05 | $0.10-0.20 | Clean profile, 30-page limit |
| Compute (workers) | $0.02 | $0.05-0.10 | Railway/Fly.io (NOT Vercel — adversarial C1) |
| LLM inference | $0.00 | $1.50-3.50 | Sonnet for analysis, Haiku for extraction. Opus for synthesis only on paid. |
| Content extraction + summarization | $0.00 | $0.20-0.50 | PageSummary generation (reduces raw HTML token cost) |
| Supabase storage + queries | $0.01 | $0.03-0.05 | Postgres + evidence bundle storage |
| Redis/BullMQ queue | $0.01 | $0.01 | Upstash serverless Redis |
| Abuse prevention overhead | $0.01 | $0.01 | Turnstile, rate limiting, URL validation |
| **Total COGS** | **~$0.10** | **$1.90-4.40** | |
| **p50 / p95 estimate** | **$0.10** | **$2.50 / $4.50** | Based on 5-page vs 30-page site |

**Per-audit LLM cost tracking:** Soft warning at $5. Hard caps and circuit breakers deferred until 50+ real audits establish cost baselines (see CANONICAL-BUILD-SCOPE Section 7). Phase 0 priority is understanding real cost distributions before constraining them.

### Gross Margin by Tier (Revised)

| Tier | Price | COGS (p50) | Gross Margin | GM% |
|------|-------|-----------|-------------|-----|
| Quick Check (free) | $0 | $0.10 | -$0.10 | -100% |
| Re-test (same URL, 7 days) | $5-9 | $1.50 | $3.50-7.50 | 58-83% |
| Full Audit (Builder) | $19-49 | $2.50 | $16.50-46.50 | 87-95% |
| Monthly + per-audit | $29 + $5/audit | $2.50/audit | $29 base + $2.50/audit | 70%+ |
| Professional | $49-99/audit | $2.50 | $46.50-96.50 | 95%+ |
| Consultant white-label | $99 + $5/audit | $2.50/audit | $99 base + $2.50/audit | 80%+ |
| Enterprise | $500+/mo | $2.50/audit | $500 base + margin | 85%+ |

**Target blended gross margin: 65-80%** (revised down from 75-85% to account for real LLM costs)

**Cost validation requirement (before building all primitives):** Run 10 real audits with actual LLM calls, measure actual token usage, calculate actual costs. If cost >$4/audit at p50: move more analysis from Opus to Sonnet, increase deterministic extraction, reduce LLM judgment surface area.

### Customer Acquisition Cost by Channel

| Channel | Estimated CAC | Payback Period | LTV:CAC |
|---------|-------------|----------------|---------|
| Organic / community | $0-5 | Immediate | 50:1+ |
| Content marketing | $10-20 | 1-2 months | 15:1 |
| Product-led (viral) | $2-5 | Immediate | 30:1+ |
| Agent distribution (MCP) | $0 | Immediate | Infinite |
| Consultant referral | $15-30 | 1 month | 10:1 |
| Google Ads | $30-50 | 2-3 months | 6:1 |
| Newsletter sponsorships | $25-50 | 2 months | 8:1 |
| Paid social (X, Reddit) | $15-40 | 1-2 months | 8:1 |

**CAC ceiling: $50.** If any channel exceeds this, stop spending and optimize.

### LTV Projections by Segment

| Segment | Monthly Spend | Avg Retention | LTV |
|---------|--------------|--------------|-----|
| Vibe coder (casual) | $5-15/mo | 4 months | $20-60 |
| Solo builder (regular) | $29 + $9/mo | 8 months | $304 |
| Growth consultant | $99 + $90/mo | 14 months | $2,646 |
| Agency PM | $99 + $45/mo | 12 months | $1,728 |
| Startup CTO | $199 + $30/mo | 18 months | $4,122 |
| Enterprise | $500+/mo | 24+ months | $12,000+ |

**Blended average LTV target: $300-500** (weighted toward solo builders who are the largest segment).

### Break-Even Analysis

**Fixed costs (monthly):**

| Expense | Cost | Notes |
|---------|------|-------|
| Hosting / infra | $200-500 | Vercel Pro, Supabase Pro, Upstash, browser pool |
| LLM API costs (fixed) | $100-300 | Development, testing, internal use |
| Domain / DNS | $20 | Annual, amortized |
| Founder time | $0 | Bootstrapped; no salary until revenue supports it |
| **Total fixed** | **$320-820/mo** | |

**Variable costs:** $0.40-1.00 per audit (see COGS above)

**Break-even scenarios (revised with real COGS):**

| Scenario | Audits/mo | Revenue/mo | COGS/mo (p50) | Fixed/mo | Profit/mo |
|----------|----------|-----------|--------------|----------|----------|
| Minimum viable | 50 paid | $1,450 | $125 | $500 | $825 |
| Growth mode | 200 paid | $5,800 | $500 | $800 | $4,500 |
| Scale | 1,000 paid | $29,000 | $2,500 | $1,200 | $25,300 |

**Break-even point: ~20 paid Full Audits per month** ($580 revenue vs $500 fixed + $50 variable = $550 cost). Quick Checks are near-free to serve but don't generate revenue directly — they're the top of funnel.

Note: break-even assumes 0 free-tier abuse (Turnstile + email verification + rate limiting). If abuse prevention fails, free-tier costs can spike. Total hourly LLM spend is logged in Phase 0; hard caps will be introduced after cost baselines are established.

**Failure cost scenarios (adversarial C4 — missing from original):**

| Failure Mode | Cost Impact | Mitigation |
|-------------|------------|------------|
| Blocked crawl (Cloudflare/WAF) | $0.05 wasted (browser only) | Return `blocked` status, no LLM calls |
| LLM retry (malformed output) | +$0.50-1.50 per retry | JSON repair loop, max 2 retries |
| Abuse (bot submissions) | $0.10/Quick Check, $2.50/Full Audit | Turnstile + email + IP rate limits |
| Support/triage (false positive disputes) | ~$5/hour founder time | Automate dispute workflow; self-serve first |
| Refund (dissatisfied customer) | Full price refunded | Track refund rate; target <2% |

### Fundraising Decision

**Default: Bootstrap.** The unit economics support bootstrapping:
- Low fixed costs ($500/mo)
- High gross margins (75-85%)
- Low break-even point (30 audits/mo)
- No hardware capex
- Single founder can operate until ~$10K MRR (may need ops/support hire at $10K+ — adversarial C4)

**Consider raising ONLY if:**
- The agent distribution channel explodes and we need to scale infrastructure faster than revenue can fund
- Enterprise demand materializes earlier than expected and we need a sales team
- A competitor with funding enters the space and we need to accelerate
- The Rhumb data flywheel requires simultaneous investment in both products

**If raising:**
- Pre-seed: $250K-500K at $2-4M valuation
- Use of funds: 1 senior engineer, 6 months of aggressive infrastructure scaling, 6 months of content marketing
- Raise after demonstrating: 1,000+ audits/month, 5%+ free-to-paid conversion, 40%+ re-audit rate

---

## 7. COMPETITIVE POSITIONING

### Handling "Just Use Lighthouse"

**The objection:** "Lighthouse is free and does the same thing."

**The response:**

"Lighthouse is excellent at what it measures: web performance metrics defined by Google. We use Lighthouse as one input. But here's what Lighthouse doesn't do:

1. Test whether your signup flow works on mobile (it checks load speed, not user flows)
2. Tell you if an AI agent can complete a task through your API (it doesn't know agents exist)
3. Format findings so your coding agent can fix them (it produces scores for humans to interpret)
4. Connect related issues into causal chains (it reports isolated metrics)
5. Score your content for AI search visibility (AEO/GEO/MEO)
6. Test from a fresh user perspective (it runs the same checks every time)
7. Measure whether your product WORKS, vs whether it's FAST

Lighthouse is a speedometer. We're a mechanic who checks the whole car."

**Where to deploy this response:**
- FAQ page
- HN comments (inevitable)
- Comparison page on website
- Social media responses

### Handling "I Can Build This Myself"

**The objection:** "I could build an audit tool with Playwright and Claude in a weekend."

**The response:**

"You could build a basic audit script. Many people have. But the value isn't in the script — it's in three things you can't build in a weekend:

1. **Cross-product calibration.** After thousands of audits, we know what 'good' looks like for a SaaS product vs. an API vs. an MCP server. Your script has no baseline. *(Honest note: this moat exists at scale. At launch, our calibration data is thin.)*

2. **Reproducibility.** Your script gives different results each time. Our methodology is versioned and deterministic. Same site, same version, same findings.

3. **The separation of concerns.** If you build your own test, you're testing what you think matters. The whole point is that someone else tests what you can't see. This is structural, not technical.

The tool that builds should not be the tool that tests. If your coding agent writes your tests, your tests have the same blind spots as your code."

### Handling "Why Not Just Ask Claude Code?" (NEW — adversarial H2)

**The objection:** "I can type 'audit my site at example.com' into Claude Code and get findings for free."

**The honest response:**

"You absolutely can, and for a quick sanity check, you should. But here's what's different:

1. **Your coding agent has your blind spots.** If it built your code, it tests what it thought of, not what it missed. We test from OUTSIDE — clean browser, no history, no cached state, no access to your code. We see what your USERS see.

2. **We're reproducible.** Ask Claude Code to audit your site three times and you'll get three different sets of findings. Our methodology is versioned and deterministic. Same site, same methodology version, same findings.

3. **We accumulate cross-product intelligence.** After 1,000 audits, we know what 'good' looks like for a SaaS vs an API vs a landing page. Your coding agent has no baseline beyond its training data.

4. **The format is optimized for the fix loop.** Our Format B output produces verified autonomous fixes. A coding agent's free-form audit output varies in structure and actionability.

Think of it like this: you CAN check your own blood pressure at home. But a doctor runs 13 tests you wouldn't think to run, compares your results to thousands of patients, and catches patterns you can't see from inside."

**Where to deploy:** FAQ page, HN comments (inevitable), landing page "How is this different from asking my AI?" section.

**Honest caveat for internal use:** This competitive narrative strengthens as our data moat grows. At V1 launch with 0 accumulated audits, the honest differentiator is reproducibility + the feedback payload format. The cross-product intelligence argument becomes real at 1,000+ audits.

### Category Creation: Product Quality Verification

**The play:** We're not competing in "website audit tools" or "SEO tools" or "testing tools." We're creating a new category: **Product Quality Verification**.

**Category definition:** Independent, external verification that a digital product achieves its intended outcomes for both human and machine users. Distinct from testing (internal, code-level), monitoring (uptime/performance only), and auditing (expensive, human-delivered, annual).

**How to establish the category:**
1. Never describe ourselves using competitor category language ("audit tool," "testing platform")
2. Always use "Product Quality Verification" or "independent quality check" in positioning
3. The methodology paper defines what the category means
4. The "Tested by Alien Eyes" badge creates visible category artifacts
5. Industry benchmark reports position us as the category authority
6. AEO/GEO/MEO content creates search presence for new terms WE define

**Category creation timeline:**
- Month 1-3: Use the phrase consistently. Define it in our methodology paper.
- Month 3-6: Other people start using the phrase when describing us.
- Month 6-12: Competitors start using the phrase to describe themselves (this is winning).
- Month 12+: The category has its own search volume.

### Analyst / Press Strategy

**Month 1-3:** Not relevant. No press is better than a weak press story. Build the product and the user base.

**Month 3-6:** Target micro-influencers and niche publications:
- AI/dev newsletter features (TLDR AI, ByteByteGo, Bytes, Changelog)
- Indie hacker podcasts (Indie Hackers, My First Million, Starter Story)
- AI builder YouTube channels

**Month 6-12:** Target industry analysts and mainstream dev press:
- Submit for Gartner Cool Vendor consideration (if enterprise traction warrants)
- Pitch to The Information, TechCrunch for the "quality verification for AI-built products" angle
- The "agent-nativeness scoring" angle is novel enough for press interest

**Month 12+:** The data becomes the press story:
- "Our data shows 67% of AI-built websites have critical accessibility issues" -- that's a headline
- Annual "State of Product Quality" report generates its own press coverage
- Category benchmark data becomes a cited source for industry analysis

---

## 8. METRICS DASHBOARD

### What to Track from Day 1

**Product metrics:**

| Metric | Base (Month 3) | Target (Month 3) | Base (Month 6) | Target (Month 6) | Target (Month 12) |
|--------|---------------|-----------------|---------------|-----------------|-------------------|
| Audits per week | 20 | 50 | 100 | 250 | 1,000 |
| Re-audit rate (7 days) | 25% | 35% | 30% | 40% | 50% |
| Free-to-paid conversion | 2% | 5% | 3% | 8% | 12% |
| Autonomous fix rate | 50% | 65% | 60% | 70% | 80% |
| FP rate (overall) | <12% | <10% | <8% | <7% | <5% |
| FP rate (CRITICAL) | <3% | <1% | <1% | <0.5% | <0.5% |
| Agent API calls % | 0% | 2% | 5% | 10% | 25% |
| Avg findings per audit | 8-15 | 8-15 | 8-15 | 8-15 | 8-15 |

**Revenue metrics:**

| Metric | Base (Month 3) | Target (Month 3) | Base (Month 6) | Target (Month 6) | Target (Month 12) |
|--------|---------------|-----------------|---------------|-----------------|-------------------|
| MRR | $1K | $3K | $3K | $10K | $30K |
| Paying customers | 15 | 40 | 50 | 150 | 400 |
| ARPU (monthly) | $67 | $75 | $60 | $67 | $75 |
| Net Revenue Retention | N/A | N/A | 105% | 115% | 125% |
| CAC (blended) | $10 | $15 | $15 | $20 | $25 |
| LTV:CAC | 12:1 | 15:1 | 10:1 | 12:1 | 12:1 |

*Revenue projections use base/target scenarios. Plan to base case. Celebrate target. Original $5K MRR by Month 3 required 172 paying customers from zero — adversarial review H3 flagged this as 50x the validated customer base.*

**Growth metrics:**

| Metric | Base (Month 3) | Target (Month 3) | Base (Month 6) | Target (Month 6) | Target (Month 12) |
|--------|---------------|-----------------|---------------|-----------------|-------------------|
| Website visitors/month | 2K | 5K | 8K | 20K | 60K |
| Signups/week | 20 | 50 | 80 | 200 | 400 |
| Viral coefficient | 0.08 | 0.15 | 0.12 | 0.20 | 0.30 |
| Active consultants | 1 | 5 | 5 | 15 | 50 |
| Agent framework partnerships | 0 | 1 | 1 | 2 | 4 |
| Content pieces published | 10 | 15 | 30 | 50 | 120 |

### Leading vs. Lagging Indicators

**Leading (predict future performance):**
- Free audit completion rate (do they finish the first audit?)
- Time-to-value (how long from URL paste to useful findings?)
- "Copy to Builder" click rate (did they use the core value?)
- Re-audit within 7 days (is the loop working?)
- Social shares of audit results (is the viral loop active?)
- Agent API call volume (is agent distribution growing?)

**Lagging (confirm past performance):**
- MRR and revenue growth
- Churn rate
- Net promoter score
- Category benchmark coverage
- Press mentions

### How to Know We Have PMF

**PMF is achieved when all of these are true simultaneously:**

1. **Re-audit rate exceeds 40%.** Builders are coming back to verify fixes. The loop is working.

2. **Free-to-paid conversion exceeds 5%.** The free audit is valuable enough that people pay for more.

3. **Organic growth exceeds 50% of new signups.** Word of mouth is working. We're not buying all our users.

4. **At least one channel produces users at <$20 CAC with positive unit economics.** We have a repeatable acquisition engine.

5. **Users describe the product using our language.** When they say "I Tool Tested it" or "the alien perspective" or "my agent-nativeness score," we've won the narrative.

6. **Pulling the product away would cause pain.** If we shut down, would people actively search for a replacement? If yes: PMF.

**Canary signals that we DON'T have PMF:**
- Re-audit rate below 20% (the loop isn't compelling)
- Free users run one audit and never return (novelty, not value)
- Paid users churn within 60 days (value doesn't sustain)
- Users describe us as "like Lighthouse but..." (positioning failure)
- Agent API usage stays below 5% (agent distribution isn't working)

### When to Scale vs. When to Iterate

**Iterate (fix the product) if:**
- False positive rate exceeds 15%
- Re-audit rate below 30%
- Free-to-paid conversion below 3%
- Users don't click "Copy to Builder" (the core value isn't landing)
- Autonomous fix rate below 50%

**Scale (invest in growth) if:**
- Re-audit rate above 40%
- Free-to-paid conversion above 5%
- At least 3 testimonials reference specific value delivered
- Organic growth trending up month-over-month
- Unit economics are positive at current volume

**The rule:** Never scale what doesn't work. If the product metrics aren't hitting thresholds, invest in product quality, not marketing spend. Marketing cannot fix a product that doesn't deliver value. The loop must converge before we pour fuel on it.

---

## APPENDIX A: LAUNCH WEEK CHECKLIST

### Pre-Launch (Week Before)

- [ ] Product is working: URL paste, audit runs, findings generated, "Copy to Builder" works
- [ ] Landing page live with: hero, demo video, pricing, methodology link, free audit CTA
- [ ] 3 case study blog posts published
- [ ] OG tags and social previews optimized (we test these things -- ours must be perfect)
- [ ] Analytics configured: GA4, conversion tracking on "Start Audit" and "Copy to Builder"
- [ ] Pricing page live with free tier prominently featured
- [ ] Methodology document published (v0.1)
- [ ] Support email configured (or Discord/Slack channel)
- [ ] 10+ alpha tester testimonials collected
- [ ] Loom demo video recorded (60 seconds: paste URL, get results, copy, paste into Claude Code)
- [ ] HN post draft written (methodology-first, technical tone)
- [ ] Product Hunt listing prepared
- [ ] X/Twitter launch thread drafted with screenshots
- [ ] Reddit posts drafted (different angle per subreddit)

### Launch Day

- [ ] HN post submitted (Tuesday, 8am ET)
- [ ] X/Twitter thread posted
- [ ] Product Hunt launched
- [ ] Personal email to 50 alpha testers: "We're live. Share if you found value."
- [ ] Monitor all channels for comments/questions -- respond to EVERYTHING within 1 hour
- [ ] Monitor error rates and performance under load

### Post-Launch (First 48 Hours)

- [ ] Respond to every HN comment
- [ ] Respond to every tweet/mention
- [ ] Run free audits for anyone who asks publicly
- [ ] Document and fix any bugs reported
- [ ] Track: signups, audits completed, conversion, social shares
- [ ] Post "launch day metrics" update on X/Twitter (transparency builds trust)

---

## APPENDIX B: COMPETITOR QUICK-REFERENCE

| Competitor | What They Do | What They Don't Do | Our Edge |
|-----------|-------------|-------------------|----------|
| Lighthouse / PageSpeed | Web performance scoring | Agent testing, UX flows, fix loop, AEO/GEO/MEO | We test outcomes, not metrics |
| Axe / WAVE | Accessibility checking | 70% of a11y issues, agent testing, full audit | We catch what automated a11y misses |
| Screaming Frog | Technical SEO crawling | Agent testing, UX, security, AEO/GEO/MEO | We're holistic, not single-dimension |
| Ahrefs / Semrush | SEO analysis + backlinks | Agent testing, UX, security, code quality | We test whether the product WORKS |
| OWASP ZAP | Security scanning | UX, agent testing, SEO, accessibility | We cover security AS PART OF holistic audit |
| Codacy / CodeRabbit | Code quality analysis | Outside-in testing, agent testing, UX | We test the product, not the code |
| Manual QA agencies | Full human testing | Speed, affordability, agent perspective | We deliver in minutes for $5, not weeks for $15K |
| Vercel / Netlify checks | Deploy previews + basic checks | Comprehensive audit, agent testing | We're independent, not tied to hosting |
| Nobody | Agent-nativeness scoring | -- | First mover. No competitor exists. |
| Nobody | AEO/GEO/MEO scoring | -- | First mover. No competitor exists. |

---

## APPENDIX C: 90-DAY EXECUTION TIMELINE

| Week | Focus | Key Deliverable |
|------|-------|----------------|
| 1-2 | Build MVP | URL-paste audit, Format B output, "Copy to Builder" button |
| 3-4 | Alpha recruitment | 50 alpha testers recruited, first 50 audits run |
| 5-6 | Iterate on output | Refine findings accuracy, reduce false positives |
| 7-8 | Content + case studies | 3 case study blog posts, 5 finding-spotlight posts, methodology v0.1 |
| 9 | Pre-launch seeding | Teaser content on X/Twitter, newsletter outreach, demo video |
| 10 | LAUNCH WEEK | HN, Product Hunt, X/Twitter, Reddit, Indie Hackers |
| 11-12 | Post-launch growth | Respond to feedback, run free public audits, publish metrics |
| 13 | Evaluate PMF signals | Hit targets? Scale or iterate decision |

---

*This plan was written to be executed from, not admired. Every tactic, channel, and number should be tested, validated, and revised as real data replaces assumptions. The product thesis is validated. The loop works. Now we ship.*
