# Alien Eyes — Expert Panel Round 3: Cross-Surface Metrology

> Date: 2026-03-11
> Panel: 7 abstract domain specialists on evaluation quality across structurally different mediums
> Question: What structural patterns maintain evaluation quality, consistency, and trust when the things being evaluated are fundamentally different?
> Format: Full expert output + cross-panel synthesis
> Commissioned by: Product owner, pre-implementation
> Panel size: 7 experts, 6 required outputs each, plus 8-section cross-panel synthesis

---

## Expert 1: Master Sommelier Laurent Beaumont

### A. Structural Analogy

| Alien Eyes Concept | Wine Evaluation Equivalent |
|---|---|
| The thing being evaluated | A wine, spirit, sake, beer, or cocktail |
| The evidence | Color, nose, palate, finish — captured through systematic tasting notes |
| A finding | A fault (TCA cork taint, volatile acidity, premature oxidation) or a quality observation (excellent length, precise acidity, complex bouquet) |
| Severity | Fault severity: corked (CRITICAL — undrinkable), brettanomyces (HIGH — objectionable to most), slight reduction (MEDIUM — blows off with air), minor sediment (LOW — cosmetic) |
| A dimension | The WSET SAT axes: appearance, nose, palate (acidity/tannin/body/flavor/finish), quality, readiness |

### B. Framework for Cross-Surface Consistency

The WSET Systematic Approach to Tasting (SAT) is the definitive answer to this problem in our field. It evaluates still wines, sparkling wines, fortified wines, and spirits using a **shared process with surface-specific criteria**. The framework has three structural layers:

**Layer 1 — Universal Process.** Every evaluation follows the same sequence: appearance, nose, palate, conclusion. This sequence never changes regardless of what you are tasting. A Champagne and a single malt whisky both go through appearance-nose-palate-conclusion.

**Layer 2 — Surface-Specific Descriptors.** Within each process step, the vocabulary and criteria adapt. For sparkling wine, appearance includes "mousse quality" (bubble size, persistence, integration). For still wine, there is no mousse axis at all. For spirits, palate includes "heat integration" — how the alcohol burn relates to flavor. For beer, there is "head retention." These are not optional add-ons; they are mandatory surface-specific criteria.

**Layer 3 — Universal Quality Ladder.** Despite surface-specific criteria, the final quality assessment uses a UNIVERSAL scale: poor, acceptable, good, very good, outstanding. A "very good" Riesling and a "very good" Cognac occupy the same quality tier even though the paths to that judgment were entirely different. The quality ladder is calibrated independently of the surface.

The critical insight: **the process is universal, the descriptors are surface-specific, and the quality conclusion is universal again.** It is a sandwich. Universal bread, surface-specific filling, universal bread.

**For Alien Eyes:** The audit pipeline (collect evidence, apply primitives, synthesize findings, render output) is the universal process. The primitives and evidence types are surface-specific (DOM hash for web, schema validation for MCP, exit code for CLI). The quality score is universal again — a "72" on a website and a "72" on an MCP server mean the same thing: "needs work."

### C. Calibration Method

Wine judges are calibrated through a protocol that has been refined over 50 years:

1. **Reference wines.** Every certification level requires tasting against canonical examples. You taste a textbook Chablis, a textbook Barolo, a textbook Sauternes. These are the reference standards. You know what "correct" tastes like before you encounter deviations.

2. **Blind tasting.** Judges taste without knowing what the wine is. This eliminates label bias — the tendency to score a prestigious label higher. In Alien Eyes terms, this is the "alien perspective": no context, no preconceptions.

3. **Calibration flights.** Before a competition, all judges taste the same 5-8 wines and compare scores. Judges whose scores deviate >2 standard deviations from the panel median are flagged. They are not removed; they receive coaching. The assumption is that outlier scores reflect a calibration issue, not a quality disagreement.

4. **Fault detection drills.** Judges are trained to identify spiked wines — wines with known faults at known concentrations. TCA at 2 parts per trillion, at 5, at 10. If a judge cannot detect TCA at 5 ppt, they know their threshold and can flag uncertainty.

5. **Systematic disagreement tracking.** When two judges disagree on quality (not just descriptors), the disagreement is logged and the third judge's score is used for ranking. Over time, persistent systematic disagreements lead to category specialization — some judges are better at Burgundy, others at Champagne, and the panel composition reflects this.

### D. The Trap You Fell Into

The wine world made a catastrophic error in the 1970s and 1980s that took decades to correct: **we applied still wine criteria to sparkling wine and fortified wine.** Judges trained on Bordeaux and Burgundy would taste Champagne and unconsciously penalize the acidity, penalize the lack of color depth, penalize the short palate weight. They were not wrong about what they observed — they were wrong about what "good" meant for that surface.

The fix was surface-specific training. You cannot evaluate Champagne until you have tasted 200 Champagnes. You cannot evaluate Port until you understand what oxidative aging tastes like in a fortified context. Generalist judges can rank wines within a surface; only surface-trained judges can identify the difference between a good wine and a great one within that surface.

**Warning for Alien Eyes:** Your web-trained primitives will unconsciously penalize non-web surfaces for not being web-like. An MCP server that has no "homepage" is not missing a homepage — it is a different surface. A CLI tool with no "responsive design" is not failing accessibility — accessibility means something different for CLIs (clear help text, screen reader compatible output, exit codes). If you apply web-derived quality criteria to non-web surfaces, you will produce findings that are technically correct but meaningfully wrong.

### E. The One Pattern That Transfers

**The Fault vs. Quality Distinction.**

In wine, there is a strict separation between faults and quality. A fault is objective: TCA contamination, volatile acidity above threshold, oxidation beyond style parameters. A quality assessment is subjective-within-bounds: complexity, length, balance, typicity. You can have a fault-free wine that is mediocre, and (rarely) a slightly faulty wine that is transcendent.

Alien Eyes must maintain this distinction. A missing Content-Security-Policy header is a fault — it is either present or it is not. Whether the overall security posture of a site is "good" or "very good" is a quality assessment. The Finding type already captures this implicitly (deterministic checks = faults, LLM-evaluated checks = quality), but the distinction should be explicit in the scoring. Faults have binary detection with graduated severity. Quality has graduated assessment with confidence intervals.

### F. Three Specific Recommendations

1. **Create surface-specific "tasting grids."** For each surface type (web, MCP, CLI, API, etc.), define the mandatory evaluation axes — the equivalent of appearance/nose/palate. Web has DOM/network/console. MCP has tool_schemas/resource_queries/prompt_templates. CLI has help_text/exit_codes/error_output. These grids should be frozen per methodology version, just as your web dimension rubrics are frozen in v0.1.

2. **Build a reference corpus per surface.** Before you can evaluate MCP servers at scale, you need to evaluate 20-50 MCP servers manually to establish what "excellent," "good," and "poor" look like for that surface. These become your reference standards. Every new primitive for that surface is calibrated against these references. Without this, your first MCP audits will produce uncalibrated scores that erode trust.

3. **Separate "fault detection" from "quality assessment" in the Finding type.** Add a `category: 'fault' | 'quality'` field. Faults are deterministic or near-deterministic (confidence >= 0.9). Quality assessments carry wider confidence intervals. This lets you report faults with certainty ("your CLI exits with code 0 on error — this is a fault") while being transparent about quality uncertainty ("your error messages are unclear — this is a quality observation at 0.75 confidence").

---

## Expert 2: Insurance Actuary Dr. Elena Vasquez

### A. Structural Analogy

| Alien Eyes Concept | Insurance Equivalent |
|---|---|
| The thing being evaluated | A risk — property, casualty, life, health, cyber, marine, or aviation |
| The evidence | Loss history, exposure data, inspection reports, actuarial tables |
| A finding | A risk factor — a condition that increases expected loss frequency or severity |
| Severity | Loss severity distribution: catastrophic (total loss, business interruption), significant (major claim), moderate (standard claim), minor (nuisance claim) |
| A dimension | Line of business: property, liability, professional indemnity, cyber, D&O |

### B. Framework for Cross-Surface Consistency

Insurance has spent 300 years solving exactly this problem: how do you price risk consistently across structurally incomparable asset classes? A $10M commercial building and a $10M cargo ship have nothing in common physically, yet both must be assessed for risk, priced, and reserved against.

The structural principle is **loss ratio normalization.** Every risk class is evaluated using the same core metric: expected loss divided by premium collected. If a property portfolio has a 60% loss ratio and a cyber portfolio has a 60% loss ratio, they are performing comparably — even though the underlying risks, claim frequencies, and claim sizes are completely different.

This works because the loss ratio is a **ratio, not an absolute number.** It normalizes across scales. A $1M claim on a $100M property portfolio and a $10K claim on a $1M cyber policy are both "small relative to exposure."

The deeper structural principle is the **exposure basis.** For each risk class, we define what constitutes one unit of exposure:

| Risk Class | Exposure Basis |
|---|---|
| Property | Insured value per location |
| Auto | Vehicle-years |
| Workers comp | Payroll per classification |
| Cyber | Revenue + number of records + industry |
| Marine | Cargo value per voyage |

The exposure basis lets you compare loss rates across incomparable risks. Property losses per $1M insured value, auto losses per 1,000 vehicle-years, cyber losses per $1M revenue. Different numerators, same structural form.

**For Alien Eyes:** Define the exposure basis per surface. For websites, it might be "per page crawled." For MCP servers, "per tool exposed." For CLIs, "per command." For APIs, "per endpoint." Findings-per-exposure-unit is your loss ratio. A website with 3 findings per 10 pages and an API with 3 findings per 10 endpoints are comparably healthy — even though "findings on a website" and "findings on an API" are structurally different.

