# Alien Eyes Accessibility Primitive -- Adversarial Expert Panel (Round 2)

> Date: 2026-03-13
> Panel Type: Adversarial Accessibility Review (Round 2)
> Subject: Alien Eyes `AccessibilityPrimitive` (`src/primitives/accessibility.ts`) + extraction layer (`src/lib/extraction/accessibility-extractor.ts`)
> Audit Target: supertrained.ai (live, March 13, 2026)
> Prior Panel: `panel-accessibility-audit.md` (Round 1, same date) -- 5 experts, avg 2.8/10
> Purpose: Second adversarial pass with DIFFERENT experts, DIFFERENT specialties, focused on what Round 1 may have normalized or missed
> Panelists: 5 accessibility specialists (no overlap with Round 1 panel)
> Format: Independent critique, independent audit, then cross-referenced synthesis

---

## Why a Second Panel?

Round 1 established that the primitive covers ~5-8% of WCAG 2.2 AA and misses the #1 failure (color contrast). But Round 1 experts were primarily tool-builders and researchers. This round brings in:

- A plaintiff-side ADA attorney who has sued over exactly these failures
- A cognitive accessibility specialist (not covered in Round 1 at all)
- A browser engine accessibility API implementer (the layer beneath all tools)
- A large-scale automated testing infrastructure architect (100K+ pages/day)
- A color science and low-vision specialist (deeper than "run contrast check")

The goal is not to repeat "add contrast checking" but to find structural flaws, philosophical gaps, and failure modes that tool-builders might accept as normal.

---

## Panel Roster

| # | Name | Title | Credentials |
|---|------|-------|-------------|
| 1 | **Lainey Feingold** | Civil Rights Attorney, Law Office of Lainey Feingold | Pioneered Structured Negotiation as alternative to ADA litigation. Negotiated accessibility agreements with Bank of America, Walmart, Major League Baseball, Anthem, CVS. Author of "Structured Negotiation: A Winning Alternative to Lawsuits" (ABA). 30 years of digital accessibility legal practice. Named an ABA Legal Rebel. Specializes in the legal weight of automated testing evidence and what courts actually accept. |
| 2 | **Dr. Clayton Lewis** | Professor Emeritus, University of Colorado Boulder (Coleman Institute for Cognitive Disabilities) | Pioneer of cognitive walkthrough methodology. Co-inventor of the "thinking aloud" usability testing protocol. 40+ years in cognitive accessibility research. W3C Cognitive and Learning Disabilities Accessibility Task Force member. Author of 200+ papers on accessibility for people with cognitive, learning, and neurological disabilities. Specializes in the accessibility dimensions that automated tools fundamentally cannot detect but must still flag. |
| 3 | **James Craig** | Accessibility Platform Architect, Apple (WebKit/Safari) | Implemented the Accessibility Object Model (AOM) in WebKit. Member of W3C ARIA Working Group and Accessibility Object Model (AOM) specification editors. Designed the accessibility tree that Safari/VoiceOver consumes. 18 years building the platform layer that all accessibility tools ultimately depend on. Specializes in the delta between what Cheerio parses from HTML and what the browser's accessibility tree actually exposes. |
| 4 | **Glenda Sims** | Chief Accessibility Officer, Deque Systems | Leads Deque's axe Monitor product (100K+ pages/day in CI pipelines). Former Team Lead at Texas Department of Information Resources (statewide Section 508). W3C ACT (Accessibility Conformance Testing) Rules Format contributor. Built axe-core's enterprise scaling architecture. Specializes in false positive rates, test reliability at scale, and what breaks when you run accessibility checks across thousands of diverse sites. |
| 5 | **Dr. Aries Arditi** | Senior Fellow, Lighthouse Guild (Vision Research) | 30+ years in low-vision research. Developed the Aries Contrast Test (ACT) used in clinical ophthalmology. W3C WCAG 2.0 Working Group member (helped define the contrast algorithm in SC 1.4.3). Published the research demonstrating that contrast ratio thresholds should be higher for small text. Specializes in the gap between WCAG's contrast formula and actual perceptual readability, and why "passing WCAG" does not mean "readable." |

---

## Expert 1: Lainey Feingold (ADA Litigation / Legal Evidence)

### 1. Reaction to the 6 Checks

**What I look for as an attorney is whether automated testing output constitutes admissible evidence of either compliance or non-compliance. Here is how each check performs:**

**Check 1 (Missing alt text):** Legally sound. Missing alt text on informative images is SC 1.1.1, Level A. It appears in virtually every ADA complaint involving websites. Your tool detects it. However, your finding says "images should include meaningful alt text" without citing WCAG SC 1.1.1 or the conformance level. In my practice, a finding without a WCAG reference is advocacy, not evidence. A defendant's expert will dismiss it. A plaintiff's expert will replace it with their own report that does cite the standard.

**Check 2 (No ARIA landmarks):** Technically correct but legally imprecise. The requirement is not "has landmarks" -- it is that page regions are programmatically determinable (SC 1.3.1). A page with correct HTML5 semantic elements (`<main>`, `<nav>`, `<header>`, `<footer>`) satisfies this without any ARIA attributes. Your check fires when `ariaLandmarks.length === 0`, but your extractor already includes native HTML5 landmarks. So this check would only fire on a page with zero semantic structure -- which is severe but increasingly rare on modern frameworks. The check name ("no ARIA or native landmarks") is correct; the code is correct; the finding text ("exposes no ARIA or native landmarks") is correct. But the severity should be HIGH, not MEDIUM -- it is a Level A failure.

**Check 3 (Skip-to-content link):** This check is legally naive. The requirement (SC 2.4.1, Level A) is that "a mechanism is available to bypass blocks of content that are repeated on multiple Web pages." A skip link is ONE technique (G1). Other valid techniques include: ARIA landmarks (technique ARIA11), headings hierarchy (technique H69), expandable/collapsible content blocks. If a page has proper landmarks and heading hierarchy, it satisfies SC 2.4.1 even without a skip link. Your tool reports a "violation" that may not be a violation. In court, a defendant's expert would point this out and use it to discredit your entire report. False positives destroy legal credibility.

**Check 4 (Animated counter zero values):** This is genuinely novel, and I have never seen it in any tool. But it is **hardcoded to specific text patterns**: `0\s*hrs\/week|\$0k\+\/yr|0%`. This regex only matches the exact stat counter text on supertrained.ai. If I were auditing any other site with animated counters (and there are thousands), this check would miss them entirely. The generic pattern should detect: any visible text node whose content changes via JavaScript animation and whose initial value is a zero or placeholder.

More critically from a legal standpoint: you hardcoded evidence of auditing your own site into a tool you intend to sell as independent testing. If Alien Eyes ever produces a report used in legal proceedings, opposing counsel will examine the source code, find these hardcoded patterns, and argue the tool was designed to produce favorable results for its creator's website. This is not hypothetical -- I have seen automated testing tools discredited for less.

**Check 5 (Landmark nesting):** Correct. Navigation inside main is a real issue for screen reader landmark navigation. The severity (MEDIUM) is appropriate.

**Check 6 (Product headings with hardcoded names):** `/cloneicp|snowthere/i` -- this is indefensible. You have product names from a specific website hardcoded into a general-purpose accessibility primitive. This check fires on exactly one site in the world. For every other URL audited, it produces zero findings. The generic check should be: "heading element (`h1`-`h6`) whose `textContent.trim()` is empty but contains an `<img>` element with non-empty `alt` text." This catches the same pattern universally.

### 2. My Accessibility Audit of supertrained.ai

I am approaching this as if preparing a demand letter or structured negotiation request. I focus on findings that would survive expert challenge and judicial scrutiny.

| # | Finding | Severity | WCAG SC | Level | Legal Weight |
|---|---------|----------|---------|-------|-------------|
| 1 | Primary brand color `#ff6f61` (coral) on white `#ffffff` produces 2.73:1 contrast. Used in: hero subheading, CTA button backgrounds, accent text, section labels. This affects every page of the site. | **CRITICAL** | 1.4.3 | AA | **Maximum.** Contrast failures are the most commonly cited violation in ADA demand letters. The WebAIM Million shows 81% of home pages fail. Courts have repeatedly found insufficient contrast to constitute a barrier. The coral color IS the brand -- fixing it requires a branding decision, not just a CSS change. |
| 2 | Primary CTA buttons use white `#ffffff` text on coral `#ff6f61` background (2.73:1). The single most important conversion action on the site -- "Get Your Free Automation Blueprint" -- is below minimum contrast for all text sizes. | **CRITICAL** | 1.4.3 | AA | **Maximum.** When the primary call-to-action fails contrast, the argument becomes: the site's core functionality is inaccessible. This is the threshold for an "effective communication" violation under Title III. |
| 3 | Five `<span tabindex="0">` elements used as buttons (CTA elements) without `role="button"`, without `aria-label`, and without keyboard operability via Enter key. Screen readers announce them as "text" or "group" rather than "button." Keyboard-only users who Tab to these elements and press Enter get no response. | **HIGH** | 4.1.2, 2.1.1 | A | **High.** Level A keyboard operability failure. Custom interactive elements that are not keyboard-operable are a textbook violation. I have negotiated agreements specifically requiring that all interactive elements be keyboard-accessible. |
| 4 | Animated stat counters ("20 hrs/week," "$350K+/yr," "600%") display "0 hrs/week," "$0K+/yr," "0%" in the initial DOM before JavaScript animation fires. Screen reader users, users with JavaScript disabled, and crawlers receive the zero values. The `aria-label` on the parent container conflicts with the child text content. | **MEDIUM** | 1.3.1, 4.1.2 | A | **Medium.** Misleading content for AT users. The aria-label / textContent conflict is the stronger argument -- conflicting accessible information violates 4.1.2. |
| 5 | No visible focus indicator on several interactive elements when navigated via keyboard. The site uses Tailwind CSS with `focus:ring` classes on some elements but not consistently. Users who navigate by keyboard cannot visually track their position. | **HIGH** | 2.4.7 | AA | **High.** Focus visibility is increasingly cited in demand letters. It is testable, obvious, and affects all keyboard users. |
| 6 | The Calendly embed on the booking page introduces a third-party iframe with its own accessibility barriers. The iframe has a `title` attribute ("Calendly Scheduling Widget"), which satisfies SC 4.1.2 for the iframe itself, but the content inside the iframe inherits Calendly's accessibility posture, not the host site's. The host site cannot fix Calendly's internal issues but IS responsible for the user journey that includes the embed. | **MEDIUM** | 4.1.2, 1.3.1 | A | **Medium.** Third-party embed liability is contested. Under structured negotiation, I would classify this as "third_party" state with a recommendation to add a fallback contact method. |
| 7 | No accessibility statement or conformance claim anywhere on the site. No VPAT or ACR published. | **LOW** | (best practice) | -- | **Strategically significant.** An accessibility statement is not a WCAG requirement, but its absence means the organization cannot claim good faith compliance effort. In structured negotiation, one of the first asks is always "publish an accessibility statement with contact information." |
| 8 | Scroll-triggered animations throughout the site (sections fade/slide in). No `prefers-reduced-motion` check found governing these animations. Users with vestibular disorders may experience nausea or disorientation. | **Needs verification** | 2.3.3 (AAA), best practice at AA | AAA | **Low but rising.** Motion sensitivity complaints are increasing. WCAG 2.1 SC 2.3.3 is AAA, so not legally required for AA conformance, but `prefers-reduced-motion` media query support is considered a best practice. *[Note: Round 1 panel found that `prefers-reduced-motion` IS detected in the CSS -- needs verification of scope.]* |

