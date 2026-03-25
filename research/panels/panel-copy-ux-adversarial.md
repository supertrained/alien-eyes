# Adversarial Expert Panel: Copy-UX Primitive

> Date: 2026-03-13
> Panel Type: Adversarial UX Research + Conversion Copywriting
> Experts: 5
> Subject: `src/primitives/copy-ux.ts` — Alien Eyes Copy & UX audit primitive
> Live Audit Target: supertrained.ai (homepage, /services, /blueprint)
> Evidence: Playwright accessibility snapshots + full-page screenshot of live site

---

## Panel Roster

| # | Name | Title | Credentials |
|---|------|-------|------------|
| 1 | **Dr. Rina Patel** | Principal UX Researcher, ex-Google Search Quality | PhD HCI (Carnegie Mellon), 14 years. Led heuristic evaluation frameworks for Google's SERP quality team. Published on automated usability assessment. Nielsen Norman Group certified. |
| 2 | **Marcus Cole** | Head of Conversion, Copyhackers alumni | 11 years direct-response copywriting. Built conversion audit frameworks for Shopify Plus merchants. Joanna Wiebe mentee. Ran 400+ A/B tests on SaaS landing pages. CXL certified optimizer. |
| 3 | **Dr. Sarah Lindqvist** | UX Psychologist, Baymard Institute contributor | PhD Cognitive Psychology (Lund). 8 years quantitative UX. Contributed to Baymard's e-commerce UX benchmark (76,000+ hours of research). Specializes in cognitive load measurement and form design. |
| 4 | **James Okafor** | Senior Design Systems Lead, ex-Stripe | 10 years product design. Built Stripe's internal accessibility + copy quality linting system. Shipped automated UX regression testing at scale. Former FullStory power user (1,200+ session reviews). |
| 5 | **Elena Voss** | CRO Director, Unbounce | 9 years conversion rate optimization. Managed $40M+ in ad spend landing page optimization. Built programmatic landing page scoring systems. Expert in Cialdini's persuasion framework applied to digital products. |

---

## Expert 1: Dr. Rina Patel — Principal UX Researcher

### 1. Reaction to Keyword-Matching for CTA and Trust Detection

This approach is fundamentally flawed, and I want to be precise about why.

**The CTA check is measuring presence of words, not presence of calls to action.** A page that contains the sentence "Get in touch with our legal department regarding your privacy complaint" would pass this check (matches "get", "contact", "privacy") despite having zero conversion intent. Meanwhile, a brilliantly designed page with "Automate your hiring pipeline now" as its primary CTA would PASS because of "now"... wait, no, it wouldn't. "Now" isn't in the pattern list. Neither is "automate," "hire," "schedule," "learn," "explore," "discover," "download," "claim," "reserve," "join," "subscribe," "upgrade," "compare," "calculate," or "see."

The pattern list is arbitrary and incomplete. More critically, it treats all pages the same. A blog post doesn't need a hard CTA. A pricing page absolutely does. A 404 page needs a recovery CTA. The primitive has no concept of **page role**.

**The trust check is worse.** The word "security" appearing anywhere in body text is not a trust signal. A trust signal is a specific persuasion mechanism: a named customer with a logo, a review with a star rating and attribution, a certification badge with a verifiable link. The current check conflates topic mention with persuasion architecture.

**What supertrained.ai reveals:** The site passes both checks because words like "get," "book," "try," "contact," "customer," "review," "security," and "privacy" appear in the body text. The primitive concludes: no findings. But the site has real UX issues that a human evaluator would catch in 30 seconds. The primitive is giving a false-clean result.

**The right method:** Structural analysis, not keyword matching. CTAs are `<a>` and `<button>` elements in prominent positions (hero, section endings, sticky nav). Trust signals are visually distinct components (blockquotes with attribution, logo grids, badge images, star ratings). These have DOM signatures, not keyword signatures.

### 2. Top 5 UX/Copy Checks to Add

**Check 1: Value Proposition Clarity Score (deterministic + LLM)**

What it measures: Can a first-time visitor understand what this product/service is AND who it's for within the first viewport?

Implementation:
- Extract the `<h1>` text and the first `<p>` within the same parent container
- Deterministic pre-filter: if `<h1>` is missing or empty, CRITICAL finding immediately
- Deterministic: measure character count of h1 (should be under 80 chars) and first paragraph (under 200 chars)
- Check if the h1 contains a **subject** (who benefits) and a **verb** (what happens). "We build the AI your team actually needs" has both — passes structural check.
- LLM check (Sonnet): "Given this h1 and first paragraph, can you identify: (a) what the product/service is, (b) who it's for, (c) what differentiating claim is made? Answer with the extracted values or 'unclear' for each."
- If any of (a), (b), (c) returns 'unclear', generate a finding.
- Severity: HIGH (methodology rubric says so)
- Confidence: 0.75 (LLM judgment)

**Check 2: CTA-to-Page-Role Alignment (deterministic)**

What it measures: Does each page have a CTA appropriate to its role in the conversion funnel?

Implementation:
- Classify page role from URL patterns and heading content:
  - Homepage: `/` or `/home` → must have primary CTA (link or button with action verb + destination)
  - Services/Pricing: `/services`, `/pricing`, `/plans` → must have purchase/contact CTA
  - Blog/Content: `/blog/*`, `/insights/*` → may have soft CTA (newsletter, related content) — no finding if absent
  - Legal: `/privacy`, `/terms`, `/cookies` → exempt from CTA requirement
  - Contact: `/contact` → must have a form or booking widget
  - Case study: `/work/*`, `/case-study/*` → must have "next step" CTA
- For pages requiring CTAs: scan `links` array for `<a>` elements whose `text` contains action verbs. Also scan for `<button>` elements (need to add button extraction to PageSummary).
- Check: Is at least one CTA link/button present in the first 3 headings worth of content (above fold proxy)?
- Severity: MEDIUM for missing CTA on a page that needs one
- Confidence: 0.85 (page role classification is heuristic)

**Check 3: Heading Hierarchy as Information Architecture (deterministic)**

What it measures: Do headings tell a coherent story when read in sequence? Are they scannable? Does the hierarchy make logical sense?

Implementation:
- Already have `headings: Heading[]` in PageSummary
- Deterministic checks:
  - Multiple H1s: finding (severity: MEDIUM, but this overlaps SEO — deduplicate)
  - H1 missing: finding (MEDIUM)
  - Heading level skips (H1 → H3, no H2): finding (LOW) — indicates broken visual hierarchy
  - Heading word count: if any heading > 15 words, it's not scannable (LOW)
  - Sequential duplicate headings: same text repeated (e.g., two "Learn More" H3s) — finding (LOW)
- LLM check: "Read these headings in order. Do they tell a coherent story about what this page offers? Rate coherence 1-5 and explain gaps." If rating < 3, MEDIUM finding.
- Severity: varies (see above)
- Confidence: 0.8 deterministic, 0.7 LLM

**Check 4: Navigation Depth and Orphan Detection (deterministic)**

What it measures: Can users reach all important pages within 3 clicks from the homepage? Are there pages that aren't linked from the main navigation?

Implementation:
- Requires cross-page analysis (use `CrawlResult`, not just individual `PageSummary`)
- Build a link graph from all crawled pages
- For each page, calculate minimum click depth from homepage
- Pages at depth > 3 that are NOT blog posts: finding (MEDIUM) — important pages are buried
- Pages that appear in the crawl but are linked from zero other crawled pages (orphans): finding (MEDIUM)
- Pages linked only from the footer but not the main nav or body content: informational (LOW) — these are technically reachable but likely undervisited
- Severity: MEDIUM for deep important pages, LOW for footer-only pages
- Confidence: 0.9 (fully deterministic from link graph)

**Check 5: Conversion Funnel Continuity (deterministic + LLM)**

What it measures: Does the primary conversion path (homepage → service page → contact/signup) flow without friction or dead ends?

Implementation:
- Identify the primary CTA on homepage (the most prominent link — first `<a>` with action verb in hero section)
- Follow the CTA destination. Check that destination page:
  - Loads successfully (statusCode 200)
  - Has its own CTA (the chain continues)
  - Does not redirect to an unexpected domain
  - Contains content relevant to the CTA text (LLM: "Does this page deliver on the promise of the link text '{cta_text}'?")
- Repeat for up to 3 hops (homepage → intermediate → terminal)
- If any hop breaks (404, redirect loop, dead end, content mismatch): finding
- Severity: HIGH for broken primary funnel, MEDIUM for broken secondary funnel
- Confidence: 0.85

### 3. Professional Tools/Frameworks to Encode

| Tool/Framework | What to Steal | Implementation Priority |
|---------------|--------------|----------------------|
| **Nielsen's 10 Usability Heuristics** | Encode #1 (Visibility of System Status), #2 (Match Between System and Real World), #3 (User Control), #6 (Recognition Over Recall), #8 (Aesthetic Minimalist Design) as check categories | HIGH — these are the industry standard |
| **Baymard Institute Benchmarks** | Their 650+ UX guidelines have specific, testable patterns. E.g., "product pages must have breadcrumbs," "forms must have inline validation" — encode the ones detectable from external crawl | MEDIUM — selective adoption |
| **Hotjar/FullStory Heuristics** | Rage click patterns (many clicks on non-interactive elements), U-turn patterns (user goes to page, immediately returns) — we can't measure real user behavior, but we CAN detect the conditions that cause it: non-clickable elements styled as buttons, misleading link text | HIGH |
| **Jobs-to-be-Done Framework** | Every page should map to a visitor job. "I want to understand what this company does" (homepage), "I want to see proof it works" (case studies), "I want to know cost" (pricing). Check that pages fulfill their job. | MEDIUM — requires page-role classification first |
| **Krug's "Don't Make Me Think"** | The core principle: every page should be self-evident. Operationalize: if the h1 + first paragraph don't explain the page's purpose, the page is making people think. | HIGH — simple to check |