### C. Calibration Method

Actuarial calibration relies on three mechanisms:

1. **Credibility weighting.** When you have little data for a specific risk, you blend it with the portfolio average. If you have only 3 MCP server audits, each score is weighted 30% on its own findings and 70% on the overall average across all surfaces. As you accumulate 50 MCP audits, the weight shifts to 80% individual, 20% portfolio. This prevents early scores from being wild outliers.

2. **Loss development factors.** Claims do not all emerge immediately. A property claim is reported quickly; a liability claim may not emerge for years. Actuaries apply development factors to immature loss data. For Alien Eyes: findings do not all emerge in one audit. Some are only discoverable after interaction (e.g., form submission errors). Your confidence interval should be wider for surfaces where you know the collection method cannot observe all potential findings.

3. **Peer review of reserve estimates.** Every actuarial opinion is peer-reviewed by an independent actuary. When reserves are "stale" (based on old data), the peer reviewer flags this. For Alien Eyes: methodology versions that have not been recalibrated against recent data should carry an explicit "staleness" flag.

### D. The Trap You Fell Into

The insurance industry's greatest error in the cyber line was **applying property risk models to cyber risk.** In property, losses are independent — a fire in building A does not cause a fire in building B. In cyber, losses are correlated — a vulnerability in a shared library affects every customer using that library simultaneously. The 2017 NotPetya event caused $10B+ in correlated losses that property-style models had priced as independent.

The industry had to learn that a new risk class requires a new loss model, not an adaptation of an existing one. The exposure basis is different (records, not square footage), the loss distribution is different (heavy tail, not normal), and the correlation structure is different (systemic, not independent).

**Warning for Alien Eyes:** Your web audit model assumes findings are roughly independent — a SEO issue does not systematically correlate with a security issue. This may not hold for other surfaces. In MCP servers, a tool schema error often correlates with authentication errors and error handling errors — they share a root cause (the developer does not understand the MCP specification). If you treat MCP findings as independent and simply count them, you will double- and triple-count what is really a single root cause finding. Your Swiss Cheese Model (causal chains) is the right defense, but it needs to be surface-aware: some surfaces have higher correlation among findings.

### E. The One Pattern That Transfers

**The Exposure Basis Principle.**

Every quantitative comparison across different categories requires a normalization denominator. You cannot compare "3 findings on a website" to "3 findings on an MCP server" without knowing the exposure. A 50-page website with 3 findings is healthy. A 2-tool MCP server with 3 findings is in trouble.

Define the exposure unit per surface. Normalize all scores to findings-per-exposure-unit. Make the exposure unit explicit in every report. This is the single most important structural change for multi-surface scoring.

### F. Three Specific Recommendations

1. **Add an `exposureUnit` field to the audit metadata.** For web: pages crawled. For MCP: tools + resources + prompts counted. For CLI: commands available. For API: endpoints enumerated. For GitHub repos: files analyzed. Every score should be interpretable as "X findings per Y exposure units."

2. **Implement credibility weighting for new surface types.** When you launch MCP audits, your first 10-20 audits will have uncalibrated scoring. Blend the surface-specific score with the overall cross-surface average using a credibility formula: `blended_score = z * surface_score + (1-z) * portfolio_average`, where `z` increases from 0.3 to 1.0 as sample size grows. This prevents early MCP scores from being wildly different from web scores due to small-sample noise.

3. **Model finding correlation per surface.** Some surfaces have systematically correlated findings (one root cause produces many symptoms). Track correlation matrices per surface. If the average within-surface finding correlation exceeds 0.5, the scoring model needs to account for redundancy — either through stronger causal chain detection or through a "unique root causes" metric alongside "total findings."

---

## Expert 3: General Practitioner (GP) Dr. Yuki Tanaka

### A. Structural Analogy

| Alien Eyes Concept | Medical Equivalent |
|---|---|
| The thing being evaluated | A patient (the whole system, not a single organ) |
| The evidence | History, examination findings, lab results, imaging, vital signs |
| A finding | A clinical sign or symptom — an observable deviation from health |
| Severity | Triage categories: life-threatening (CRITICAL), urgent (HIGH), semi-urgent (MEDIUM), non-urgent (LOW) |
| A dimension | Body system: cardiovascular, respiratory, neurological, endocrine, musculoskeletal, psychiatric, dermatological |

### B. Framework for Cross-Surface Consistency

Medicine faces exactly this problem: how does a GP evaluate a patient who could have a cardiovascular problem, a neurological problem, a psychiatric problem, or all three? The structural framework is the **differential diagnosis process**, and it operates in four layers:

**Layer 1 — Review of Systems (ROS).** Before examining anything in depth, the GP runs a systematic checklist across ALL systems. "Any chest pain? Shortness of breath? Headaches? Mood changes? Joint pain? Skin changes?" This takes 3-5 minutes and produces a triage map: which systems need deep examination, which can be deferred.

**Layer 2 — Focused Examination.** Based on the ROS, the GP examines the flagged systems using system-specific techniques. Cardiovascular: auscultation, pulse, blood pressure. Neurological: reflexes, sensation, cranial nerves. Dermatological: inspection, palpation, dermoscopy. Each system has its own examination toolkit.

**Layer 3 — Investigation.** Based on examination findings, the GP orders system-specific investigations. Cardiovascular: ECG, echocardiogram, troponin. Neurological: MRI, nerve conduction studies. Endocrine: thyroid function tests, HbA1c. Each investigation produces system-specific evidence in system-specific formats.

**Layer 4 — Differential Diagnosis.** The GP synthesizes findings from all systems into a ranked list of possible diagnoses, from most likely to least likely, with confidence for each. The diagnosis may span systems — a thyroid problem (endocrine) presenting as depression (psychiatric) and weight gain (metabolic).

**For Alien Eyes:** The Review of Systems is your Quick Check — a rapid pass across all surfaces/dimensions to identify which need deep examination. The Focused Examination is your Full Audit with adaptive enrichment. The Investigation is your evidence collection with surface-specific methods. The Differential Diagnosis is your Synthesis with causal chains.

### C. Calibration Method

Medical calibration is the most rigorous of any field:

1. **Standardized Patients (SPs).** Medical schools use trained actors who present specific symptoms. Every student examines the same SP and is scored on what they identify. This is the medical equivalent of a test corpus — known inputs with known findings that calibrate diagnostic accuracy.

2. **Case-Based Discussion (CBD).** A senior clinician reviews a junior clinician's cases, not to check if they got the right answer, but to check if their reasoning process was sound. Was the differential complete? Were dangerous diagnoses excluded? Were the right tests ordered? For Alien Eyes: audit the auditor's reasoning chains, not just its findings.

3. **Clinical Audit Cycles.** Periodically, a practice reviews its diagnoses against outcomes. "We diagnosed 50 cases of chest pain last quarter. How many were correctly diagnosed? How many were missed? What was the false positive rate for cardiac referrals?" This is exactly your Finding Lifecycle tracking.

4. **Sensitivity and Specificity.** Every diagnostic test has known sensitivity (catches true positives) and specificity (avoids false positives). A highly sensitive test is used for screening (Review of Systems); a highly specific test is used for confirmation (focused examination). For Alien Eyes: Quick Check should be high sensitivity (catch everything, accept some false positives). Full Audit should be high specificity (every finding is real).

### D. The Trap You Fell Into

Medicine made a devastating error that took decades to recognize: **over-reliance on single-system thinking.** A patient presents with fatigue. The endocrinologist checks the thyroid. The psychiatrist checks for depression. The hematologist checks for anemia. Each specialist finds something within their system — subclinical hypothyroidism, mild anxiety, borderline ferritin. Each recommends treatment. The patient ends up on thyroid medication, an SSRI, and iron supplements, when the actual problem was sleep apnea — a condition that crosses systems and is nobody's specialty.

The fix was the generalist renaissance — the recognition that someone must see the whole patient before specialists examine the parts. The GP's value is not in being better at any single system than the specialist; it is in seeing the CONNECTIONS between systems that specialists miss.

**Warning for Alien Eyes:** When you expand to multiple surfaces, resist the temptation to run each surface's audit independently and report findings per surface. A product that has a bad CLI, bad API docs, and inconsistent error formats probably has ONE root cause: the developer does not invest in developer experience. Reporting 15 surface-specific findings obscures the one finding that matters. Your synthesis layer must be surface-agnostic — it should look for patterns ACROSS surfaces, not just within them.

### E. The One Pattern That Transfers

**The Review of Systems as Triage Protocol.**

Before any deep examination, run a systematic, shallow check across ALL surfaces. This produces a triage map: which surfaces are healthy (defer), which have symptoms (examine), which are critical (examine urgently). This prevents the most common medical error — premature closure (diagnosing the first problem you find and stopping).

For Alien Eyes: when a builder submits a product that has a website, an API, and a CLI, do NOT start with the most obvious surface (the website). Start with a 30-second Review of Systems across all three: can you reach it? Does it respond? Are there obvious faults? Then prioritize the full audit based on triage findings.

### F. Three Specific Recommendations

1. **Implement a surface-agnostic "Review of Systems" as the first pipeline stage.** Before any surface-specific primitive runs, execute a lightweight probe across all discoverable surfaces: HTTP response? API endpoint responds? CLI installs? MCP server connects? Package installs? This takes 10-30 seconds per surface and produces a triage map that determines which surfaces get the full audit budget.