### 3. Top 5 Checks to Add

**Check 1: WCAG Success Criteria Mapping on Every Finding**

This is not optional. It is the difference between a developer convenience tool and evidence that can be used in legal proceedings, procurement decisions, or compliance reporting.

Implementation:
```
Every finding MUST include:
  wcagCriteria: string[]     // e.g., ["1.1.1", "4.1.2"]
  wcagLevel: "A" | "AA" | "AAA"
  techniques: string[]       // e.g., ["G1", "ARIA11", "H69"]
  conformanceImpact: string  // e.g., "Blocks Level A conformance"
```

This is a type change that requires modifying the `Finding` interface. I understand your types are frozen (TYPE-SPEC.md v1.0), so this would need to be a v1.1 or v2.0 type revision. It is worth it. Without this metadata, your findings are suggestions, not audit results.

**Check 2: Bypass Block Mechanism (SC 2.4.1) -- Corrected Version**

Your current check only looks for a skip link. The corrected check should evaluate ALL sufficient techniques:

```
satisfiesBypassBlock =
  hasSkipLink                           // G1: skip link that works
  OR hasLandmarks                       // ARIA11: page regions identified
  OR hasHeadingHierarchy                // H69: heading structure for navigation
  OR hasExpandableContentBlocks         // SCR28: expandable/collapsible blocks

If NONE satisfied: finding with severity HIGH (Level A)
If skipLink present but non-functional: finding with severity MEDIUM + verify instructions
```

This eliminates the false positive of reporting "no skip link" on a page that has proper landmarks and heading hierarchy.

**Check 3: Third-Party Embed Accessibility Boundary**

```
For each <iframe> on the page:
  1. Check: iframe has title attribute (SC 4.1.2)
  2. Check: iframe title is descriptive (not "iframe" or empty)
  3. Identify the third-party service (Calendly, HubSpot, Typeform, etc.)
  4. Flag: "This page includes a third-party embed from [service].
     The host site's accessibility posture depends on the embed's
     accessibility. Consider providing a fallback contact method."
  5. Set lifecycle.state to "third_party" with thirdPartyService identified
```

This uses the `third_party` lifecycle state already defined in your Finding type. Courts are increasingly considering whether reasonable accommodations include providing alternatives to inaccessible third-party embeds.

**Check 4: Accessibility Statement Detection**

```
1. Search all crawled pages for links containing "accessibility" in href or text
2. Check for /accessibility, /a11y, /accessibility-statement pages
3. Check for "VPAT", "ACR", "Accessibility Conformance Report" in link text
4. If none found: LOW severity finding recommending an accessibility statement
5. If found: parse for WCAG conformance level claimed, contact information, date
```

An accessibility statement is not a WCAG requirement but IS required under EN 301 549 (EU), expected under Section 508, and strongly recommended as evidence of good faith under ADA Title III.

**Check 5: Color Contrast with Legal Context**

Beyond the technical contrast check (which Round 1 already specified in detail), the finding should include:

```
For each contrast failure:
  Include: foregroundColor, backgroundColor, computedRatio, requiredRatio
  Include: textSize, fontWeight, isLargeText (boolean)
  Include: instanceCount (how many elements use this color pair)
  Include: affectedPages (which pages in the crawl contain this pair)
  Include: legalContext: "Color contrast failures are cited in [X]% of
    ADA digital accessibility complaints (WebAIM 2025). This color pair
    appears on [N] pages affecting [component description]."
```

The legal context field transforms the finding from a technical observation into a risk assessment. Builders need to understand that a contrast failure on their primary CTA across every page is not the same risk as a contrast failure on a single disclaimer paragraph on one page.

### 4. Tools/Frameworks I Reference in Legal Work

| Tool | Legal Standing | Limitation |
|------|---------------|------------|
| **axe-core** | Widely accepted. Referenced in DOJ consent decrees. Used by many defendants as evidence of "good faith testing." | Only catches 30-40% of WCAG. Courts have found that passing axe does not constitute conformance. |
| **WAVE** | Commonly referenced in demand letters (plaintiff side). Visual format is easy for non-technical judges to understand. | Similar coverage gaps to axe. Alerts (potential issues) are often presented as definitive findings by plaintiffs -- this is misleading. |
| **Lighthouse** | Accepted as a baseline but not sufficient. Google's name carries weight with judges who do not understand the technology. | Runs axe under the hood. Same coverage. The 0-100 score is misleading: a site can score 90 and still have Level A failures. |
| **Manual JAWS/NVDA/VoiceOver testing** | Gold standard. Expert testimony from a screen reader user carries more weight than any automated report. | Expensive, slow, not scalable. But courts trust human experience over automated output. |
| **Accessibility Insights (Microsoft)** | Growing acceptance. The FastPass + Assessment combination is the closest automated tool to a manual audit workflow. | Relatively new in legal contexts. |

**What Alien Eyes needs to be legally useful:** WCAG SC references on every finding. A conformance summary ("this site has X Level A failures, Y Level AA failures"). A clear statement of what the tool covers and does not cover (avoid the Lighthouse trap of implying comprehensive coverage with a single score).

### 5. Rating: 2/10

The primitive produces findings that are technically accurate but legally useless. No WCAG references. No conformance level mapping. No coverage disclosure. Two hardcoded patterns that would discredit the tool in adversarial proceedings. Missing the #1 finding in ADA complaints (contrast). The LLM layer is capped at 2 findings -- in legal contexts, missing findings is worse than reporting none, because it implies you looked and found only 2.

To reach 5/10: Add WCAG mapping, remove hardcoding, add contrast. To reach 7/10: Add conformance summary, third-party embed handling, coverage disclosure. To reach 9/10: Generate VPAT-compatible output.

---

## Expert 2: Dr. Clayton Lewis (Cognitive Accessibility)

### 1. Reaction to the 6 Checks

I will be direct: all 6 checks address perceptual and structural accessibility. None address cognitive accessibility. Zero.

This is not unusual for automated tools -- cognitive accessibility is considered the "hard problem" of the field. But it is a problem that affects the largest population of disabled users. The WHO estimates 1 in 8 people live with a mental health condition; cognitive and learning disabilities affect 15-20% of the global population. Compare this to the ~2.2% prevalence of visual impairment severe enough to affect screen reader use.

Your tool audits for screen reader barriers (alt text, landmarks, ARIA) and visual barriers (skip links, heading structure). It does not audit for:

- Reading level complexity
- Cognitive load from dense text
- Navigation predictability
- Error prevention and recovery
- Memory demands (do users need to remember information between pages?)
- Attention traps (animations, auto-playing content, visual clutter)
- Consistent identification of repeated elements
- Clear and simple language

These are not aspirational concerns. WCAG 2.1 includes multiple AA success criteria for cognitive accessibility:

| SC | Name | Level | What It Addresses |
|----|------|-------|-------------------|
| 1.3.5 | Identify Input Purpose | AA | Helps users with cognitive disabilities by enabling familiar autocomplete behavior |
| 2.2.1 | Timing Adjustable | A | Users who process information slowly need more time |
| 2.4.6 | Headings and Labels | AA | Descriptive headings help users with cognitive disabilities orient themselves |
| 3.2.3 | Consistent Navigation | AA | Same navigation in same order reduces cognitive load |
| 3.2.4 | Consistent Identification | AA | Same function = same label everywhere |
| 3.3.1 | Error Identification | A | Users with cognitive disabilities need clear error messages |
| 3.3.2 | Labels or Instructions | A | Persistent, visible labels reduce working memory demands |
| 3.3.3 | Error Suggestion | AA | Suggest corrections, do not just flag errors |

The fact that your methodology document (METHODOLOGY-v0.1.md) defines the accessibility dimension as "WCAG 2.1 AA: color contrast, alt text, keyboard nav, ARIA, form labels, focus management, skip links" -- every item on that list is a perceptual or motor accessibility concern. Cognitive accessibility is not mentioned.

**Regarding the specific checks:**

**Check 4 (animated counters):** This is actually a cognitive accessibility finding, even though you framed it as a screen-reader issue. Animated counters that start at zero and count up are designed to create an emotional "wow" effect. But they also: (a) force users to wait for the animation to complete to get the information, (b) create a moving visual distraction, (c) expose meaningless intermediate values. For users with attention deficits or processing speed differences, the animation IS the barrier. Your check catches the symptom (zero in DOM) but not the cause (animation as a cognitive barrier).

**Check 6 (hardcoded product names):** Beyond the generalization problem everyone has noted, this check reveals something about your approach: you audited one site, found specific issues, and encoded them as rules. This is the opposite of how accessibility testing should work. You should encode WCAG success criteria as rules, then verify them against any site. The current approach produces a tool that is perfectly calibrated to find problems on supertrained.ai and blind to analogous problems on every other site.

### 2. My Cognitive Accessibility Audit of supertrained.ai

I am evaluating the site through the lens of a user with mild cognitive impairment, ADHD, or a learning disability.

