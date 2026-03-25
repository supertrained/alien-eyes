# Alien Eyes — Expert Panel Round 2: Surface Coverage Analysis

> Date: 2026-03-11
> Panel: 7 abstract/adjacent experts on external testing and quality auditing
> Question: Have we thought deeply enough about ALL the endpoints/surfaces Alien Eyes needs to test?
> Format: Each expert provides structured analysis from their discipline
> Commissioned by: Product owner, pre-implementation

---

## Expert 1: Kai Lindqvist — Penetration Tester (OAST/Black-Box), 16 years

### Perspective

In offensive security, the first thing we do before testing anything is **attack surface enumeration** -- and it is never, ever the same as what the client thinks their attack surface is. The client says "test our website." We discover that their website has a staging subdomain with default credentials, a forgotten API on port 8443, an admin panel exposed through a predictable path, three orphaned S3 buckets referenced in JavaScript, and a WebSocket endpoint nobody documented. The gap between "what they think is exposed" and "what is actually exposed" is where nearly all critical findings live.

This is the core methodology of OAST (Out-of-Band Application Security Testing) tools like Burp Collaborator and ProjectDiscovery's Interactsh: you interact with a target and listen for callbacks from services you didn't know were there. The target sends a DNS lookup to your controlled domain, and suddenly you know about an SSRF you didn't explicitly test for. The surface reveals itself through interaction.

External-only testing is not a limitation -- it is a discipline. OWASP ASVS Level 1 is entirely external. The PTES (Penetration Testing Execution Standard) distinguishes clearly between what you can find externally and what requires source access, and both are rigorous. What matters is being honest about which category each finding belongs to.

### What Alien Eyes is Getting Right

1. **The separation of concerns thesis is correct.** In offensive security, the reason third-party pen tests exist is precisely because the builder cannot test their own product objectively. Alien Eyes' core thesis maps directly to the reason pen testing as an industry exists.

2. **Clean browser profiles per audit.** This is excellent. State contamination is a real source of false positives and false negatives in web application testing. Burp Suite has "New Browser Session" for exactly this reason.

3. **SSRF defense as Day 1.** URLValidator with DNS pre-resolution, private range blocking, and anti-rebinding is the correct pattern. Most tools ship this as a patch after an incident. Having it from Day 1 puts you ahead of most commercial scanners.

4. **Evidence bundles.** In pen testing, a finding without proof is not a finding. The requirement for DOM snapshot hash, screenshot, timestamp, and reasoning chain maps directly to pen test reporting standards (OWASP Testing Guide v4 Section 4).

5. **Ownership verification for security findings.** This prevents the tool from being weaponized as a free reconnaissance platform. This exactly mirrors how HackerOne and Bugcrowd scope engagements.

### What Alien Eyes is Missing

1. **Subdomain and asset enumeration is completely absent.** When you receive a URL, you test that URL. But the builder's real attack surface includes subdomains (staging.example.com, api.example.com, admin.example.com), alternate ports, and services referenced in the page's JavaScript, DNS records, and certificate transparency logs. Tools like Subfinder, Amass, and crt.sh find these programmatically. A builder who doesn't know staging.example.com is publicly accessible can't fix what they don't know is exposed.

2. **No secrets-in-transit detection.** You capture network requests but only log "type/category, NOT request/response bodies." This is the right default for privacy, but it means you will miss API keys, tokens, and credentials transmitted in URL parameters, authorization headers to third-party services, and leaked cookies. At minimum, pattern-match on common API key formats (sk_live_, AKIA, ghp_, etc.) in outbound request URLs without storing the full body.

3. **No JavaScript source analysis.** Many critical exposures live in bundled JS: hardcoded API keys, Firebase configs with overly permissive rules, commented-out debug endpoints, internal API base URLs, and source maps that expose the full unminified codebase. Tools like RetireJS detect known vulnerable libraries from the JS bundle. Trufflehog and GitLeaks detect secrets in source. You can do this deterministically, no LLM needed.