2. **Add cross-surface synthesis to the SynthesisResult.** Your current causal chain logic connects findings within a surface. Add a `crossSurfacePatterns` field that identifies patterns across surfaces. "API error responses return HTML (api-003), CLI error messages are unstructured (cli-007), MCP tool errors return string instead of error object (mcp-002) — ROOT CAUSE: no error handling standard across the product." This is where the GP adds value that no specialist can.

3. **Adopt the sensitivity/specificity framework for primitive design.** Tag each primitive as "screening" (high sensitivity, some false positives) or "confirmatory" (high specificity, may miss edge cases). Quick Check runs screening primitives. Full Audit adds confirmatory primitives. This is more rigorous than the current "deterministic = quick check, LLM = full" split, because some deterministic checks are confirmatory (specific header presence) and some LLM checks could be screening (broad content assessment).

---

## Expert 4: Film Festival Jury President Amara Diallo

### A. Structural Analogy

| Alien Eyes Concept | Film Festival Equivalent |
|---|---|
| The thing being evaluated | A film — feature narrative, documentary, short, animation, experimental, VR/immersive |
| The evidence | The film itself (screener), press kit, director's statement, technical specifications |
| A finding | A selection note — what makes this film notable (positive) or what prevents selection (negative) |
| Severity | Not selected (CRITICAL — fundamental issues), shortlisted but not selected (HIGH — significant weaknesses among strengths), selected with reservations (MEDIUM), minor note (LOW) |
| A dimension | Technical craft, narrative coherence, emotional impact, originality, cultural relevance, audience accessibility |

### B. Framework for Cross-Surface Consistency

Festival programming is one of the hardest evaluation problems in culture because the things being compared are deliberately incommensurable. A 12-minute stop-motion animation about grief and a 3-hour documentary about climate migration are not competing on the same terms. Yet both must be evaluated against a quality standard that allows a program committee to build a coherent festival.

The structural principle is **evaluation against category-specific excellence, followed by comparison at the meta-level of ambition fulfilled.** We do not ask "is this animation better than this documentary?" We ask two sequential questions:

**Question 1 (Category-Internal):** "How fully does this work achieve what it is trying to achieve, given the conventions and possibilities of its form?" A short film is not a compressed feature. It has its own grammar — compression, implication, single-image resonance. An excellent short film is not one that feels like a feature that ran out of time; it is one that could not exist in any other form.

**Question 2 (Category-Transcendent):** "Does this work enlarge the viewer? Does it make them feel, think, or see differently than they did before watching?" This question is asked identically of every work regardless of form. A VR piece and a documentary are evaluated on equal footing here. The question is not "how good is this for a VR piece?" but "how much does this matter?"

This two-question structure prevents the most common evaluation error: **comparing surface-level technical quality across incomparable forms.** A beautifully shot documentary with nothing to say ranks lower than a rough-looking short that lands an unforgettable idea.

**For Alien Eyes:** Question 1 maps to surface-specific dimension scores (is this MCP server good by MCP standards? is this CLI good by CLI standards?). Question 2 maps to the satisfaction score (does this product accomplish what it exists to accomplish, regardless of surface?). The satisfaction score should never be a simple average of dimension scores — it should reflect whether the product fulfills its purpose.

### C. Calibration Method

Festival jury calibration has hard-won protocols:

1. **The calibration film.** Before deliberation begins, the jury watches 2-3 films together and discusses them openly. This establishes a shared vocabulary and reveals biases. One juror may value technical craft above all; another may value emotional impact. The calibration session makes these biases visible without requiring consensus.

2. **Category advocates.** In a festival with mixed categories, the jury includes at least one specialist per category. The animation specialist advocates for animation on its own terms, preventing feature-narrative jurors from penalizing animated works for "not being realistic enough."

3. **No ranking until all works are seen.** Jurors are prohibited from ranking until they have seen every film in their category. This prevents "anchoring" — the first film seen sets the standard and everything is compared to it.

4. **Positive-first discussion.** Deliberation begins with what works. This prevents pile-on negativity and ensures that strong works are not dismissed because of minor flaws.

### D. The Trap You Fell Into

The film festival world made a structural error that persists in some festivals today: **privileging features over shorts, documentaries over experimental, live-action over animation — not because features are better, but because features are the default evaluation mode.** Jurors trained on features unconsciously apply feature-length pacing expectations to shorts, feature-narrative arc expectations to documentaries, and photographic realism expectations to animation.

The fix was category-specific juries and category-specific awards. You cannot evaluate experimental film with a feature jury. The expertise is different, the criteria are different, and the vocabulary is different.

But there was a subtler error that took longer to fix: **assuming that technical quality is comparable across forms.** "Production value" means something different for a guerrilla documentary (authenticity is a virtue), an animated film (rendering quality matters), and a VR piece (spatial audio is critical). A single "technical quality" score applied uniformly across forms is meaningless.

**Warning for Alien Eyes:** "Performance" as a dimension will mean different things across surfaces. For a website, load time in milliseconds is the key metric. For a CLI, startup time and execution time matter. For an API, response latency and throughput matter. For an MCP server, time-to-first-tool-response and schema validation latency matter. A single "performance" rubric applied to all surfaces will produce scores that feel precise but are structurally meaningless. Each surface needs its own performance rubric, even though they all map to the same dimension.

### E. The One Pattern That Transfers

**Ambition-Fulfillment as the Meta-Score.**

The most useful quality assessment is not "how technically proficient is this?" but "how fully does this accomplish what it set out to accomplish?" A modest CLI tool that does one thing perfectly may score higher on ambition-fulfillment than an ambitious web platform with a broken signup flow. This reframes quality from an absolute measure to a relative one — relative to the product's own stated purpose.

For Alien Eyes: the satisfaction score should measure purpose-fulfillment, not feature-completeness. This requires understanding what the product is trying to do before evaluating how well it does it. Your current system infers purpose from the crawl; for non-web surfaces, you may need to accept a purpose declaration from the builder ("this CLI converts images") and evaluate against it.

### F. Three Specific Recommendations

1. **Allow the builder to declare the product's purpose before the audit.** For web, you can infer purpose from the homepage. For CLI/API/MCP, purpose is not obvious from the interface. A simple text field — "What does this product do, and for whom?" — gives the audit context to evaluate ambition-fulfillment rather than checking boxes against a generic rubric.

2. **Create surface-specific dimension rubrics, even when the dimension name is the same.** "Accessibility" for a website (WCAG 2.1 AA) and "accessibility" for a CLI (POSIX conventions, screen reader output, internationalization) share a name and a SPIRIT but have entirely different rubrics. Each surface-dimension pair needs its own rubric, frozen separately.

3. **Implement "positive-first" in the celebration section, and weight it.** Your CelebrationSection exists but is a small part of SynthesisResult. In festival programming, the celebration is what keeps filmmakers coming back. Builders who receive only criticism will not re-audit. Lead with what is working, make it specific ("your API error responses are exemplary — structured, consistent, with machine-readable error codes"), and ensure it is visible in every output format.

---

## Expert 5: Building Inspector Robert Mwangi

### A. Structural Analogy

| Alien Eyes Concept | Building Inspection Equivalent |
|---|---|
| The thing being evaluated | A building — residential, commercial, industrial, institutional, historic, temporary |
| The evidence | Visual inspection, measurement, code lookup, material testing, structural calculation |
| A finding | A deficiency — a code violation, safety hazard, or maintenance concern |
| Severity | Imminent danger (CRITICAL — evacuate, stop work), significant deficiency (HIGH — must fix before occupancy), code violation (MEDIUM — must fix within timeframe), maintenance recommendation (LOW — advisory) |
| A dimension | Structural, electrical, plumbing, fire safety, accessibility, energy, environmental |

### B. Framework for Cross-Surface Consistency

Building inspection has been evaluating structurally different building types for over a century. A three-story wood-frame house and a 40-story steel-and-concrete tower are fundamentally different structures, yet both must pass inspection before occupancy.

The structural principle is **code compliance as the floor, fitness-for-purpose as the ceiling.**

**The floor: code compliance.** Every building type has a specific code (IBC for commercial, IRC for residential, NFPA for fire, ADA for accessibility). The code specifies minimum requirements. A code violation is a deficiency regardless of context. This is the deterministic layer — it is either compliant or it is not.

**The ceiling: fitness-for-purpose.** Beyond code compliance, the inspector evaluates whether the building serves its intended occupancy. A code-compliant warehouse that will be used as a school needs additional evaluation: egress capacity, bathroom ratios, ventilation rates. The code is the same; the application depends on purpose.

**The sequence matters.** In every inspection, regardless of building type, we follow the same priority order:

1. **Life safety** — structural integrity, fire egress, fall hazards (equivalent to CRITICAL)
2. **Health and sanitation** — plumbing, ventilation, mold (equivalent to HIGH)
3. **Code compliance** — electrical, energy, accessibility (equivalent to MEDIUM)
4. **Maintenance and quality** — cosmetic, durability, craftsmanship (equivalent to LOW)

This sequence is UNIVERSAL. We never inspect cosmetics before structure. We never evaluate energy efficiency before fire safety. The priority order is the same for a house, a hospital, and a temporary tent structure.

**For Alien Eyes:** Establish a universal priority order across all surfaces. Security before functionality. Functionality before usability. Usability before optimization. This prevents audit reports that flag "your API response time is 230ms" (optimization) while missing "your API accepts SQL in query parameters" (security).

### C. Calibration Method

Building inspection calibration is regulatory and procedural:

1. **Codified standards with interpretive guidance.** The code is specific ("guardrails at 42 inches, maximum 4-inch baluster spacing"), but real buildings require interpretation. The code council publishes interpretive guidance ("when a landing serves as both an exit and a turn, measure the guardrail height from the walking surface, not the stair nosing"). Alien Eyes needs both: specific checks AND interpretive guidance for edge cases.

2. **Continuing education with building-type specialization.** Inspectors must complete annual continuing education, and many specialize. A residential inspector may not inspect commercial structures without additional certification. For Alien Eyes: new surface types should require a "certification" process — a set of reference audits that validate the primitives before they go live.

3. **Third-party plan review.** Complex buildings require independent plan review before inspection. The third-party reviewer checks the design; the inspector checks the construction. For Alien Eyes: the methodology review (pre-registered methodology) is the plan review. The audit execution is the inspection. These should be independent — the methodology author should not also be the auditor.

4. **Deficiency response tracking.** After inspection, deficiencies are tracked to closure. A CRITICAL deficiency triggers a re-inspection before occupancy. A MEDIUM deficiency can be fixed within a specified timeframe. This maps directly to your FindingLifecycle.

### D. The Trap You Fell Into

Building inspection made a structural error in the 1990s that is still being corrected: **treating the inspection checklist as the inspection.** Inspectors would arrive at a complex building, run through the code checklist, mark every item pass/fail, and leave. The checklist produced a compliant building on paper that was unsafe in practice — because the checklist could not capture emergent issues like how fire loads in one area interacted with ventilation patterns in another, or how a code-compliant exit was practically unusable because it required navigating a maze of cubicles.

The fix was performance-based codes. Instead of prescriptive requirements ("guardrail at 42 inches"), performance codes state the objective ("prevent falls from elevations exceeding 30 inches") and allow the inspector to evaluate whether the objective is met, regardless of the specific solution. This shifted inspection from checkbox compliance to judgment-based assessment.

**Warning for Alien Eyes:** Your deterministic checks are a checklist. They are necessary but not sufficient. A product can pass every deterministic check and still be terrible — missing CSP header (check), alt text on all images (check), valid heading hierarchy (check), and yet the site is incomprehensible, the navigation is circular, and no user can accomplish the primary task. The LLM-evaluated dimensions (copy/UX, agent-nativeness) are your performance-based evaluation. Do not let the volume of deterministic findings dominate the narrative. Five deterministic LOWs are less important than one LLM-identified HIGH about a broken core flow.

### E. The One Pattern That Transfers

**The Universal Priority Sequence.**

In building inspection, we ALWAYS inspect in priority order: life safety, health, code compliance, quality. This sequence never changes regardless of building type. It prevents the inspector from getting distracted by interesting but non-critical observations while life-safety issues go unexamined.

For Alien Eyes: establish a fixed priority sequence across all surfaces. Security -> Core Functionality -> Standards Compliance -> Usability -> Optimization. Run primitives in this order. Report findings in this order. If the budget runs out, at least the highest-priority dimensions were covered. This is more important than it sounds — without a fixed sequence, the audit will naturally gravitate toward what is easy to check rather than what matters most.

### F. Three Specific Recommendations

1. **Implement a mandatory "life safety" pass before any other evaluation.** For web: HTTPS, no exposed secrets, no mixed content. For CLI: no arbitrary code execution from user input. For API: authentication present, no SSRF vectors. For MCP: permission model exists. This pass should be the first thing that runs, takes under 10 seconds, and its results should gate whether the rest of the audit proceeds. A product with a CRITICAL security finding should receive that finding immediately, not after 2 minutes of SEO analysis.

2. **Weight findings by priority tier, not just by count.** Your current scoring deducts points per finding (CRITICAL = -25, HIGH = -12, etc.). Add a multiplier based on priority tier: security findings get 1.5x weight, functionality findings 1.2x, compliance 1.0x, optimization 0.8x. This prevents a product with 10 cosmetic issues from scoring worse than a product with 2 security issues.

3. **Add "scope of inspection" language to every audit output.** Building inspectors always state what was and was not inspected. "This inspection covered structural, electrical, and plumbing systems. HVAC, environmental, and energy systems were not evaluated." Alien Eyes should state: "This audit evaluated [list of surfaces]. The following surfaces were discovered but not evaluated: [list]. Scores reflect only the evaluated surfaces."

---

## Expert 6: Museum Conservator Dr. Hiroshi Yamamoto

### A. Structural Analogy

| Alien Eyes Concept | Conservation Equivalent |
|---|---|
| The thing being evaluated | A cultural object — painting, sculpture, textile, ceramic, metal, paper, digital art |
| The evidence | Condition report: visual inspection, UV fluorescence, X-ray, spectroscopy, provenance documents |
| A finding | A condition issue — active deterioration, structural damage, past intervention, environmental risk |
| Severity | Imminent loss (CRITICAL — object is actively deteriorating), significant damage (HIGH — structural but stable), moderate condition issue (MEDIUM — cosmetic or slow-developing), minor observation (LOW — monitoring only) |
| A dimension | Structural integrity, surface condition, material stability, environmental sensitivity, authenticity, documentation quality |

### B. Framework for Cross-Surface Consistency

Museum conservation evaluates objects that are profoundly incomparable. A 15th-century tempera painting, a 19th-century silk kimono, a Roman bronze sculpture, and a 2020 NFT-based digital installation exist in different material universes. Yet every museum maintains a unified conservation policy and a single condition reporting standard.

The structural principle is **condition assessment relative to material norms, documented against a standard vocabulary.**

**Material norms.** Every material has known degradation patterns and expected lifespan. Oil paint cracks (craquelure) predictably based on age, ground preparation, and environmental history. Bronze develops patina. Paper foxes. Silk weakens along fold lines. These are EXPECTED — they are not deficiencies. Craquelure on a 500-year-old panel painting is normal. The same pattern on a 5-year-old painting indicates a defect in materials or technique.

The conservator's job is to distinguish between expected aging (normal for this material at this age) and abnormal deterioration (something has gone wrong). The assessment is ALWAYS relative to material norms, never absolute.

**Standard vocabulary.** The American Institute for Conservation (AIC) defines a condition reporting vocabulary that works across all media: stable, actively deteriorating, structurally compromised, surface damage, previous intervention, original, altered. These terms mean the same thing whether applied to a painting or a ceramic. The vocabulary is intentionally medium-agnostic.

**For Alien Eyes:** Define a surface-agnostic condition vocabulary. "Functional" (works as intended), "degraded" (works but with issues), "broken" (does not accomplish purpose), "vulnerable" (works now but is fragile), "undocumented" (works but cannot be understood by others). This vocabulary can be applied to any surface without surface-specific knowledge.

### C. Calibration Method

Conservation calibration is uniquely rigorous because mistakes are irreversible (you cannot un-clean a painting):

1. **Condition report peer review.** Every condition report is reviewed by a second conservator. Disagreements are documented in the report itself — "Conservator A identified this as original; Conservator B believes this is a later addition. Further analysis recommended." Uncertainty is a first-class citizen.

2. **Material-specific training.** A paintings conservator does not treat textiles. Specialization is mandatory. Generalist conservators exist (they do condition reports) but any intervention requires a specialist. For Alien Eyes: your generalist scoring engine can evaluate all surfaces at a surface level, but deep findings for MCP servers, CLI tools, or API quality should be flagged as requiring "specialist" evaluation until the primitives for those surfaces are validated.

3. **Reference collections.** Museums maintain reference collections of materials in known states — samples of paint at various stages of degradation, samples of corroded bronze, samples of foxed paper. New observations are compared against these references. For Alien Eyes: maintain a reference corpus of audited products per surface type, with scores that have been human-validated.

4. **Minimal intervention principle.** The conservator's first obligation is "do no harm." Any treatment must be reversible if possible. For Alien Eyes: findings should recommend the minimum intervention that resolves the issue. A finding that says "rewrite your entire authentication system" when the actual fix is "add SameSite=Strict to your session cookie" violates minimal intervention.

### D. The Trap You Fell Into

Conservation made a catastrophic error in the 19th century that we are still undoing: **applying one medium's standards to another.** Early conservators "cleaned" paintings to make them look like freshly painted canvases, removing centuries of legitimate patina. They consolidated cracked paint to make surfaces smooth, destroying evidence of the artist's technique. They treated aging as damage, when aging was actually the natural state of the material.

The deeper version of this error was assuming that the GOAL of conservation was to restore the object to its original state. Modern conservation recognizes that the goal is to stabilize the object in its current state while preserving both the original material AND the evidence of its history.

**Warning for Alien Eyes:** When you audit older or established products, resist treating "old patterns" as defects. A product using jQuery is not defective — jQuery may be the correct technical choice for that product's context. A CLI that uses POSIX-style flags instead of subcommands is not "bad CLI design" — it follows a different, older, and equally valid convention. Your primitives must distinguish between "this doesn't follow current best practice" (quality observation) and "this is actually broken" (fault). Otherwise, your audits will read as "this product is not built the way I would build it," which is not a quality assessment.

### E. The One Pattern That Transfers

**Documentation as the Primary Output.**

In conservation, the condition report IS the deliverable. Not the treatment, not the restoration — the documentation. A conservator who treats an object without documenting the before-state, the treatment performed, and the materials used has committed malpractice, even if the treatment was technically excellent. The documentation enables future conservators to understand what was done and why.

For Alien Eyes: your Evidence Bundle is conservation's condition report. It should be treated as the PRIMARY output, not a supporting artifact. The evidence is what makes findings trustworthy, reproducible, and disputable. Without evidence, a finding is an opinion. With evidence, it is a scientific observation. Invest more engineering effort in evidence quality than in finding generation.