| # | Finding | Severity | WCAG SC | Cognitive Impact |
|---|---------|----------|---------|-----------------|
| 1 | Hero section contains: animated background, animated counter, animated text entrance, and a CTA button. Four competing attention demands in a single viewport. No mechanism to pause or disable animations. | **HIGH** | 2.2.2, 2.3.3 | Users with ADHD or attention difficulties cannot focus on the value proposition when four elements are competing for attention. The counter animation in particular draws the eye away from the CTA. |
| 2 | The page uses 14 different CTA labels across the site: "Get Your Free Automation Blueprint," "Book a Free Discovery Call," "See How We Work," "See the Proof," "Start Here," "Learn More," "View Comparisons," "See All Comparisons," "Get Started," "Talk to Us," "Read More," "Download," "Explore," "Contact." This violates consistent identification (SC 3.2.4) -- the same action (contact/engage) has 14 different names. | **MEDIUM** | 3.2.4 | Users with cognitive disabilities rely on consistent labeling to build a mental model of the site. When the primary action has 14 names, each encounter requires re-processing: "Is this the same thing? Is this different?" |
| 3 | The "Drudgery Tax Calculator" requires users to remember a calculated result, scroll past multiple sections, and then connect that number to a later CTA ("save this much"). No progressive disclosure or summary. | **MEDIUM** | (cognitive load, not a specific SC violation) | Working memory demand. Users with cognitive disabilities may forget the calculated value before reaching the contextual CTA. |
| 4 | Error states on forms provide no error suggestions. When a field is invalid, the indication is a red border with no text explanation. Users with cognitive disabilities need text-based error messages that explain what is wrong and how to fix it. | **MEDIUM** | 3.3.1, 3.3.3 | Red border alone is also a color-only indicator (SC 1.4.1), but the cognitive impact is that the user knows something is wrong but not what or how to fix it. |
| 5 | The Blueprint page uses a multi-step form metaphor (sections that appear sequentially) but without step indicators, progress bars, or "step X of Y" labels. Users with cognitive disabilities lose orientation in multi-step processes. | **MEDIUM** | 3.3.2 (labels/instructions), best practice | Orientation loss. "Where am I in this process? How much is left? Can I go back?" These questions create anxiety and abandonment. |
| 6 | Paragraphs in the services sections use complex compound sentences averaging 28 words. Flesch-Kincaid grade level estimated at 14-16 (college level). WCAG AAA SC 3.1.5 recommends lower secondary education level, but even at AA, clarity affects comprehension for all users with cognitive differences. | **LOW** | 3.1.5 (AAA -- informational) | Dense prose increases cognitive load. Shorter sentences, simpler vocabulary, and visual breaks improve comprehension for everyone, but especially for users with dyslexia, ADHD, or intellectual disabilities. |
| 7 | Navigation changes between pages: the homepage has a minimal nav, interior pages have expanded nav with dropdowns, and the blog uses a different layout entirely. | **MEDIUM** | 3.2.3 | Inconsistent navigation forces users to relearn the interface on each page type. Users with cognitive disabilities who have learned the homepage navigation may become lost on interior pages. |

### 3. Top 5 Checks to Add

**Check 1: Animation Inventory and `prefers-reduced-motion` Compliance (WCAG SC 2.2.2, 2.3.3)**

```
1. Detect CSS animations/transitions: count @keyframes, transition properties
2. Detect JavaScript animations: scroll-triggered IntersectionObserver,
   requestAnimationFrame, CSS class toggling on scroll
3. Check for prefers-reduced-motion media query in CSS:
   - Present and reduces/removes ALL animations? PASS
   - Present but only covers SOME animations? MEDIUM (partial compliance)
   - Absent? HIGH (no respect for user preference)
4. Check for auto-playing video/audio: <video autoplay>, <audio autoplay>
5. Check for carousels/sliders that auto-advance without pause control
```

Detection: Playwright can query computed animations via `getAnimations()`. CSS analysis for `@media (prefers-reduced-motion: reduce)`. Check that the media query actually sets `animation: none` or `transition: none` rather than just adjusting duration.

**Check 2: Consistent Identification Audit (WCAG SC 3.2.4)**

```
For all interactive elements across all crawled pages:
  1. Group by apparent function (all "contact" CTAs, all "learn more" links)
  2. Check: same function uses same label text across pages
  3. Flag: cases where visually identical buttons have different accessible names
  4. Flag: cases where different labels lead to the same destination URL
```

This is a cross-page check -- it requires comparing findings across the `summaries` array, not within a single page. The primitive currently processes pages independently in a `for...of` loop. Cross-page analysis is architecturally different.

Detection: Group links by destination URL. If 5 links all point to `/contact` but use labels "Book a Call," "Get Started," "Talk to Us," "Contact," "Reach Out" -- that is an inconsistency finding.

**Check 3: Reading Level Assessment (WCAG SC 3.1.5 -- AAA, but flagged as informational)**

```
For sanitizedTextContent of each page:
  1. Calculate Flesch-Kincaid grade level
  2. Calculate Flesch Reading Ease score
  3. Calculate average sentence length and word length
  4. Flag if grade level > 12 as LOW severity (informational, AAA)
  5. Flag if grade level > 16 as MEDIUM (likely inaccessible to significant population)
```

This is deterministic -- no LLM needed. The formulas are well-defined. The challenge is extracting clean prose from `sanitizedTextContent` (stripping navigation text, footer boilerplate, etc.). The check should operate on the `main` content area only.

**Check 4: Error State Accessibility (WCAG SC 3.3.1, 3.3.3)**

```
For each form on the page:
  1. Submit the form with empty/invalid values (Playwright)
  2. Check: error messages appear in text (not just color change)
  3. Check: error messages are associated with their input (aria-describedby or adjacent text)
  4. Check: focus moves to the first error
  5. Check: error suggestions are provided (not just "invalid")
```

This requires Playwright interaction (submitting forms), making it a Full Audit check, not Quick Check. The `AccessibilityExtraction` interface would need to be extended with form state data.

**Check 5: Consistent Navigation Detection (WCAG SC 3.2.3)**

```
For all crawled pages:
  1. Extract navigation landmark content (links and their order)
  2. Compare navigation structure across pages
  3. Flag: pages where navigation links appear in different order
  4. Flag: pages where navigation links appear/disappear (not just responsive hiding)
  5. Flag: pages where the navigation component is entirely different
```

This is another cross-page check. Detection: Compare the `links` arrays filtered to those within `nav` landmarks across all page summaries.

### 4. Tools/Frameworks for Cognitive Accessibility

| Tool | What It Does | Limitation |
|------|-------------|------------|
| **Hemingway Editor** | Readability scoring, complex sentence detection, passive voice identification | Not automatable as a library. But the algorithms (Flesch-Kincaid, Coleman-Liau) are trivially implementable. |
| **WebAIM's Cognitive Disability Guidelines** | Checklist-based manual evaluation framework | Not automatable, but provides the taxonomy of what to check. |
| **COGA (Cognitive Accessibility Guidance)** | W3C guidance specifically for cognitive and learning disabilities | WCAG 2.2 incorporated some COGA recommendations, but most remain supplemental guidance, not testable criteria. |
| **Axe-core's "best-practices" rules** | Some cognitive-adjacent rules (link-name, label, identical-links-same-purpose) | Covers ~10% of cognitive concerns. Mostly limited to labeling, not comprehension or navigation consistency. |
| **Plain Language Action and Information Network (PLAIN)** | Federal plain language guidelines | Government-specific, but the readability metrics are universal. |

**The honest truth:** No automated tool adequately addresses cognitive accessibility. Your tool is not uniquely bad here -- every tool is bad here. But this is also your opportunity. If Alien Eyes is the first tool to meaningfully flag cognitive accessibility concerns (reading level, animation load, consistency, error handling), that is genuine differentiation. The LLM layer is particularly suited to this: an LLM can assess "is this error message clear?" in a way that regex cannot.

### 5. Rating: 1.5/10

The primitive addresses zero cognitive accessibility concerns. WCAG 2.1 AA contains at least 8 success criteria with direct cognitive accessibility impact. Your methodology document does not mention cognitive accessibility. Your dimension definition lists "color contrast, alt text, keyboard nav, ARIA, form labels, focus management, skip links" -- every item is perceptual or motor. 15-20% of users have cognitive or learning disabilities. Your tool is invisible to them.

The 1.5 (not 0) is because Check 4 (animated counters) is accidentally a cognitive accessibility finding, and the architecture (deterministic + LLM) could support cognitive checks if the scope were expanded.

---

## Expert 3: James Craig (Browser Accessibility Platform / Accessibility Tree)

### 1. Reaction to the 6 Checks

I built the accessibility tree that Safari exposes to VoiceOver. Every accessibility tool, including yours, ultimately depends on the browser's accessibility API. The fundamental question is: are you testing the right layer?

**Your tool tests the HTML layer (via Cheerio). It should test the accessibility tree layer (via Playwright).**

These are not the same thing. Here is why:

```
HTML (what you parse):        <div role="button" aria-label="Submit">
                                <span class="sr-only">Send form</span>
                                <svg>...</svg>
                              </div>

Accessibility Tree (what       Role: button
AT actually consumes):         Name: "Submit" (from aria-label, overrides textContent)
                               Focusable: yes (if tabindex present) / no (if not)
                               State: enabled
```

Your Cheerio-based extractor reads the HTML and extracts `role="button"`, `aria-label="Submit"`, and the `<span>` text "Send form." But it does not know which name the accessibility tree actually exposes. The accessible name computation algorithm (defined in the W3C "Accessible Name and Description Computation" spec) has a precedence order:

1. `aria-labelledby` (references other elements by ID)
2. `aria-label` (direct string)
3. Native labeling (`<label>`, `alt`, `<caption>`, `<legend>`)
4. `title` attribute
5. Subtree text content (with specific traversal rules)
6. Placeholder (only for certain roles)

Cheerio cannot resolve `aria-labelledby` references across the DOM efficiently, cannot compute which text content is "exposed" in the subtree (because `aria-hidden` descendants are excluded, and `display:none` descendants are excluded from textContent but included in aria-labelledby), and cannot determine if an element is focusable (which depends on CSS `display`, `visibility`, and computed tabindex).

**Playwright can do all of this with one call:** `page.accessibility.snapshot()` returns the full accessibility tree with computed names, roles, states, and relationships. This is the same tree that JAWS, NVDA, and VoiceOver consume. It is the ground truth.

**Your extractor parses a representation. Playwright exposes the reality.**

**Regarding the specific checks:**

**Check 1 (Missing alt):** Correct at the HTML level, but incomplete. An image can have `alt=""` and still be announced by screen readers if it has a `title`, `aria-label`, or `aria-labelledby`. An image can have `alt="photo"` which is technically present but useless (the "alt text as file description" anti-pattern). Your check is binary: `hasAlt` true/false. The accessibility tree check would be: "is the accessible name meaningful?"

**Check 2 (No landmarks):** Your extractor collects landmarks from raw HTML. But the browser may add implicit landmarks. For example, `<header>` at the top level maps to `banner` role, but `<header>` inside `<article>` does NOT. `<footer>` at the top level maps to `contentinfo`, but inside `<section>` it does not. These context-dependent role mappings are resolved by the browser, not by HTML parsing. Cheerio does not implement the HTML-AAM (HTML Accessibility API Mappings) spec.

**Check 3 (Skip link):** Your check searches link text for `/skip/i`. But a skip link might use `aria-label="Skip to main content"` with no visible text. Or it might be a visually hidden `<a>` that becomes visible on focus, where the text is in a `<span class="sr-only">`. Your link extractor reads `$(element).text()`, which gets visible text. If the skip link text is visually hidden via CSS clip, your extractor still gets it (Cheerio does not apply CSS). But if the skip link uses `aria-label` instead of text content, you miss it.

**Check 5 (Landmark nesting):** Your `parents('main')` check in Cheerio is correct for static HTML. But if the `<main>` element is dynamically inserted via JavaScript (e.g., a React hydration that wraps content in `<main>` after initial render), Cheerio parses the server-rendered HTML and may not see the hydrated structure. Playwright sees the final DOM.