4. **WebSocket and SSE endpoints are invisible.** Your CrawledPage captures network requests but categorizes them as standard HTTP types. WebSocket connections (ws:// / wss://) and Server-Sent Events are a distinct surface. Many modern apps use WebSockets for real-time features, and they have their own security model (no CORS, no CSP coverage, authentication often handled differently).

5. **The "tested" vs "secure" distinction needs explicit framing.** You test 6 dimensions but only one is "Security Surface," and it is scoped to external-visible headers and cookies. This is honest, but the framing needs to be extremely clear in output: "We tested external security signals. This is NOT a penetration test. This is NOT a vulnerability assessment." Without that framing, a builder who gets a clean security score may develop a false sense of security.

### Novel Surface Types to Add

1. **DNS configuration audit.** DMARC, SPF, DKIM records (email spoofing defense), DNSSEC status, CAA records (certificate authority authorization), dangling CNAME records (subdomain takeover vector). All deterministic, no LLM, externally observable, and frequently misconfigured. Tools: dig, dns-recon, MX Toolbox methodology.

2. **Certificate transparency log analysis.** Query crt.sh for the domain. You get every certificate ever issued, which reveals: subdomains the builder may not know are public, wildcard certificate usage patterns, certificate expiry timelines, and CA choice. Deterministic, free, and often revelatory.

3. **Source map exposure check.** If .map files are publicly accessible, the builder's entire unminified source code is public. This is a LOW finding on its own but becomes CRITICAL when combined with secrets in source. Deterministic check: request {bundle-name}.js.map and see if it returns 200.

4. **robots.txt and sitemap.xml as intelligence.** You already check these for SEO, but they also reveal: hidden admin paths (Disallow: /admin), internal API routes, staging environments referenced in sitemaps, and the delta between what robots.txt blocks and what is actually accessible.

### Anti-Patterns to Avoid

1. **"Comprehensive" security testing from the outside is a lie.** Do not claim or imply full security coverage. External scanning catches maybe 15-20% of real vulnerabilities (OWASP estimates vary). The danger is a builder who gets a "90/100 Security" score and believes their app is secure. Frame the dimension as "Security Signals" or "Security Hygiene," not "Security."

2. **Don't test in production without explicit consent for anything beyond passive observation.** Your Principle 7 (gentle by default) is correct, but I'd go further: define a strict boundary between passive observation (reading headers, checking certificates, analyzing JS) and active interaction (submitting forms, testing auth, navigating user flows). Active interaction should always require verification.

3. **Don't aggregate security findings into a single score.** A site can have 9/10 security headers correct and one CRITICAL exposed admin panel. The score is 90 but the site is compromised. Use pass/fail for security, or at minimum, never let LOW/MEDIUM findings compensate for CRITICAL ones in a composite score.

### One Insight That Changes the Architecture

**You need a "discovery" phase before the "audit" phase.** Currently, the pipeline is URL --> Crawl --> Primitives --> Synthesis. It should be URL --> Discover --> Crawl --> Primitives --> Synthesis. The Discover phase enumerates: subdomains (via DNS + CT logs), referenced API endpoints (via JS analysis), exposed configuration files (.env, .git/HEAD, wp-config.php.bak), and linked third-party services. This discovery phase feeds the crawl engine with additional targets the builder may not know about. It costs almost nothing (DNS queries + a few HTTP HEAD requests), runs in under 10 seconds, and catches an entire category of findings that a URL-only crawl will structurally miss. In pen testing, we call this "reconnaissance," and it is typically where 40-60% of critical findings originate -- not from testing the app, but from discovering surfaces the client forgot existed.

---

## Expert 2: Margot De Vries — Mystery Shopping Industry Veteran, 22 years

### Perspective

I spent 22 years building and managing mystery shopping programs for brands from McDonald's to Harrods to the NHS. The thing outsiders never understand about mystery shopping is that the assessment itself is the easy part. The hard part is everything around it: assessor calibration, scenario rotation, gaming prevention, longitudinal tracking, and the political dynamics of how organizations receive and weaponize quality scores.

Mystery shopping is fundamentally about measuring the gap between what an organization promises and what a customer actually experiences. We don't test against a specification. We test against the experience the brand claims to deliver. If the website says "response in 24 hours" and you don't hear back for 72, that's a finding -- not because 72 hours is inherently wrong, but because the promise was 24.

The most important lesson from 22 years: **a single assessment is almost worthless for measuring quality. Quality is a trend, not a snapshot.** A restaurant can have a bad Tuesday. A builder can have a bad deploy. What matters is whether the trend is improving, stable, or degrading. Point-in-time assessments create a false sense of precision.

### What Alien Eyes is Getting Right

1. **The scenario grammar is the single best architectural decision in this product.** In mystery shopping, scenario rotation is what prevents gaming. Our programs generate unique visit briefs from composable elements (day of week, time of day, customer type, product category, complaint vs no complaint). Your 5-axis grammar with 27,440+ configurations is exactly this pattern. The anti-gaming properties you describe (non-predictable, evolving, adaptive) are the properties every good mystery shopping program has.

2. **Hiding the methodology from the subject.** Principle 2 (show findings, never methodology) is the cardinal rule of mystery shopping. The moment the employee knows the exact checklist, they perform to the checklist, not to the customer. Your scenario-blind findings are correct.

3. **The re-audit as a first-class product.** In mystery shopping, the follow-up visit is where the real value emerges. Did the training work? Did the process change? Alien Eyes' re-audit loop is structurally identical to what we call "trend assessment."

4. **Celebration-first results.** We learned this the hard way in healthcare mystery shopping: if you lead with failures, the staff become hostile to the program and start gaming it defensively. Leading with "what's working well" creates psychological safety for the recipient. Your CelebrationSection in SynthesisResult is correct.

### What Alien Eyes is Missing

1. **Assessor calibration is completely absent.** In mystery shopping, different assessors will rate the same experience differently. We solve this with calibration: assessors evaluate the same standardized scenarios, and their scores are compared. Outliers are retrained or removed. Your "assessors" are LLM prompts, and they will exhibit the same variance. You plan Gauge R&R (10 sites, 3 times each), which is good, but you need ongoing calibration, not just a one-time pre-alpha check. Every methodology version change requires recalibration. Study the MSPA (Mystery Shopping Providers Association) calibration standards.

2. **You're missing the "promise vs delivery" dimension entirely.** Your 6 dimensions all measure absolute quality. None measure whether the product delivers what it claims. If the homepage says "blazing fast," and the site loads in 4.2 seconds, that's not a performance finding (4.2s is "needs work" but not terrible) -- it's a truth-in-advertising finding. The gap between claimed experience and actual experience is often the most actionable finding category for builders. In my world, we call this "service promise alignment."

3. **No longitudinal assessment infrastructure.** You have re-audit, but you don't have a framework for interpreting trends. Is a score drop from 78 to 73 meaningful, or is it measurement noise? In mystery shopping, we use statistical process control (SPC) charts with upper and lower control limits. A score within control limits is "normal variation." A score outside is a "signal." Without this, builders will panic over noise and ignore real trends.

4. **Time-of-day and day-of-week effects are unaccounted for.** Your Axis 5 (Adversarial Condition) tests network speed and browser conditions, but not temporal conditions. Websites behave differently during traffic peaks (Monday morning) vs troughs (Sunday 3am). CDN behavior varies, database responses slow, rate limiters activate. A single-time-point audit will miss performance degradation that only manifests under load.

5. **The relationship dynamics of assessment are unaddressed.** In mystery shopping, the biggest risk is not inaccurate assessment -- it's the organization using the assessment as a weapon. Managers use bad scores to fire employees. Franchise owners use scores to bully operators. Your "consultant" persona (Craig) will use Alien Eyes reports to justify billing increases. Your "non-technical founder" (Raymond) will use them to pressure agencies. These are legitimate uses, but Alien Eyes needs to consider how its output will be used in adversarial contexts between parties. The framing of findings affects this: "your agency shipped a site with critical SEO issues" vs "the site has critical SEO issues that should be addressed" -- same finding, very different political implication.

### Novel Surface Types to Add

1. **Promise fulfillment audit.** Crawl the marketing copy, extract promises ("99.9% uptime," "response in 24 hours," "works offline," "GDPR compliant," "SOC 2 certified"), then test each one. Does the uptime monitoring confirm 99.9%? Does the contact form get a response in 24 hours? Does it work offline? Is there actually a GDPR page with meaningful content? Is the SOC 2 badge real or decorative? This is a dimension no automated tool currently measures, and it is the highest-signal dimension for non-technical evaluators like Raymond.

2. **Competitor comparison surface.** In mystery shopping, we always benchmark against competitors. The builder's site doesn't exist in isolation -- it exists in a market. "Your page loads in 3.2 seconds" means nothing. "Your page loads in 3.2 seconds; the average in your category is 1.8 seconds" means everything. Your cross-product pattern database (ADR-016) enables this, but you're not positioning it as a customer-facing feature.

3. **Support channel audit.** Submit a test inquiry through the contact form, chatbot, or support email. Measure response time, response quality, and whether the response actually addresses the question. In mystery shopping, the support interaction is often the most revealing assessment point. Your "gentle by default" principle may conflict here -- submitting a support request is active interaction. But with ownership verification, it becomes legitimate.

### Anti-Patterns to Avoid

1. **Do not sell "improvement" when you can only measure "state."** Mystery shopping programs that promise "we'll improve your scores" fail because the scores are the measurement, not the intervention. Alien Eyes measures quality. It does not improve quality. The builder's coding agent improves quality. Keep this distinction sharp in all messaging.

2. **Beware the "assessment arms race."** Once builders know the dimensions, they optimize for the dimensions. This is fine at first -- that's the point. But eventually, they optimize the metrics while the underlying experience degrades. Goodhart's Law is your biggest long-term risk. Your 30% exploratory scenarios per audit are the mitigation, but you should also rotate which sub-checks within a dimension are emphasized across audits.

3. **Never release raw scores without confidence context.** A score of "73" implies false precision. "70-76 (likely range)" is honest. Your confidence intervals in SynthesisResult are correct, but they need to be the default display, not a tooltip that experts click into.

### One Insight That Changes the Architecture

**You need a "promise extraction" primitive that runs before scoring.** Currently, your primitives evaluate the product against your methodology's definition of quality. But the most powerful findings come from evaluating the product against its OWN claims. This means adding a pre-scoring step: crawl the homepage and marketing pages, extract explicit and implicit promises (performance claims, feature claims, compliance claims, support commitments), and then test each promise. A "Promise Fulfillment" dimension would be the single most differentiating feature Alien Eyes could offer, because no automated tool does it, every human evaluator does it instinctively, and it directly addresses Raymond's core need: "Is what I was told about this product true?" This requires an LLM to extract promises from marketing copy and a structured verification pipeline to test them -- but the architecture is already designed for exactly this kind of primitive.

---

## Expert 3: Ines Cardoso — Film/TV Test Screening Coordinator, 14 years

### Perspective

I've coordinated test screenings for studios including A24, Focus Features, and Netflix. A test screening is not a quality check -- it is a measurement of audience experience over time. We don't ask "is this film good?" We ask: "At minute 47, did the audience understand what the protagonist's motivation was? At minute 72, were they emotionally engaged or checking their phones? Did they leave the theater wanting to recommend it?" The film hasn't changed. The audience's journey through it is what we measure.

The single most important thing I've learned is that **comprehension and satisfaction are different measurements, and they often diverge.** An audience can understand a film perfectly and hate it. An audience can be confused by a film's plot and love the experience. Measuring only one gives you a dangerously incomplete picture. The same principle applies to digital products: a user can understand exactly how to use your app and find the experience terrible, or they can be slightly confused by the navigation but love the product anyway.

We also learned that **first impressions are disproportionately durable.** If the audience is confused in the first 10 minutes, their experience of everything that follows is colored by that confusion -- even if the confusion is resolved. The film screening world calls this "front-loading": the beginning of the experience sets the emotional frame for everything after it.

### What Alien Eyes is Getting Right

1. **The verbatim narrative (Stolen Mechanism #5) is the most undervalued element of your product.** In film testing, the free-response cards are always more valuable than the rating cards. A viewer writes "I didn't understand why Sarah went back to the house" and that tells us more than a 3/5 rating on "plot clarity." Your plan for first-person simulated user narratives is the equivalent, and it will produce insights that structured findings miss.

2. **The persona composition in the scenario grammar.** Different audiences experience the same film differently. Your 10 personas on Axis 1 create different "audience compositions" for each audit, which will surface different findings. The screen-reader-user and the first-time-visitor will have fundamentally different experiences of the same product, just as a 22-year-old college student and a 55-year-old retired teacher have different experiences of the same film.

3. **Celebration-first design.** In film testing, we never start with "here's what's wrong with your film." We start with "84% of the audience said they would recommend this film." Then we discuss the 16%. Your CelebrationSection mirrors this structure.

### What Alien Eyes is Missing

1. **You measure state but not journey.** Your primitives evaluate pages and features independently: "this page has an accessibility issue," "this page has an SEO gap." But the user doesn't experience pages -- they experience a journey. The flow from homepage to pricing to signup to first use is a narrative arc with emotional beats. A signup form that works perfectly in isolation but is reached after 6 clicks through confusing navigation is a terrible experience, even though the form itself is fine. You need a "journey assessment" that evaluates multi-page flows as a continuous experience, not a collection of page-level findings.

2. **No "emotional beat" tracking.** In film testing, we use dial testing (real-time audience satisfaction meters) to track emotional engagement moment by moment. The digital equivalent: how does the user's likely emotional state change as they move through the product? Do they start confident, become confused at the pricing page, regain confidence at the testimonials, then hit a dead end at signup? Your Copy & UX dimension catches individual issues but doesn't model the emotional arc of the experience.

3. **First-impression bias is not accounted for.** You test with 10 personas, but all of them presumably encounter the product from scratch on each audit. The first 5-7 seconds of the homepage experience dominates everything that follows. Yet I don't see a specific primitive that isolates and measures that first impression -- the "above the fold in 5 seconds" check exists in your Copy & UX rubric, but it should be elevated to its own measurement because of how disproportionately it affects everything downstream.

4. **No audience composition effects.** In film screening, we learned that WHO is in the room matters as much as what's on screen. A comedy screening with 80% comedy fans tests differently than one with 50% comedy fans. Your persona selection per audit is random or adaptive, but you're not modeling how the combination of personas affects the composite score. A product that serves mobile users beautifully and screen-reader users terribly gets a middling accessibility score -- but for a screen-reader user, the product is broken. Composite scores obscure segment-specific failure.

5. **"Preview fatigue" equivalent.** In film, if you screen the same cut too many times, the feedback becomes about the screening process, not the film. Your re-audit loop has the same risk: if a builder re-audits weekly, they stop fixing findings and start disputing them because they've internalized the output format rather than the product's actual quality. Track dispute rates over time per builder -- rising dispute rates with stable finding counts is a signal of assessment fatigue, not improving quality.

### Novel Surface Types to Add

1. **Onboarding flow audit as a first-class surface.** Not "does the signup form have labels" (accessibility) but "can a first-time user go from landing page to first meaningful action in under 3 minutes?" This is the equivalent of our "first 10 minutes" measurement and is the single highest-impact journey to test. It requires multi-page state tracking through the crawl, which your current CrawlResult supports but your primitives don't exploit.

2. **Emotional arc visualization.** Generate a timeline of the user journey with emotional annotations: "Confident (clear value prop) --> Confused (pricing page has no prices listed) --> Frustrated (signup requires phone number) --> Abandoned." This is the verbatim narrative made visual. It would be the single most shareable output format -- a journey map that tells a story.

3. **"Would they come back?" assessment.** In film, the ultimate metric is "would you recommend this to a friend?" For digital products, the equivalent is: "Based on this first visit, would this user return?" This is a judgment call that an LLM can make from the journey data, and it is the highest-level quality signal a builder can receive.

### Anti-Patterns to Avoid

1. **Do not let the scoring system flatten journey failures into page-level findings.** "The signup form is missing aria-label" is a page-level finding. "The signup flow is inaccessible to keyboard users" is a journey finding. The second is more useful but harder to generate. Resist the gravitational pull toward atomic findings that are easy to score but miss systemic issues.

2. **Do not assume comprehension means satisfaction.** A user who can navigate your product perfectly might still have a terrible experience if the tone is condescending, the aesthetic is dated, or the product feels untrustworthy. These are "vibes" -- and vibes drive purchasing decisions more than functionality for many user segments (Jaylen, Yuki).

3. **Do not test the same way every time.** In film screening, we rotate audience recruitment, screening venues, time of day, and pre-screening materials. Identical conditions create overfitting. Your scenario grammar handles this well, but ensure the adversarial conditions (Axis 5) actually rotate meaningfully -- not just theoretically.

### One Insight That Changes the Architecture

**You need a "journey" data type alongside your "page" data type.** Currently, your data model is CrawlResult (pages) --> PageSummary (per page) --> Finding (per page per dimension). But the most valuable findings span multiple pages: "the path from pricing to signup has 3 unnecessary steps," "the mobile user loses context when navigating from the blog to the product page because the navigation collapses differently." You need a `Journey` type that represents a sequence of pages experienced as a flow, with transition points, time estimates, and emotional annotations. This doesn't replace page-level analysis -- it adds a layer above it. Every primitive that currently runs on PageSummary should also be able to run on Journey[], where a Journey is something like `{ pages: PageSummary[], transitions: Transition[], intent: string, persona: string }`. The verbatim narrative and the emotional arc visualization both generate from Journey data, not from isolated page data. This is the equivalent of editing a film scene by scene vs evaluating the film as a narrative arc -- you need both.

---

## Expert 4: Dr. Hamid Nazari — Clinical Trial Biostatistician, 19 years

### Perspective

I design clinical trials for Phase II and III drug development. My job is to answer the question: "Does this intervention produce a real effect, or are we seeing noise?" Everything in my field is designed to prevent self-deception. Randomization, blinding, pre-registration, intention-to-treat analysis, multiplicity correction, independent data monitoring boards -- every mechanism exists because humans are extraordinarily good at finding patterns that aren't there, especially when they want the intervention to work.

The fundamental challenge of measurement is this: **you cannot improve what you cannot reliably measure, and most things that matter cannot be reliably measured by a single observation.** A blood pressure reading taken once tells you almost nothing. Taken 10 times across 5 days, a pattern emerges. Taken 50 times across a population with a control group, you have evidence. Alien Eyes is attempting to measure "product quality" from a single observation. I don't say this to be dismissive -- single observations have value, and a screening test is not a diagnostic. But the architecture must be honest about what a single observation can and cannot tell you.

Clinical trials distinguish between **primary endpoints** (what you're actually trying to prove) and **secondary/exploratory endpoints** (interesting additional measurements). Everything is pre-specified. You cannot change your primary endpoint after seeing the data. This discipline is what Alien Eyes' pre-registered methodology borrows, and it is the right instinct.

### What Alien Eyes is Getting Right

1. **Pre-registration of methodology (Stolen Mechanism #6).** This is the single most credibility-building decision in the entire product. In clinical trials, a pre-registered trial is trustworthy; an unregistered trial is suspicious. By publishing what you measure and how before audits run, you prevent yourself from unconsciously adjusting scoring to produce impressive results. This is rare in software tooling and should be prominently marketed to the Diana/Viktor/Dr. Mara personas.

2. **Confidence intervals on scores.** Scores without uncertainty bounds are misleading. Your Score type with `{ value, confidenceLow, confidenceHigh }` is correct. Most competitor tools report point estimates ("SEO score: 73") which imply false precision.

3. **Conservative severity classification.** "When severity classification is ambiguous, always classify DOWN." This is the statistical principle of specificity over sensitivity: it is better to miss a true finding (false negative) than to report a false finding (false positive) when the consumer will take automated action on the finding.

4. **False positive rate tracking by primitive.** Per-primitive FP tracking with a review trigger at 20% is a form of statistical process control. In clinical trials, we call this interim monitoring with futility boundaries.

### What Alien Eyes is Missing

1. **No multiplicity correction.** You run 6 dimensions, each with 5-12 checks. That's 40-70 individual tests. At a 10% false positive rate per check, you expect 4-7 false positives per audit by chance alone. This is the "multiple comparisons problem" (familywise error rate). In clinical trials, we use Bonferroni correction, Holm-Bonferroni, or false discovery rate (FDR) control (Benjamini-Hochberg) to manage this. Your current methodology does not account for it. With 70 checks at 10% FP rate, the probability of at least one false positive per audit is 99.9%. You are guaranteeing false positives in every audit. You need to either: (a) apply FDR control to the finding set before output, or (b) raise the confidence threshold for reporting as the number of findings increases.

2. **No validated measurement properties.** You've defined rubrics (what to measure) but not measurement properties (how reliable the measurement is). In psychometrics and clinical measurement, every instrument must demonstrate: test-retest reliability (same input, same output), inter-rater reliability (different assessors, same output), construct validity (does the measure correlate with the thing it claims to measure), and sensitivity to change (can it detect real improvement). Your Gauge R&R plan addresses test-retest, but the other three are unaddressed. Specifically: does your "satisfaction score" actually correlate with user satisfaction? You don't know yet, and you should be explicit about this.

3. **No "clinically significant" threshold.** In medicine, statistical significance (p < 0.05) is different from clinical significance (meaningful to the patient). A blood pressure reduction of 0.5 mmHg can be statistically significant with a large enough sample but is clinically meaningless. Similarly, a score change from 73 to 71 might be "detected" by your system but meaningless to the builder. You need a "minimum detectable effect" threshold: what score change is large enough to represent a real quality change vs measurement noise? Without this, builders will react to random variation.

4. **No equivalence testing.** You assume a lower score is worse. But sometimes the builder wants to know: "Is my site equivalent to the benchmark?" or "Did my deploy NOT make things worse?" This requires equivalence testing (TOST -- Two One-Sided Tests), which is a fundamentally different statistical question than "Is my site good?" It's the question CI/CD integration asks: "Is this deploy safe to ship?" Framing it as "score above threshold" is crude. Framing it as "score within equivalence margin of previous deploy" is rigorous.

5. **The confidence intervals are estimated, not measured.** You acknowledge this ("confidence intervals estimated from model temperature and finding type") but I want to emphasize how much this matters. Estimated confidence intervals are educated guesses. Measured confidence intervals (from multi-run data) are evidence. Until you ship 2-of-3 averaging (v0.2), your confidence intervals are decoration, not statistics. Say this clearly to users.

### Novel Surface Types to Add

1. **Regression detection surface.** Not "is this site good?" but "did this deploy make it worse?" This is the clinical trial's "non-inferiority" question. It requires a baseline audit, a post-deploy audit, and a statistical comparison that accounts for measurement noise. The output is binary: "Safe to ship" or "Regression detected in [dimension]." This is the CI/CD product, and it requires different statistics than point-in-time scoring.

2. **Dose-response analysis for progressive enhancement.** When a builder fixes 3 of 5 findings, does the score improve proportionally? Or is there a threshold effect (fixing the first 3 has no visible impact, but fixing the 4th produces a jump)? Understanding the dose-response relationship between fixes and scores would help builders prioritize. This is a secondary analysis on your existing re-audit data.

3. **Subgroup analysis by device/persona.** Your composite score averages across personas and conditions. But a product can score 85 for desktop first-time visitors and 35 for mobile screen-reader users. The composite (60) hides a critical failure for a specific subgroup. Report subgroup scores alongside the composite. In clinical trials, we always report subgroup analyses because the treatment may work for one population and harm another.

### Anti-Patterns to Avoid

1. **Do not report more decimal places than your measurement precision supports.** A score of "73.4" implies you can distinguish 73.4 from 73.5. You can't. Report whole numbers for single-run audits. Report to one decimal for multi-run averages.

2. **Do not use the word "significant" unless you mean it statistically.** "Significant improvement" in marketing copy is fine. "Significant improvement" in the audit report implies a statistical test was performed. Use "notable" or "meaningful" for qualitative language.

3. **Do not let users cherry-pick re-audit timing.** If a builder re-audits 10 times and publishes only the best score, the published score is biased. This is publication bias, the bane of clinical research. Consider publishing the most recent score, or the median of recent scores, not the best.

### One Insight That Changes the Architecture

**You need to separate screening (Quick Check) from diagnosis (Full Audit) not just by cost, but by statistical purpose.** In clinical medicine, a screening test is designed for high sensitivity (catch everything, accept some false positives). A diagnostic test is designed for high specificity (everything we report is real, accept some false negatives). Your Quick Check and Full Audit currently differ by dimensions included and LLM usage. They should also differ by statistical properties. Quick Check should maximize sensitivity: flag anything that MIGHT be wrong, even at higher FP rates, because the cost of a false positive is just "builder looks at something that's fine" and the cost of a false negative is "builder misses a real issue." Full Audit should maximize specificity: everything reported should be real, because the builder's coding agent is going to automatically fix it, and a false positive fix could break things. This means different confidence thresholds, different finding inclusion rules, and different severity calibration between the two tiers -- which is not currently in your methodology. The analogy is a mammogram (screening: catch everything) vs a biopsy (diagnostic: be certain). They measure the same thing but with fundamentally different error tolerances.

---

## Expert 5: Robert Adeyemi — Building Inspector / Code Inspector, 28 years

### Perspective

I've been a building inspector in various jurisdictions for 28 years, starting in residential construction and moving into commercial and mixed-use. The first thing people get wrong about inspection is conflating three things that are actually distinct: **code compliance**, **safety**, and **quality**. A building can be code-compliant (meets minimum standards), unsafe (the code has a known gap), and high-quality. Or it can be code-non-compliant, perfectly safe, and terrible quality. These three axes are independent, and an inspection that conflates them produces confused owners and bad decisions.

The second thing people get wrong: they think inspection happens once, at the end. In construction, inspection happens at every stage -- foundation, framing, rough electrical, rough plumbing, insulation, drywall, finish. Each inspection verifies the work that is about to be concealed. Once the drywall goes up, you can't see the wiring. Once the product ships, you can't see the architecture. The most valuable inspection is the one that happens BEFORE the work is hidden.

The third thing, and this is the one that keeps me up at night: **the inspector-builder relationship is inherently adversarial, even when both parties are honest.** The builder has financial incentive to pass. The inspector has professional incentive to find faults. When an inspector says "this passes," they're putting their license on the line. When I say a building is safe, I mean "safe enough that I will stake my career on it." This liability frame completely changes what I'm willing to certify.

### What Alien Eyes is Getting Right

1. **The "this passes code but is terrible" problem is your entire product thesis.** In construction, code is the minimum. A code-compliant building can have terrible air circulation, inadequate natural light, poor acoustic separation, and uncomfortable ergonomics -- all things the code doesn't require. Your argument that "passing tests doesn't mean the product is good" is the same insight. Lighthouse is code compliance. Alien Eyes is quality inspection.

2. **The ownership verification pattern.** In building inspection, I can only inspect properties I have jurisdiction over or the owner has authorized. Your requirement for ownership verification before security findings mirrors this exactly. I cannot (and should not) inspect my neighbor's house and publish the findings.

3. **Platform-limited findings (Principle 15).** This maps directly to what we call "pre-existing non-conforming conditions." A building built to the 1975 code isn't required to meet 2025 code unless renovated. Similarly, a Shopify site isn't "wrong" for having Shopify's limitations -- that's the platform the builder chose, and the findings should reflect what the builder can actually change.

4. **Finding lifecycle states.** In construction, a deficiency moves through states: identified, acknowledged, corrected, re-inspected, closed. Your lifecycle (detected -> delivered -> accepted/disputed/fixed -> verified) is the same workflow.

### What Alien Eyes is Missing

1. **No distinction between visible and hidden defects.** In construction, a crack in the drywall is a visible defect. Corroded wiring behind the drywall is a hidden defect. External-only testing can only find visible defects -- things observable from outside. But some of your most impactful finding categories (security, agent-nativeness) imply hidden defect detection that external testing cannot reliably accomplish. You need to be explicit about which findings are "visible defects" (deterministic, externally observable) and which are "inferred defects" (LLM judgment about what might be happening behind the interface). The confidence scoring partially addresses this, but the framing should be clearer.

2. **No inspection stages.** You audit the finished product. But the most valuable inspection in construction happens at the rough-in stage -- before things are hidden. The equivalent for software is auditing during development, not just after deployment. Your CI/CD integration (Phase 1/2) addresses this, but I'd argue it should be a core architectural concept: "pre-deploy inspection" and "post-deploy inspection" are fundamentally different inspection types with different finding categories, different severity weights, and different remediation paths.

3. **No occupancy load consideration.** A building passes inspection empty. Put 500 people in it and things change -- fire egress, HVAC capacity, structural load. Your audits test a product with zero users. Under load, the experience degrades: pages slow down, databases time out, rate limiters activate, CDNs behave differently. Load-conditional quality is invisible to your current architecture. I realize load testing is explicitly out of scope (Section 10), but the framing should acknowledge this as a known blind spot, not just an out-of-scope feature.

4. **No aging/degradation model.** Buildings deteriorate. Foundations settle. Roofing degrades. Plumbing corrodes. Digital products also degrade: SSL certificates expire, dependencies develop vulnerabilities, third-party services deprecate APIs, CDN configurations drift, DNS records become stale. Your point-in-time audit catches the current state but doesn't predict degradation. A finding like "your SSL certificate expires in 14 days" is a degradation prediction, not a current-state finding. Add degradation checks as a distinct finding type.

5. **No "condemned" threshold.** In construction, there is a point where a building is not just "needs work" but is unsafe to occupy. Your scoring goes down to 0-24 ("Critical") but there is no mechanism to say "this product should not be used." For cases where authentication is completely broken, where HTTPS is absent and the site collects PII, where the product is fundamentally deceptive -- there needs to be a hard threshold below which the finding is not "low score" but "unsafe." This matters especially for the Rhumb integration: an AN Score should have a "do not integrate" threshold, not just a graduated scale.

### Novel Surface Types to Add

1. **Dependency health audit.** Check the product's externally observable dependencies: are the JavaScript libraries known-vulnerable (RetireJS/Snyk DB)? Is jQuery 2.x still loaded? Are third-party services using deprecated API versions? Is the analytics script from a provider that's been acquired/deprecated? This is the digital equivalent of checking whether the building's electrical panel uses recalled breakers.

2. **Certificate and DNS health.** SSL certificate expiry, chain validity, protocol version (TLS 1.2 minimum), HSTS preload status, DNS propagation consistency, DNSSEC validation. These are "foundation" checks that affect everything built on top of them.

3. **Third-party service audit.** Enumerate all third-party services loaded on the page (analytics, chat widgets, CDN, fonts, ad networks). Check each one: is the service still actively maintained? Is the integration using a current API version? Are there known outages or deprecation notices? This is the equivalent of checking whether the building's elevator maintenance contract is current.

### Anti-Patterns to Avoid

1. **Never certify safety from an external inspection alone.** A building inspector who says "this building is safe" based on a visual walk-through is committing malpractice. An audit tool that implies "your product is secure" based on header checks is doing the same thing. Your security dimension should carry a permanent caveat: "This assessment covers external security signals only. It is not a security certification."

2. **Do not allow your scores to be used as certification without your consent.** In construction, an inspection report is a specific document with specific limitations. It is not a certificate of occupancy. If builders start displaying "Alien Eyes Score: 92" as a trust badge without context, you are liable for the impression this creates. Your "Tested by Alien Eyes" badge (Phase 3) needs to carry specific scope limitations, not just a number.

3. **Resist the temptation to expand scope into hidden-defect territory without changing your methodology.** The moment you start making claims about internal architecture quality from external observation, you cross from inspector to diagnostician, and your liability profile changes completely.

### One Insight That Changes the Architecture

**You need finding categories that distinguish "current defect," "emerging risk," and "degradation trajectory."** Currently, all findings are present-tense: "this is wrong now." But the most valuable findings in building inspection are future-tense: "this will fail within 6 months." In software, this means: SSL certificate expiring soon, JavaScript library with a CVE published last week, third-party service with a deprecation notice, DNS record pointing to a decommissioned IP, and dependencies that haven't been updated in 2+ years. These are not current defects. They are degradation signals. Adding a `temporalCategory` field to the Finding type -- `current_defect | emerging_risk | degradation_signal` -- would let builders prioritize differently. A current defect needs fixing now. An emerging risk needs a plan. A degradation signal needs monitoring. This temporal dimension also enables a killer feature for the continuous monitoring product (Phase 3): "Your SSL certificate was fine 30 days ago. It expires in 14 days. This is now an emerging risk." The degradation trajectory IS the monitoring product. Build the data model for it now, even though you won't ship monitoring until Phase 3.

---

## Expert 6: Dr. Sana Petrov — Automotive Crash Test Engineer, 17 years

### Perspective

I design and execute crash test protocols for vehicle safety assessment. My world is defined by two tensions: **standardization vs representativeness** and **laboratory conditions vs real-world conditions.** Euro NCAP, IIHS, NHTSA -- each rating system uses standardized test protocols so that vehicles can be compared fairly. But standardized tests, by definition, only cover the scenarios they test. A vehicle that scores 5 stars in Euro NCAP frontal offset can still be deadly in a side pole impact if the protocol doesn't include one. The consumer sees "5 stars" and thinks "safe." The engineer knows "5 stars in the scenarios we tested."

Crash testing also makes a fundamental distinction between **destructive testing** (we crash the car and it cannot be used again) and **non-destructive testing** (we inspect, measure, and simulate without damage). Alien Eyes is non-destructive -- you browse the product without changing it. This is a significant constraint. Many real-world failure modes only manifest under stress (load, concurrent users, edge-case inputs, unusual browser configurations). A car that passes a 40mph frontal offset test might fail catastrophically at 45mph. You can't know without testing at 45mph -- and you can't test at 45mph non-destructively.

The third principle from my field: **rating systems must be simultaneously rigorous enough for experts and simple enough for consumers.** Euro NCAP solved this with stars (consumers) backed by detailed sub-scores (experts). The star rating is what drives purchasing decisions. The sub-scores are what manufacturers engineer to.

### What Alien Eyes is Getting Right

1. **Dual scoring (human-native + agent-nativeness) is the right structural decision.** This is like Euro NCAP's separate scores for adult occupant, child occupant, pedestrian, and safety assist. Different stakeholders care about different sub-scores. A product that's excellent for humans but terrible for agents, or vice versa, needs both signals.

2. **Standardized methodology with versioning.** This is exactly how crash test protocols work. Euro NCAP 2020 protocol is different from 2025 protocol. Vehicles rated under the old protocol aren't directly comparable to vehicles rated under the new one. Your methodology versioning with archived old versions for reproducibility mirrors this pattern.

3. **The scenario grammar for anti-gaming.** In crash testing, manufacturers sometimes "tune" vehicles for specific test scenarios (positioning reinforcement exactly where the test barrier hits). Your composable scenario grammar prevents this kind of targeted optimization.

4. **Conservative severity classification.** In crash testing, we never round up. A vehicle that's borderline between 4 and 5 stars gets 4. This protects consumers from overconfidence and manufacturers from complacency.

### What Alien Eyes is Missing

1. **No "crash pulse" equivalent -- no measurement of degradation under stress.** Your Axis 5 adversarial conditions include slow network and JS disabled, which is excellent. But you don't test: concurrent requests from the same audit session (does the site rate-limit you?), rapid navigation (does state management break under fast page transitions?), form submission with boundary-case input (max-length strings, Unicode, empty required fields). These are non-destructive stress tests that reveal failure modes invisible under normal conditions. The automotive analogy: a slow-speed bump test reveals whether airbags deploy inappropriately (they shouldn't), which is a fundamentally different test than a high-speed impact.

2. **No "pedestrian safety" equivalent -- no assessment of impact on bystanders.** Your audit assesses the product's quality for its intended users. But digital products also affect non-users: email recipients who get spam from a compromised contact form, users of other products that embed this product's widget, search engines that index misleading structured data, and agents that integrate this product's API and then propagate its errors. The "blast radius" of a defect matters. A broken contact form is a finding. A broken contact form that sends confirmation emails to arbitrary addresses is a different severity entirely.

3. **No "sled test" equivalent -- no isolated component testing.** In crash testing, we don't only test the full vehicle. We test individual components on a sled: the seatbelt under load, the airbag deployment timing, the steering column collapse behavior. Your audit tests the full product. But could you also test individual components in isolation? A single API endpoint. A single form. A single user flow. This "component audit" mode would be faster, cheaper, and more useful for CI/CD ("I changed the signup form, just audit the signup form").

4. **Your rating system is not consumer-readable.** Euro NCAP invested enormous effort in making stars meaningful to consumers who don't understand structural deformation. Your scores are numbers (0-100) with labels ("Excellent," "Good," "Needs Work"). But numbers don't drive behavior the way visual ratings do. Raymond (non-technical founder) won't react to "73." He will react to a visual that immediately communicates "this needs attention in these 2 areas, and these 4 areas are fine." Consider a dimension-level visual system (pass/fail/warning per dimension) alongside the numerical scores.

5. **No "repeatability and reproducibility" protocol.** In crash testing, every test is run under controlled conditions with documented environmental variables (temperature, humidity, barrier construction). Your audits run in cloud environments where: CDN edge location varies, server response time varies, third-party resource loading varies, and network conditions vary. Two audits of the same site 5 minutes apart will produce different performance numbers. You need to document the environmental variables (audit location, browser version, network conditions, time of day) and either control them or account for them in the confidence interval.

### Novel Surface Types to Add

1. **Form resilience testing.** Submit each form with: empty required fields (do you get helpful errors?), maximum-length input (does it truncate or break?), special characters (do they cause XSS or display issues?), rapid double-submission (do you get duplicates?), back-button after submission (do you get a re-submission warning?). This is non-destructive (no persistent state change if forms require confirmation) and reveals an entire class of findings that page-level auditing misses.

2. **Error state auditing.** Navigate to deliberately wrong URLs (/asdfghjkl, /admin, /api/v1, /wp-admin). What 404 page do you get? Does it maintain navigation? Does it leak stack traces? Does it reveal technology stack? Submit API requests with wrong content types. Hit authenticated endpoints without auth. These are the digital equivalent of "what happens when things go wrong" -- and the quality of error handling is often the most revealing signal about overall product quality.

3. **Progressive enhancement testing.** Disable JavaScript, images, and CSS individually (not just JS-disabled as in your Axis 5). Does the product degrade gracefully or catastrophically? Can you still read the content? Can you still navigate? This is the "pedestrian safety" of web products: what happens to users on the margins of your target experience?

### Anti-Patterns to Avoid

1. **Do not let a high composite score obscure a failing sub-score.** In Euro NCAP, you can't get 5 stars overall if any sub-category falls below a threshold. A vehicle with excellent adult protection but poor pedestrian protection gets penalized. Your satisfaction score should have a similar floor: if any dimension is below 25, the composite cannot exceed 50, regardless of how good the other dimensions are.

2. **Do not compare scores across methodology versions without explicit caveat.** A 5-star car from 2015 might not pass the 2025 protocol. A "90" score under Alien Eyes v0.1 might be a "75" under v0.3 if the methodology gets more rigorous. Always display the methodology version alongside the score.

3. **Do not assume laboratory conditions represent reality.** Your clean browser profile is a laboratory condition. Real users have extensions, cached data, logged-in sessions, and browser histories. The clean profile eliminates variables but also eliminates the most common real-world usage pattern. Consider testing with a "typical user" profile (popular extensions, common screen resolutions, typical cached state) alongside the clean profile.

### One Insight That Changes the Architecture

**You need a "component audit" mode, not just a "full product audit" mode.** In crash testing, sled tests of individual components are cheaper, faster, and more targeted than full-vehicle crash tests. Similarly, Alien Eyes should support: `ae audit https://example.com/api/v1/users --surface api-endpoint` or `ae audit https://example.com/signup --surface form` or `ae audit https://example.com --surface homepage-only`. The scenario grammar would select from a reduced set of relevant scenarios. The finding set would be scoped. The cost would be a fraction of a full audit. This serves three use cases: (1) CI/CD ("audit just the thing I changed"), (2) debugging ("audit this specific endpoint that's causing issues"), and (3) the free tier ("quick-check just the homepage"). Your current architecture of CrawlResult --> PageSummary[] --> Primitives could support this with a `scope` parameter on AuditConfig that limits which pages are crawled and which primitives run. The data model doesn't need to change. The pipeline just needs a filter. But the product implications are significant: component audits are cheaper to run, faster to return, more actionable per dollar, and map directly to developer workflow.

---

## Expert 7: Adaku Nwosu — Food Safety Auditor (HACCP/ISO 22000), 20 years

### Perspective

I audit food manufacturing facilities for compliance with HACCP (Hazard Analysis and Critical Control Points) and ISO 22000. The fundamental insight of HACCP, which was developed by NASA to ensure food safety for astronauts, is this: **you cannot test quality into a product. You must build quality into the process.** Testing the finished product tells you the current batch is safe or unsafe. It tells you nothing about whether the next batch will be safe. To ensure consistent quality, you must identify the critical control points in the production process, monitor them continuously, and have corrective actions ready when they deviate.

This is a profound distinction that the software industry mostly ignores. Software testing (unit tests, integration tests, e2e tests) is product testing -- it tests the output. Process testing asks: does the development process itself have the controls necessary to consistently produce quality output? These are different questions.

The second key HACCP concept is **traceability**. When a food safety incident occurs, we must be able to trace every ingredient in the affected product back to its source, every production step, every temperature log, every worker who handled it. This enables targeted recalls (only the affected batches) instead of blanket recalls (everything ever produced). The software equivalent is: when a finding is discovered, can you trace it back to the commit, the deploy, the dependency change, or the configuration drift that introduced it?

The third concept is the difference between **testing the product** and **testing the process.** I can test a can of soup for pathogens (product test). Or I can verify that the canning line maintains 121 degrees C for 3 minutes at the retort stage (process test). The product test tells me about this can. The process test tells me about every can.

### What Alien Eyes is Getting Right

1. **Cross-product pattern database (ADR-016) is the HACCP approach applied to the software industry.** Individual findings are product tests. But patterns across 1,000+ products -- "67% of Next.js sites have misconfigured canonical URLs" -- are process insights. They tell you about the production process (Next.js's default configuration, developer training gaps, documentation failures), not just individual products. This is genuinely powerful and should be a primary differentiator.

2. **Finding lifecycle with false positive feedback.** In HACCP, every deviation from a critical limit triggers a corrective action AND a root cause investigation. Your "Mark as false positive" with reason tracking is a root cause investigation for methodology failures. When a primitive hits 20% dispute rate, that's a "critical control point" in your own process that needs corrective action.

3. **Evidence bundles with immutability.** In food safety, every lab result, temperature log, and corrective action must be documented with immutable records. Your requirement for DOM snapshot hash, timestamp, and screenshot creates an evidence trail that can be independently verified. This is the foundation of audit credibility.

4. **Methodology versioning is equivalent to our HACCP plan versioning.** Every HACCP plan has a version. Every audit references which version was in effect. Changes require validation. This is exactly your pre-registered methodology with version tracking.

### What Alien Eyes is Missing

1. **No critical control point (CCP) identification for the builder's own process.** Your audit tells the builder "your product has these findings." But it doesn't tell them WHERE in their process the finding was introduced. Was it a code change? A dependency update? A configuration drift? A third-party service change? Without traceability, the builder fixes the symptom (the finding) but not the cause (the process gap). This matters for re-audit: if the builder keeps producing the same types of findings, the process is broken, not just the product. Track finding recurrence patterns per builder and surface: "You've had canonical URL issues in 3 of your last 5 audits. This suggests a process gap in your deployment pipeline."

2. **No "recall" mechanism.** In food safety, when a hazard is detected in a distributed product, a recall is initiated. The software equivalent: when Alien Eyes discovers a CRITICAL finding in a product that agents are actively consuming (via Rhumb), there should be a mechanism to alert those agents. "The API you're using has a critical finding as of 2 hours ago." This is the bridge between point-in-time auditing and continuous monitoring, and it directly serves the Rhumb integration.

3. **No supplier audit (third-party dependency verification).** HACCP requires auditing your suppliers, not just your own process. A food manufacturer that uses contaminated ingredients fails even if their own process is perfect. Your products use third-party services (Supabase, Vercel, Stripe, analytics providers, CDN). You check whether these services are loaded, but you don't assess whether they're healthy. If a builder's product depends on a third-party API that has a known outage or deprecation, that's a finding -- not about the builder's code, but about their supply chain.

4. **No "prerequisite program" equivalent.** In HACCP, before you even identify CCPs, you establish prerequisite programs: sanitation, personnel hygiene, pest control, equipment maintenance. These are baseline requirements that must be met before HACCP analysis is meaningful. The digital equivalent: basic infrastructure health (HTTPS, valid DNS, server responding, not blocked by robots.txt) should be verified before any audit dimension runs. If the "prerequisite" fails, the audit should report "unable to audit -- prerequisite not met: [reason]" rather than attempting to score a fundamentally broken product. Your "Could not verify" handling partially addresses this, but it should be formalized as a prerequisite check phase.

5. **No continuous monitoring of your own measurement system.** In food safety, the measuring instruments (thermometers, pH meters, metal detectors) are calibrated on a schedule. If the thermometer reads 2 degrees low, every temperature reading since the last calibration is suspect. Your "measuring instrument" is the combination of Playwright, LLM prompts, and scoring rubrics. When Playwright updates, when Claude's behavior changes with a model update, when a rubric is revised -- your instrument has changed. You need to track these environmental changes and re-validate measurement consistency when they occur. A Claude model update that changes severity classification for 30% of findings is a calibration event, not a feature improvement.

### Novel Surface Types to Add

1. **Supply chain audit (third-party dependency health).** For every third-party service loaded by the product: is the service actively maintained? Is the API version current or deprecated? Are there known outages in the last 30 days? Is the service's own security posture adequate (do they have a security.txt, a privacy policy, an SOC 2)? This is the HACCP supplier audit applied to software. It catches risks the builder doesn't control but is responsible for.

2. **Process quality indicators from audit patterns.** After 3+ audits of the same URL: what types of findings recur? What types get fixed? What's the mean time to fix by severity? Are new finding types emerging (degradation) or is the same set being fixed and re-introduced (process failure)? This transforms point-in-time auditing into process assessment -- the HACCP transformation of testing the product into testing the process.

3. **Batch testing for agencies/consultants.** Audit 10 client sites simultaneously and generate a cross-client analysis: common findings, outlier sites, overall portfolio health. This is the HACCP concept of lot testing -- testing a batch to characterize the population. Craig (consultant persona) would use this as the cornerstone of his practice.

### Anti-Patterns to Avoid

1. **Do not confuse product testing with process assurance.** An audit that finds zero issues does not mean the process is sound. It means the product was good at that moment. A food safety audit that finds no pathogens in one batch does not prove the production line is safe. Clearly communicate this limitation: "This audit assesses your product at a point in time. It does not certify your development process."

2. **Do not audit without auditing your own audit system.** Meta-auditing (auditing the auditor) is a requirement in ISO 22000. You need regular reviews of: are your deterministic checks still detecting what they claim to detect? Are your LLM prompts producing consistent results across model versions? Are your confidence intervals well-calibrated (i.e., do 90% of findings with 0.9 confidence turn out to be true positives)? Schedule this quarterly and publish the results for the Diana/Viktor personas who need to trust your methodology.

3. **Never grade your own homework.** If the same LLM that generates findings also evaluates confidence in those findings, you have a self-referential measurement system. Consider using a different model for confidence evaluation than for finding generation (the "LLM-as-judge" pattern with a different judge than the generator). Or use human review on a sample (10%) of findings to calibrate confidence scores.

### One Insight That Changes the Architecture

**You need a "traceability" dimension that connects findings to their probable origin in the builder's process.** HACCP's greatest contribution to food safety was not better testing -- it was traceability. When you find a contaminated product, you trace it back through the production chain to find where contamination entered. Alien Eyes should do the same for software findings. When you detect a missing canonical URL, the finding should include a `probable_origin` field: "This is commonly caused by: (1) default Next.js metadata configuration not overridden per page, (2) a layout component that sets canonical globally, (3) a recent framework upgrade that changed default behavior." This doesn't require source code access -- it requires the cross-product pattern database. If 80% of canonical URL findings in Next.js sites trace back to the same root cause, you can infer the probable origin with high confidence. This transforms the finding from "what's wrong" to "what's wrong AND where it probably came from AND how to prevent it from recurring." The builder's coding agent gets better fix instructions. The builder gets process improvement guidance. And the pattern database becomes a knowledge base, not just a statistics table. This is the difference between a food safety audit that says "this batch has salmonella" and one that says "this batch has salmonella, which was likely introduced at the mixing stage due to a failed temperature control at 14:23." The second one prevents the next batch from being contaminated. The first one only catches the current batch.

---

## Cross-Expert Synthesis: Surfaces Alien Eyes Should Add

Based on the seven expert analyses, here are the surfaces and capabilities that emerged across multiple experts, ranked by frequency of mention and estimated impact:

### Tier 1: Add Before V1 (referenced by 3+ experts)

| Surface/Capability | Experts Who Raised It | Rationale |
|--------------------|-----------------------|-----------|
| **Discovery/enumeration phase** (subdomains, exposed files, referenced APIs, certificate transparency) | Kai (pen tester), Robert (inspector), Adaku (food safety) | 40-60% of critical findings in pen testing come from discovery, not from testing the known surface. A URL-only crawl structurally misses this. |
| **Third-party dependency/service health** | Kai (pen tester), Robert (inspector), Adaku (food safety) | Digital supply chain risk. The builder's product fails because of their dependencies, not their code. |
| **Journey/flow-level testing** (multi-page, not just per-page) | Ines (film), Margot (mystery shopping), Sana (crash test) | Page-level findings miss systemic issues. The user experiences a journey, not a collection of pages. |
| **Degradation/temporal findings** (certificates expiring, deprecated deps, stale DNS) | Robert (inspector), Sana (crash test), Adaku (food safety) | Future-tense findings are higher value than present-tense findings for preventive action. |
| **Promise fulfillment audit** (claims vs reality) | Margot (mystery shopping), Ines (film), Robert (inspector) | The gap between marketing claims and product reality is the most actionable finding category for non-technical evaluators. |
| **Error state auditing** (404s, wrong inputs, missing auth, edge cases) | Sana (crash test), Kai (pen tester), Robert (inspector) | Quality of error handling reveals overall engineering quality. Currently invisible to page-level auditing. |

### Tier 2: Add Before Phase 1 (referenced by 2 experts)

| Surface/Capability | Experts Who Raised It | Rationale |
|--------------------|-----------------------|-----------|
| **Component/scoped audit mode** (single endpoint, single form, single flow) | Sana (crash test), Adaku (food safety) | Cheaper, faster, more CI/CD-friendly. The "sled test" model. |
| **DNS/certificate health** (DMARC, SPF, DNSSEC, cert chain, CAA) | Kai (pen tester), Robert (inspector) | Foundational infrastructure that affects everything. Deterministic, no LLM cost. |
| **Process quality indicators** (finding recurrence, mean time to fix, pattern detection) | Adaku (food safety), Margot (mystery shopping) | Transforms product testing into process assessment. Highest-value longitudinal feature. |
| **Statistical rigor** (multiplicity correction, measurement properties, minimum detectable effect) | Hamid (biostatistician), Sana (crash test) | Without these, the scoring system produces false precision and misleading comparisons. |
| **Consumer-readable rating system** (visual ratings, not just numbers) | Sana (crash test), Ines (film) | Numbers don't drive behavior. Visual systems (stars, traffic lights, dimension-level pass/fail) do. |

### Tier 3: Add Phase 2+ (referenced by 1 expert with strong rationale)

| Surface/Capability | Expert | Rationale |
|--------------------|--------|-----------|
| **JavaScript source analysis** (secrets, vulnerable libs, source maps) | Kai (pen tester) | Deterministic, no LLM, high-severity findings. |
| **Emotional arc visualization** | Ines (film) | Most shareable output format. Journey as narrative. |
| **Promise extraction primitive** | Margot (mystery shopping) | Pre-scoring step that enables the highest-impact finding category. |
| **Recall mechanism** (alert consuming agents of critical findings) | Adaku (food safety) | Critical for Rhumb integration. |
| **Form resilience testing** | Sana (crash test) | Non-destructive stress testing of interactive elements. |
| **Screening vs diagnostic statistical design** | Hamid (biostatistician) | Quick Check and Full Audit should have different error tolerance profiles. |
| **Meta-auditing** (auditing the audit system itself) | Adaku (food safety) | Quarterly self-assessment of measurement system health. |

### Architecture Changes Recommended

1. **Add a Discovery phase** to the pipeline: URL --> **Discover** --> Crawl --> Primitives --> Synthesis
2. **Add a Journey type** alongside PageSummary: primitives should evaluate flows, not just pages
3. **Add temporal category** to Finding: `current_defect | emerging_risk | degradation_signal`
4. **Add promise extraction** as a pre-scoring primitive
5. **Add probable_origin** field to Finding for process traceability
6. **Add multiplicity correction** (Benjamini-Hochberg FDR) to the finding set before output
7. **Add component audit scope** to AuditConfig: scope the crawl and primitive set per audit
8. **Separate statistical design** for Quick Check (high sensitivity) and Full Audit (high specificity)

---

*This panel was conducted on 2026-03-11. Seven experts contributed structured analysis. No expert had access to another expert's output. Cross-synthesis was performed after all analyses were complete.*