### F. Three Specific Recommendations

1. **Add a `materialNorm` or `surfaceExpectation` field to the Finding type.** This captures what is NORMAL for this surface type and this product's age/stage. "Expected: MCP servers typically expose 3-15 tools. Observed: this server exposes 47 tools with overlapping functionality." The norm provides context that prevents findings from being interpreted as universal standards when they are surface-specific observations.

2. **Implement a "minimal intervention" principle in finding recommendations.** Each finding's `expected` field should describe the SMALLEST change that resolves the issue, not the ideal state. Instead of "Implement comprehensive Content-Security-Policy with nonce-based script loading," write "Add a basic Content-Security-Policy header: default-src 'self'." The builder can iterate from there. Overscoped recommendations cause analysis paralysis.

3. **Never describe expected product aging as a deficiency.** Add an exclusion list of patterns that are valid for the product's stack/age. A PHP application using procedural code is not deficient. A website without a service worker is not deficient. A CLI without shell completions is not deficient. These are quality observations at most, never faults. The distinction between "this could be better" (quality) and "this is wrong" (fault) is the most important judgment call in the entire system.

---

## Expert 7: Forensic Accountant Mei Lin Chen

### A. Structural Analogy

| Alien Eyes Concept | Forensic Accounting Equivalent |
|---|---|
| The thing being evaluated | A set of financial statements — across banking, insurance, manufacturing, tech, nonprofit, government, crypto |
| The evidence | General ledger, bank statements, invoices, contracts, tax filings, blockchain transactions |
| A finding | An exception — a discrepancy, misstatement, irregularity, or non-compliance |
| Severity | Material misstatement (CRITICAL — affects financial decisions), significant deficiency (HIGH — internal control weakness), non-material misstatement (MEDIUM — correct but not urgent), minor observation (LOW — process improvement) |
| A dimension | Revenue recognition, expense classification, asset valuation, internal controls, regulatory compliance, related party transactions |

### B. Framework for Cross-Surface Consistency

Financial auditing evaluates organizations that are structurally incomparable. A multinational bank with $2 trillion in assets and a 5-person crypto startup with $500K in revenue both receive audit opinions, and both audit opinions must be meaningful. The framework that makes this work is **materiality-based audit methodology.**

**Materiality.** The single most important concept in financial auditing is materiality — the threshold below which a misstatement does not affect decisions. Materiality is defined relative to the entity being audited, not in absolute terms. For a bank, a $10M misstatement might be immaterial. For a startup, a $10K misstatement might be material. The threshold is typically 1-5% of a relevant benchmark (revenue, assets, net income).

**Materiality drives everything.** It determines which accounts to test, how many transactions to sample, what level of assurance to provide. It is the mechanism that makes audits of wildly different entities comparable — not by making them the same size, but by making them proportionally rigorous.

**The Audit Risk Model.** Every audit, regardless of industry, uses the same risk model:

```
Audit Risk = Inherent Risk x Control Risk x Detection Risk
```

- **Inherent risk:** How likely are errors in this area, given the nature of the business? (Cash-heavy businesses have higher inherent fraud risk. Complex financial instruments have higher inherent misstatement risk.)
- **Control risk:** How likely are errors to NOT be caught by internal controls? (Strong internal audit function reduces control risk. No segregation of duties increases control risk.)
- **Detection risk:** How likely are WE to miss errors in our audit procedures? (More sampling reduces detection risk. Less testing time increases detection risk.)

The model is universal. The inputs are entity-specific. A bank has different inherent risks than a nonprofit, but both are evaluated using the same model. This is how you compare across categories: not by comparing the findings, but by comparing the risk model's outputs.

**For Alien Eyes:** Define an audit risk model per surface. Inherent risk varies by surface (MCP servers have higher inherent schema risk than websites, because there are no established standards). Control risk varies by product maturity (an established API with versioning has lower control risk than a newly released one). Detection risk varies by your collection method (web crawling is a mature collection method; MCP introspection is new and has unknown blind spots). The model quantifies how much confidence to place in your findings per surface.

### C. Calibration Method

Financial audit calibration is the most formalized of any profession:

1. **Engagement Quality Control Reviews (EQCRs).** A second partner reviews every significant audit before the opinion is issued. This is not optional — it is required by ISA 220. The reviewer did not participate in the audit; they bring fresh eyes. For Alien Eyes: every methodology version should be reviewed by someone who did not design it.

2. **Firm-wide calibration exercises.** Large firms run annual calibration exercises where auditors from different offices evaluate the same simulated engagement. Results are compared and systemic biases identified. For Alien Eyes: run the same audit through multiple methodology versions and compare scores. Significant divergence indicates a calibration issue.

3. **Root cause analysis of inspection findings.** When a regulatory inspectorate (PCAOB, FRC) identifies a deficiency in an audit, the firm conducts root cause analysis. Was it insufficient testing? Incorrect materiality? Failure to understand the industry? The cause determines the fix: more training, updated methodology, or industry specialist involvement. For Alien Eyes: every confirmed false positive should trigger root cause analysis. Is the primitive wrong? Is the evidence insufficient? Is the surface-specific rubric miscalibrated?

4. **Industry specialization with general methodology.** Every auditor uses the same methodology (ISA, PCAOB standards). But industry-specific knowledge is required for complex industries. A tech auditor understands SaaS revenue recognition (ASC 606); a manufacturing auditor understands inventory costing (FIFO vs weighted average). The methodology is general; the application is specialized. For Alien Eyes: the pipeline is general; the primitives are surface-specialized.

### D. The Trap You Fell Into

Forensic accounting made a structural error in the early 2000s that the Enron and WorldCom scandals exposed: **confusing compliance with quality.** Arthur Andersen's audits of Enron were technically compliant with every auditing standard. They checked every box, followed every procedure, documented every step. And they missed a multi-billion dollar fraud because compliance with procedure had become a substitute for professional skepticism.

The fix was the Sarbanes-Oxley Act, which codified what should have been obvious: following the checklist is necessary but not sufficient. The auditor must exercise professional skepticism — an active, questioning mindset that challenges assertions rather than confirming them. SOX 404 requires auditors to evaluate internal controls, not just test transactions. The control environment (culture, tone at the top, incentive structures) matters as much as the individual transactions.

**Warning for Alien Eyes:** Your deterministic checks are your compliance procedures. They are necessary and efficient. But a product can pass every deterministic check and still be fundamentally flawed — because the checks measure what is measurable, not what matters. Your LLM-powered primitives are your professional skepticism layer. They should be designed to QUESTION what the deterministic checks found, not just to ADD MORE CHECKS. "All pages have valid heading hierarchy" (deterministic pass) but "the heading hierarchy does not reflect the content structure — it is being used for styling, not semantics" (LLM skepticism). The LLM layer should be adversarial to the deterministic layer, not additive to it.

### E. The One Pattern That Transfers

**Materiality as Proportional Significance.**

The concept of materiality — a threshold below which a finding does not affect decisions — is the most transferable principle in forensic accounting. It solves the scoring comparability problem directly. Instead of comparing absolute finding counts across surfaces, compare findings relative to a materiality threshold calibrated to each surface.

For a 50-page website, a missing alt tag on one decorative image is immaterial. For a 3-page landing page, the same missing alt tag is material — it represents a significant portion of the surface. The finding is the same; the materiality is different.

**For Alien Eyes:** Materiality is the bridge between the actuary's exposure basis and a practical scoring system. Define materiality per surface type and per product size. Small products have lower materiality thresholds (everything matters). Large products have higher thresholds (minor issues are noise). This prevents large products from being penalized for having more surface area to find issues in, and prevents small products from getting artificially clean scores because there was less to audit.

### F. Three Specific Recommendations

1. **Implement materiality thresholds per surface and product size.** Define what is "material" — the threshold at which a finding matters enough to report. For a 50-page website: 1 finding per 10 pages (5 findings total). For a 3-endpoint API: any finding is material. For a CLI with 20 commands: 1 finding per 5 commands. Findings below the materiality threshold are logged for pattern detection but not reported to the builder. This prevents report fatigue and focuses attention on what actually matters.

2. **Design the LLM primitives as skeptics, not as additional checkers.** The LLM layer should receive the deterministic findings and CHALLENGE them: "The deterministic check found valid heading hierarchy. But examine the actual headings — are they being used semantically or just for styling?" This adversarial relationship between the deterministic and LLM layers is how you achieve the equivalent of professional skepticism. It is the opposite of the common pattern where LLM adds more findings on top of deterministic ones.

3. **Add an `auditRiskScore` to the audit metadata per surface.** This quantifies your confidence that the audit FOUND what there was to find. Inherent risk (how likely are issues on this surface type?) x Control risk (how mature is the product?) x Detection risk (how comprehensive is our collection method for this surface?). A surface where detection risk is high (MCP servers, where your introspection tools are new) should carry a visible "coverage confidence" indicator. The builder should know: "We are 90% confident this web audit found all material issues" vs "We are 60% confident this MCP audit found all material issues — our MCP evaluation methodology is new."

---

---

# Cross-Panel Synthesis

## 1. Universal Evaluation Framework

All seven experts converge on a three-layer evaluation structure. The terminology differs, but the architecture is identical:

| Layer | Sommelier | Actuary | GP | Film Jury | Inspector | Conservator | Accountant |
|---|---|---|---|---|---|---|---|
| **1. Universal Process** | Appearance → Nose → Palate → Conclusion | Risk identification → Measurement → Pricing → Reserving | History → Exam → Investigation → Diagnosis | Watch → Discuss → Evaluate → Select | Safety → Health → Code → Quality | Inspect → Document → Assess → Recommend | Plan → Test → Evaluate → Report |
| **2. Surface-Specific Criteria** | Mousse quality (sparkling), heat integration (spirits), head retention (beer) | Exposure basis varies by risk class | System-specific examination techniques | Category-specific technical standards | Building-type-specific codes | Material-specific degradation norms | Industry-specific accounting standards |
| **3. Universal Quality Conclusion** | Poor → Acceptable → Good → Very Good → Outstanding | Loss ratio (normalized across all lines) | Diagnosis + prognosis | "Does this enlarge the viewer?" | Certificate of Occupancy (pass/fail + conditions) | Stable / Actively Deteriorating / Compromised | Audit opinion (unqualified, qualified, adverse, disclaimer) |

**The structural pattern: universal process, surface-specific criteria, universal conclusion.** This is the sandwich architecture. Alien Eyes should implement it as:

1. **Universal pipeline** (collect → probe → evaluate → synthesize → render) — same for all surfaces
2. **Surface-specific primitives** (web has DOM/screenshot/headers; MCP has tool schemas/resource queries; CLI has help text/exit codes) — different evidence and rubrics per surface
3. **Universal scoring** (satisfaction score 0-100, severity classification, finding lifecycle) — same scale and meaning regardless of surface

The pipeline never changes. The primitives always change. The scoring never changes. This is the architectural contract.

## 2. Surface-Agnostic Quality Dimensions

Five quality dimensions emerged from ALL seven experts as applicable to every evaluation target, regardless of surface:

### The Five Universal Dimensions

| Dimension | What It Measures | Sommelier | Actuary | GP | Film | Inspector | Conservator | Accountant |
|---|---|---|---|---|---|---|---|---|
| **1. Purpose Fulfillment** | Does it accomplish what it exists to do? | Does the wine taste like what it claims to be? | Does the policy cover what it claims to cover? | Does the treatment address the diagnosis? | Does the film achieve what it set out to achieve? | Can occupants use the building for its intended purpose? | Is the object in a state that allows it to serve its function? | Do the financials fairly present the entity's position? |
| **2. Safety / Trust** | Can you trust it not to harm you? | Is the wine free of faults that could harm the drinker? | Is the risk adequately reserved against? | Will the treatment cause harm? | Is the film safe to screen (legal, ethical)? | Is the building structurally safe? | Will the conservation treatment harm the object? | Are the financials free of material misstatement? |
| **3. Documentation Quality** | Can a third party understand it? | Are the label, vintage, and appellation accurate? | Is the policy language clear? | Is the medical record complete? | Does the press kit accurately represent the film? | Do plans match construction? | Is the condition report complete? | Is the audit trail sufficient? |
| **4. Standards Compliance** | Does it meet the relevant standards for its type? | Does it conform to appellation rules? | Does it comply with regulatory requirements? | Does it follow clinical guidelines? | Does it meet technical standards (resolution, sound mix)? | Does it meet building code? | Does it meet conservation ethics standards? | Does it comply with GAAP/IFRS? |
| **5. Resilience / Maintainability** | Will it continue to work over time? | Will the wine age well? | Is the risk portfolio diversified? | Is the treatment sustainable? | Will the film endure beyond its festival run? | Is the building durable and maintainable? | Is the object stable in its environment? | Are internal controls sustainable? |

These five dimensions can be operationalized for EVERY surface Alien Eyes evaluates:

| Universal Dimension | Web | MCP Server | CLI | REST API | npm Package |
|---|---|---|---|---|---|
| Purpose Fulfillment | Can a user accomplish the product's core task? | Can an agent discover and use the tools effectively? | Can a user accomplish the stated task from the help text? | Can a consumer retrieve/mutate the stated resources? | Can a developer install, import, and use the exported API? |
| Safety / Trust | HTTPS, CSP, no exposed secrets, no XSS vectors | Permission model, input validation, no data leakage | No arbitrary code execution, safe defaults, input sanitization | Authentication, authorization, rate limiting, input validation | No known vulnerabilities, safe post-install scripts, no telemetry without consent |
| Documentation Quality | Clear copy, accurate meta tags, helpful error pages | Tool descriptions, parameter descriptions, example usage | Help text, man page, --version, error messages | OpenAPI/Swagger spec, endpoint documentation, changelog | README, API docs, TypeScript types, CHANGELOG |
| Standards Compliance | WCAG, SEO best practices, HTML validity | MCP specification compliance, JSON-RPC correctness | POSIX conventions, exit code standards, signal handling | REST conventions, HTTP status codes, content negotiation | semver, ESM/CJS compatibility, peer dependency declarations |
| Resilience / Maintainability | Performance under load, graceful degradation, caching | Schema stability, version negotiation, graceful deprecation | Idempotent operations, config file support, update mechanism | Versioning, backward compatibility, deprecation headers | Dependency currency, test coverage indicators, release cadence |

**Recommendation:** These five universal dimensions should form the top-level scoring framework for ALL surfaces. Surface-specific sub-dimensions (like the current SEO, accessibility, etc. for web) should nest UNDER these universal dimensions. The current six web dimensions map cleanly:

| Current Web Dimension | Universal Dimension Parent |
|---|---|
| SEO | Documentation Quality + Standards Compliance |
| Accessibility | Standards Compliance + Purpose Fulfillment |
| Security Surface | Safety / Trust |
| Performance | Resilience / Maintainability + Purpose Fulfillment |
| Agent-Nativeness | Purpose Fulfillment (for agent audience) |
| Copy & UX | Purpose Fulfillment + Documentation Quality |

## 3. Calibration Architecture

Six of seven experts described nearly identical calibration structures. Synthesized into a four-phase calibration system for Alien Eyes:

### Phase 1: Reference Corpus (Before Launch per Surface)

Before launching audits for any new surface type, manually audit 20-50 products of that type with human review. These become the reference corpus — the "calibration wines," the "standardized patients," the "reference collections." Each reference product has:
- Known findings (ground truth)
- Known scores (human-validated)
- Known edge cases and false positive triggers
- Documentation of what "excellent" vs "poor" looks like for that surface

**Gate:** No surface goes live until the reference corpus exists and the automated pipeline reproduces >= 80% of the human-identified findings on the reference corpus.

### Phase 2: Credibility Weighting (Early Audits)

For the first 10-50 audits on a new surface, apply credibility weighting (from the actuary). Blend surface-specific scores with the cross-surface portfolio average. As the sample grows, shift weight from portfolio to surface-specific. This prevents early scores from being wild outliers that damage trust.

Formula: `blended_score = z * raw_score + (1-z) * portfolio_average`

Where `z = min(1.0, sqrt(n / 50))` and `n` is the number of completed audits for that surface type.

### Phase 3: Continuous Calibration (Ongoing)

- **False positive tracking per primitive per surface** (from the GP and the accountant). Every `false_positive` lifecycle state feeds back into primitive recalibration.
- **Root cause analysis** (from the accountant). Every FP > threshold triggers investigation: wrong primitive? wrong rubric? wrong evidence?
- **Cross-surface pattern detection** (from the GP). If the same finding pattern appears across surfaces, validate once and propagate.
- **Methodology version bumps** (from the conservator). Recalibration changes the methodology version.

### Phase 4: Inter-Rater Reliability (Scale)

When Alien Eyes runs multiple audit instances (for 2-of-3 averaging in v0.2), track inter-rater reliability across instances. If two runs of the same audit on the same product produce significantly different scores, the primitives need recalibration. Target: Cohen's kappa >= 0.7 for finding-level agreement, ICC >= 0.8 for score-level agreement.

## 4. Anti-Patterns

The five most dangerous mistakes from all domains, ranked by relevance to Alien Eyes:

### Anti-Pattern 1: Applying One Surface's Standards to Another (Severity: CRITICAL)
- **Source:** Sommelier (still wine criteria on sparkling), Conservator (painting standards on textiles), Inspector (residential code on commercial)
- **Manifestation in Alien Eyes:** Web-derived quality criteria applied to MCP servers, CLIs, or APIs. "Your MCP server doesn't have a sitemap" is the equivalent of asking a Champagne to taste like Bordeaux.
- **Prevention:** Surface-specific rubrics are MANDATORY. No primitive may evaluate a surface it was not designed for. The pipeline enforces surface-type routing: web primitives run only on web crawl results; MCP primitives run only on MCP introspection results.

### Anti-Pattern 2: Checklist Compliance as Quality (Severity: CRITICAL)
- **Source:** Inspector (checklist replacing judgment), Accountant (Enron-style compliance without skepticism)
- **Manifestation in Alien Eyes:** Deterministic checks dominate findings by volume; builders optimize for passing checks rather than being good. 50 passing checks with 1 failing check produces a misleading "95%" score even when the failing check is catastrophic.
- **Prevention:** LLM primitives serve as skeptics, not just additional checkers. The synthesis layer must evaluate whether passing checks actually indicate quality, not just compliance. The satisfaction score should weight purpose-fulfillment higher than standards-compliance.

### Anti-Pattern 3: Treating Expected Surface Characteristics as Defects (Severity: HIGH)
- **Source:** Conservator (patina as damage), Film Jury (documentary roughness as poor craft)
- **Manifestation in Alien Eyes:** Flagging jQuery usage as a finding. Flagging a CLI without shell completions. Flagging an API without GraphQL support. These are style choices, not defects.
- **Prevention:** Each primitive must distinguish between faults (objectively broken) and quality observations (could be better by modern standards). The Finding type should carry a `category: 'fault' | 'quality'` field. Builder-facing output should clearly separate the two.