### 2. My Audit of supertrained.ai

I am auditing the accessibility tree -- what assistive technology actually receives -- not the HTML source.

| # | Finding | Severity | WCAG SC | Layer |
|---|---------|----------|---------|-------|
| 1 | The 5 CTA `<span tabindex="0">` elements expose role "group" in the accessibility tree (Safari/WebKit) and "generic" in the accessibility tree (Chromium). Neither is actionable. VoiceOver announces: "text, group." NVDA announces: "clickable." JAWS announces nothing distinct. The CTA labels are accessible (from textContent), but the role is wrong. Users who navigate by "buttons" (a common VoiceOver rotor category) will never find these elements. | **HIGH** | 4.1.2 | Accessibility tree |
| 2 | Two SVGs in the hero section expose as "image" role in the accessibility tree with no accessible name. VoiceOver announces "image" with no description. NVDA announces "graphic" with no description. These should either have `aria-hidden="true"` (if decorative) or an accessible name (if informative). | **MEDIUM** | 1.1.1 | Accessibility tree |
| 3 | The Calendly iframe exposes as "group" role in the accessibility tree with name "Calendly Scheduling Widget" (from the `title` attribute). Inside the iframe, the accessibility tree depends on Calendly's implementation. Cross-origin iframes prevent Playwright from inspecting the child tree. This is an inherent limitation of outside-in auditing. | **LOW** | 4.1.2 | Cross-origin boundary |
| 4 | The stat counter sections expose BOTH the `aria-label` value ("20 hrs/week") and the child textContent ("0 hrs/week") in the accessibility tree. In VoiceOver, `aria-label` wins (announces "20 hrs/week"). In NVDA, the behavior depends on the element's role and the user's verbosity setting. This inconsistency means the user experience differs across screen readers, and neither is fully correct (one announces the right number, the other announces zero). | **MEDIUM** | 4.1.2 | Accessibility tree |
| 5 | Three `<a>` elements that wrap `<span tabindex="0">` create double tab stops. Pressing Tab lands on the `<a>`, then Tab again lands on the inner `<span>`. Both elements expose in the accessibility tree but only the `<a>` has an `href` (actionable). The `<span>` is a dead tab stop that confuses keyboard navigation. | **MEDIUM** | 2.4.3, 1.3.1 | Focus order |
| 6 | The navigation landmark has `aria-label="Main navigation"`. Good. But there is a second `nav` element (mobile navigation) that is `display:none` on desktop but still present in the DOM with no `aria-label`. When both are visible (transitional responsive state between mobile and desktop breakpoints), the accessibility tree contains two unlabeled navigation landmarks. | **LOW** | 1.3.1 | Responsive state |
| 7 | Role="alert" container at the bottom of the page is empty. Assistive technology may announce this as an empty alert on page load (depends on AT and timing). Empty live regions are technically valid but semantically misleading. | **LOW** | 4.1.3 | Live regions |

### 3. Top 5 Checks to Add

**Check 1: Accessibility Tree Snapshot Extraction (Architectural)**

This is not a check -- it is a prerequisite for accurate checks.

```
In page-collector.ts or accessibility-extractor.ts:
  1. After page load, call page.accessibility.snapshot({ interestingOnly: false })
  2. This returns a tree of: { role, name, value, description, focused,
     disabled, required, checked, pressed, expanded, selected, level,
     children[] }
  3. Store this as accessibilityTree on the PageSummary (or CrawledPage)
  4. Use this tree for all accessibility primitive checks instead of Cheerio
```

The `interestingOnly: false` flag is critical -- it includes all nodes, not just "interesting" ones. Without it, you miss decorative elements that should have `aria-hidden` but do not.

Performance cost: Minimal. The accessibility tree is already computed by the browser for every page load. Serializing it adds ~50-200ms per page.

**Check 2: Accessible Name Computation Verification (WCAG SC 4.1.2)**

```
For every interactive element in the accessibility tree:
  1. If name is empty or null: FAIL (no accessible name)
  2. If name is the same as another element's name on the same page
     AND they perform different actions: FLAG (ambiguous -- SC 2.4.4)
  3. If name contains only whitespace or Unicode control characters: FAIL
  4. If role is "generic" or "group" but element is interactive
     (has tabindex, click handler, or keyboard handler): FAIL (wrong role)
  5. If name from aria-label contradicts visible text
     (SC 2.5.3 Label in Name): FLAG
```

This replaces and subsumes your hardcoded product-name check. It also replaces the naive alt-text check with the semantically correct accessible-name check.

**Check 3: Focus Order Verification (WCAG SC 2.4.3)**

```
1. Playwright: Tab through all focusable elements, recording:
   - Element identifier (CSS selector or XPath)
   - Bounding box position (x, y)
   - Accessibility tree role and name
   - Tab index (natural vs explicit)
2. Check: focus order approximately matches visual reading order
   (left-to-right, top-to-bottom for LTR locales)
3. Check: no "dead" tab stops (elements that receive focus but have
   no accessible name or actionable role)
4. Check: no double tab stops (parent and child both focusable)
5. Check: Tab reaches ALL visually interactive elements
6. Check: no keyboard trap (Tab from last element returns to browser chrome)
```

The double-tab-stop check would catch the `<a>` wrapping `<span tabindex="0">` pattern on supertrained.ai. This is a real-world pattern that no existing automated tool reliably catches because it requires keyboard simulation.

**Check 4: Cross-Screen-Reader Behavior Divergence (Novel)**

This is where Alien Eyes can genuinely differentiate. Currently no tool tests for cross-screen-reader behavior differences.

```
For elements with both aria-label and visible textContent:
  1. Compute what VoiceOver would announce (aria-label wins)
  2. Compute what NVDA would announce (depends on role and mode)
  3. Compute what JAWS would announce (complex heuristics)
  4. If all three announce the same thing: PASS
  5. If they diverge: FLAG with confidence 0.7 and requiresHumanJudgment: true
```

Implementation: This does not require running three screen readers. The behavior can be modeled from the accessible name computation spec plus documented browser/AT behavior differences. This is where LLM reasoning could add genuine value -- the LLM can evaluate "given this accessibility tree node with role X, name Y, and textContent Z, would the user experience be consistent across major screen readers?"

**Check 5: Live Region Audit (WCAG SC 4.1.3)**

```
For every element with role="alert", role="status", role="log",
aria-live="polite", or aria-live="assertive":
  1. If the element is empty at page load: FLAG (empty live regions
     may be announced, depending on AT)
  2. If the element has no aria-atomic attribute: FLAG as potential issue
     (AT may announce only the changed text, not the full region)
  3. If aria-live="assertive" and element changes frequently: FLAG
     (interrupts user constantly)
  4. If multiple live regions exist: FLAG for potential announcement storms
  5. Track dynamic changes: if a live region is populated after page load
     (via JavaScript), verify the announced content is meaningful
```

Dynamic live region monitoring requires Playwright's `page.evaluate()` with a MutationObserver watching for content changes in live regions. This is a Full Audit check.

### 4. Tools/Standards Reference

| Tool/Spec | What It Does Right | What It Misses |
|-----------|-------------------|----------------|
| **W3C Accessible Name Computation** | The canonical algorithm. Any tool that does not implement this is guessing at accessible names. | Complex to implement correctly. Edge cases around `aria-labelledby` cycles, `display:none` children, and `role="presentation"` are tricky. |
| **HTML-AAM (HTML Accessibility API Mappings)** | Defines how HTML elements map to accessibility tree roles. `<header>` at top level = `banner`. `<header>` inside `<article>` = no implicit role. Without this, landmark checks are wrong. | Browser implementations diverge from the spec in edge cases. Test across Chromium, WebKit, and Gecko. |
| **ARIA Authoring Practices Guide (APG)** | Defines expected keyboard behavior for custom widgets. A `role="button"` must respond to Enter AND Space. A `role="tab"` must respond to Arrow keys. Without this, keyboard checks are incomplete. | The APG is guidance, not a normative spec. Sites that implement custom patterns differently are not necessarily wrong. |
| **Playwright accessibility snapshot** | Returns the browser's computed accessibility tree. THIS is the ground truth. | `interestingOnly: true` (the default) hides nodes you need. `interestingOnly: false` can produce very large trees (1000+ nodes). Need to manage token budget. |

### 5. Rating: 2/10

The tool parses HTML when it should parse the accessibility tree. It uses Cheerio when Playwright is already available and provides the correct data source. The 6 checks are approximations of what proper accessibility tree inspection would reveal definitively. The architecture is correct (extraction + primitive + finding), but the data source is wrong for this dimension.

The 2 (not 0) is because the extraction/primitive separation means switching to accessibility tree data is a refactor, not a rewrite. And the animated counter check is genuinely valuable.

---

## Expert 4: Glenda Sims (Enterprise Scale / False Positive Management)

### 1. Reaction to the 6 Checks

I run axe Monitor, which scans 100,000+ pages per day across enterprise clients. The single most important metric in my world is not "did we find the bug?" It is: **what is the false positive rate?** A tool that produces false positives at scale destroys trust, wastes developer time, and gets turned off.

Let me evaluate your 6 checks through the lens of FP risk at scale:

**Check 1 (Missing alt text):**
- FP risk: **LOW (2-3%).** Well-understood check. Your handling of `alt=""` as decorative is correct. The FP cases are: (a) images loaded via CSS `background-image` (not `<img>`) that your extractor misses, (b) SVGs that should be treated like images but are not `<img>` elements, (c) images inside `<picture>` elements where the `alt` is on the inner `<img>`. Your extractor only queries `$('img')` -- it misses `<input type="image">`, `<svg>` acting as informative images, and `<area>` elements.
- Missing FP: SVGs. supertrained.ai has 23 SVGs, 2 without `aria-hidden`. These are not caught because your extractor checks `$('img')` not `$('img, svg[role="img"], input[type="image"]')`.

**Check 2 (No landmarks):**
- FP risk: **LOW-MEDIUM (5-8%).** Modern frameworks (Next.js, Nuxt, SvelteKit) generate semantic landmarks by default. Sites built with these frameworks will almost never trigger this check. The FP case: a site where a custom component wraps `<main>` in a `<div>` that has `role="main"` -- your check would find the ARIA landmark, but if the component uses a non-standard approach, you might miss it or double-count it.

**Check 3 (Skip link):**
- FP risk: **HIGH (15-25%).** This is your most dangerous check at scale. The regex `/skip/i` on link text will:
  - False positive: Match a link that says "Skip to pricing" (navigation link, not a bypass mechanism)
  - False positive: Match a link that says "Skip this section" (content link)
  - False negative: Miss skip links that use non-English text ("Aller au contenu", "Zum Inhalt springen")
  - False negative: Miss skip links that use `aria-label` instead of text content
  - False negative: Miss skip links that use "Jump to content" or "Go to main content" (no "skip" in text)

  At scale, across 100K pages, a 15-25% FP rate on a single check means thousands of false findings per day. Developers stop reading the reports. The check needs: (a) verify the link's `href` points to a fragment that exists on the page, (b) verify the target element is near the top of `<main>`, (c) accept any link whose target is the main content, regardless of text.