### 4. Heuristics/Frameworks to Encode

**Nielsen's 10 — what's detectable externally:**

| Heuristic | Externally Detectable? | How |
|-----------|----------------------|-----|
| H1: Visibility of system status | Partially — loading states need JS interaction testing | Check for progress indicators in form flows |
| H2: Match between system and real world | Yes — link text should describe destination, not "click here" | Scan link text array for generic patterns |
| H3: User control and freedom | Partially — check for back button support, exit paths | Check all pages have navigation back to home |
| H4: Consistency and standards | Yes — same nav on all pages, same CTA styling | Compare nav structure across pages |
| H5: Error prevention | Partially — check for confirmation on destructive actions | Limited from external crawl |
| H6: Recognition rather than recall | Yes — visible navigation, breadcrumbs, labels | Check for breadcrumbs, consistent labels |
| H7: Flexibility and efficiency | Minimal — requires interaction testing | Out of V1 scope |
| H8: Aesthetic and minimalist design | Partially — content density, heading count, text length | Word count per section, heading-to-content ratio |
| H9: Help users recognize errors | Partially — check error page quality (404, 500) | Crawl known-bad URLs, evaluate error pages |
| H10: Help and documentation | Yes — check for FAQ, help links, tooltips | Scan for /faq, /help, /docs links |

**Cialdini's 6 Principles — what's detectable:**

| Principle | Detection Method |
|-----------|-----------------|
| Reciprocity | Free resource offered before asking for commitment (check for "free" + download/tool) |
| Commitment/Consistency | Small ask before big ask (blueprint before booking) — check funnel progression |
| Social Proof | Named testimonials with attribution, client logos, review counts — DOM structure, not keywords |
| Authority | Credentials, certifications, "years of experience," media mentions — structural patterns |
| Liking | Founder photos, team page, brand personality — check for /about with images |
| Scarcity | "Limited spots," "Only X remaining" — keyword + context analysis |

### 5. Live Audit of supertrained.ai

**Finding 1 (MEDIUM): Homepage hero section has competing CTAs with unclear hierarchy.**

The hero has "Get Your Free Automation Blueprint" (primary, coral button) and "See How We Work" (secondary, text link). Good so far. But scrolling to the "Drudgery Tax" section, there's a third CTA "Try it free" that goes to the same /blueprint destination. Then the bottom of the page has "Book a Conversation" AND "Or get a free Automation Blueprint first." The visitor is being asked to make two different decisions (blueprint vs. conversation) repeatedly without clear guidance on which to choose based on their situation. A first-time visitor doesn't know if they're a "blueprint person" or a "conversation person."

Detection method: Count distinct CTA destinations on homepage. If > 2 primary CTA destinations with similar visual weight, flag for review.

**Finding 2 (MEDIUM): The "Selected Work" section renders as mostly white space on initial page load.**

From the full-page screenshot, the case study cards section (CloneICP, SnowThere) appears to have enormous white gaps where content should be. This might be lazy-loading or animation-dependent content that doesn't render for a static crawl. If a first-time visitor sees this blank space, it's a significant trust gap — the "proof" section is invisible.

Detection method: Compare visible text content length to expected content length based on heading count. If a section has headings but minimal text between them, flag potential rendering issue.

**Finding 3 (LOW): Testimonial quote lacks specific attribution details.**

The quote "When a company's first instinct is 'replace my team with AI,' we walk away..." is attributed to "Tom Meredith & Josh Hill, Co-Founders." This is self-attribution — the founders are quoting themselves. This is a brand positioning statement, not a trust signal. There are zero EXTERNAL testimonials (named clients, client logos, third-party reviews) on the homepage.