### Anti-Pattern 4: Ignoring Cross-Surface Root Causes (Severity: HIGH)
- **Source:** GP (specialist silos missing sleep apnea), Actuary (correlated losses treated as independent)
- **Manifestation in Alien Eyes:** Reporting 15 surface-specific findings when the root cause is one decision (e.g., "no error handling standard across the product"). Each surface shows symptoms; the disease is cross-surface.
- **Prevention:** Cross-surface synthesis in the SynthesisResult. After surface-specific primitives run, a cross-surface synthesis pass looks for finding patterns that share a root cause.

### Anti-Pattern 5: Equal Weighting Across Severity Tiers (Severity: MEDIUM)
- **Source:** Inspector (life safety must come first), Accountant (materiality prevents noise)
- **Manifestation in Alien Eyes:** A product with 10 LOW findings scoring worse than a product with 2 CRITICAL findings, because 10 x -2 points = -20 while 2 x -25 points = -50 is counterintuitive (actually the current system handles this correctly, but the PRESENTATION may not). More subtly: a report that lists all 10 LOWs before mentioning the 2 CRITICALs, burying the important information.
- **Prevention:** Always present findings in severity order, not dimension order. The first thing the builder sees should be the most critical finding, regardless of which dimension produced it.

## 5. The Scoring Problem

How to make scores comparable across surfaces without forcing false equivalence. Six experts provided convergent solutions:

### The Three-Component Score

Instead of a single number, every surface audit produces three components:

**Component 1: Fault Score (Deterministic)**
- Binary: how many faults exist relative to the surface's exposure basis?
- Formula: `fault_score = 100 - sum(severity_deductions) / exposure_units * normalization_factor`
- This is directly comparable across surfaces because it is normalized per exposure unit
- Equivalent to: wine faults, building code violations, financial misstatements, medical diagnoses

**Component 2: Quality Score (Probabilistic)**
- Judgment: how well does this product fulfill its purpose?
- Assessed by LLM primitives against surface-specific rubrics
- Carries a confidence interval (wider for new surfaces)
- Equivalent to: wine quality assessment, film artistic merit, building fitness-for-purpose, conservation condition

**Component 3: Coverage Confidence (Meta)**
- How confident are we that we FOUND what there was to find?
- Based on the audit risk model: `coverage = 1 - (inherent_risk * detection_risk)`
- Low coverage confidence means: "there may be material issues we did not detect"
- Equivalent to: audit risk in accounting, sensitivity in medicine, inspection scope in building

**The Satisfaction Score as Composite:**
```
satisfaction = fault_score * 0.6 + quality_score * 0.4
reported with coverage_confidence as a qualifier
```

Example output: "Satisfaction: 72 (coverage confidence: 85%)" means "we scored this 72 and we believe we found 85% of what there is to find."

This solves the comparability problem: a web score of 72 and an MCP score of 72 mean the same thing (needs work), even though the underlying faults and quality observations are completely different. The coverage confidence tells you how much to trust each score — a web 72 at 90% confidence is more reliable than an MCP 72 at 60% confidence.

### Materiality Adjustment

Per the accountant's recommendation, apply materiality thresholds:
- Large surface (50+ pages, 20+ tools, 20+ endpoints): materiality threshold = 2% of exposure units. Findings below threshold are logged but not reported.
- Medium surface (10-49 exposure units): materiality threshold = 5%.
- Small surface (1-9 exposure units): all findings are material.

This prevents large products from being overwhelmed with immaterial findings and prevents small products from getting false "clean" scores.

## 6. Evidence Standards

What constitutes sufficient evidence across incomparable surfaces. Synthesized from all seven experts:

### The Evidence Adequacy Matrix

| Evidence Type | Web | MCP Server | CLI | REST API | npm Package |
|---|---|---|---|---|---|
| **Snapshot** (frozen state) | DOM hash + screenshot | Tool schema JSON + capability listing | Help text output + version string | OpenAPI spec snapshot + response samples | package.json + README + type definitions |
| **Behavioral** (observed action) | Network requests, console logs, form submissions | Tool invocation results, error responses | Command execution output, exit codes, stderr | Endpoint response codes, headers, body structure | Import/require behavior, export availability |
| **Temporal** (when observed) | ISO 8601 timestamp, page load time | Connection timestamp, response latency | Execution timestamp, runtime duration | Request timestamp, response time | Install timestamp, postinstall duration |
| **Provenance** (who/what produced the finding) | Model ID + tokens used + reasoning | Model ID + tokens used + reasoning | Model ID + tokens used + reasoning | Model ID + tokens used + reasoning | Model ID + tokens used + reasoning |

### Minimum Evidence Requirements

| Severity | Minimum Evidence |
|---|---|
| CRITICAL | Snapshot + Behavioral + Temporal + Provenance. 100% completeness. NO EXCEPTIONS. |
| HIGH | Snapshot + Behavioral + Temporal. >= 90% completeness. |
| MEDIUM | Snapshot + Temporal. >= 70% completeness. |
| LOW | Temporal only acceptable. >= 50% completeness. |

### Surface-Specific Evidence Types

The current `EvidenceBundle` type is web-centric (DOM hash, screenshot). For multi-surface support, generalize:

```
Current (web-only):
  domSnapshotHash: string
  screenshotPath?: string
  relevantHeaders?: Record<string, string>

Proposed (multi-surface):
  snapshotHash: string         // SHA-256 of the primary evidence artifact
  snapshotType: SurfaceSnapshotType  // 'dom' | 'schema' | 'output' | 'spec' | 'manifest'
  snapshotPath?: string        // Storage path to the evidence artifact
  secondaryEvidence?: SecondaryEvidence[]  // Additional evidence items (screenshots, outputs, etc.)
  relevantMetadata?: Record<string, string>  // Surface-appropriate metadata (headers, env vars, etc.)
```

This preserves backward compatibility (web audits still produce `snapshotType: 'dom'`) while enabling MCP audits (`snapshotType: 'schema'`), CLI audits (`snapshotType: 'output'`), etc.

## 7. Triage System

How to prioritize which surface to examine first for a multi-surface product. Synthesized from the GP (Review of Systems), the Inspector (life safety first), and the Actuary (risk-based audit approach):

### The Multi-Surface Triage Protocol

**Stage 0: Discovery (10-30 seconds per surface)**

Before any evaluation, discover all surfaces. A product URL might have:
- Website (HTTP response on port 443)
- API (common paths: /api, /v1, /graphql, openapi.json)
- MCP server (advertised in .well-known, package.json, or docs)
- CLI (npm package, GitHub releases)
- Documentation (separate docs site, /docs path)
- GitHub repo (linked from website, package.json)

Discovery uses lightweight probes, not full audits. The output is a **surface map**: what exists, whether it responds, initial risk signals.

**Stage 1: Triage Pass (30 seconds per surface)**

For each discovered surface, run a minimal check:

| Surface | Triage Check | What It Reveals |
|---|---|---|
| Website | HTTPS? Responds? Status 200? Any console errors? | Basic health |
| API | Auth required? Returns JSON? Status codes correct? | Basic functionality |
| MCP | Connects? Lists tools? Schema validates? | Basic conformance |
| CLI | Installs? `--help` works? `--version` works? | Basic usability |
| Docs | Loads? Not empty? Matches product? | Basic presence |
| Package | Installs? Imports? No post-install warnings? | Basic safety |

**Stage 2: Priority Assignment**

Based on triage results, assign priority to each surface:

| Triage Result | Priority | Action |
|---|---|---|
| Critical signal (no HTTPS, auth bypass, broken install) | P0 — Examine immediately | Full audit, security-first |
| Degraded signal (errors, slow, partial functionality) | P1 — Examine next | Full audit, balanced |
| Healthy signal (responds, correct, no obvious issues) | P2 — Examine if budget allows | Full audit or targeted spot check |
| Not responsive / not found | P3 — Document absence | Note in scope-of-inspection; do not score |

**Stage 3: Budget Allocation**

Allocate the audit budget across surfaces based on priority:
- P0 surfaces get 40% of budget
- P1 surfaces get 35% of budget
- P2 surfaces get 25% of budget
- P3 surfaces get 0% (documented as out of scope)

If only one surface exists, it gets 100%. If all surfaces are P2 (healthy), distribute evenly.

## 8. Architecture Recommendations

Ten specific, actionable recommendations for the Alien Eyes type system, methodology, and pipeline, derived from the cross-panel synthesis:

### Recommendation 1: Generalize the Evidence Bundle Type (TYPE-SPEC change)

**What:** Replace the web-specific `EvidenceBundle` fields with surface-agnostic equivalents.

**Why:** All seven experts emphasized that evidence standards must be surface-appropriate. DOM hashes do not exist for CLI tools. Screenshots do not exist for MCP servers.

**Specifically:**
- Rename `domSnapshotHash` to `snapshotHash`
- Add `snapshotType: 'dom' | 'schema' | 'output' | 'spec' | 'manifest' | 'recording'`
- Rename `screenshotPath` to `primaryArtifactPath`
- Add `secondaryArtifacts: Array<{ type: string; path: string; description: string }>`
- Rename `relevantHeaders` to `relevantMetadata`

This is a TYPE-SPEC change requiring a version bump (1.0 -> 2.0) and human approval per the frozen type rules.

### Recommendation 2: Add Surface Type as a First-Class Concept (TYPE-SPEC addition)