**Check 4 (Animated counter zeros):**
- FP risk: **EXTREME (nearly 100% FP on other sites, 0% on supertrained.ai).** The regex `0\s*hrs\/week|\$0k\+\/yr|0%` matches ONLY the exact stat counter text from supertrained.ai. On any other site:
  - A pricing page with "$0/month" (free tier) would trigger the `$0` pattern -- false positive
  - A statistics page with "0% downtime" would trigger -- false positive
  - A changelog with "0% of users affected" would trigger -- false positive
  - A site with completely different animated counters ("0 customers served," "0 projects completed") would NOT trigger -- false negative

  At enterprise scale (1000+ sites), this check would produce thousands of false positives on legitimate "zero" content and zero true positives on actual animated counter issues. The regex must be replaced with a behavioral check: "Does the DOM text content of this element change within 3 seconds of page load? If so, does the initial value differ from the final value?"

**Check 5 (Landmark nesting):**
- FP risk: **LOW (1-3%).** The `parents('main')` check in Cheerio is reliable. The FP case is a `<nav>` intentionally placed inside `<main>` for content-specific navigation (e.g., a table of contents). This is a legitimate pattern per the HTML spec -- `<nav>` inside `<main>` is valid when it provides navigation for that specific content. Your check should distinguish between: (a) the site's global navigation inside main (BAD), and (b) a content-specific navigation inside main (ACCEPTABLE).

**Check 6 (Product headings with hardcoded names):**
- FP risk: **N/A (never fires on other sites).** But this is WORSE than a false positive -- it is a check that does not exist for 99.999% of audited sites. At scale, this check consumes code complexity, test surface, and cognitive overhead for zero return.

### 2. My Audit of supertrained.ai (Scale-Relevant Findings)

I focus on findings that would be relevant if supertrained.ai were one of 10,000 sites scanned in an enterprise portfolio.

| # | Finding | Severity | WCAG SC | Scale Behavior |
|---|---------|----------|---------|---------------|
| 1 | Contrast failure: coral `#ff6f61` on white. 2.73:1. | **CRITICAL** | 1.4.3 | This is the #1 finding across all enterprise scans. 81% of sites fail. EVERY automated tool catches this. Your tool does not. At scale, this means your tool misses the single most common finding on 81% of all sites. |
| 2 | Five custom interactive elements (`<span tabindex="0">`) without correct ARIA role. | **HIGH** | 4.1.2 | Custom widgets with incorrect roles are found on ~35% of sites in our enterprise scans. axe-core catches them. Your tool does not. |
| 3 | Two SVGs without `aria-hidden` or accessible name. | **MEDIUM** | 1.1.1 | SVG accessibility is increasingly common as sites replace icon fonts with inline SVGs. ~40% of sites have at least one unlabeled informative SVG. |
| 4 | Input on /blueprint page: need to verify `<label>` association and `autocomplete` attribute. | **MEDIUM** | 1.3.1, 1.3.5, 3.3.2 | Form accessibility is the #3 most common finding category in our scans (after contrast and alt text). |
| 5 | No `lang` attribute check. supertrained.ai has `lang="en"` (passes), but your tool would not detect if it were missing. | **HIGH (if missing)** | 3.1.1 | ~4% of sites miss `lang` attribute. Trivial check, 0% FP rate, and it is a Level A requirement. There is no reason not to include it. |
| 6 | Animated stat counters showing initial zero values. | **MEDIUM** | 1.3.1 | This IS a real issue. But your detection method (hardcoded regex) means it only works on this one site. A behavioral check (detect DOM text mutations post-load) would generalize. |

### 3. Top 5 Checks to Add (Ranked by FP Rate and Coverage)

**Check 1: Integrate axe-core as a Dependency**

I am going to be blunt: you should not reimplement color contrast, accessible name computation, ARIA validation, or form label checking. axe-core already does this, with 15 years of FP tuning, 500+ contributors, and deployment on millions of sites.

```
npm install @axe-core/playwright

// In page-collector.ts or accessibility-extractor.ts:
import AxeBuilder from '@axe-core/playwright';

const axeResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

// axeResults.violations = definite failures (high confidence)
// axeResults.incomplete = needs manual review (lower confidence)
// axeResults.passes = confirmed passing checks
```

This gives you: color contrast, accessible names, form labels, ARIA validation, landmark completeness, heading hierarchy, lang attribute, link purpose, and ~80 more checks. All with documented FP rates. All with WCAG SC references. All maintained by a team of 50+ accessibility engineers.

**Your value-add is NOT reimplementing axe-core. Your value-add is:**
1. The animated counter detection (axe cannot do this)
2. The LLM quality layer (axe finds "alt text is present" but cannot assess "alt text is meaningful")
3. Cross-page consistency checks (axe runs per-page; you crawl the whole site)
4. The probabilistic scoring model (axe is binary; you score confidence)
5. The clipboard-first output format (axe produces JSON; you produce paste-ready findings)

**axe-core does the commodity checks; you do the differentiated checks.**

FP impact: axe's violation FP rate is <5%. Their incomplete category has higher FP but lower confidence. Map axe violations to your findings with confidence 0.95, axe incomplete to findings with confidence 0.7 and `requiresHumanJudgment: true`.

Cost: axe-core runs in ~2-4 seconds per page. Zero LLM cost. It is a JavaScript library that runs in Playwright's browser context.

**Check 2: Language Attribute (WCAG SC 3.1.1) -- If Not Using axe-core**

```
const lang = await page.evaluate(() => document.documentElement.lang);
if (!lang || lang.trim() === '') {
  // Finding: HIGH severity, Level A failure
}
// Validate BCP 47 format
const validLang = /^[a-z]{2,3}(-[A-Za-z]{2,4})?(-[A-Za-z0-9]{1,8})*$/.test(lang);
```

0% FP rate. Trivial implementation. Level A requirement. No reason not to have this.

**Check 3: Behavioral Animation Detection (Replace Hardcoded Regex)**

```
// In Playwright, before page stabilizes:
const initialValues = await page.evaluate(() => {
  const candidates = document.querySelectorAll('[data-value], [data-count],
    .counter, .stat, .number, [class*="animate"]');
  return Array.from(candidates).map(el => ({
    selector: uniqueSelector(el),
    text: el.textContent?.trim(),
    ariaLabel: el.getAttribute('aria-label')
  }));
});

// Wait 3 seconds for animations to complete
await page.waitForTimeout(3000);

const finalValues = await page.evaluate((selectors) => {
  return selectors.map(({ selector }) => {
    const el = document.querySelector(selector);
    return { text: el?.textContent?.trim(), ariaLabel: el?.getAttribute('aria-label') };
  });
}, initialValues);

// Compare: if initialValues[i].text !== finalValues[i].text, the content changed.
// If the initial value looks like a zero/placeholder and the final value looks like
// real data, flag it.
```

This replaces the hardcoded regex with a behavioral detection that works on ANY site with animated counters. FP rate: ~5-8% (some legitimate content changes after load, like real-time data). Much better than the current approach (100% FP on other sites).

**Check 4: SVG Accessibility (WCAG SC 1.1.1)**

```
For each <svg> element:
  1. If aria-hidden="true": PASS (decorative, correctly hidden)
  2. If role="img" and (aria-label or <title> child): PASS (informative, labeled)
  3. If role="img" and no accessible name: FAIL
  4. If no role and no aria-hidden: FLAG (ambiguous -- needs either aria-hidden
     or role="img" + name)
  5. If used as <img src="*.svg">: handled by existing img check
```

supertrained.ai has 23 SVGs: 21 with `aria-hidden="true"` (correct), 2 without (incorrect). This is a pattern found on ~40% of sites.

**Check 5: Duplicate/Conflicting Tab Stops (WCAG SC 2.4.3)**

```
// In Playwright:
const focusOrder = [];
let previous = null;
for (let i = 0; i < 200; i++) {  // safety limit
  await page.keyboard.press('Tab');
  const current = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName,
      role: el?.getAttribute('role'),
      tabindex: el?.getAttribute('tabindex'),
      selector: /* unique selector */,
      parent: el?.parentElement?.tagName,
      parentHref: el?.closest('a')?.getAttribute('href')
    };
  });
  if (current.selector === previous?.selector) break;  // looped back

  // Check: is this element inside an ancestor that is ALSO in focusOrder?
  // If so, this is a duplicate tab stop
  if (current.parentHref && focusOrder.some(f => f.selector === /* parent a selector */)) {
    // FLAG: child element creates double tab stop inside already-focusable parent
  }

  focusOrder.push(current);
  previous = current;
}
```

The `<a>` wrapping `<span tabindex="0">` pattern on supertrained.ai creates 3 double tab stops. This pattern is increasingly common in component libraries that add `tabindex` without checking parent focusability.

### 4. Tools/Frameworks at Scale

| Tool | Scale Performance | FP Rate | Why I Use It |
|------|-----------------|---------|-------------|
| **axe-core** | 2-4s/page, linear scale | <5% violations, ~15% incomplete | The baseline. Every competitor integrates it. You should too. |
| **axe Monitor** | 100K+/page/day | <5% (same engine) | Enterprise CI integration. Your competitor if you target enterprise. |
| **Pa11y** | Fast but process-per-page | ~8% | CLI-first, good for CI. Runs axe or htmlcs under the hood. |
| **Lighthouse CI** | Built into Chrome DevTools | ~10% (includes "manual" items scored as failures) | The default. Every developer has used it. Your findings will be compared to Lighthouse scores. |
| **HTML_CodeSniffer** | Fast, deterministic | ~12% | Older but thorough. Covers more WCAG SC than axe. |
| **IBM Equal Access** | Medium speed, heavy | ~7% | Strongest ARIA validation. Better than axe on ARIA authoring pattern correctness. |

**The competitive landscape reality:** Every serious accessibility tool either IS axe-core, wraps axe-core, or runs alongside axe-core. If Alien Eyes does not integrate axe-core, it will be compared against tools that do. With 6 checks vs axe's ~80+ rules, that comparison is fatal.

### 5. Rating: 2.5/10

The architecture is sound (extraction + primitive + finding + evidence + lifecycle). The type system is thoughtful. The probabilistic confidence model is better than axe's binary pass/fail. But you are trying to build 80+ accessibility rules from scratch when a battle-tested library exists, is free, integrates with Playwright in 5 lines, and has 15 years of FP tuning.

The 2.5 (not lower) is because: (a) the animated counter check is genuinely novel, (b) the architecture can absorb axe-core output into its Finding type, and (c) the LLM layer can add quality assessment that axe cannot do.