Detection method: Identify `<blockquote>` elements. Check attribution text for patterns indicating self-quotation (same names as those in the site's about/team section). Flag pages where the only "testimonials" are self-quotes.

**Finding 4 (LOW): Services page has identical CTA ("Book a Conversation") repeated 4 times with no differentiation.**

Each service card on /services ends with "Book a Conversation" pointing to /contact. There's no indication of which service the visitor is interested in — the contact form presumably asks them to re-state their interest. This loses the context established by reading a specific service card.

Detection method: On pages with repeated CTAs to the same destination, check if any URL parameters differentiate the referral source. E.g., `/contact?service=workflow-automation` would pass; bare `/contact` repeated 4 times would flag.

**Finding 5 (LOW): Blueprint page has a disabled submit button with no explanation.**

The "Go" button on /blueprint is `[disabled]` with no visible explanation of why or what the user needs to do to enable it. The placeholder text "I wish I didn't have to..." hints at the input, but a user who doesn't type might be confused about why the button is grayed out.

Detection method: Detect `<button disabled>` elements. Check if there is adjacent helper text or an `aria-describedby` explaining the disabled state.

### 6. Rating: 3/10

The primitive barely qualifies as a UX check. It's a keyword presence scanner with a 2-finding LLM supplement. The methodology rubric specifies 7 checks; 3 of those 7 aren't implemented at all (error states, navigation consistency, mobile UX). The 4 implemented checks use the wrong detection method (keyword matching vs. structural analysis), which produces false-clean results on a site that has real UX issues. The LLM supplement is too constrained (2 findings max) and too vague in its prompt ("Find at most two copy or UX clarity issues") to compensate.

---

## Expert 2: Marcus Cole — Head of Conversion

### 1. Reaction to Keyword-Matching for CTA and Trust Detection

I've reviewed over 400 landing pages for conversion optimization, and I can tell you with certainty: **the presence of a CTA keyword has zero correlation with conversion rate.** What matters is:

1. **Position** — Is the CTA above the fold? Is it after the value prop, not before?
2. **Clarity** — Does the button text tell you what happens when you click? ("Get Your Free Blueprint" is clear; "Submit" is not; "Get Started" is ambiguous)
3. **Singular focus** — Is there ONE primary action per viewport, or are you splitting attention?
4. **Motivation sequence** — Has the page built enough desire before asking for the commitment?

The keyword list also reveals a B2B/SaaS bias. "Start," "book," "demo," "sign up" — these are SaaS patterns. An e-commerce site's CTAs are "Add to Cart," "Buy Now," "Shop." A media site's CTAs are "Read," "Watch," "Listen," "Subscribe." A nonprofit's CTAs are "Donate," "Volunteer," "Give." The pattern list would miss all of these.

For trust: the word "customer" appearing in body copy (e.g., "customer support") is not a trust signal. A trust signal is **specific, verifiable social proof** — "Trusted by 500+ companies including Stripe, Shopify, and Notion" or "4.8 stars from 1,200 reviews on G2." The distinction is between mentioning trust concepts and deploying trust mechanisms.

The primitive is checking for ingredients without checking if anyone cooked a meal.

### 2. Top 5 UX/Copy Checks to Add

**Check 1: Above-Fold Content Completeness (deterministic)**

What it measures: Does the first viewport contain the essential conversion elements?

Implementation:
- Approximate "above fold" as content within the first ~800px of vertical space. Since we have sanitizedTextContent, use a heuristic: content appearing before the second H2 heading is roughly above-fold.
- Required elements in above-fold zone:
  - H1 present: YES/NO
  - Value proposition statement (first paragraph after H1): present and under 30 words
  - Primary CTA (first link with action verb): present
  - Supporting proof or credibility marker (number, testimonial fragment, client name): present
- Score: count of 4 requirements met. If < 3, MEDIUM finding. If < 2, HIGH.
- Severity: HIGH (missing above-fold elements = immediate bounce)
- Confidence: 0.8

**Check 2: Button/Link Text Quality Audit (deterministic)**

What it measures: Does every clickable element tell the user what will happen?

Implementation:
- Already have `links: Link[]` with `text` and `href`
- Flag patterns:
  - Generic link text: "Click here," "Learn more," "Read more," "More," "Here" (with no surrounding context in the link itself) → LOW finding
  - Misleading text: link text that doesn't match destination content (requires LLM: "Does '{link_text}' accurately describe what you'd find at '{destination_page_title}'?")
  - "Submit" as form button text: MEDIUM finding (should describe the outcome: "Get My Blueprint," "Send Message")
  - Empty link text (link wrapping only an image with no alt): MEDIUM finding (overlaps a11y, but it's also a UX problem)
- Need to add: extract button elements and their text to PageSummary (currently only links are extracted)
- Severity: MEDIUM for misleading, LOW for generic
- Confidence: 0.9 for generic text detection, 0.7 for misleading (LLM)

**Check 3: Social Proof Structural Analysis (deterministic)**

What it measures: Are trust signals real social proof (specific, attributed, verifiable) or just trust-flavored words?

Implementation:
- Scan DOM for social proof patterns (structural, not keyword):
  - `<blockquote>` elements with attribution (the quote pattern)
  - Image grids that look like logo bars (multiple small images in a row, commonly client logos)
  - Star rating patterns (text matching "X/5", "X stars", "X out of 5", or `<span>` with star characters)
  - Numeric proof ("500+ customers", "10,000 users", number + "companies/teams/customers")
  - Named external entities in proof context (company names near "trusted by" or "used by")
  - Review platform badges (G2, Capterra, Trustpilot logos — check image src/alt)
- Score by specificity:
  - Level 0: No social proof at all → MEDIUM finding on homepage/services pages
  - Level 1: Generic claim ("trusted by companies worldwide") → LOW finding
  - Level 2: Specific numbers ("500+ companies") → passes
  - Level 3: Named entities + numbers ("Used by Stripe, Notion, and 300 others") → excellent
- Apply only to "decision pages" (homepage, services, pricing, case study) — blog posts exempt
- Severity: MEDIUM for Level 0 on decision pages, LOW for Level 1
- Confidence: 0.85

**Check 4: Pricing Transparency Check (deterministic)**

What it measures: Can a visitor understand what things cost without having to "Book a Call"?

Implementation:
- Check if the site has a dedicated pricing page (/pricing, /plans, /packages) — scan links array across all pages
- If services page exists: check for price indicators (dollar signs, "starting at," "per month," numeric values near "price" or "cost")
- If prices are present: check that each service/product listing includes a price range
- If NO price information anywhere on the site: MEDIUM finding ("Visitors who need to understand cost before engaging will bounce — 70% of B2B buyers want pricing before talking to sales, per Demand Gen Report 2024")
- If prices exist but require clicking through to find: LOW finding
- Severity: MEDIUM for completely hidden pricing, LOW for hard-to-find pricing
- Confidence: 0.85

**Check 5: Objection Handling Completeness (deterministic + LLM)**

What it measures: Does the page anticipate and address common visitor objections?

Implementation:
- Check for FAQ section: scan headings for "FAQ," "Questions," "Common questions"
- Check for comparison/alternative pages: scan links for "/compare," "/vs," "/alternative"
- Check for guarantee/risk-reversal language: "money-back," "guarantee," "no commitment," "cancel anytime," "free trial," "no credit card"
- LLM supplement: "Based on this page's product/service description, what are the top 3 likely visitor objections? Does the page content address any of them?"
- If the page has:
  - FAQ: +1
  - Comparison pages: +1
  - Risk-reversal language: +1
  - LLM identifies unaddressed major objection: -1
- Score < 1 on a services/pricing page: MEDIUM finding
- Severity: MEDIUM
- Confidence: 0.75 (objection identification is subjective)

### 3. Professional Tools/Frameworks

| Tool/Framework | What to Steal | Priority |
|---------------|--------------|----------|
| **Copyhackers' Conversion Copywriting Framework** | Message hierarchy: Problem → Agitation → Solution → Proof → CTA. Check that pages follow a motivation sequence before the CTA, not CTA-first | HIGH |
| **Wynter (message testing)** | Their scoring rubric: Clarity, Relevance, Differentiation, Credibility on a 1-5 scale. Encode as LLM evaluation dimensions. | MEDIUM |
| **Unbounce Conversion Benchmark Report** | Industry-specific conversion benchmarks. Use to contextualize: "Your page has X CTAs, Y trust signals. For SaaS, the median is..." | LOW — requires industry classification |
| **CXL's ResearchXL Framework** | Systematic prioritization: Heuristic analysis → Technical analysis → Digital analytics → Mouse tracking → Qualitative research. Alien Eyes does layers 1-2 well; encode the heuristic scoring rubric specifically | HIGH |
| **Flint McGlaughlin's MECLABS** | The Conversion Sequence: C = 4m + 3v + 2(i-f) - 2a. Motivation (m), Value prop clarity (v), Incentive (i), Friction (f), Anxiety (a). Each is measurable from page content. | HIGH |

### 4. Frameworks to Encode

**MECLABS Conversion Sequence** is the most implementable:

| Factor | Detection Method |
|--------|-----------------|
| **Motivation (m)** | Does the page address a pain point before presenting the solution? Check: first section of content mentions a problem/challenge/pain BEFORE mentioning the product. If solution-first, lower motivation score. |
| **Value Prop (v)** | Value prop clarity already covered in Check 1 above. |
| **Incentive (i)** | Is there a specific offer? Free trial, discount, free resource. Detect keywords + structural patterns (form + downloadable offer). |
| **Friction (f)** | Count form fields (fewer = less friction). Count required steps to primary CTA. Count mandatory account creation before value delivery. |
| **Anxiety (a)** | Missing trust signals (covered in Check 3). Also: missing SSL warning, no privacy policy link near forms, no "cancel anytime" near commitment CTAs. |

**PAS/AIDA frameworks:**

For each page, check whether the content follows a persuasion sequence:
- **Problem** → **Agitation** → **Solution** (PAS): LLM check — "Does this page describe a problem, intensify it, then present a solution? Or does it jump straight to features?"
- **Attention** → **Interest** → **Desire** → **Action** (AIDA): Check heading progression — H1 should grab attention, H2s should build interest/desire, final section should drive action.

### 5. Live Audit of supertrained.ai

**Finding 1 (HIGH): Competing conversion paths create decision paralysis.**

Homepage has TWO distinct conversion funnels running in parallel:
- Funnel A: "Get Your Free Automation Blueprint" → /blueprint (low-commitment, self-serve)
- Funnel B: "Book a Conversation" → /contact (high-commitment, human contact)

Both are presented with near-equal visual weight throughout the page. The bottom CTA section literally says "Book a Conversation" with "Or get a free Automation Blueprint first" as a secondary — making the blueprint seem inferior ("first" implies it's preliminary).

The copy never helps the visitor decide which path is right for them. A conversion-optimized page would segment: "Know your challenge? Get your blueprint in 60 seconds. Prefer to talk it through? Book a 15-minute conversation." Instead, both options float side by side with no decision framework.

Detection method: Identify all CTA destinations on a page. If > 1 primary CTA destination appears in the hero section, check if there is qualifying/segmenting text that helps the visitor choose between them. If not, flag as competing CTAs.

**Finding 2 (MEDIUM): Services page buries pricing inside service cards with no comparison view.**

The services page lists 5 offerings with prices ($10K, $25-50K, $3-5K/mo, $10-20K/mo, $8-12K) scattered across individual cards. There's no comparison table, no "which is right for you" guide, and no way to scan pricing quickly. A visitor evaluating budget fit has to read all 5 cards to understand the pricing landscape.

The "How pricing works" section at the bottom says "Milestone billing" and "Monthly retainer" but doesn't reference the actual prices listed above. It feels disconnected.

Detection method: If a page contains 3+ price mentions, check for a comparison/summary element (table, grid with aligned price columns). If prices are only in individual card sections with no aggregation, flag for review.

**Finding 3 (MEDIUM): The blueprint input field has no example of what "good input" looks like.**

The /blueprint page has a text input with placeholder "I wish I didn't have to..." and a suggestion below: 'Try: "Summarize 50 resumes a week" or "Brief the CEO every morning"'. But the input pattern ("I wish I didn't have to...") and the examples ("Summarize 50 resumes a week") use different sentence structures. The examples don't complete the prompt stem. A user might type "I wish I didn't have to summarize 50 resumes a week" (overly long) or just "resumes" (too vague).

Detection method: For form fields with placeholder/prompt text + separate example text, check if examples are syntactically consistent with the prompt format. LLM check: "Does the example text naturally complete the prompt stem?"

**Finding 4 (LOW): "Founded 2024. 15+ agents deployed. 3,000+ hours reclaimed." lacks context.**

These stats on the homepage sit below a self-attributed quote. "15+ agents deployed" — for how many clients? "3,000+ hours reclaimed" — over what timeframe? For whom? These numbers feel small for a company charging $10-50K per project. Without context, they might undermine rather than reinforce credibility.

Detection method: Detect numeric proof statements. Check if they include context qualifiers (timeframe, comparison, attribution). Standalone numbers without context on a credibility section: informational flag.

**Finding 5 (LOW): Footer has 17 navigation links — navigation overload.**

The footer's "Navigate" section has 10 links and "Legal" has 6 links, plus social links. This is fine for a footer, but some of these pages (MEO Framework, Marketing Systems, Principles) aren't in the main header nav — they're footer-only discoverable. If they're important enough to link, they might be important enough to be in the main nav. If they're not important, they're adding noise.

Detection method: Compare main nav link set vs. footer nav link set. Links that appear ONLY in footer but have "important" URL patterns (not legal/policy pages) may indicate information architecture issues.

### 6. Rating: 2/10

The primitive would be useless for an actual conversion audit. It can detect the absence of CTA keywords (wrong signal) and the absence of trust keywords (wrong signal). It cannot detect CTA quality, CTA positioning, persuasion sequence, social proof specificity, pricing transparency, objection handling, or funnel continuity. The 2-finding LLM supplement is a band-aid — you're asking one vague question and hoping the LLM catches what the deterministic checks miss. That's not a methodology; it's a prayer.

---

## Expert 3: Dr. Sarah Lindqvist — UX Psychologist

### 1. Reaction to Keyword-Matching for CTA and Trust Detection

From a cognitive psychology perspective, the keyword-matching approach makes an error that's well-documented in the literature: **it confuses semantic content with functional affordance.**

A CTA is not a word. A CTA is a **perceived affordance** — a visual element that a user perceives as clickable and understands will advance them toward their goal. The research on affordance perception (Gibson 1979, Norman 1988, updated by Kaptelinin & Nardi 2012) is clear: affordance is a relationship between the user and the interface element, not a property of the text.

The current approach is analogous to checking whether a door has the word "push" printed on it, rather than checking whether it has a push plate. Many doors with push plates have no label at all — the hardware IS the signal. Similarly, many effective CTAs rely on visual design (contrasting color, size, whitespace isolation) rather than specific vocabulary.

For trust signals, the psychological literature on credibility assessment (Fogg 2003, Stanford Persuasive Technology Lab) identifies four types of web credibility:
1. **Presumed credibility** — based on general assumptions (e.g., ".gov is trustworthy")
2. **Surface credibility** — based on first impression (professional design, no errors)
3. **Earned credibility** — based on experience over time (site works, delivers promises)
4. **Reputed credibility** — based on third-party endorsement (reviews, referrals, certifications)

The keyword check can only detect fragments of type 4 (reputed credibility), and it does so badly. Types 1-3 are invisible to keyword matching but highly influential on user behavior.

### 2. Top 5 UX/Copy Checks to Add

**Check 1: Cognitive Load Assessment (deterministic)**

What it measures: Is the page overwhelming the visitor's working memory?

Implementation:
- Miller's Law: humans can hold 7 ± 2 chunks in working memory. A page with too many competing elements creates cognitive overload.
- Measurable proxies:
  - **Navigation item count**: main nav > 7 items → LOW finding (cognitive overload on primary navigation)
  - **CTA count per page**: > 3 distinct CTA destinations per page → MEDIUM finding
  - **Heading count**: > 12 H2/H3 headings on a single page suggests the page is trying to do too much → LOW finding
  - **Word count**: if sanitizedTextContent > 3,000 words on a non-blog page → LOW finding (pages should be scannable)
  - **Link density**: links.length / word_count ratio. If > 0.05 (1 link per 20 words), the page is over-linked → LOW finding
- These are all deterministic and cheap to compute from existing PageSummary data.
- Severity: MEDIUM for navigation overload, LOW for others
- Confidence: 0.8 (thresholds are research-backed but context-dependent)

**Check 2: Hick's Law Decision Complexity (deterministic)**

What it measures: Are users forced to choose between too many options at once?

Implementation:
- Hick's Law: decision time increases logarithmically with the number of choices.
- Detect "choice moments" on a page:
  - Navigation menus: count items
  - Service/product grids: count cards/items in a single section
  - Form select elements: count options (would require form element extraction in PageSummary)
  - CTA groups: count buttons/links clustered in same section
- Thresholds (from Baymard Institute research):
  - Main nav: > 8 items → flag
  - Product/service grid without filtering: > 6 items → flag
  - CTA cluster: > 3 options with no visual hierarchy → flag
- Severity: LOW to MEDIUM depending on where the choice overload occurs
- Confidence: 0.85

**Check 3: Reading Flow Disruption (deterministic)**

What it measures: Does the page content follow a logical reading flow without abrupt topic changes?

Implementation:
- Extract heading sequence from PageSummary
- Check for topic coherence in heading progression:
  - Map each heading to a rough topic (using simple keyword clustering or LLM)
  - Flag headings that introduce an unrelated topic without transition (e.g., going from "Our Services" to "Company History" back to "Service Details")
- Check for content rhythm:
  - If two consecutive sections have vastly different lengths (one is 20 words, next is 500 words), the rhythm is disrupted → LOW finding
  - If a section has a heading but < 20 words of content → MEDIUM finding (suggests incomplete or placeholder content)
- Severity: LOW for rhythm disruption, MEDIUM for apparent placeholder content
- Confidence: 0.7 (requires judgment)

**Check 4: Form Friction Analysis (deterministic)**

What it measures: How much effort does the primary conversion form require?

Implementation:
- Need to add form extraction to PageSummary (currently not captured):
  - Form fields: count, types (text, email, phone, textarea, select, checkbox)
  - Required fields: count
  - Labels: present/absent for each field
  - Error states: does the form show inline validation or only post-submit errors?
  - Autocomplete attributes: present/absent
- Baymard Institute benchmark: every additional form field reduces conversion by ~7% (their 2024 study)
- Thresholds:
  - > 5 required fields on a lead gen form: MEDIUM finding
  - > 3 required fields on a "quick" tool (like the blueprint): MEDIUM finding
  - Fields without visible labels (placeholder-only): LOW finding (placeholder disappears on focus)
  - Missing autocomplete attributes on name/email/phone fields: LOW finding
- Currently the blueprint has 1 field (good), but we can't detect this from PageSummary because form elements aren't extracted
- Severity: MEDIUM for excessive fields, LOW for missing labels/autocomplete
- Confidence: 0.9 (field count is objective)

**Check 5: Error State and Empty State Quality (requires interaction testing)**

What it measures: When things go wrong (404, empty search results, form errors, empty states), does the page help the user recover?

Implementation:
- **404 page quality**: navigate to a known-bad URL (e.g., /this-page-does-not-exist). Check:
  - Does it return a custom 404 (not browser default)?
  - Does it offer navigation back to homepage?
  - Does it suggest alternatives or have a search function?
  - If generic browser 404: MEDIUM finding
  - If custom but no navigation: LOW finding
- **Form error messaging**: submit the primary form with empty/invalid data (requires Playwright interaction):
  - Does it show inline errors next to the offending field?
  - Are error messages specific ("Please enter a valid email") vs generic ("Error")?
  - This is harder to implement but extremely high-value
- **Empty states**: if the site has search or filtering, test with a query that returns no results. Does it show a helpful empty state or just... nothing?
- Note: This requires active interaction testing (clicking, submitting), not just passive crawling. This is a capability gap in the current architecture.
- Severity: MEDIUM for bad 404, HIGH for form errors that lose user data
- Confidence: 0.9

### 3. Professional Tools/Frameworks

| Tool/Framework | What to Steal | Priority |
|---------------|--------------|----------|
| **Baymard Institute UX Benchmarks** | 650+ guidelines with severity ratings. Their "Page Design" and "Homepage & Category" benchmarks are directly encodable. Free desktop benchmark available. | HIGH |
| **System Usability Scale (SUS) — adapted** | SUS is a 10-question survey. Adapt the concepts into observable properties: learnability (can you figure out what to do?), efficiency (is the path short?), memorability (is the nav consistent?), errors (are error states handled?), satisfaction (is the design clean?) | MEDIUM |
| **Fogg Behavior Model** | B = MAP — Behavior happens when Motivation + Ability + Prompt converge. Check: does each page have all three? Motivation (problem/benefit stated), Ability (low friction path), Prompt (clear CTA) | HIGH |
| **Don Norman's Emotional Design** | Three levels: visceral (first impression), behavioral (usability), reflective (meaning). The primitive currently checks zero of these. Visceral could be approximated by checking for hero images, professional typography (font loading), color consistency. | LOW — hard to automate |
| **Kano Model** | Classify features as Must-be, One-dimensional, Attractive, Indifferent, Reverse. The must-be features (nav works, CTA exists, form submits) should be deterministic checks. The attractive features (animations, personality) are out of scope. | MEDIUM |

### 4. Frameworks to Encode

**Fogg Behavior Model (B = MAP)** is the most practical framework for this primitive:

For each "decision page" (homepage, services, pricing, contact):

| Component | What to Check | Detection |
|-----------|--------------|-----------|
| **Motivation** | Does the page address a pain point or desire? | Check: first section contains problem/pain language before solution language (LLM classification) |
| **Ability** | Is the next step easy? | Check: primary CTA is within 2 scroll-depths of the hero, form has < 5 fields, no account creation required |
| **Prompt** | Is there a clear trigger? | Check: CTA is visually prominent (link with action verb exists in first 3 headings), not buried in body text |

If any component is missing on a decision page, generate a finding:
- Missing Motivation: MEDIUM ("Page presents solution without establishing the problem")
- Missing Ability: MEDIUM ("Primary action requires too many steps")
- Missing Prompt: HIGH ("No clear call to action on a conversion-critical page")

**Gestalt Principles** (limited but useful):

| Principle | Detectable Proxy |
|-----------|-----------------|
| Proximity | Check if related content (e.g., price + service description) are in the same semantic section (same parent heading) |
| Similarity | Check if all CTAs use consistent link text patterns (not one "Book" and one "Get" and one "Try") |
| Continuity | Check heading hierarchy flows without skips |
| Closure | Check sections have clear endings (CTA or transition to next section) |

### 5. Live Audit of supertrained.ai

**Finding 1 (MEDIUM): Cognitive load spike in the "Selected Work" section.**

The CloneICP case study card packs: a category label ("Sales Intelligence"), a brand name with logo, two paragraphs (problem + fix), a testimonial quote, two metric cards, a screenshot image, a "What the user sees" callout with embedded UI mockup, a search result simulation, match scores, AND a "Visit live product" link. That's approximately 11 distinct information units in a single card. The SnowThere card is similarly dense, adding an "Agent Panel Vote" simulation with three agent profiles.

This exceeds working memory capacity (7 ± 2 items). A visitor scanning the page will likely skip these entirely due to information density, which defeats the purpose of a "proof" section.

Detection method: For each major content section (between H2 headings), count the number of distinct content types (text paragraphs, images, blockquotes, metric displays, embedded UI elements, links). If > 8 content types in a single section, flag cognitive load risk.

**Finding 2 (MEDIUM): The "Drudgery Tax" statistics section has animated counters that start at 0.**

The accessibility snapshot shows "0 hrs/week", "$0K+/yr", "0%" for the three statistics. This means the counters start at zero and animate up — but they're all zero in the initial render. For users with reduced motion preferences, users on slow connections where JS loads late, or users with screen readers, these stats are literally zero. The actual values ("20 hrs/week", "$50K+/yr", "70%") are in aria attributes but the visual presentation starts empty.

Detection method: Compare visual text content (sanitizedTextContent) against aria-label or alt text for numeric elements. If visible numbers are 0 but aria/alt shows non-zero values, flag as animation-dependent content with accessibility implications.

**Finding 3 (LOW): Methodology section uses numbered steps (01-04) but no progress indication.**

The Discover → Design → Build → Evolve flow is laid out as 4 equal-weight cards. There's no visual indication that these are sequential (an arrow, a progress bar, a timeline connector). The numbering (01, 02, 03, 04) helps, but without visual flow indicators, the section reads as "here are 4 things we do" rather than "here is our process from start to finish."

Detection method: Detect numbered sequential content (sections labeled 01, 02, 03 or Step 1, Step 2, Step 3). Check if the parent container has structural elements suggesting sequence (list elements, progress indicators). Numbered sections inside a flat grid layout (no list markup) → informational flag.

**Finding 4 (LOW): "See the proof" link in methodology section is a weak CTA.**

After three paragraphs about ROI and workflows, the CTA is "See the proof →" linking to /work. "Proof" is abstract. "See the proof" doesn't tell me WHAT proof — client results? Case studies? Live products? Compare with the more specific "Get Your Free Automation Blueprint" (tells me exactly what I'll get). Vague CTAs reduce click-through because they increase cognitive effort (the user has to predict what's on the other side).

Detection method: For CTAs (links with arrow indicators or action verbs), check specificity. LLM check: "Does this CTA text clearly communicate what the user will find at the destination? Rate specificity 1-5." CTAs rated < 3: LOW finding.

**Finding 5 (LOW): The page has no visible search functionality.**

For a site with 15+ pages of content (services, blog, case studies, methodology, principles, FAQ, legal pages, comparisons), there's no search function anywhere. A visitor looking for specific information (e.g., "Do they do healthcare AI?") has to browse manually.

Detection method: Check for search input elements (input[type="search"], role="search", links to /search). If site has > 10 crawled pages and no search functionality, LOW informational finding.

### 6. Rating: 3/10

The primitive measures proxies of proxies. It's keyword-matching for concepts that require structural and contextual analysis. The false-negative rate on a well-written site like supertrained.ai is essentially 100% — the primitive finds nothing, but a human researcher would find 5+ legitimate issues. The architecture is sound (PageSummary has the right data fields), but the analysis logic is doing almost nothing with the available data.

---

## Expert 4: James Okafor — Senior Design Systems Lead

### 1. Reaction to Keyword-Matching for CTA and Trust Detection

When I built Stripe's internal copy linting system, we went through exactly this evolution. We started with keyword matching (version 1). It lasted two weeks before we scrapped it. Here's why:

**False positive rate was catastrophic.** The word "get" appears in English text constantly. "Get started," "get help," "you'll get an email" — only one of these is a CTA. Our keyword linter flagged every page as having CTAs. Conversely, Stripe's actual primary CTA at the time was "Start now" — and "start" was in our list, but "Start now" as a CTA is mediocre. It tells you nothing about what you're starting.

**What worked at Stripe:** We built a three-layer system:
1. **Structural detection**: Find all `<button>`, `<a role="button">`, `<input type="submit">`, and `<a>` elements with click handlers or prominent visual styling (class names containing "btn", "cta", "primary", "action")
2. **Quality scoring**: For each detected CTA, score the text: Does it contain an action verb + a benefit/outcome? "Start your free trial" scores higher than "Start" scores higher than "Submit" scores higher than "Click here"
3. **Placement analysis**: Is the CTA in the hero area, in a repeated section, at the end of a content block? Position determines intent.

The current Alien Eyes approach skips layers 1 and 2 and doesn't even attempt layer 3.

**For trust signals**, at Stripe we checked for specific DOM patterns: `<figure>` with `<figcaption>` (attributed quotes), `<img>` elements in flex/grid containers with consistent sizing (logo bars), elements with star-rating-related class names or aria-labels. These are structural signals, not keyword signals.

### 2. Top 5 UX/Copy Checks to Add

**Check 1: Interactive Element Audit (deterministic — requires PageSummary enhancement)**

What it measures: Are all interactive elements properly labeled, correctly sized, and distinguishable from non-interactive content?

Implementation:
- Need to enhance PageSummary to extract:
  - Buttons: `<button>`, `<input type="submit">`, `<a role="button">`
  - Their text content, disabled state, aria-label
  - Their approximate position (within which heading section)
- Checks:
  - Buttons with no text AND no aria-label: HIGH finding (inaccessible and unclear)
  - Disabled buttons with no explanation (no title, no aria-describedby, no adjacent helper text): MEDIUM finding
  - Buttons with generic text ("Submit", "Go", "OK", "Yes", "No") on primary conversion pages: LOW finding
  - Links styled as buttons (check: `<a>` with class containing "btn" or "button") that have no `role="button"`: LOW finding (semantic confusion)
- This overlaps with accessibility, but from the UX perspective: unclear interactive elements create hesitation. People don't click things they don't understand.
- Severity: HIGH for unlabeled, MEDIUM for unexplained disabled state, LOW for generic text
- Confidence: 0.9

**Check 2: Navigation Consistency Across Pages (deterministic)**

What it measures: Is the navigation structure identical across all crawled pages?

Implementation:
- For each page, extract the main nav links (links within `<nav>` landmark)
- Compare the nav link sets across all pages:
  - Missing nav items on some pages: MEDIUM finding ("Navigation is inconsistent — page X has Y items but page Z has W items")
  - Nav items in different order on different pages: LOW finding
  - Different nav link text for same destination: LOW finding (e.g., "Work" on one page, "Our Work" on another)
- Also check: does every page have a link back to the homepage? (Either in nav or via logo)
- This is a direct implementation of Nielsen Heuristic #4 (Consistency and Standards)
- Severity: MEDIUM for missing items, LOW for ordering/text differences
- Confidence: 0.95 (fully deterministic)

**Check 3: Content Hierarchy Alignment (deterministic)**

What it measures: Does the visual hierarchy (heading levels) match the conceptual hierarchy (importance)?

Implementation:
- Extract heading tree from each page
- Check for anti-patterns:
  - H1 that's not the most prominent concept on the page (e.g., H1 is "Welcome" but H2 is the actual topic): LLM check needed
  - Sections with heading but no content below: MEDIUM finding (structural but empty)
  - Deeply nested headings (H4, H5, H6) that suggest content should be on a separate page: LOW finding
  - Heading text that's a full sentence (> 20 words): LOW finding (headings should be scannable labels)
  - Heading that duplicates the page title exactly: LOW finding (wastes the H1 on redundancy)
- Cross-page: check if H1 pattern is consistent (always the page topic, or sometimes brand name, or sometimes a tagline)
- Severity: MEDIUM for structural issues, LOW for style issues
- Confidence: 0.85

**Check 4: Micro-copy Quality Scan (deterministic + LLM)**

What it measures: Are the small but critical text elements (form labels, button text, error messages, tooltips, helper text) clear and helpful?

Implementation:
- Extract micro-copy elements (requires PageSummary enhancement):
  - Form labels and placeholder text
  - Button text (all buttons, not just primary CTAs)
  - `<small>`, `.helper-text`, `.hint` class elements
  - Toast/alert elements (if visible)
- Deterministic checks:
  - Placeholder text used AS the label (no separate `<label>` element): MEDIUM finding (placeholder disappears on focus)
  - All-caps button text: LOW finding (harder to read, feels like shouting)
  - Button text > 5 words: LOW finding (too verbose for a button)
  - Inconsistent button text for same action across pages: LOW finding
- LLM check for quality:
  - "For each form field label, does the label clearly communicate what input is expected?"
  - "For each button, does the text clearly communicate what will happen when clicked?"
- Severity: MEDIUM for missing labels, LOW for quality issues
- Confidence: 0.8

**Check 5: Page Template Detection and Completeness (deterministic)**

What it measures: Are pages built from consistent templates, and are any template sections incomplete?

Implementation:
- Cluster crawled pages by structural similarity (heading patterns, section counts, element types)
- Within each cluster (template), check for outliers:
  - Pages with significantly fewer sections than siblings: possibly incomplete
  - Pages with sections that other siblings have but this page is missing: potentially broken template
  - Pages with duplicate content from other pages (copy-paste template without customization): LOW finding
- Cross-page: check that all "service" type pages have the same structural elements (description, pricing, CTA, case study link). If one service page is missing pricing but others have it: MEDIUM finding.
- This is powerful because it surfaces inconsistencies the builder doesn't notice — they edited one page but forgot to update the others.
- Severity: MEDIUM for incomplete vs. siblings, LOW for minor template deviations
- Confidence: 0.8

### 3. Professional Tools/Frameworks

| Tool/Framework | What to Steal | Priority |
|---------------|--------------|----------|
| **FullStory's DX Score** | Their automated "digital experience score" combines frustration signals (rage clicks, error clicks, dead clicks) + engagement signals. Alien Eyes can't measure real user behavior but CAN detect the conditions that cause rage clicks: non-interactive elements that look clickable, links that go nowhere useful, buttons that are disabled without explanation | HIGH |
| **Stripe's Internal Copy Linter** | Three-layer CTA detection (structure → quality → placement). Also: banned words list for UI copy ("simple," "easy," "just" — words that make promises the product may not keep) | HIGH |
| **Figma's Content Reel / Microsoft's Writing Style Guide** | Standardized micro-copy patterns. "Sign in" not "Login," "couldn't" not "could not," action verbs in button text. Encode as quality rules. | MEDIUM |
| **Google's Material Design Guidelines** | Specific rules for button text, dialog text, empty states, error messages. Testable patterns. | MEDIUM |
| **NN/g's UX Writing Guidelines** | "Front-load" important words, use active voice, be specific. Each of these is measurable in link/button text. | HIGH |

### 4. Frameworks to Encode

**A Design System UX Lint Ruleset** (what I'd build):

| Rule Category | Specific Rules | Detection |
|--------------|---------------|-----------|
| **Consistency** | Same action = same text across pages. All nav links identical. CTA style consistent. | Compare link text arrays and nav structures across all PageSummaries |
| **Clarity** | No jargon without definition. No acronyms without expansion. Button text = verb + noun. | LLM scan of heading and CTA text for unexplained jargon |
| **Completeness** | Every page has: nav, h1, at least one CTA (or explicit reason not to), footer. Form pages have: labels, validation, success state. | Structural check of required elements |
| **Hierarchy** | One primary CTA per viewport. Visual hierarchy descends H1→H2→H3. No heading skips. | Count CTAs per section, verify heading level sequence |
| **Accessibility-UX overlap** | Focus order matches visual order. Interactive elements have visible focus states. Color is not the only differentiator. | Partially covered by a11y primitive but UX framing is different |

### 5. Live Audit of supertrained.ai

**Finding 1 (MEDIUM): The homepage has 7 distinct link destinations competing for attention.**

Above the fold and first scroll: /blueprint, /work, /services, /contact, /blog, /method, /about (in nav), plus /blueprint again (hero CTA), /work again (secondary CTA). The nav has 5 items plus "Book a Conversation" button. By the time you include the hero CTAs, a visitor in the first viewport faces 8 clickable options.

Compare Stripe's homepage: 2-3 nav items visible + 1 primary CTA. Linear's homepage: 3 nav items + 1 CTA. The more options, the less likely any gets clicked.

Detection method: Count unique link destinations visible in the first page section (before first H2). Include main nav. If > 5 unique destinations before first scroll, flag navigation complexity.

**Finding 2 (MEDIUM): The "Book a Conversation" nav button goes to /contact — a generic contact page, not a booking widget.**

When a button says "Book a Conversation," users expect a calendar — like Calendly or Cal.com. If /contact is actually a contact form, the button text is misleading. The link text promises booking; the destination delivers a form. This is a text-destination mismatch that creates a micro-disappointment.

Detection method: For CTAs containing "book" or "schedule," check if the destination page contains a calendar/booking widget (Calendly, Cal.com, HubSpot meetings — detect by iframe src, script domains, or specific DOM patterns). If the destination is a generic form page, flag as text-destination mismatch.

**Finding 3 (LOW): Inconsistent link text patterns for similar actions.**

Across the site:
- "Book a Conversation" (nav, services page CTAs)
- "Get Your Free Automation Blueprint" (hero CTA, bottom CTA)
- "Try it free" (drudgery section)
- "See How We Work" (hero secondary)
- "See the proof" (methodology section)
- "Learn More" (comparison cards)
- "Visit live product" (case studies)
- "Or get a free Automation Blueprint first" (bottom section)

"Try it free" and "Get Your Free Automation Blueprint" go to the same page (/blueprint) but use different text. "See How We Work" and "See the proof" go to the same page (/work) but use different text. Inconsistent labeling makes the site feel like it was written by different people at different times (which it probably was, given it went through 37 rounds).

Detection method: Group all links by destination URL. For each destination, compare the link text variants. If the same URL has > 2 different link text values (excluding nav vs. body context), flag as inconsistent labeling.

**Finding 4 (LOW): "Selected Work" heading says "Products we've shipped" but only shows 2 products.**

Two case studies for a company claiming "15+ agents deployed" sets up an expectation gap. The heading "Products we've shipped" (plural, confident) with only 2 items feels thin. Either show more products or adjust the heading to not overpromise.

Detection method: Detect headings that make plural/quantity claims ("products," "clients," "projects") and count the items in the corresponding section. If the heading implies many but the section contains < 3 items, flag as expectation mismatch.

**Finding 5 (LOW): The empty `alert` element at the bottom of every page.**

Every page has `<div role="alert">` as the last element in the body. It's empty. Screen readers will announce "alert" with no content. For sighted users, it's invisible. But it suggests either (a) a notification system that's not yet implemented, or (b) a React framework artifact that should be conditionally rendered.

Detection method: Detect elements with role="alert" or role="status" that contain no text content. Flag as potential UX artifact. (This also overlaps with a11y, but from UX perspective, empty alert landmarks suggest unfinished implementation.)

### 6. Rating: 3/10

The architecture is fine — PageSummary provides headings, links, images, meta, and sanitized text. The problem is that the analysis logic uses almost none of this data. The links array is only used to check for zero links (dead ends). The headings array is never used. Images are never checked for context (hero images, logo bars). The meta tags are never checked for OG completeness (which is a UX issue for social sharing). The primitive is leaving 80% of the available data on the table.

---

## Expert 5: Elena Voss — CRO Director

### 1. Reaction to Keyword-Matching for CTA and Trust Detection

I manage landing page optimization for brands spending $40M+ annually on paid traffic. If I used keyword matching to evaluate CTA quality, I'd be fired within a quarter. Here's what I know from 2,000+ A/B tests:

**CTA effectiveness is a function of 6 variables, of which keyword presence is zero of them:**

1. **Specificity** — "Get Your Free 2026 Automation Blueprint" outperforms "Get Started" by 30-50% consistently. The more specific the CTA text, the higher the conversion rate. Keyword matching can't measure specificity.

2. **Value framing** — "Get Your Blueprint" (you get something) vs. "Submit Your Information" (you give something). Same action, opposite framing, 20-40% conversion difference. Keyword matching treats both as "having a CTA."

3. **Commitment level match** — The CTA should match the visitor's stage. A first-time visitor seeing "Buy Now" on a $25K service page will bounce. "See How It Works" matches their awareness level. The primitive doesn't model visitor awareness stages.

4. **Visual isolation** — The most important CTA should have the most whitespace around it, the highest contrast, the largest tap target. None of this is visible from text analysis.

5. **Position in persuasion sequence** — A CTA placed before the value prop is less effective than one placed after problem-agitation-solution. Position matters. The primitive doesn't track position relative to persuasion content.

6. **Urgency/scarcity context** — "Get Your Blueprint" is weaker than "Get Your Blueprint — 60 seconds, free forever." The qualifier reduces perceived risk. The primitive can't measure this.

For trust signals: I've tested trust signal placement extensively. The SAME trust badges placed above the fold vs. below the fold produce 10-15% conversion differences. A Trustpilot widget with 4.8 stars placed next to the primary CTA outperforms the same widget in the footer by 25%. **Placement matters more than presence.** The keyword check doesn't know where the trust signals are on the page.

### 2. Top 5 UX/Copy Checks to Add

**Check 1: CTA Strength Score (deterministic + LLM)**

What it measures: Quality of each CTA on a 4-point scale.

Implementation:
- Extract all CTAs: links and buttons with action verbs (maintain an expanded verb list: start, get, book, try, buy, download, claim, join, subscribe, schedule, request, explore, discover, calculate, compare, upgrade, learn + "free", "now", "today" as modifiers)
- But — and this is critical — also extract by DOM position: the first prominent link/button after H1 is likely the primary CTA regardless of text content
- Score each CTA on 4 dimensions:
  1. **Specificity** (1-3): "Submit" = 1, "Get Started" = 2, "Get Your Free Automation Blueprint" = 3. Rule: count of specific nouns in CTA text. 0 nouns = 1, 1 noun = 2, 2+ nouns = 3.
  2. **Value framing** (1-2): Text uses "get/receive/access/claim/your" = 2 (value frame). Text uses "submit/send/give/enter" = 1 (cost frame).
  3. **Urgency** (0-1): Presence of time words ("now", "today", "60 seconds", "instant") = 1, absent = 0.
  4. **Risk reduction** (0-1): Presence of "free", "no commitment", "cancel anytime", "no credit card" within 100 chars of CTA = 1, absent = 0.
- Total score: 2-7. Primary CTA scoring < 4: MEDIUM finding. Secondary CTAs scoring < 3: LOW finding.
- Severity: MEDIUM for weak primary CTA, LOW for weak secondary
- Confidence: 0.8

**Check 2: Persuasion Sequence Validation (LLM-primary)**

What it measures: Does the page follow a proven persuasion framework before asking for the conversion?

Implementation:
- Extract content blocks (text between headings)
- LLM classification of each block's role in persuasion:
  - **Problem**: describes a pain point the visitor has
  - **Agitation**: intensifies the problem with data, consequences, emotional language
  - **Solution**: presents the product/service as the answer
  - **Proof**: shows evidence it works (testimonials, case studies, metrics)
  - **CTA**: asks for the conversion
  - **Objection handling**: addresses concerns (FAQ, guarantees)
  - **Other**: navigation, legal, unrelated
- Check sequence: Problem should appear before Solution. Proof should appear before final CTA. Objection handling should appear near the end.
- Anti-patterns:
  - Solution before Problem: MEDIUM finding ("Leading with your solution before establishing the problem. 'We build AI agents' before 'Your team wastes 20 hours/week'")
  - CTA before any Proof: LOW finding
  - No Problem section at all: MEDIUM finding
  - No Proof section on homepage/services: MEDIUM finding
- Severity: MEDIUM for sequence violations on decision pages
- Confidence: 0.7 (LLM judgment required)

**Check 3: Price Anchoring and Framing (deterministic + LLM)**

What it measures: When prices are present, are they framed effectively?

Implementation:
- Detect price patterns: `$X,XXX`, `$X/mo`, `starting at $X`, `from $X`
- For each price, check surrounding context:
  - **Anchoring**: Is a higher reference price mentioned before the actual price? ("Hiring costs $150K/year. Our service: $10K." → good anchoring)
  - **ROI framing**: Is the price accompanied by ROI context? ("$10K → saves 80 hrs/month" → good). Price alone with no ROI context → LOW finding
  - **Comparison framing**: Is the price compared to alternatives? ("Instead of $150K for a full-time hire, get a fractional AI department for $10K/mo" → good)
- Check for "starting at" pattern without upper bound: LOW finding ("Starting at $10K" without mentioning maximum creates uncertainty)
- Check for price ranges: if range is > 3x (e.g., "$25,000-$50,000"), the range is too wide to be useful → LOW finding
- Severity: LOW for framing issues, MEDIUM for completely unanchored high prices
- Confidence: 0.75

**Check 4: Social Proof Placement Optimization (deterministic)**

What it measures: Is social proof placed where it has the most persuasive impact?

Implementation:
- Detect social proof elements (using structural detection from Expert 2's Check 3)
- Map their position relative to decision points:
  - Social proof near/before primary CTA: optimal
  - Social proof near/before pricing: optimal
  - Social proof only in footer or dedicated testimonial page: suboptimal → LOW finding
  - Social proof on homepage but not on services/pricing pages: LOW finding ("Trust signals are most needed at the point of decision, not the point of awareness")
  - No social proof within 2 sections of any CTA: MEDIUM finding
- Check: does every page with a "Book a Conversation" or purchase CTA have at least one social proof element within the preceding 2 sections?
- Severity: MEDIUM for no proof near CTA, LOW for suboptimal placement
- Confidence: 0.75

**Check 5: Exit Intent and Secondary Conversion Paths (deterministic)**

What it measures: Does the page offer a lower-commitment alternative for visitors who aren't ready to convert?

Implementation:
- For pages with a high-commitment primary CTA (booking, purchase, sign up):
  - Check for a secondary, lower-commitment CTA ("Download guide," "Subscribe to newsletter," "Get free resource")
  - The secondary CTA should be visually subordinate (not competing — see Expert 2's finding about competing CTAs)
  - If no secondary path exists on a high-commitment page: LOW finding ("Visitors not ready to book have no way to maintain the relationship")
- For the overall site:
  - Check for email capture mechanism (newsletter signup, lead magnet)
  - Check for content marketing (blog with > 3 posts)
  - If neither exists: MEDIUM finding ("No mechanism to capture interest from visitors not ready to buy")
- supertrained.ai actually does this well with the Blueprint as a low-commitment alternative to booking — but the primitive can't detect this.
- Severity: MEDIUM for no secondary conversion mechanism site-wide, LOW for individual pages
- Confidence: 0.8

### 3. Professional Tools/Frameworks

| Tool/Framework | What to Steal | Priority |
|---------------|--------------|----------|
| **Unbounce Smart Traffic** | Their ML model classifies visitors and routes to variants. The CLASSIFICATION model is what matters — it identifies visitor intent signals. Alien Eyes can encode the classification taxonomy: new vs. returning, high-intent vs. browsing, problem-aware vs. solution-aware. | MEDIUM |
| **VWO's SmartStats** | Bayesian A/B test analysis. Not directly applicable, but their pre-test "hypothesis quality" scoring is: stronger hypothesis = clearer problem + specific metric + directional prediction. Each finding should rate hypothesis strength for fixing it. | LOW |
| **Cialdini's Influence Framework** | Already discussed by others, but specifically: encode the 7th principle (Unity — shared identity) as checking for "we"/"our" language, community signals, tribe markers. B2B SaaS sites that use "we" outperform those that use "the company" by measurable margins. | MEDIUM |
| **ConversionXL's Landing Page Scorecard** | 15-point checklist: unique value prop, hero image, benefit-oriented copy, social proof, single conversion goal, urgency/scarcity, trust marks, no distracting links, form optimization, mobile optimization, page speed, visual hierarchy, clear headline, supporting subhead, benefit bullets. 10 of these 15 are detectable from crawl data. | HIGH — most directly applicable |
| **Wynter Message Testing** | Their 4-dimension framework: Clarity (do I understand it?), Relevance (is it for me?), Value (is it worth it?), Differentiation (why not alternatives?). Each dimension can be an LLM evaluation axis for the homepage h1 + first paragraph. | HIGH |

### 4. Frameworks to Encode

**ConversionXL Landing Page Scorecard** — the most practical conversion framework:

| Criterion | Detection Method | Finding Severity |
|-----------|-----------------|-----------------|
| Unique value proposition in H1 | LLM: "Is this headline differentiated from competitors?" | HIGH if generic |
| Hero image/visual present | Check for images in first section | LOW if absent |
| Benefit-oriented copy (not feature-oriented) | LLM: "Does the first section describe benefits to the user or features of the product?" | MEDIUM if feature-oriented |
| Social proof present on page | Structural detection of testimonials/logos/reviews | MEDIUM if absent on decision page |
| Single conversion goal per page | Count distinct CTA destinations per page | MEDIUM if > 2 |
| Trust marks present | Structural detection of badges/certifications | LOW if absent |
| No distracting links in hero area | Count non-CTA links in first section | LOW if > 3 |
| Form optimized (if present) | Field count, label presence, autocomplete | MEDIUM if > 5 fields |
| Mobile tap targets adequate | Need viewport testing — currently out of scope | Deferred |
| Clear headline (< 10 words) | H1 word count | LOW if > 12 words |
| Supporting subheadline present | Check for paragraph immediately after H1 | LOW if absent |
| Benefit bullets present | Check for `<ul>` or `<ol>` in first 3 sections | LOW if absent on services page |

**Cialdini's 7 Principles as Automated Checks:**

| Principle | Automated Detection |
|-----------|-------------------|
| **Reciprocity** | Free resource offered before commitment ask? Check for "free" + /download, /tool, /calculator, /blueprint links |
| **Commitment** | Small commitment before large? Blueprint before booking is correct sequencing — check that low-commitment CTA appears before or alongside high-commitment CTA |
| **Social Proof** | Testimonials, client counts, reviews — structural detection |
| **Authority** | Credentials mentioned (years, certifications, client names) — keyword + context |
| **Liking** | Team photos, founder story, brand personality — /about page with images |
| **Scarcity** | "Limited," "only X remaining," deadline language — keyword in CTA proximity |
| **Unity** | Shared identity language — "we" language, community references, industry-specific belonging markers |

### 5. Live Audit of supertrained.ai

**Finding 1 (HIGH): No external social proof anywhere on the homepage.**

The homepage has zero client logos, zero named customer testimonials, zero review platform scores, zero certification badges. The only "testimonial" is founders quoting themselves. The CloneICP case study has one unattributed quote ("It found prospects we never would have discovered through traditional search" — who said this?). For a company charging $10-50K per project, the absence of external validation is the single biggest conversion killer on this page.

A B2B buyer evaluating a $25K AI agent engagement will immediately look for: (1) Who else has used this? (2) What did they say? (3) Can I verify it? The answer to all three questions on this homepage is "no." That's a hard bounce for any buyer with budget authority.

Detection method: Check homepage for Level 2+ social proof (see Expert 2's framework). If decision pages have only Level 0-1 social proof, this is HIGH severity for B2B sites with pricing > $1K.

**Finding 2 (MEDIUM): The Blueprint funnel has no email capture before value delivery.**

The /blueprint page asks for a task description and then presumably generates a blueprint. But there's no visible email field in the initial form. If the blueprint is generated without capturing an email address first, the visitor gets value and leaves. If the email is asked for AFTER generation, many visitors will skip it (they already got what they wanted). The optimal sequence for lead generation is: describe problem → enter email → receive blueprint.

From the snapshot, the form has only a text input and a disabled "Go" button. No email field visible. This means either (a) email is asked later (friction after commitment — bad), or (b) the blueprint is delivered without any lead capture (bad for the business), or (c) account creation is required (highest friction).

Detection method: For "lead magnet" pages (free resource, calculator, assessment), check if email/contact capture is part of the initial form visible on page load. If the form has < 2 fields and doesn't include email type input, flag for review.

**Finding 3 (MEDIUM): Services page has no "which is right for me?" guidance.**

Five services ranging from $3K/month to $50K one-time. No comparison table. No "I'm a startup" vs. "I'm enterprise" pathway. No quiz/assessment. The page relies entirely on the visitor self-selecting, which requires them to understand the differences between "Workflow Automation" and "Custom AI Agents" and "AI Marketing Systems" — differences that aren't obvious from the names alone.

The "Best for" subsections help, but they're buried inside each card. A first-time visitor scanning the page doesn't see these without reading every card.

Detection method: On pages with > 3 service/product offerings, check for comparison/summary element (table, feature matrix, "which is right for you" section, quiz/assessment link). If absent, flag as missing decision support.

**Finding 4 (LOW): "Founded 2024" establishes the company as very young, which may undermine the premium pricing.**

"Founded 2024" means the company is less than 2 years old. "15+ agents deployed" over 2 years is ~7-8 per year. "3,000+ hours reclaimed" is ~1,500 hours per year across all clients. These numbers, when contextualized, might suggest a small operation — which is fine, but it creates cognitive dissonance with the premium pricing ($25K-$50K projects, $10K-$20K/month retainers).

This isn't a bug to fix — it's a framing question. "3,000+ hours reclaimed" sounds better as "200 hours/month reclaimed for our clients" or "$150K+ in annual labor savings delivered."

Detection method: Detect credibility statistics (numbers near terms like "deployed," "delivered," "saved," "clients," "years"). LLM check: "Given the company's founding date and stated metrics, do these numbers strengthen or potentially weaken the credibility claim?" This is subjective and should be flagged with `requiresHumanJudgment: true`.

**Finding 5 (LOW): The comparison pages (/compare/doing-nothing, /compare/diy-tools, /compare/other-agencies) are linked but not prominently featured.**

These comparison pages are powerful conversion content — they handle objections directly. But they're accessible only through small "Learn more" links in the "The Difference" section cards. They're not in the main nav, not in the mobile nav, and the link text "Learn more" is generic. A visitor actively comparing options (the highest-intent segment) might never find these pages.

Detection method: Check for comparison/alternative pages (URLs containing "compare", "vs", "alternative"). If they exist but aren't linked from the main navigation or aren't referenced by specific link text (e.g., "Compare us to DIY tools"), flag as buried high-value content.

### 6. Rating: 2/10

The primitive is attempting to do conversion optimization with string matching. That's like trying to do surgery with a butter knife — the tool category is wrong. The keyword lists are arbitrary, incomplete, and measure the wrong thing. The LLM supplement is too constrained (2 findings, vague prompt) to compensate. The supertrained.ai audit producing zero findings is damning evidence: this is a site with real, significant conversion issues (no external social proof, competing CTAs, no comparison table for 5 services), and the primitive caught none of them.

---

## Consensus Findings

### Panel Rating: 2.6 / 10

| Expert | Rating | Key Criticism |
|--------|--------|---------------|
| Dr. Rina Patel | 3/10 | Keyword matching measures word presence, not functional affordance |
| Marcus Cole | 2/10 | Zero correlation between keyword presence and conversion rate |
| Dr. Sarah Lindqvist | 3/10 | Confuses semantic content with functional affordance; ignores cognitive psychology |
| James Okafor | 3/10 | Leaves 80% of available PageSummary data unused |
| Elena Voss | 2/10 | Supertrained.ai producing zero findings is proof the primitive doesn't work |

### Unanimous Conclusions

1. **Keyword matching is the wrong method for CTA and trust detection.** All 5 experts agree: the approach should be structural (DOM patterns, element types, positioning) not lexical (keyword presence). The false-negative rate is unacceptable — supertrained.ai passed all checks despite having real UX/copy issues.

2. **The primitive needs page-role classification.** A blog post, a pricing page, and a legal page have fundamentally different UX requirements. Checking all pages against the same criteria produces meaningless results. Implement page-role detection (from URL patterns + heading content) and apply role-specific checks.

3. **The LLM supplement is too constrained.** "Find at most 2 copy/UX clarity issues" is too vague and too limited. Replace with structured LLM evaluations: value proposition clarity score, persuasion sequence analysis, social proof specificity assessment — each with defined rubrics.

4. **The existing PageSummary data is underutilized.** The `headings` array, `links` array, `images` array, and `metaTags` are all available but barely touched by the current implementation. Before adding new data extraction, maximize what's already there.

5. **Form and button data must be added to PageSummary.** The current extraction captures links but not buttons, form fields, or interactive element states. This is the single most important data gap for UX evaluation.

### Priority-Ordered Implementation Roadmap

| Priority | Check | Type | Expert(s) | Estimated Effort |
|----------|-------|------|-----------|-----------------|
| P0 | **Replace keyword CTA check with structural CTA detection** | Rewrite | All 5 | 4 hours |
| P0 | **Replace keyword trust check with social proof structural analysis** | Rewrite | Cole, Voss | 4 hours |
| P0 | **Add page-role classification** | New | Patel, Cole | 3 hours |
| P1 | **Value proposition clarity score** | New (LLM) | Patel, Voss | 2 hours |
| P1 | **Navigation consistency across pages** | New (deterministic) | Okafor | 2 hours |
| P1 | **Heading hierarchy coherence** | New (deterministic) | Patel, Lindqvist | 2 hours |
| P1 | **Above-fold content completeness** | New (deterministic) | Cole | 2 hours |
| P1 | **CTA strength scoring** | New (deterministic + LLM) | Voss, Cole | 3 hours |
| P1 | **Cognitive load assessment** | New (deterministic) | Lindqvist | 2 hours |
| P2 | **Persuasion sequence validation** | New (LLM) | Cole, Voss | 3 hours |
| P2 | **Link/button text quality audit** | New (deterministic) | Cole, Okafor | 2 hours |
| P2 | **Conversion funnel continuity** | New (deterministic + LLM) | Patel | 3 hours |
| P2 | **Social proof placement optimization** | New (deterministic) | Voss | 2 hours |
| P2 | **Pricing transparency check** | New (deterministic) | Cole | 1 hour |
| P2 | **Form friction analysis** | New (deterministic) | Lindqvist | 2 hours (+ PageSummary enhancement) |
| P3 | **Micro-copy quality scan** | New (deterministic + LLM) | Okafor | 3 hours |
| P3 | **Page template detection** | New (deterministic) | Okafor | 3 hours |
| P3 | **Error state quality (404/form errors)** | New (interaction-based) | Lindqvist | 4 hours |
| P3 | **Price anchoring and framing** | New (deterministic + LLM) | Voss | 2 hours |
| P3 | **Objection handling completeness** | New (deterministic + LLM) | Cole | 2 hours |
| P3 | **Exit intent / secondary conversion paths** | New (deterministic) | Voss | 1 hour |

**Total estimated effort:** ~50 hours for all checks. P0 alone: ~11 hours.

### PageSummary Enhancement Requirements

The panel identified these data fields that must be added to `PageSummary` for the P1+ checks:

```typescript
// Additions needed in PageSummary interface
interface PageSummary {
  // ... existing fields ...

  /** Buttons (not just links) with text, disabled state, type */
  buttons: ButtonInfo[];

  /** Form elements with field types, labels, required status */
  forms: FormInfo[];

  /** Approximate content sections (text between H2 headings) */
  contentSections: ContentSection[];

  /** Detected page role based on URL + content analysis */
  inferredPageRole: 'homepage' | 'services' | 'pricing' | 'blog-post' | 'blog-index'
    | 'case-study' | 'about' | 'contact' | 'legal' | 'comparison' | 'tool' | 'faq' | 'other';
}

interface ButtonInfo {
  text: string;
  type: 'submit' | 'button' | 'reset';
  disabled: boolean;
  ariaLabel: string | null;
  /** Which heading section this button is in (index into headings array) */
  sectionIndex: number;
}

interface FormInfo {
  action: string;
  method: string;
  fields: FormFieldInfo[];
}

interface FormFieldInfo {
  type: 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'hidden' | 'other';
  name: string;
  label: string | null;
  placeholder: string | null;
  required: boolean;
  hasAutocomplete: boolean;
}

interface ContentSection {
  headingLevel: number;
  headingText: string;
  wordCount: number;
  linkCount: number;
  imageCount: number;
  hasBlockquote: boolean;
  hasList: boolean;
}
```

### Frameworks to Encode (Panel Consensus)

**Tier 1 — Encode immediately (deterministic, high-value):**
- Nielsen's Heuristics #2 (Match), #4 (Consistency), #6 (Recognition), #8 (Minimalist Design)
- Fogg Behavior Model (B = MAP — Motivation, Ability, Prompt)
- CXL Landing Page Scorecard (10 of 15 criteria are crawl-detectable)

**Tier 2 — Encode with LLM support:**
- MECLABS Conversion Sequence (C = 4m + 3v + 2(i-f) - 2a)
- Cialdini's 7 Principles (social proof, authority, reciprocity detectable; scarcity, liking, unity require context)
- PAS/AIDA persuasion sequence validation
- Wynter 4-dimension message scoring (Clarity, Relevance, Value, Differentiation)

**Tier 3 — Reference for interpretation, not automation:**
- Baymard Institute benchmarks (too granular for V1, but great for expanding check library later)
- Norman's Emotional Design (visceral level partially automatable; behavioral and reflective are not)
- Kano Model (useful for finding classification, not detection)

### Live Audit of supertrained.ai — Consolidated Findings

| # | Finding | Severity | Experts Who Identified | Detectable by Current Primitive? |
|---|---------|----------|----------------------|--------------------------------|
| 1 | No external social proof (client logos, named testimonials, review scores) on homepage | HIGH | Voss, Cole, Patel | NO |
| 2 | Competing conversion paths (Blueprint vs. Booking) with no segmenting guidance | HIGH | Cole, Patel | NO |
| 3 | Case study section renders as white space (animation/lazy-load dependent) | MEDIUM | Patel | NO |
| 4 | Animated stat counters show "0" values in initial render state | MEDIUM | Lindqvist | NO |
| 5 | Services page has 5 offerings with no comparison table or "which is right for me" guide | MEDIUM | Voss | NO |
| 6 | Blueprint input field prompt and examples use inconsistent sentence structures | MEDIUM | Cole | NO |
| 7 | "Book a Conversation" nav button destination may not match user expectation (calendar vs. form) | MEDIUM | Okafor | NO |
| 8 | Case study cards have 11+ information units each (cognitive overload) | MEDIUM | Lindqvist | NO |
| 9 | Self-attributed "testimonial" (founders quoting themselves) is not social proof | LOW | Patel, Voss | NO |
| 10 | Repeated "Book a Conversation" CTAs on services page with no service-specific context passing | LOW | Patel | NO |
| 11 | Inconsistent link text for same destinations (/blueprint has 3 variants, /work has 2) | LOW | Okafor | NO |
| 12 | "Products we've shipped" heading with only 2 items creates expectation gap | LOW | Okafor | NO |
| 13 | Credibility stats ("Founded 2024, 15+ agents, 3,000+ hours") lack context that might weaken rather than strengthen | LOW | Voss | NO |
| 14 | Comparison pages (/compare/*) are buried behind generic "Learn more" links | LOW | Voss | NO |
| 15 | Footer has 17 links including pages not in main nav (potential IA issue) | LOW | Patel | NO |
| 16 | No search functionality on a 15+ page site | LOW | Lindqvist | NO |
| 17 | Disabled "Go" button on /blueprint has no visible explanation | LOW | Patel | NO |
| 18 | Empty `role="alert"` element on every page | LOW | Okafor | NO |
| 19 | "See the proof" CTA is vague — doesn't specify what proof | LOW | Lindqvist | NO |
| 20 | Numbered methodology steps (01-04) lack visual sequence indicators | LOW | Lindqvist | NO |

**Detection rate of current primitive: 0/20 (0%).**

This is the definitive evidence that the primitive needs a fundamental rewrite, not incremental improvement.