**What:** Add a `SurfaceType` enum and a `surface` field to `CrawlResult`, `Finding`, and `SynthesisResult`.

**Why:** Every expert emphasized that evaluation criteria must be surface-aware. The system needs to know WHAT it is evaluating, not just WHERE.

**Specifically:**
```typescript
type SurfaceType = 'web' | 'mcp' | 'rest-api' | 'graphql-api' | 'cli' | 'npm-package' | 'github-repo' | 'docs-site' | 'webhook' | 'oauth-flow';
```

Add `surface: SurfaceType` to: `Finding`, `CrawlResult` (or its multi-surface equivalent), `AuditConfig`, `SynthesisResult`. The `AuditDimension` type should remain surface-agnostic (it already is), but dimension RUBRICS should be keyed by `[SurfaceType, AuditDimension]`.

### Recommendation 3: Implement the Exposure Basis (METHODOLOGY change)

**What:** Define an exposure unit per surface type. Normalize scores to findings-per-exposure-unit.

**Why:** The actuary and the accountant converged on this independently. Without normalization, scores across surfaces are meaningless. "3 findings on a 50-page website" and "3 findings on a 2-tool MCP server" represent vastly different quality levels.

**Specifically:**
| Surface | Exposure Unit | Example |
|---|---|---|
| Web | Pages crawled | 50 pages |
| MCP | Tools + resources + prompts | 12 tools |
| REST API | Endpoints enumerated | 24 endpoints |
| CLI | Commands available | 8 commands |
| npm package | Exported modules | 5 modules |
| GitHub repo | Source files analyzed | 120 files |

Add `exposureUnits: number` and `exposureUnitType: string` to `AuditMeta`.

### Recommendation 4: Split Finding Category into Fault vs Quality (TYPE-SPEC addition)

**What:** Add `category: 'fault' | 'quality'` to the `Finding` type.

**Why:** The sommelier, conservator, and inspector all emphasized this distinction. Faults are objective deviations (missing HTTPS, invalid exit code, malformed JSON). Quality observations are judgment-based (unclear copy, poor error messages, verbose output). They require different confidence thresholds, different presentation, and different response expectations from the builder.

**Impact:** Faults can be auto-fixed with high confidence. Quality observations require human review. The clipboard payload should separate them: "FAULTS (fix these)" followed by "QUALITY OBSERVATIONS (consider these)."

### Recommendation 5: Add Coverage Confidence to Scoring (METHODOLOGY change)

**What:** Report a coverage confidence alongside every satisfaction score.

**Why:** The accountant, GP, and inspector all emphasized that the evaluator must state the scope and confidence of their evaluation. A score without coverage confidence is an assertion without qualification.

**Specifically:** Add to `SynthesisResult`:
```typescript
coverageConfidence: Score;  // 0-100 with confidence interval
coverageFactors: {
  surfaceMaturity: 'established' | 'emerging' | 'experimental';
  collectionCompleteness: number;  // 0-1: what % of the surface did we observe?
  methodologyCalibration: number;  // 0-1: how well-calibrated are our primitives for this surface?
  sampleSize: number;  // how many products of this type have we audited?
};
```

This is the meta-score that tells the builder "how much to trust our score."

### Recommendation 6: Implement the Review of Systems as Pipeline Stage 0 (PIPELINE change)

**What:** Before any surface-specific primitives run, execute a 10-30 second triage pass across ALL discoverable surfaces.

**Why:** The GP, inspector, and actuary all described this pattern independently. It prevents the most common evaluation error: spending all budget on the most obvious surface while missing critical issues on an undiscovered surface.

**Specifically:** Add a `TriageResult` type:
```typescript
interface TriageResult {
  discoveredSurfaces: DiscoveredSurface[];
  priorityMap: Record<SurfaceType, 'P0' | 'P1' | 'P2' | 'P3'>;
  budgetAllocation: Record<SurfaceType, number>;  // percentage of total budget
  triageDurationMs: number;
}

interface DiscoveredSurface {
  type: SurfaceType;
  endpoint: string;
  responsive: boolean;
  criticalSignals: string[];  // e.g., "no HTTPS", "auth bypass", "broken install"
  health: 'critical' | 'degraded' | 'healthy' | 'unresponsive';
}
```

The triage pass feeds into the existing `AuditConfig` — it determines which surfaces get audited and with what budget.

### Recommendation 7: Build Reference Corpora Before Launching New Surfaces (PROCESS requirement)

**What:** No surface type goes live until 20-50 products of that type have been manually audited with human-validated scores.

**Why:** The sommelier (reference wines), the GP (standardized patients), the conservator (reference collections), and the accountant (calibration exercises) all require reference standards before evaluation begins.

**Specifically:** For each new surface type:
1. Manually audit 20 products (10 "good," 5 "mediocre," 5 "poor" — assessed by domain expert)
2. Record human-generated findings as ground truth
3. Run automated primitives against the same 20 products
4. Measure agreement: automated findings vs human findings
5. Gate: >= 80% recall (automated catches 80% of human-identified findings) AND <= 15% FP rate
6. Store the reference corpus permanently for ongoing calibration

### Recommendation 8: Add Cross-Surface Synthesis (PIPELINE addition)

**What:** After surface-specific primitives run, add a cross-surface synthesis pass that looks for patterns shared across surfaces.

**Why:** The GP (multi-system diagnosis), the actuary (correlated losses), and the inspector (multi-system buildings) all emphasized that surface-specific findings may share root causes invisible within any single surface.

**Specifically:** Add to `SynthesisResult`:
```typescript
crossSurfacePatterns: CrossSurfacePattern[];

interface CrossSurfacePattern {
  pattern: string;  // "Inconsistent error handling across all surfaces"
  findingIds: string[];  // IDs from multiple surfaces
  rootCause: string;  // "No error handling standard adopted across the product"
  surfaces: SurfaceType[];
  confidence: number;
}
```

This is where Alien Eyes adds value that no single-surface tool can provide — the generalist's view.

### Recommendation 9: Implement Credibility Weighting for New Surface Scores (SCORING change)

**What:** For the first N audits on a new surface type, blend scores with the portfolio average using a credibility formula.

**Why:** The actuary's credibility weighting prevents uncalibrated early scores from damaging trust. The first MCP audit should not produce a score of 23 when the actual quality is 65, just because the primitives are miscalibrated.

**Specifically:**
```
z = min(1.0, sqrt(n / 50))
reported_score = z * raw_score + (1 - z) * portfolio_average
```

Where `n` is the number of completed audits for that surface type. At n=50, the surface's own scores dominate entirely. Below n=50, scores are blended toward the mean. This MUST be disclosed in the audit output: "This score includes credibility weighting because our [surface type] evaluation methodology has been calibrated on [n] products."

### Recommendation 10: Allow Builder Purpose Declaration (UX addition)

**What:** For non-web surfaces, allow the builder to provide a one-sentence purpose declaration: "What does this product do, and for whom?"

**Why:** The film jury (ambition-fulfillment), the sommelier (typicity), and the conservator (intended function) all emphasized that quality can only be assessed relative to purpose. For websites, purpose can be inferred from the homepage. For CLIs, APIs, and MCP servers, purpose is not visible from the interface.

**Specifically:** Add to `AuditConfig`:
```typescript
purposeDeclaration?: string;  // "This CLI converts images between formats for developers"
```

When present, the synthesis layer evaluates findings against stated purpose. When absent, the synthesis layer infers purpose from available evidence (tool descriptions, README, help text). The purpose is used to weight the ambition-fulfillment component of the satisfaction score.

---

## Summary: What to Build

The seven experts converge on a clear architectural evolution for Alien Eyes:

| Priority | Change | Type | Source Experts |
|---|---|---|---|
| **P0** | Surface-agnostic evidence bundle | TYPE-SPEC v2.0 | All 7 |
| **P0** | SurfaceType as first-class concept | TYPE-SPEC v2.0 | All 7 |
| **P0** | Fault vs Quality finding category | TYPE-SPEC v2.0 | Sommelier, Conservator, Inspector |
| **P0** | Universal priority sequence (security first) | METHODOLOGY | Inspector, Accountant, GP |
| **P1** | Exposure basis per surface | METHODOLOGY | Actuary, Accountant |
| **P1** | Coverage confidence score | METHODOLOGY | Accountant, GP, Inspector |
| **P1** | Review of Systems triage pass | PIPELINE | GP, Inspector, Actuary |
| **P1** | Reference corpus per surface (before launch) | PROCESS | Sommelier, GP, Conservator, Accountant |
| **P1** | Cross-surface synthesis | PIPELINE | GP, Actuary, Inspector |
| **P2** | Credibility weighting for new surfaces | SCORING | Actuary |
| **P2** | Builder purpose declaration | UX | Film Jury, Sommelier, Conservator |
| **P2** | Materiality thresholds | SCORING | Accountant |
| **P2** | Audit risk model per surface | SCORING | Accountant |
| **P2** | Surface-specific dimension rubrics | METHODOLOGY | All 7 |

**The most important single insight across all seven experts:** The process is universal; the criteria are surface-specific; the conclusion is universal again. Alien Eyes should never apply web criteria to non-web surfaces, but it should always produce scores that are comparable across surfaces. The sandwich architecture — universal pipeline, surface-specific primitives, universal scoring — is the structural pattern that enables multi-surface quality evaluation without forcing false equivalence.

---

*Panel conducted 2026-03-11. 7 experts, 42 structured outputs, 8 synthesis sections, 10 architecture recommendations.*