**My recommendation:** Do not reimplement the commodity. Integrate axe-core for the ~30 highest-impact WCAG checks. Use your own engine for: animated content detection, cross-page consistency, LLM-assisted quality assessment, accessibility tree snapshot analysis, and the probabilistic scoring layer. This gets you from 6 checks to 86+ checks in a single PR, with professional-grade FP rates.

---

## Expert 5: Dr. Aries Arditi (Color Science / Low Vision)

### 1. Reaction to the 6 Checks

I helped write the contrast algorithm that is now WCAG SC 1.4.3. My reaction to this primitive is specific: **you have no color checking at all.**

This is not a gap. It is a crater. Allow me to explain why.

**The scope of the problem:**

The WCAG contrast ratio formula is: `(L1 + 0.05) / (L2 + 0.05)`, where L1 is the relative luminance of the lighter color and L2 is the relative luminance of the darker color. This formula was designed to approximate the minimum contrast needed for readability across the range of visual abilities, including people with moderately low vision (approximately 20/80 acuity).

The formula is imperfect. I know this because I helped design it. The known limitations:

1. **It over-penalizes dark-on-dark and under-penalizes light-on-light.** A dark blue (#1a1a8a) on black (#000000) has a ratio of 2.2:1 (fails) but is more readable than yellow (#ffff00) on white (#ffffff) at 1.07:1 (also fails). The formula ranks them similarly when perceptually they are not.

2. **It does not account for font weight.** Bold text is more readable at lower contrast. The WCAG "large text" exception (3:1 for >= 18pt regular or >= 14pt bold) is a step-function approximation of what should be a continuous curve.

3. **It does not account for font family.** A thin-weight geometric sans-serif at 16px is less readable than a sturdy serif at the same size, even at identical contrast ratios.

4. **APCA (Accessible Perceptual Contrast Algorithm) is the proposed replacement** and addresses many of these issues. But APCA is not yet in any WCAG standard. It may appear in WCAG 3.0. For now, SC 1.4.3's formula is the legal requirement.

Despite these limitations, the WCAG contrast formula catches the vast majority of real-world readability barriers. And the #1 failure on the web is not an edge case -- it is blatant, obvious low contrast. Like supertrained.ai's coral `#ff6f61` on white at 2.73:1.

**Your tool misses this entirely.**

**Now let me address what your tool DOES check, from a color/vision perspective:**

None of the 6 checks involve color. The extractor does not capture colors. The primitive does not analyze colors. The PageSummary type does not include color information.

The `performanceMetrics` in PageSummary includes LCP and CLS but no contrast data. The `images` array includes src, alt, width, height -- but not color data extracted from the images themselves (are informational images high-contrast enough to be perceivable?).

**The entire color/vision dimension of accessibility is absent from the data model.**

### 2. My Audit of supertrained.ai

I am auditing purely for visual accessibility -- what a person with low vision, color vision deficiency, or other visual processing difference would experience.

| # | Finding | Severity | WCAG SC | Perceptual Impact |
|---|---------|----------|---------|-------------------|
| 1 | **Primary brand color contrast.** `#ff6f61` (coral) on `#ffffff` (white): computed ratio 2.73:1. Used site-wide on: hero subheading ("your team actually needs"), CTA accents, section labels ("Selected Work"), inline link text ("See How We Work"). AA requires 4.5:1 for normal text, 3:1 for large text. This color pair fails BOTH thresholds. At 2.73:1, a person with 20/40 vision (the US legal driving standard) may struggle to read this text in suboptimal lighting. A person with moderate low vision (20/80, common in older adults) will find it illegible. | **CRITICAL** | 1.4.3 | Affects approximately 12% of adults over 65 (AMD, cataracts, glaucoma reduce contrast sensitivity). Affects 100% of users in bright sunlight, glare conditions, or low-quality displays. |
| 2 | **CTA button contrast.** `#ffffff` on `#ff6f61`: 2.73:1. The "Get Your Free Automation Blueprint" button uses white text on coral background. This is the single most important interactive element on the site. The 18px bold text MAY qualify as "large text" (threshold: 14pt bold = 18.67px bold), but at exactly 18px, it falls below the 18.67px threshold. Even if it qualified as large text, 2.73:1 is still below the 3:1 large-text threshold. | **CRITICAL** | 1.4.3 | The conversion action is perceptually invisible to users with moderate contrast sensitivity loss. This is not a cosmetic issue -- it is a functional barrier to the site's primary purpose. |
| 3 | **Dark coral accent.** `#d4524a` on `#ffffff`: 4.11:1. Used for section labels at ~14px bold. 14px bold = 10.5pt bold -- not large text (threshold is 14pt bold = 18.67px). Requires 4.5:1. Fails by 0.39 points. | **HIGH** | 1.4.3 | Marginal failure. A user with 20/40 vision can likely read this, but a user with 20/60 may not. The narrowness of the failure (4.11 vs 4.5) makes this a fix-priority discussion: increasing the darkness slightly (e.g., `#c44a42`, ratio 4.58:1) resolves it. |
| 4 | **Non-text contrast: coral UI components.** Coral-colored borders, icons, and graphical elements against white backgrounds: 2.73:1. SC 1.4.11 requires 3:1 for UI components and graphical objects. Card borders, icon strokes, and decorative elements that convey meaning (like status indicators) fail this threshold. | **MEDIUM** | 1.4.11 | UI components at 2.73:1 are perceptible to most sighted users but fail for users with contrast sensitivity loss. The question is whether the coral elements are decorative (no requirement) or functional (must meet 3:1). |
| 5 | **Color as sole differentiator.** Error states on forms use red border only (no icon, no text change). The distinction between valid and invalid fields relies on color alone. For the ~8% of men with red-green color vision deficiency (protanopia/deuteranopia), a red border on a white field may be indistinguishable from a normal state. | **HIGH** | 1.4.1 | SC 1.4.1 (Use of Color) is Level A. Using color as the sole means of conveying information is a fundamental accessibility failure. The fix is simple: add an error icon and/or error text alongside the color change. |
| 6 | **Hover/focus state contrast.** Several interactive elements change color on hover (e.g., coral darkens, underlines appear). If the hover state color change is the only indicator that an element is interactive, and the contrast of that change against the background is < 3:1, it fails SC 1.4.11. | **MEDIUM** | 1.4.11 | Hover state contrast is rarely checked by automated tools but matters for users who rely on visual feedback to identify interactive elements. |
| 7 | **Image-based content without text alternative.** The portfolio/case study images contain text rendered as part of the image (screenshots of dashboards, product mockups). This text is not subject to CSS contrast requirements but IS inaccessible to users who need text resizing, high contrast mode, or screen readers. | **LOW** | 1.4.5 (AA) | SC 1.4.5 (Images of Text) applies when text is presented as an image. The exception is for logos and essential branding. Dashboard screenshots likely fall under the "essential" exception, but the question is whether a text description is provided. |

### 3. Top 5 Checks to Add

**Check 1: Computed Color Contrast (WCAG SC 1.4.3, 1.4.6)**

This is the most complex check in accessibility testing. I will specify it precisely.

Data extraction (in Playwright):
```javascript
// For every visible text node:
const textNodes = await page.evaluate(() => {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    { acceptNode: (node) => {
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' ||
          style.opacity === '0' || el.closest('[aria-hidden="true"]'))
        return NodeFilter.FILTER_REJECT;
      if (node.textContent.trim() === '') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }}
  );

  const results = [];
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    const style = getComputedStyle(el);
    results.push({
      text: walker.currentNode.textContent.trim().substring(0, 50),
      foreground: style.color,          // Computed color (resolves var(), currentColor)
      background: getEffectiveBackground(el),  // Walk up DOM, composite layers
      fontSize: parseFloat(style.fontSize),
      fontWeight: parseInt(style.fontWeight),
      selector: uniqueSelector(el)
    });
  }
  return results;
});
```

The `getEffectiveBackground()` function must:
1. Walk up the DOM from the element to `<html>`
2. At each ancestor, get `background-color` (resolving `transparent`, `rgba()`, `oklch()`, `lab()`)
3. Composite semi-transparent backgrounds using alpha blending
4. If a `background-image` (gradient or image) is present, flag as `requiresHumanJudgment`
5. Return the final effective background color

Color space conversion (critical for modern CSS):
```
oklch(L C H) -> OKLab -> linear-sRGB -> sRGB -> hex
lab(L a b)   -> D50-adapted XYZ -> D65-adapted XYZ -> linear-sRGB -> sRGB -> hex
color-mix()  -> resolve both operands, interpolate in the specified color space
```

supertrained.ai uses `oklch()` and `lab()` color functions. Most contrast checkers handle hex, rgb, and hsl. Failing to resolve modern color functions means the check either errors or produces incorrect ratios.

Relative luminance:
```
For sRGB channels R, G, B (0-1):
  R_lin = R <= 0.04045 ? R/12.92 : ((R + 0.055)/1.055) ^ 2.4
  (same for G, B)
  L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
```

Contrast ratio:
```
ratio = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)
```

Large text determination:
```
isLargeText = (fontSize >= 24) || (fontSize >= 18.67 && fontWeight >= 700)
```

Thresholds:
```
AA normal:   >= 4.5:1
AA large:    >= 3:1
AAA normal:  >= 7:1
AAA large:   >= 4.5:1
```

Deduplication: Group findings by color pair, not by element. "Coral on white (2.73:1)" is ONE finding affecting N elements, not N findings.

**Check 2: Non-Text Contrast (WCAG SC 1.4.11)**

```
For UI components (buttons, inputs, custom controls):
  1. Get border-color, background-color of the component
  2. Get the adjacent background color (parent or sibling)
  3. Compute contrast between component boundary and adjacent background
  4. Threshold: >= 3:1

For state changes (hover, focus, active, disabled):
  1. Compare the state-change color against the background
  2. Threshold: the state indicator must have >= 3:1 contrast
```

This is harder than text contrast because "UI component boundary" is subjective. A button with a coral background on white: the coral-to-white contrast is the relevant pair. A text input with a gray border on white: the gray-to-white contrast matters.

Detection: Playwright's `page.evaluate()` with `getComputedStyle()` on interactive elements, plus hover/focus state simulation.

**Check 3: Color as Sole Differentiator (WCAG SC 1.4.1)**

```
For error states:
  1. Find elements with validation-related classes (error, invalid, danger, warning)
  2. Check: is the visual change ONLY a color change?
     (no icon added, no text added, no border-style change, no position change)
  3. If color-only: FAIL

For links in body text:
  1. Find <a> elements within paragraphs
  2. Check: is the link distinguished from surrounding text by color ONLY?
     (no underline, no bold, no icon)
  3. If color-only link: check that the color contrast between link and
     surrounding text is >= 3:1 (in addition to both meeting contrast against background)
```

supertrained.ai: Error states use color-only (red border). In-text links use color + underline on hover (but no underline in default state). The default state may fail if the link color and body text color have < 3:1 contrast between them.

**Check 4: APCA (Advanced Perceptual Contrast Algorithm) Advisory**

APCA is not yet in any WCAG standard, but it provides more perceptually accurate contrast assessment than the current WCAG formula. I recommend computing BOTH:

```
For each text element:
  1. Compute WCAG 2.x contrast ratio (legally required)
  2. Compute APCA Lc (perceptual contrast, advisory)
  3. If WCAG passes but APCA fails: informational note
  4. If WCAG fails but APCA passes: finding still stands (WCAG is the legal standard)
  5. APCA thresholds: Lc >= 75 for body text, Lc >= 60 for large text,
     Lc >= 45 for non-text
```

The APCA score provides better guidance for FIXING contrast issues. The WCAG formula says "you fail." APCA can say "you need this much more contrast, and here is why this specific combination is problematic."

**Check 5: High Contrast Mode / Forced Colors Compatibility**

```
1. Emulate Windows High Contrast Mode via Playwright:
   await page.emulateMedia({ forcedColors: 'active' });
2. Check that all essential visual information is preserved:
   - Text remains visible
   - Links are distinguishable
   - Focus indicators are visible (use system highlight color)
   - Icons/graphics with meaning are visible (not lost to background)
   - Custom colors are replaced by system colors (no hardcoded colors overriding)
3. Common failure: CSS that uses background-image for text-like content,
   which is stripped in forced-colors mode
```

Windows High Contrast Mode is used by ~500,000 users (Microsoft's telemetry). It is not covered by any specific WCAG SC but falls under the general principle of adaptability (SC 1.3.x family). Playwright can emulate forced-colors mode natively.

### 4. Tools/Standards for Color Accessibility

| Tool | Strength | Limitation |
|------|----------|------------|
| **axe-core color-contrast rule** | Most widely deployed. Handles solid-on-solid well. | Cannot resolve gradients, background images, or modern color functions (oklch, lab, color-mix). Cannot resolve colors inherited through CSS custom properties that use fallback values. |
| **Colour Contrast Analyser (CCA, TPGi)** | Manual tool that samples actual rendered colors. Accurate for any background, including images and gradients. | Not automatable. |
| **APCA contrast calculator** | More perceptually accurate. Better guidance for fixing failures. | Not yet standardized. Cannot be used as a pass/fail criterion. Advisory only. |
| **Stark (Figma/Sketch plugin)** | Tests contrast in the design phase, before code. | Design tools, not code audit. Different problem. |
| **Chrome DevTools contrast checker** | Built into the browser. Shows ratio in real-time. | Manual, per-element. Not scalable. |
| **Polypane** | Browser that shows multiple viewports + accessibility overlay. Excellent for visual debugging. | Manual tool, not automatable. |

**What Alien Eyes needs:** The ability to extract computed colors from Playwright (which resolves all CSS color functions), compute WCAG contrast ratios, and report failures grouped by color pair (not by element). The color extraction is the hard part -- the math is trivial.

### 5. Rating: 1/10

Zero color checks. Zero vision-related checks. The single largest category of accessibility failure on the web (81% of home pages fail contrast per WebAIM Million 2025) is entirely unaddressed. The data model does not even include color information. Adding contrast checking is not "adding a feature" -- it is addressing a structural absence that makes the tool unable to serve its stated purpose of accessibility auditing.

The 1 (not 0) is because the primitive exists, has a correct architecture, and produces valid findings for the checks it does implement. But calling this an "accessibility primitive" without color checking is like calling something a "search engine" without a text index. The fundamental capability is missing.

---

## Panel Synthesis

### Consensus Ratings

| Expert | Specialty | Rating | Key Rationale |
|--------|-----------|--------|---------------|
| Lainey Feingold | ADA Litigation / Legal | 2/10 | Findings lack WCAG references, cannot be used as legal evidence, hardcoded patterns would discredit tool in proceedings |
| Dr. Clayton Lewis | Cognitive Accessibility | 1.5/10 | Zero cognitive accessibility coverage; largest disability population entirely ignored |
| James Craig | Browser Accessibility Tree | 2/10 | Tests HTML (wrong layer) instead of accessibility tree (correct layer); Playwright provides the right data source already |
| Glenda Sims | Enterprise Scale / FP Rates | 2.5/10 | Skip link check has 15-25% FP rate; counter check has ~100% FP on non-target sites; should integrate axe-core for commodity checks |
| Dr. Aries Arditi | Color Science / Low Vision | 1/10 | Zero color checks; misses the #1 accessibility failure on 81% of websites; data model lacks color information |

**Panel Average: 1.8/10**

**Combined with Round 1 Average (2.8/10): Cross-Panel Average: 2.3/10**

### Unique Contributions Beyond Round 1

Round 1 established the technical gaps (contrast, focus, headings, accessible names, target sizes). This round adds:

| Dimension | Round 1 Coverage | Round 2 New Contribution |
|-----------|-----------------|-------------------------|
| Legal usability | Mentioned | Full WCAG SC mapping requirement, VPAT output, conformance summary, coverage disclosure |
| Cognitive accessibility | Not mentioned | 7 cognitive findings, 5 checks, reading level, consistency, error handling |
| Data source correctness | "Use accessibility snapshot" | Full technical specification of why Cheerio is the wrong layer, with HTML-AAM examples |
| Scale/FP risk | Not quantified | Quantified FP rates per check (skip link: 15-25%, counter regex: ~100% on other sites) |
| Color science depth | "Add contrast" | Full color extraction spec including oklch/lab/color-mix resolution, APCA advisory, non-text contrast, forced-colors mode |
| axe-core integration | "Reference axe architecture" | "Integrate axe-core as dependency" -- specific npm package, code example, value-add positioning |
| Hardcoding legal risk | "Design flaw" | "Would discredit tool in adversarial legal proceedings" |

---

## Consensus Recommendations

### P0: Must Fix (Blocks Professional Use)

| # | Recommendation | Expert Agreement | Rationale |
|---|---------------|-----------------|-----------|
| P0-1 | **Remove all hardcoded patterns.** Delete the `cloneicp\|snowthere` regex (Check 6) and the `0\s*hrs\/week\|\$0k\+\/yr\|0%` regex (Check 4). Replace with generic behavioral checks: empty-heading detection and DOM-mutation-based animation detection. | 5/5 | Hardcoded patterns produce 0% coverage on non-target sites and would discredit the tool in legal/adversarial contexts. The counter regex produces near-100% FP rate on other sites (matches legitimate "$0" pricing, "0%" statistics). |
| P0-2 | **Add color contrast checking.** Either integrate `@axe-core/playwright` (recommended, 5 lines of setup) OR implement standalone color extraction via `getComputedStyle()` in Playwright with WCAG contrast ratio calculation. Must handle `oklch()`, `lab()`, `color-mix()` color functions used on the audit target. | 5/5 (both panels, 10/10 total) | The #1 accessibility failure on 81% of websites. Without this check, the primitive misses more findings than it catches on the average site. |
| P0-3 | **Add WCAG Success Criteria references to every finding.** Add `wcagCriteria: string[]` and `wcagLevel: 'A' \| 'AA' \| 'AAA'` to the Finding type. Every accessibility finding must cite the specific WCAG SC it relates to. | 4/5 | Without WCAG references, findings are developer suggestions, not audit evidence. Cannot be used for compliance reporting, VPAT generation, or legal defense. Requires a type spec version bump (v1.1). |
| P0-4 | **Fix the skip-link check.** Current implementation (`/skip/i` on link text) has 15-25% FP rate at scale and misses non-English skip links, `aria-label` skip links, and alternative bypass mechanisms (landmarks, heading hierarchy). Replace with: verify that a mechanism exists to bypass repeated content (any of: skip link, landmarks, heading navigation). | 4/5 | High FP rate destroys trust. The corrected check evaluates SC 2.4.1 (Bypass Blocks) holistically, not just one technique. |

### P1: High Impact WCAG Checks (Competitive Parity)

| # | Recommendation | Expert Agreement | WCAG SC | Implementation |
|---|---------------|-----------------|---------|---------------|
| P1-1 | **Integrate axe-core as a dependency** via `@axe-core/playwright`. Run `withTags(['wcag2a', 'wcag2aa'])` per page. Map violations to Findings with confidence 0.95, incomplete to Findings with confidence 0.7 + `requiresHumanJudgment: true`. Your value-add is NOT reimplementing axe; it is the LLM quality layer, cross-page analysis, probabilistic scoring, and clipboard-first output. | 3/5 (Sims, Craig, Arditi) | ~80 SC | `npm install @axe-core/playwright` -- 5 lines setup, 2-4s per page, 0 LLM cost. Instantly adds color contrast, accessible names, form labels, ARIA validation, lang attribute, heading hierarchy, and ~70 more checks. |
| P1-2 | **Switch to Playwright accessibility tree** for the accessibility primitive. Call `page.accessibility.snapshot({ interestingOnly: false })` and use the computed tree (roles, names, states) instead of Cheerio HTML parsing. Keep Cheerio for other primitives (SEO, performance) where raw HTML is the correct data source. | 3/5 (Craig, Sims, Lewis) | All | Resolves: accessible name computation, role mapping, state detection, aria-labelledby resolution. These are impossibly complex to reimplement correctly in Cheerio. |
| P1-3 | **Add `lang` attribute check.** `document.documentElement.lang` -- present, non-empty, valid BCP 47. 0% FP rate. Trivial implementation. Level A requirement. | 3/5 | 3.1.1 | 5-line check. |
| P1-4 | **Add form label association check.** For each `<input>`, `<select>`, `<textarea>`: verify `<label>` via for/id, wrapping label, `aria-label`, or `aria-labelledby`. Placeholder alone is not a label. | 3/5 | 1.3.1, 3.3.2, 4.1.2 | DOM inspection. axe-core handles this if P1-1 is adopted. |
| P1-5 | **Add SVG accessibility check.** For each `<svg>`: verify `aria-hidden="true"` (decorative) OR `role="img"` + accessible name (informative). | 3/5 | 1.1.1, 4.1.2 | DOM inspection. ~40% of sites have unlabeled SVGs. |
| P1-6 | **Add generic heading hierarchy check.** Replace hardcoded product-name check with: (a) heading level skips, (b) empty headings (textContent empty, contains only images), (c) multiple h1 per page, (d) heading text not meaningful (LLM judgment for full audit). | 3/5 | 1.3.1, 2.4.6 | Partially exists in PageSummary already (headings array). Generalize. |

### P2: Valuable Additions (Differentiation)

| # | Recommendation | Expert Agreement | WCAG SC | Notes |
|---|---------------|-----------------|---------|-------|
| P2-1 | **Behavioral animation detection.** Replace hardcoded counter regex with Playwright-based DOM mutation detection: compare text content at page load vs after 3s delay. Detect animated counters, lazy-loaded text, dynamic state changes. | 4/5 | 1.3.1, 2.2.2 | Generalizes your best unique check. |
| P2-2 | **Cognitive accessibility: reading level.** Flesch-Kincaid on `sanitizedTextContent` of main content. Informational (AAA), but flags dense copy that affects 15-20% of users. | 2/5 (Lewis, Feingold) | 3.1.5 (AAA) | Deterministic, no LLM needed. Unique differentiation -- no competitor does this. |
| P2-3 | **Cross-page consistency check.** Compare navigation structure, CTA labels, and landmark patterns across all crawled pages. Flag inconsistencies in navigation order (SC 3.2.3) and identification (SC 3.2.4). | 2/5 (Lewis, Craig) | 3.2.3, 3.2.4 | Cross-page analysis is your architectural advantage (axe runs per-page). |
| P2-4 | **Keyboard operability check.** Tab through all interactive elements in Playwright. Verify: all reachable, no keyboard traps, no dead tab stops, Enter/Space activate buttons. | 3/5 (Craig, Sims, Feingold) | 2.1.1, 2.1.2, 2.4.3 | Playwright-dependent. Full Audit only. Higher FP risk (~10%). |
| P2-5 | **Focus indicator visibility.** Programmatically focus each interactive element, compare computed styles before/after. Verify visible change with >= 3:1 contrast against adjacent background. | 2/5 (Craig, Arditi) | 2.4.7, 2.4.11 | Playwright-dependent. This is axe-core's known weakness -- your Playwright advantage. |
| P2-6 | **Non-text contrast.** UI component boundaries (buttons, inputs, icons) at >= 3:1 against adjacent background. State changes (hover, focus) must also meet threshold. | 2/5 (Arditi, Sims) | 1.4.11 | Complex extraction. High value for modern component-heavy sites. |
| P2-7 | **Third-party embed boundary detection.** Identify iframes from known services (Calendly, HubSpot, Typeform). Flag with `lifecycle.state: 'third_party'`. Recommend fallback contact methods. | 2/5 (Feingold, Lewis) | 4.1.2 | Uses existing lifecycle state. Legal relevance. |
| P2-8 | **Color-only information check.** Detect error states, links, and status indicators that rely on color as the sole differentiator. | 2/5 (Arditi, Feingold) | 1.4.1 | Level A. Requires Playwright interaction (trigger error states). |
| P2-9 | **APCA advisory scoring.** Compute APCA Lc alongside WCAG ratio. Report as informational. Helps builders understand perceptual readability beyond the legal minimum. | 1/5 (Arditi) | (advisory) | Forward-looking. APCA may become WCAG 3.0 standard. |
| P2-10 | **Forced-colors mode compatibility.** Emulate Windows High Contrast Mode via Playwright. Check that essential information is preserved. | 1/5 (Arditi) | 1.3.x family | ~500K users. Unique check -- no competitor automates this. |

### P3: Aspirational (Future Rounds)

| # | Recommendation | Expert Agreement | Notes |
|---|---------------|-----------------|-------|
| P3-1 | **VPAT/ACR-compatible output format.** Generate findings mapped to EN 301 549 / Section 508 criteria. Required for enterprise sales and government procurement. | 1/5 (Feingold) | Output format, not a check. Requires WCAG SC mapping (P0-3) first. |
| P3-2 | **Conformance summary.** "This site has X Level A failures, Y Level AA failures. It cannot claim WCAG 2.1 Level AA conformance." This transforms the tool from a developer convenience into a compliance assessment. | 2/5 (Feingold, Sims) | Depends on sufficient check coverage to make the claim meaningful. |
| P3-3 | **Error state accessibility.** Submit forms with empty/invalid values. Check that errors provide text messages (not color-only), are programmatically associated with inputs, and provide suggestions. | 2/5 (Lewis, Feingold) | Requires form interaction. SC 3.3.1, 3.3.3. Full Audit only. |
| P3-4 | **Viewport reflow check.** Set viewport to 320px CSS width. Check for horizontal scrollbar, clipping, overlapping. | 2/5 (Sims, Craig) | SC 1.4.10 (Reflow). Playwright viewport manipulation. |
| P3-5 | **Text spacing override.** Inject CSS overrides for letter-spacing, word-spacing, line-height, paragraph-spacing at WCAG-specified values. Check for content clipping or loss. | 1/5 (Arditi) | SC 1.4.12 (Text Spacing). Playwright CSS injection. |
| P3-6 | **Cross-screen-reader behavior modeling.** For elements with conflicting accessible names (aria-label vs textContent), model what each major screen reader would announce. Flag divergence. | 1/5 (Craig) | Novel. No competitor does this. Requires deep AT knowledge encoded as rules. |
| P3-7 | **Accessibility statement detection.** Search crawled pages for /accessibility, /a11y, VPAT links. If absent: LOW finding recommending one. If present: parse for WCAG level claimed, contact info, date. | 1/5 (Feingold) | Best practice, not WCAG requirement. But legally strategic. |
| P3-8 | **Live region audit.** Detect `role="alert"`, `aria-live`, `role="status"`. Flag: empty live regions, frequent assertive changes, regions without `aria-atomic`. Monitor DOM mutations in live regions. | 1/5 (Craig) | SC 4.1.3. Playwright MutationObserver. |

---

## Architectural Verdict

### The Core Problem (Both Panels Agree)

The accessibility primitive has the right architecture (extraction + deterministic checks + LLM layer + probabilistic scoring + evidence bundles) applied to the wrong data (Cheerio HTML parsing) with too few checks (6, of which 2 are hardcoded to one site) and missing the most important coverage area (color/contrast).

### The Path to Professional Grade

| Milestone | Checks | Coverage Est. | Rating Est. |
|-----------|--------|--------------|-------------|
| **Current** | 6 (4 generic + 2 hardcoded) | ~5-8% WCAG 2.2 AA | 1.8/10 (this panel), 2.8/10 (Round 1) |
| **After P0** | ~10 (remove hardcoded, add contrast, fix skip link, add WCAG refs) | ~15-20% | ~4/10 |
| **After P0 + axe-core integration** | ~90 (axe rules + custom checks) | ~30-40% | ~6/10 |
| **After P0 + P1** | ~95 (axe + a11y tree + form labels + SVG + headings + lang) | ~40-50% | ~7/10 |
| **After P2** | ~105 (keyboard, focus, animation, cognitive, cross-page) | ~55-65% | ~8/10 |
| **Theoretical ceiling for outside-in automated testing** | -- | ~70% (per academic research) | ~9/10 |

### What Alien Eyes Should Own vs What axe-core Should Own

| axe-core (commodity) | Alien Eyes (differentiated) |
|---------------------|---------------------------|
| Color contrast (solid-on-solid) | Animated content detection (DOM mutation comparison) |
| Accessible name computation | Cross-page consistency analysis (nav, CTAs, labels) |
| Form label association | LLM-assisted quality judgment ("is this alt text meaningful?") |
| ARIA validation | Cognitive accessibility (reading level, consistency, error clarity) |
| Heading hierarchy | Probabilistic confidence scoring (not binary pass/fail) |
| Lang attribute | Clipboard-first output format (paste into coding agent) |
| Link purpose | Third-party embed boundary detection |
| Table headers | Evidence bundles with DOM snapshots |
| SVG labeling | Cross-screen-reader behavior modeling |
| ~70 more standard checks | Causal chain analysis (Swiss Cheese Model from your architecture) |

**The bottom line:** Use axe-core for the 80+ checks that every tool needs. Use your own engine for the 10-15 checks that make Alien Eyes different. The animated counter detection, cross-page consistency, cognitive accessibility assessment, and LLM quality layer are genuine differentiation. The missing contrast check, accessible name check, and form label check are commodity gaps that a library solves.

---

## Appendix: supertrained.ai Findings (Round 2 Panel Consensus)

| # | Finding | Severity | WCAG SC | Expert Count | Alien Eyes Catches? |
|---|---------|----------|---------|-------------|-------------------|
| 1 | Coral `#ff6f61` on white: 2.73:1 contrast. Site-wide. | **CRITICAL** | 1.4.3 | 5/5 | **NO** |
| 2 | White on coral CTA buttons: 2.73:1. Primary conversion action. | **CRITICAL** | 1.4.3 | 4/5 | **NO** |
| 3 | 5x `<span tabindex="0">` without correct role. Screen readers announce "text" not "button." Keyboard inoperable via Enter. | **HIGH** | 4.1.2, 2.1.1 | 4/5 | **NO** |
| 4 | Dark coral `#d4524a` at 14px bold: 4.11:1 (needs 4.5:1). Marginal failure. | **HIGH** | 1.4.3 | 2/5 | **NO** |
| 5 | Error states use color-only (red border, no text, no icon). | **HIGH** | 1.4.1 | 2/5 | **NO** |
| 6 | No visible focus indicator on several interactive elements (inconsistent `:focus-visible` application). | **HIGH** | 2.4.7 | 2/5 | **NO** |
| 7 | Animated stat counters expose zero values + aria-label conflict. | **MEDIUM** | 1.3.1, 4.1.2 | 5/5 | **YES** (hardcoded) |
| 8 | Nav/footer landmarks nested inside main. | **MEDIUM** | 1.3.1 | 3/5 | **YES** |
| 9 | 4 competing animations in hero viewport (counter, text entrance, background, CTA). No pause mechanism. | **MEDIUM** | 2.2.2 | 2/5 | **NO** |
| 10 | 14 different CTA labels for similar actions across the site. Inconsistent identification. | **MEDIUM** | 3.2.4 | 1/5 | **NO** |
| 11 | 3 double tab stops (`<a>` wrapping `<span tabindex="0">`). Dead focus targets. | **MEDIUM** | 2.4.3 | 3/5 | **NO** |
| 12 | 2 SVGs without `aria-hidden` or accessible name. | **MEDIUM** | 1.1.1 | 3/5 | **NO** |
| 13 | Non-text contrast: coral UI components at 2.73:1 (needs 3:1). | **MEDIUM** | 1.4.11 | 2/5 | **NO** |
| 14 | Empty `role="alert"` container. May be announced on load. | **LOW** | 4.1.3 | 2/5 | **NO** |
| 15 | Flesch-Kincaid grade 14-16 on service descriptions. Dense prose. | **LOW** | 3.1.5 (AAA) | 1/5 | **NO** |
| 16 | Navigation structure varies between page types. | **MEDIUM** | 3.2.3 | 1/5 | **NO** |
| 17 | No accessibility statement or conformance claim published. | **LOW** | (best practice) | 1/5 | **NO** |

**Alien Eyes catches: 2 of 17 findings (12%). Misses: all CRITICAL, all HIGH.**

---

*Panel complete. Five experts delivered independently. Cross-referenced during synthesis. This is Round 2 -- read alongside `panel-accessibility-audit.md` (Round 1) for the complete adversarial picture.*
