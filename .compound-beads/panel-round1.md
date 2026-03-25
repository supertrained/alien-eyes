

# Alien Eyes Expert Panel — Discovery Phase

## Panel Session: External Validation Harness for Digital Products

---

## Expert 1: Film Test Screening Producer

**Domain**: 30+ years recruiting audiences, running test screenings, producing actionable notes for directors and studios.

---

### Reaction to the Concept

This is essentially a test screening for software. I immediately see the parallel and the promise. In film, the director thinks they made a thriller — but the audience feels confused in act two and bored by the villain. The director's intent and the audience's experience diverge, and our job is to measure that gap precisely enough that the editor can close it.

Your product does the same thing: the builder thinks they made a tool that helps agents do X, but the agent gets stuck at step 3, and a human user can't find the pricing page. The gap between intended outcome and experienced outcome is your entire value proposition.

What excites me: you're testing from the *audience's* perspective, not the creator's. That's the only perspective that matters, and it's the one creators are constitutionally incapable of seeing clearly.

What worries me: you're trying to do this without a human in the loop for interpretation. In film, we never hand raw audience data to the director. We interpret it. A scene might get low scores not because it's bad, but because the scene before it created confusion that carries over. Diagnosis requires human-level understanding of narrative flow. Your equivalent: an agent might fail at step 5 not because step 5 is broken, but because step 2 gave it subtly wrong context. Can your system detect that?

---

### Question 1: User/Agent Journeys

**Solo builder pastes a URL:** This is like a filmmaker submitting a rough cut. The journey should feel like: (a) submit the thing, (b) we watch it with fresh eyes you don't have, (c) we tell you what the audience actually experienced vs what you intended. The critical moment is when findings come back — the builder needs to feel *informed*, not *attacked*. In screenings, we always lead with what's working before what isn't. The emotional design of the output matters enormously.

**Coding agent submits via API:** This is new territory — we've never had a robot editor who can re-cut the film in real time and resubmit. The output needs to be utterly unambiguous. In our world, "the pacing felt slow in act two" is useful to a human director. For your coding agent, the equivalent is useless. It needs: "Response time on endpoint /api/checkout exceeds 3200ms under simulated concurrent agent load; reduce to sub-500ms. Specific bottleneck: database query in handler at line 147 runs unindexed SELECT." That level.

**Agent framework evaluating trust:** This is like a distributor deciding whether to buy a film for release. They don't care about the art — they care about "will this work for the audience it's targeting?" Your trust evaluation needs to be a binary-with-confidence-interval: "This tool achieves its stated purpose for agent consumers 73% of the time (±8%, n=40 simulated sessions). Primary failure mode: inconsistent error response format."

---

### Question 2: Outcome Inference

This is what I've spent my career doing. When I watch a rough cut, I infer intent from genre signals, narrative structure, casting choices, marketing positioning, and what the studio told us (which we take with a grain of salt).

For your product, intent signals include:
- **Meta-descriptions, titles, OG tags** — what the builder says it is
- **Information architecture** — what's prominent vs buried reveals priorities
- **API documentation structure** — what endpoints exist, what's marked beta vs stable
- **Onboarding flows** — what the builder thinks a new user needs first
- **Error messages** — what the builder anticipated going wrong
- **Schema definitions** — what data the builder thinks matters

But here's the key lesson from film: **stated intent and actual intent often diverge**. A filmmaker says "I'm making a character study" but every scene is structured as a thriller. The film IS a thriller — the filmmaker just doesn't want to admit it. Similarly, a builder might say "this is an API for data enrichment" but the actual product is really "a way to avoid writing parsing code." Test against the *functional* intent, not the *stated* intent.

**When inference fails:** In film, when we genuinely can't tell what the movie is trying to be, that IS the finding. "Your audience doesn't know what kind of movie they're watching" is the most important note we can give. For Alien Eyes: "We could not determine what this product is trying to accomplish" should be a first-class finding, not an error state. It means the product has a fundamental clarity problem.

---

### Question 3: Output Format

In screenings, we produce two artifacts: (1) the numbers — ratings, dial scores, demographics — and (2) the narrative report that explains what the numbers mean.

For agent-consumable output, you need the equivalent:
- **Structured findings** (the numbers): JSON with severity, category, location, reproduction steps, suggested fix, confidence level
- **Narrative context** (the meaning): why this matters, what it reveals about a pattern, what the user was likely trying to accomplish when they hit this

Issues requiring human judgment — brand voice, business strategy, aesthetic choices — should be clearly tagged as `requires_human_review: true` with the reasoning laid out. Don't try to automate judgment calls. In film, we flag "the ending tested poorly" but we never tell the director what the ending should be. That's their job.

---

### Question 4: Scenario Separation

In test screenings, audiences never see the questions before they watch the film. But more importantly: **different audiences get different questions**. The Thursday night screening in Pasadena gets a focus group about character empathy. The Saturday screening in Dallas gets a dial test about pacing. We're testing different dimensions with different instruments.

For Alien Eyes:
- Maintain a **scenario library** with hundreds of test approaches per category
- For each audit, **sample** from the library — never run the same set twice
- **Weight** scenarios by relevance to the inferred product type
- **Rotate** aggressively — if a builder re-audits monthly, they should never see the same scenario configuration

Explaining failures without revealing tests: In film, we say "23% of the audience was confused about the character's motivation in the second act" — we don't say "we asked them a trick question about timeline continuity at minute 47." You should say "Agent users were unable to complete a typical enrichment workflow" not "We tested whether your /enrich endpoint handles missing fields gracefully." Describe the *outcome gap*, not the *test procedure*.

---

### Question 5: Avoiding Goodhart's Law

This is the biggest risk in test screenings. Studios have learned to optimize for test scores — they add exposition to fix "confusion" scores, they add a joke before the sad scene to fix "pacing" scores, they reshoot endings to be happier. And the scores go up. And the films get worse. Every. Time.

The scores go up because the audience is less confused, less bored, less uncomfortable. But confusion, boredom, and discomfort were doing narrative work. Remove them and you get a smooth, frictionless, forgettable film.

Your equivalent risk: a builder optimizes to pass your tests and ends up with a product that's technically correct but has no soul — a perfectly formatted API that nobody actually wants to use. An accessible website that's sterile and generic.

**Mechanisms to prevent this:**
- Test *outcomes*, not *compliance*. Don't test "does this endpoint return 200?" Test "can an agent accomplish the thing this endpoint exists to enable?"
- Include **subjective** panels alongside objective ones. Your simulated user panels should include agents with "preferences" — some want verbose responses, some want terse. If you optimize for all of them, you're optimizing for real diversity.
- **Decay scores over time.** A score from 6 months ago is stale. The ecosystem moved. Re-audit or the score dims.
- Periodically introduce **adversarial scenarios** that test for over-optimization. The equivalent in film: we show the re-edited version to a fresh audience who didn't see the original. If scores are lower, the "fixes" made things worse.

---

### The ONE Thing We're Most Likely to Get Wrong

**Confusing "passes tests" with "is good."** You'll build a comprehensive test suite, builders will optimize for it, scores will climb, and everyone will congratulate themselves. Meanwhile, the products getting perfect scores will start to feel the same — technically compliant, soullessly interchangeable. The test becomes the ceiling, not the floor.

### Mechanism to Steal: The Focus Group Debrief

After every test screening, we run a moderated discussion with 15-20 audience members. No survey. No numbers. Just: "Tell me what you were feeling during that scene." The insights that change films come from this, not from the dial scores. 

**For Alien Eyes:** After your automated panels run, include a "debrief synthesis" — an LLM-generated narrative that roleplays AS a frustrated user describing their experience in natural language. Not "error: 404 on /docs." Instead: "I was trying to figure out how to authenticate and I clicked what looked like the docs link but got a dead page, so I went back and tried the GitHub link which took me to a repo with no README, and at that point I gave up." That narrative is more actionable than any structured finding.

---

---

## Expert 2: Aviation Accident Investigator (NTSB)

**Domain**: 20+ years investigating aviation incidents, producing probable cause determinations, and issuing safety recommendations.

---

### Reaction to the Concept

The structural parallel here is strong: you're proposing an *independent investigative body* that examines a system, determines whether it's performing as intended, identifies failure modes, and issues findings — all while maintaining strict separation from the entity being investigated. That's exactly what we do.

What I immediately recognize as sound:
- **Separation of investigator and investigated.** The builder not seeing scenarios is equivalent to us not letting the airline choose which evidence we examine. Essential.
- **Inferring what should have happened.** Every investigation starts with: what was the intended flight path? What was the actual flight path? The gap between those is where investigation begins.
- **Agent-consumable output for autonomous fix.** This is like our Safety Recommendations — they must be specific enough that the airline/manufacturer can act on them, general enough to improve the whole fleet.

What concerns me:
- **You're pre-incident, not post-incident.** We investigate after something has gone wrong. You're testing before failure. That's a fundamentally different epistemology. We have evidence of actual failure. You're *simulating* failure. Simulation can miss failure modes that only emerge in real-world conditions with real stakes.
- **Probabilistic causation is hard.** In aviation, rarely is there one cause. It's a chain: maintenance error + weather + pilot fatigue + ATC miscommunication. Your findings need to capture this — a product might "fail" for an agent not because any single element is broken, but because the combination of latency + ambiguous schema + rate limiting creates an impossible situation.

---

### Question 1: User/Agent Journeys

**Solo builder (URL submission):** Treat this like a voluntary safety report. The builder is self-reporting for inspection. The journey should mirror our Voluntary Safety Reporting Program: submit → we investigate independently → findings are confidential and non-punitive → you receive specific recommendations with priority levels. Critical: **make it non-punitive.** If builders fear a bad score will be public, they won't submit edge cases. Give them a private score and a public "badge" only if they opt in after seeing results.

**Coding agent (API submission for autonomous fix):** This is closest to our ASAP (Aviation Safety Action Program) where pilots report issues and get corrective actions. The output needs to be machine-readable with:
- **Probable cause chain** (not a single root cause)
- **Contributing factors** ranked by remediation impact
- **Specific corrective actions** with expected outcome if implemented
- **Verification criteria** — how to confirm the fix worked

The re-audit cycle is your equivalent of our "corrective action verification." We don't just take the airline's word that they fixed it. We re-inspect. Same: the coding agent fixes, resubmits, you re-test, you verify the specific failure mode is resolved AND that the fix didn't introduce new failure modes (regression).

**Agent framework evaluating trust:** This is like an airline evaluating whether to purchase a new aircraft type. They want: safety record, known failure modes, maintenance requirements, performance envelope. Your trust output should include:
- **Reliability metrics** (uptime, error rates, consistency of responses)
- **Failure mode catalog** (known ways this tool fails, with severity and frequency)
- **Operational envelope** (works well under these conditions, degrades under those)
- **Comparison to category peers** (how does this tool compare to others in its class)

---

### Question 2: Outcome Inference

In aviation, we infer intent from: the filed flight plan, ATC communications, cockpit voice recorder, flight data recorder, aircraft maintenance logs, and pilot training records. We reconstruct what *should* have happened, then compare to what *did* happen.

For Alien Eyes, the "flight plan" equivalent:
- **Declared purpose** (README, docs, marketing copy) — the filed flight plan
- **Structural evidence** (architecture, endpoints, data models) — the aircraft configuration
- **Behavioral evidence** (what happens when you actually use it) — the flight data recorder
- **Error handling** (what the builder anticipated) — the emergency procedures

**Key principle from our field: The flight plan is not the flight.** What the builder says the product does is the starting hypothesis, not the conclusion. Your inference should weight *behavioral evidence* — what the product actually does when used — far more heavily than *declared purpose*.

**When inference fails:** In aviation, when we can't determine probable cause, we say exactly that: "The probable cause could not be determined." We list the factors we examined and why they were inconclusive. For Alien Eyes, an inconclusive inference should enumerate what was examined, what signals were contradictory, and what additional information would be needed. "Insufficient evidence to determine product intent. Marketing copy suggests data enrichment. API structure suggests batch processing. Actual behavior is inconsistent with both."

---

### Question 3: Output Format

NTSB reports have a rigid structure that has evolved over decades to be maximally actionable:

1. **Synopsis** — one paragraph, what happened
2. **Factual Information** — what we observed, with evidence
3. **Analysis** — what the evidence means, chain of causation
4. **Probable Cause** — the determination
5. **Recommendations** — specific actions, addressed to specific parties

For agent-consumable findings:

```
{
  "synopsis": "Product fails to accomplish stated purpose for agent consumers in 37% of test sessions",
  "factual_findings": [
    {
      "observation": "Authentication endpoint returns 200 with empty body on malformed token",
      "evidence_type": "behavioral",
      "confidence": 0.97,
      "reproduction": { "method": "POST", "endpoint": "/auth", "body": {"token": "malformed"} }
    }
  ],
  "causal_chain": [
    {
      "factor": "Silent auth failure",
      "type": "probable_cause",
      "contributes_to": "Agent proceeds with unauthenticated session",
      "remediation_impact": "high"
    },
    {
      "factor": "No error schema in API docs",  
      "type": "contributing_factor",
      "contributes_to": "Agent cannot detect failure state",
      "remediation_impact": "medium"
    }
  ],
  "recommendations": [
    {
      "action": "Return 401 with JSON error body on auth failure",
      "addressed_to": "api_developer",
      "priority": "urgent",
      "expected_outcome": "Agent consumers can detect and handle auth failures",
      "verification": "POST /auth with invalid token returns 401 with {error: string}"
    }
  ],
  "requires_human_judgment": [
    {
      "issue": "Product positioning is ambiguous — unclear if this is for developers or end-users",
      "why_human": "Business strategy decision outside scope of automated remediation",
      "impact": "Affects all downstream UX and API design decisions"
    }
  ]
}
```

The causal chain is critical. Don't just list bugs. Explain how they interact. An agent that can see "A causes B which causes C" can fix A instead of patching C.

---

### Question 4: Scenario Separation

In aviation, we have a concept called **party separation**: the airline being investigated can participate in the investigation (they know their systems best) but they cannot influence the scope, methodology, or conclusions. They see the evidence but don't control the investigation.

For Alien Eyes:
- **The builder sees findings but never methodology.** They see "authentication fails silently" but not "we sent a malformed JWT with an expired timestamp and a valid signature from a different issuer." 
- **Scenario evolution should be driven by failure data.** When we see a new type of accident, we create new investigation protocols. When Alien Eyes sees a new type of product failure across multiple audits, new scenarios should be generated to test for that pattern.
- **Explain failures through the causal chain, not the test.** "Your API returns 200 on auth failure" tells the builder exactly what's wrong and exactly how to fix it — without revealing that you tested it with 47 different malformed token variations.

**Critical principle from our field: findings must be reproducible but methodology need not be disclosed.** The builder should be able to verify each finding independently ("yes, my API does return 200 on a bad token — I can check that myself"). But they shouldn't know the full test matrix.

---

### Question 5: Avoiding Goodhart's Law

In aviation safety, we face this constantly: airlines optimize for metrics (incident rates, on-time performance, maintenance compliance) rather than actual safety. An airline can have perfect maintenance logs and still have unsafe practices because they're logging correctly, not maintaining correctly.

**Our primary defense: we investigate outcomes, not processes.** We don't audit whether the airline follows their maintenance checklist. We investigate when a plane crashes. The outcome is unfalsifiable.

For Alien Eyes:
- **Test outcomes, not compliance.** Don't check "does the API return proper error codes?" Check "can an agent successfully complete the workflow this API exists to enable?"
- **Use probabilistic assessment.** Not pass/fail. "73% success rate across 40 simulated sessions with these confidence intervals." This is much harder to game than a checklist.
- **Introduce novel scenarios regularly.** In aviation, new accident types reveal new failure modes nobody was testing for. Your scenario library should grow based on real-world failures you observe across all audits.
- **Cross-audit pattern detection.** We issue "Safety Alerts" when we see the same failure mode across multiple airlines. Alien Eyes should detect patterns across audits: "This auth failure pattern appears in 34% of APIs tested this quarter. Industry-wide issue."

---

### The ONE Thing We're Most Likely to Get Wrong

**Treating findings as binary (pass/fail) instead of probabilistic causation chains.** Real failures are almost never "this one thing is broken." They're "these five things are individually acceptable but their interaction creates a failure mode nobody anticipated." If your output is a list of individual bugs, you'll miss the systemic issues. If you capture the causal chain — how latency + ambiguous schema + rate limiting + no retry guidance combine to make the tool unusable for agents under real conditions — you'll catch what matters.

### Mechanism to Steal: The Swiss Cheese Model

James Reason's Swiss Cheese Model of accident causation: failures happen when holes in multiple defensive layers align. Each layer (design, maintenance, training, operations) has holes. No single hole causes a failure. Failure occurs when holes in ALL layers line up.

**For Alien Eyes:** Model each product as having layers — documentation, authentication, core functionality, error handling, performance, accessibility. Each layer has weaknesses. Individual weaknesses are findings. But the *critical* output is: "Here's where your weaknesses align across layers, creating a path to total failure." An agent that can see the aligned holes can prioritize fixing the ones that break the chain.

---

---

## Expert 3: Clinical Trial Protocol Designer

**Domain**: 25 years designing Phase I-IV clinical trials, adaptive designs, and regulatory submissions.

---

### Reaction to the Concept

You're designing a clinical trial for software. I mean that precisely. You have:
- A **test article** (the product)
- **Endpoints** (human-native score, agent-native score, satisfaction score)
- A **population** (simulated users/agents with heterogeneous characteristics)
- **Blinding** (the builder doesn't see the test scenarios)
- **Efficacy criteria** (does the product achieve its intended outcome?)
- The need to prevent **sponsor bias** (the builder gaming the tests)

This maps almost perfectly to clinical trial design. And clinical trials are the most rigorous framework humans have ever developed for determining whether something works. You should steal from us liberally.

My immediate concerns:
- **You haven't defined your primary endpoint.** "Human-Native Score" and "Agent-Nativeness Score" are composite endpoints. What are the components? How are they weighted? Are the weights the same for every product type? In trials, we define the primary endpoint with excruciating specificity BEFORE enrollment begins. You need to do the same BEFORE running the first audit.
- **Your population is simulated.** In trials, simulated patients are used for modeling, never for determination. Real patients are essential because they do things you didn't predict. Can your simulated agents surprise you? If not, you're running a simulation, not a trial.

---

### Question 1: User/Agent Journeys

**Solo builder (URL submission):** This is the **investigator-initiated trial** model. The builder (investigator) submits a protocol (URL), and we run the trial. The journey:

1. **Screening**: Is the product eligible for testing? (Is it a real URL? Does it respond? Is there enough content to evaluate?)
2. **Baseline assessment**: What does the product look like before any intervention? (Capture current state — this is your control.)
3. **Randomized testing**: Run scenarios from your library, randomly sampled and assigned.
4. **Data collection**: Capture all endpoints — quantitative scores + qualitative observations.
5. **Statistical analysis**: Are the results statistically significant? (With 40 simulated sessions, what's your power? What's your alpha?)
6. **Report**: Findings with confidence intervals, not point estimates.

**Coding agent (API for autonomous fix-retest):** This is the **adaptive trial design**. In adaptive trials, we examine interim results and modify the trial based on what we're seeing — drop an arm that's clearly failing, increase enrollment in a promising arm, adjust dosing. The agent equivalent:

- Agent receives findings after audit round 1
- Agent implements fixes
- Alien Eyes runs audit round 2 — but NOT the same scenarios. **Adaptive design**: focus testing on areas that failed in round 1, while also sampling new areas to check for regressions.
- Continue until either: (a) predefined success criteria are met, or (b) a maximum number of rounds is reached (prevent infinite loops).

**Agent framework evaluating trust:** This is a **systematic review / meta-analysis**. The framework wants to know: across all available evidence, how reliable is this tool? Output should include:
- Effect size (how much does the tool improve on the null case — doing nothing)
- Heterogeneity (does the tool work for some use cases but not others?)
- Quality of evidence (GRADE system equivalent — how confident are we in these results?)

---

### Question 2: Outcome Inference

In trials, we don't infer what a drug is "supposed to do." The sponsor tells us, and we verify. But there's a relevant parallel: **post-hoc subgroup analysis.** Sometimes a drug fails its primary endpoint but works remarkably well for a subpopulation nobody predicted. The drug was "supposed to" treat depression, but it actually treats anxiety in women over 50.

For Alien Eyes:
- Start with **declared intent** as your primary hypothesis
- Test against it
- But also run **exploratory analyses**: What IS this product actually good at, even if it's not what the builder says? "Your API documentation tool fails as documentation, but it's accidentally an excellent API discovery tool. Consider repositioning."
- This is high-value insight that pure compliance testing misses

**Formal inference framework:**
1. **H₀** (null hypothesis): The product does not achieve any identifiable purpose
2. **H₁** (primary hypothesis): The product achieves its declared purpose
3. **H₂** (exploratory): The product achieves an undeclared purpose
4. Test H₁ first. If rejected, test H₂. If both rejected, H₀ stands — the product has a fundamental purpose problem.

**When inference fails:** Declare the trial **inconclusive**. Not failed — inconclusive. There's a meaningful difference. Provide the data collected and let the builder draw their own conclusions. In trials, inconclusive results are published so others can learn from them. Your inconclusive audits should still provide all observations, even without a determination.

---

### Question 3: Output Format

In clinical trials, we produce two documents:
1. **Clinical Study Report (CSR)** — comprehensive, technical, regulatory-grade
2. **Lay Summary** — plain language for patients and the public

For Alien Eyes, the equivalent:

**Agent-consumable (CSR equivalent):**
```
{
  "trial_metadata": {
    "product_id": "...",
    "audit_timestamp": "...",
    "protocol_version": "3.2",
    "sample_size": 40,
    "statistical_power": 0.82,
    "alpha": 0.05
  },
  "primary_endpoints": {
    "human_native_score": {
      "value": 0.71,
      "ci_95": [0.63, 0.79],
      "p_value": 0.003,
      "vs_category_median": "+0.12"
    },
    "agent_native_score": {
      "value": 0.43,
      "ci_95": [0.31, 0.55],
      "p_value": 0.41,
      "vs_category_median": "-0.19"
    }
  },
  "adverse_events": [
    {
      "event": "Complete agent workflow failure",
      "incidence": "37% of sessions (15/40)",
      "severity": "serious",
      "causality": "definite",
      "mechanism": "Silent auth failure → unauthenticated state → 403 cascade"
    }
  ],
  "subgroup_analyses": [
    {
      "subgroup": "Agents with retry logic",
      "n": 12,
      "outcome": "Success rate 83% vs 47% for agents without retry",
      "interpretation": "Product is functional but fragile — requires client-side resilience"
    }
  ]
}
```

**Human judgment items** should be reported as **adverse events of unknown causality**: "Observed: marketing copy promises 'instant setup' but median onboarding time is 23 minutes. Classification: expectation mismatch. Causality assessment: possible (requires business context). Recommended action: human review of positioning vs actual experience."

---

### Question 4: Scenario Separation

Clinical trials have the most battle-tested blinding methodology on Earth. Here's what applies:

**Double-blinding:** In trials, neither the patient nor the doctor knows who got the drug vs placebo. For Alien Eyes: neither the builder nor the simulated user/agent should know the test criteria. The simulated users should be given a goal ("accomplish this task") not a checklist ("test these five things"). They should behave like real users, not test executors.

**Sealed protocol:** Before the trial starts, the full protocol is registered (clinicaltrials.gov). It can't be changed mid-trial without formal amendment. For Alien Eyes: define the scenario set BEFORE the audit runs. Don't adjust scenarios based on interim results within a single audit. (Between audits, yes — adaptive design. Within an audit, no — that's p-hacking.)

**Scenario evolution:** Use **Bayesian adaptive enrichment.** As you run thousands of audits across many products, you learn which scenarios are informative (discriminate between good and bad products) and which are noise (everything passes or everything fails). Weight informative scenarios higher. Drop non-discriminating scenarios. Add new scenarios based on novel failure modes detected.

**Explaining failures without revealing tests:** In trials, we tell patients "the drug didn't work for your condition" — we don't tell them "you scored 3 points below the cutoff on the Hamilton Depression Rating Scale at week 8." Report the **clinical outcome** ("Agent consumers could not complete authentication"), not the **measurement instrument** ("Scenario S-47b: malformed JWT injection test").

---

### Question 5: Avoiding Goodhart's Law

This is the replication crisis of clinical trials, and we've been fighting it for decades. Drug companies optimize for their primary endpoint — get the p-value below 0.05 — while ignoring whether patients actually feel better. The drug "works" by the numbers. Patients are no healthier.

**Our defenses:**

1. **Pre-registered endpoints.** You can't change what you're measuring after you see the data. For Alien Eyes: your scoring criteria must be versioned and auditable. A builder should be able to see "you were evaluated on protocol v3.2" and trust that v3.2 wasn't designed to make them fail.

2. **Patient-reported outcomes (PROs).** In addition to clinical measurements, we ask patients: "How do you feel?" These are harder to game because they're subjective and heterogeneous. For Alien Eyes: include "user-reported" satisfaction from simulated users, not just objective metrics. "The simulated user rated their experience 3/10 because they felt confused about what the product does" — that's a PRO.

3. **Active comparator arms.** Don't just test "does this product work?" Test "does this product work better than the obvious alternative?" If there are 10 REST API documentation tools, score them against each other, not against an absolute standard. Absolute standards become optimization targets. Comparative assessment stays honest because the competition keeps improving.

4. **Long-term follow-up.** A drug might work at week 8 but cause problems at month 6. A product might pass your audit today but degrade as its dependencies change. Build longitudinal tracking — trend scores over time, flag degradation.

---

### The ONE Thing We're Most Likely to Get Wrong

**Not defining the primary endpoint with sufficient rigor before launching.** If "Human-Native Score" is a weighted composite of 12 subscales but the weights are tuned based on early data, you've p-hacked your own product. The composite, the weights, the success thresholds, and the scoring methodology need to be defined, registered (publicly or internally), and FROZEN before the first paid audit. Otherwise, you'll unconsciously optimize the scoring to produce results that feel right, and the entire system's credibility collapses.

### Mechanism to Steal: Adaptive Enrichment Design

In adaptive enrichment trials, you start testing broadly across a diverse population. As data accumulates, you identify which subpopulations respond best and focus enrollment on them — without invalidating the overall trial.

**For Alien Eyes:** Start each audit testing broadly — many scenarios, many user/agent types. As the audit runs, identify which test dimensions are revealing real issues (failing in interesting ways) and which are noise (trivially passing). Adaptively allocate more testing resources to the informative dimensions. This gives you better signal with the same compute budget. Critical rule: the adaptive allocation algorithm must be pre-specified, not ad hoc.

---

---

## Expert 4: Restaurant Mystery Shopping Program Director

**Domain**: 18 years designing and running mystery shopping programs for chains from fast food to Michelin-starred restaurants.

---

### Reaction to the Concept

I run mystery shopping programs. This IS a mystery shopping program for digital products. I've been doing your job in the physical world for nearly two decades, and I can tell you exactly where the bodies are buried.

What you've got right:
- **Hidden scenarios.** Absolutely essential. The moment a restaurant knows what the shopper is evaluating, they perform for the test, not for the customer. Same for software.
- **Inferring what "good" looks like.** A fine dining restaurant and a taco truck are both trying to feed people, but "good" means completely different things. You have to calibrate your expectations to the product's category and ambition.
- **Actionable feedback for frontline.** My reports go to general managers who need to tell a line cook "your ticket time on entrees is 22 minutes, standard is 14, here's why." Not strategy — tactics.

What concerns me:
- **Scenario staleness is your silent killer.** In my world, we rotate scenarios quarterly because restaurant staff TALK. "The mystery shopper always orders the chicken parmesan and asks for a substitution." Within months, every server knows the tell. Your builders will share notes. "Alien Eyes always tests auth with malformed JWTs." If your scenarios leak or become predictable, your entire product is worthless.
- **Subjective scoring at scale is brutally hard.** Is the website "intuitive"? Is the error message "helpful"? I've spent decades trying to make subjective evaluation consistent and repeatable. It's the hardest problem in my field.

---

### Question 1: User/Agent Journeys

**Solo builder (URL paste):** This is the **new restaurant onboarding** — a restaurant signs up for mystery shopping because they want to improve. Journey:

1. **Intake**: Builder submits URL. We ask: what type of product is this? (They can skip — we'll infer. But if they tell us, we get a better calibration.) This is like asking "what's your restaurant concept?" 
2. **Category calibration**: We determine the evaluation rubric. A SaaS landing page is evaluated differently from an API. Fine dining is evaluated differently from fast casual.
3. **Shop execution**: Mystery shoppers (simulated users/agents) visit and attempt to accomplish tasks.
4. **Report**: Findings organized by visit phase (discovery → onboarding → core usage → error recovery), with scores relative to category, and specific improvement actions.
5. **Trend tracking**: If they re-audit, show improvement/degradation over time. Restaurants LOVE seeing their trend lines.

**Coding agent (API for autonomous fix-retest):** This is new for my field — we don't have restaurants that can remodel themselves overnight based on our report. But I'd structure it as a **rapid re-shop program**: fix the issue, request a targeted re-evaluation of just that area. Don't re-run the entire audit. If the kitchen was slow, we re-shop the kitchen specifically. Save time and money.

**Agent framework evaluating trust:** This is like a **franchise system** evaluating whether to approve a new vendor (food supplier, equipment manufacturer). They want:
- Overall quality score vs category benchmark
- Specific failure modes and their frequency
- Consistency across multiple evaluations (one good audit means nothing — show me three)
- Comparison to alternatives

---

### Question 2: Outcome Inference

This is literally my expertise. When I set up a mystery shopping program for a new restaurant, I visit it first as a genuine customer. I eat the food, I observe the service flow, I read the menu, I look at the decor, I check the restroom, I watch other customers. And I ask myself: **What is this place trying to be?**

The signals:
- **Price point** — tells you the expected quality tier
- **Menu design** — formal vs casual, extensive vs focused
- **Decor and ambiance** — signals the intended experience
- **Staff presentation** — uniforms vs casual dress, scripted vs natural
- **Location and context** — airport, downtown, suburban strip mall

For digital products:
- **Visual design quality** — signals budget, ambition, and target audience
- **Pricing page** (if present) — signals intended market tier
- **Documentation depth** — signals whether it's for beginners or experts
- **Competitor mentions** — signals positioning
- **Technology choices visible** — signals technical ambition

**Key insight from my field:** **Watch what they invest in, not what they say.** A restaurant that says "farm to table" but has a Sysco truck in the back is lying. A product that says "enterprise-grade" but has no authentication is lying. The investment reveals the truth.

**When inference fails:** In my field, this happens with concept restaurants that are deliberately genre-defying. A taco truck that serves $40 tacos with foie gras. What's the standard? In these cases, I evaluate against the **customer expectation** created by the product itself. If you price tacos at $40, I expect $40 quality. If your marketing says "AI-native API" and your API is a REST endpoint with no structured output, I evaluate against the expectation you created.

---

### Question 3: Output Format

Mystery shopping reports are read by general managers at 6 AM before the breakfast rush. They need to be:
- **Skimmable** — summary score at the top, details below
- **Specific** — "Server didn't greet within 30 seconds" not "service was slow"
- **Comparative** — "Your greeting time is 47 seconds. Category standard is 15 seconds. Your store last month was 32 seconds."
- **Actionable** — "Train hosts to acknowledge within 10 seconds even when they can't seat immediately"

For agent-consumable output, same principles:
```
{
  "summary": {
    "human_score": 71,
    "agent_score": 43,
    "category": "developer_api",
    "category_median": { "human": 65, "agent": 62 },
    "trend": { "human": "+6 vs last audit", "agent": "first audit" }
  },
  "findings": [
    {
      "phase": "authentication",
      "observation": "Auth endpoint returns 200 with empty body on invalid credentials",
      "standard": "Return 401 with structured error body",
      "gap": "Critical — agent cannot distinguish success from failure",
      "fix": "Return HTTP 401 with JSON body: {\"error\": \"invalid_credentials\", \"message\": \"...\"}",
      "difficulty": "low",
      "impact": "high",
      "category_prevalence": "34% of APIs in this category have this issue"
    }
  ]
}
```

**The "difficulty" and "impact" fields are crucial.** A restaurant GM with limited time and budget needs to know: "Fix the slow ticket time (easy, high impact) before redesigning the menu (hard, medium impact)." Coding agents need the same prioritization.

For human judgment items: **flag them clearly and explain WHY a human is needed.** "Your onboarding copy uses technical jargon that may alienate non-developer users. This is a brand/audience decision that requires human judgment. Current jargon density: 4.2 terms per paragraph. Category median: 1.8."

---

### Question 4: Scenario Separation

This is where I have the most hard-won battle scars.

**Scenario freshness is existential.** In my programs:
- We maintain a library of 200+ scenario templates per restaurant category
- Each shop uses a randomly assembled scenario from components (what to order, what to ask, what to complain about, what to observe)
- We retire scenarios after 12 months regardless of performance
- We add 20% new scenarios every quarter based on industry trends and emerging failure modes
- **We actively monitor for scenario leakage.** If a restaurant suddenly improves on one specific metric that's always been weak, we suspect they learned the scenario. We replace it immediately.

For Alien Eyes:
- **Component-based scenario assembly.** Don't have monolithic test scripts. Have test components (auth challenge, error injection, load simulation, schema validation, etc.) that are assembled randomly for each audit.
- **Scenario retirement.** Even effective scenarios become stale. Retire and replace on a schedule.
- **Leakage detection.** If a product suddenly improves on a specific dimension after an audit but nowhere else, they may have reverse-engineered that specific test. Flag it and replace the scenario.
- **Difficulty graduation.** Start with common scenarios. If the product passes, introduce harder variants. Don't waste advanced scenarios on products that fail the basics.

**Explaining failures without revealing scenarios:** In mystery shopping, we describe the **experience**, not the **methodology.** "A customer attempting to modify their order experienced a 3-minute wait with no acknowledgment from staff" — not "Our shopper was instructed to ask to substitute the side dish at the 12-minute mark and time the response." Describe the outcome gap. The builder can verify it independently. They don't need to know the exact test.

---

### Question 5: Avoiding Goodhart's Law

Oh, I've lived this. Restaurants optimize for mystery shop scores all the time. They drill staff on the exact behaviors we measure — greet within 30 seconds, upsell a drink, mention the special — and the scores go up. But the actual dining experience gets worse because the staff feel like robots following a script, and customers sense the inauthenticity.

**What we've learned:**

1. **Measure the experience, not the compliance.** We shifted from "did the server say 'welcome'?" to "did you feel welcomed?" From "did they offer dessert?" to "was the meal conclusion satisfying?" Behavioral checklists can be gamed. Experiential outcomes are harder to fake.

2. **Include genuinely surprising scenarios.** "Your child spills a drink" or "you have a dietary restriction you didn't mention until ordering" — these test adaptability, not compliance. For Alien Eyes: include scenarios that test how the product handles UNEXPECTED inputs, not just the expected ones. An API that handles all the documented cases but crashes on anything unexpected is brittle, not good.

3. **Aggregate across many shops, weight by recency.** No single shop determines the score. We aggregate 12 shops per quarter, weight recent shops more heavily, and look at trends. A restaurant that gamed one shop still has 11 honest ones diluting the effect. For Alien Eyes: don't let a single audit determine the score. Encourage longitudinal assessment. A product that passes once might have gotten lucky. A product that passes consistently is genuinely good.

4. **Red team your own scenarios.** We hire people to try to figure out our scenarios so we can see how easy they are to game. For Alien Eyes: regularly attempt to game your own system. Submit a product that's designed to pass tests but be genuinely bad. If it scores well, your tests are gameable.

---

### The ONE Thing We're Most Likely to Get Wrong

**Calibration across categories.** A score of 71 for a developer API should mean the same quality level as a score of 71 for a marketing website. But the testing dimensions are completely different. In my world, a 71 for a fine dining restaurant and a 71 for a fast food restaurant are supposed to mean "good for its category" — but achieving that calibration is a decade-long project. You'll likely launch with uncalibrated scores across categories, and builders will (rightly) complain that the scores aren't comparable. Define what each score level MEANS for each category BEFORE launching, and revisit constantly.

### Mechanism to Steal: The Comment Card Verbatim

After every mystery shop, the shopper writes a free-form narrative: "I walked in and immediately noticed the hostess was on her phone. She looked up after about 20 seconds, seemed annoyed that I was there, and mumbled something about a 10-minute wait. I almost left." This narrative is often more valuable than all the scored metrics combined, because it captures the *felt experience* in a way scores cannot.

**For Alien Eyes:** After each simulated session, generate a free-form "verbatim" narrative from the simulated user/agent's perspective. Not structured findings — a story. "I visited the website hoping to find pricing information. The homepage had a lot of text about the company's mission but I couldn't find pricing. I clicked 'Products' and got a grid of six options with no prices. I clicked the first one and it was a 2,000-word feature page, still no pricing. I eventually found 'Contact Sales' which tells me this isn't self-serve despite the marketing suggesting it is. I gave up." This narrative, alongside the structured data, gives the builder an empathetic understanding of the failure that scores alone cannot provide.

---

---

## Expert 5: Chaos Engineering Lead (Netflix-style)

**Domain**: 12 years building and running chaos engineering programs, including GameDay exercises, automated fault injection, and resilience verification.

---

### Reaction to the Concept

I inject failures into production systems to see what breaks. You're proposing to inject *users* — real and simulated — into production products to see what breaks. Same philosophy, different injection vector. I like it.

What resonates strongly:
- **The builder doesn't know what will be tested.** This is the core principle of chaos engineering. If engineers know you're going to kill the database, they'll make sure the database failover works. But the cache layer, the message queue, the DNS resolution — those will still be brittle. Testing what you don't expect is the only way to find real weaknesses.
- **Agent-consumable output for autonomous remediation.** This is where chaos engineering is heading. We don't just find problems — we build systems that detect and fix problems automatically. Your vision of "agent reads findings, fixes issues, resubmits" is the same loop we run with automated rollbacks and self-healing infrastructure.
- **Probabilistic assessment.** In chaos engineering, nothing is pass/fail. It's "under these conditions, the system degrades this much, with this probability." That's the right framework.

What concerns me:
- **You're testing the product, not the product-in-context.** A tool might work perfectly in isolation but fail when used by an agent that's also managing three other tools, under memory pressure, with a 30-second timeout. Context matters enormously. How do you simulate realistic usage context?
- **External testing has inherent limitations.** I test from INSIDE the system — I can kill processes, corrupt data, inject latency at the network layer. You're testing from OUTSIDE — you can only interact through the product's public interfaces. This means you'll miss entire classes of failure modes (data corruption, state inconsistencies, internal timeout cascades).

---

### Question 1: User/Agent Journeys

**Solo builder (URL paste):** This is the **GameDay** model. A GameDay is a scheduled chaos engineering exercise where we test a system's resilience. Journey:

1. **Define steady state**: What does "working" look like for this product? (Your outcome inference)
2. **Hypothesize**: "We believe this product will continue to function correctly when agents interact with it under varied conditions"
3. **Run experiments**: Inject your simulated users/agents
4. **Observe**: Measure deviation from steady state
5. **Report**: "Here's where the system deviated from steady state, by how much, and what likely caused it"

The builder should understand this framing: "We're not looking for bugs. We're testing resilience. How well does your product handle the real-world chaos of diverse users and agents trying to use it?"

**Coding agent (API for autonomous fix-retest):** This is **automated chaos with automated remediation** — the holy grail of our field. The loop:

1. Chaos experiment finds weakness
2. System automatically generates a fix (canary deployment, config change, scaling adjustment)
3. Fix is deployed to a subset
4. Chaos experiment is re-run against the fixed subset
5. If the weakness is resolved and no new weaknesses appear, the fix rolls out fully

For Alien Eyes: the coding agent receives findings, generates a fix, deploys to a staging environment, requests targeted re-audit of the fixed area, and only merges to production when the re-audit passes. **Include regression checks** — re-run a sample of previously passing scenarios to ensure the fix didn't break something else.

**Agent framework evaluating trust:** This is **resilience scoring** — a metric we've developed for comparing the resilience of different services. The output should be:

- **Resilience envelope**: under what conditions does this tool function correctly? (Load range, input variety, error handling robustness)
- **Degradation profile**: when it fails, HOW does it fail? (Gracefully with useful errors? Catastrophically with no information? Silently with wrong results?)
- **Recovery time**: how quickly does it recover from failure states?
- **Blast radius**: when it fails, what else is affected?

The degradation profile is critically important. A tool that fails loudly ("500: database connection lost") is FAR better than one that fails silently (returns cached stale data with a 200). Agent frameworks need to know: when this tool breaks, will I know?

---

### Question 2: Outcome Inference

In chaos engineering, we define "steady state" — the normal operating behavior of the system — and then we test whether the system can maintain steady state under adverse conditions. We don't infer what the system is "supposed to do." We observe what it DOES do under normal conditions and define that as the baseline.

**For Alien Eyes, a two-phase approach:**

**Phase 1: Observe steady state.** Before testing anything, send "normal" traffic — straightforward requests, typical usage patterns. Record what the product does. This is your behavioral baseline.

**Phase 2: Introduce chaos.** Now send unusual, edge-case, adversarial traffic. Compare behavior to the baseline. Where does it diverge?

This is powerful because it doesn't require you to know what the product is "supposed to do." You observe what it does, then test whether it does that consistently under stress. Products that maintain behavior under chaos are resilient. Products that diverge are fragile.

**When inference fails:** In chaos engineering, we don't need to infer — we observe. If your outcome inference module can't determine what the product is supposed to do, fall back to the chaos engineering approach: observe baseline behavior, test resilience of that baseline. The finding becomes: "Under normal conditions, your product does X. Under condition Y, it does Z instead. This divergence is the finding."

---

### Question 3: Output Format

In chaos engineering, our output goes directly to automated systems that decide whether to rollback, scale, or alert. It must be:

1. **Machine-parseable** — JSON/structured data with zero ambiguity
2. **Severity-classified** — using a standard taxonomy (critical/high/medium/low based on blast radius and frequency)
3. **Reproducible** — exact conditions that trigger the failure, so the fix can be verified
4. **Contextualized** — this failure happens "under 100 concurrent connections after 30 seconds" not "sometimes"

```
{
  "experiment_id": "...",
  "steady_state_hypothesis": "API returns correct results within 500ms for authenticated requests",
  "result": "HYPOTHESIS_VIOLATED",
  "observations": [
    {
      "condition": "50 concurrent agent sessions with valid auth",
      "expected": "All requests return 200 with correct data within 500ms",
      "actual": "23% of requests return 200 with stale cached data after 500ms threshold",
      "severity": "critical",
      "failure_type": "silent_degradation",
      "blast_radius": "All concurrent users during cache staleness window",
      "reproduction": {
        "steps": ["Generate 50 concurrent authenticated requests", "Observe response timestamps and content hashes"],
        "frequency": "Occurs reliably above 40 concurrent sessions",
        "environment_requirements": ["Concurrent load > 40 sessions"]
      },
      "remediation_suggestion": {
        "approach": "Implement cache invalidation on write path or reduce cache TTL",
        "verification": "Re-run experiment at 50 concurrent sessions, verify 0% stale responses",
        "regression_risk": "Cache TTL reduction may increase database load — monitor query latency"
      }
    }
  ],
  "human_judgment_required": [
    {
      "observation": "Under load, the product degrades to a cached read-only mode rather than failing",
      "question": "Is this graceful degradation intentional or accidental?",
      "why_human": "Degradation strategy is a product design decision — if intentional, this is a feature; if accidental, it's a critical bug",
      "impact_if_intentional": "Reclassify from 'critical' to 'informational'",
      "impact_if_accidental": "Maintain 'critical' classification"
    }
  ]
}
```

**Key principle from chaos engineering: always include the "blast radius."** Don't just say what broke — say who and what is affected when it breaks. A coding agent needs to know: "If I don't fix this, agents that use my tool under concurrent load will silently receive wrong data." That blast radius description is what converts a finding from "bug to fix eventually" to "fix this NOW."

---

### Question 4: Scenario Separation

In chaos engineering, **the engineers never know what we'll test next.** This is by design. If they know we're killing the primary database on Tuesday, they'll make sure the failover works on Tuesday. We need it to work on any random Wednesday at 3 AM.

**How we maintain scenario secrecy:**
- **Large, combinatorial scenario space.** We don't have 50 scenarios. We have 5 failure domains × 10 severity levels × 20 timing patterns × 15 environmental conditions = 15,000+ unique combinations. Even if you leak a few, the space is too large to game.
- **Automated scenario generation.** We don't write scenarios by hand. We use algorithms that generate novel combinations from a set of primitives. This means even WE don't know exactly what will be tested until it runs.
- **Continuous expansion.** Every time we discover a new failure mode in ANY system, we add a new scenario primitive to the library. The library grows monotonically.

For Alien Eyes:
- **Build a scenario GRAMMAR, not a scenario LIST.** Define test primitives (auth challenge, schema validation, load injection, error injection, accessibility check, etc.) and let an algorithm compose them into unique test configurations for each audit.
- **Make the space computationally intractable to enumerate.** If there are 10^6 possible scenario configurations, even a builder who reverse-engineers 1,000 of them has covered 0.1% of the space.
- **Evolve the grammar, not just the scenarios.** When new failure patterns emerge across audits, add new primitives to the grammar. The scenario space expands automatically.

**Explaining failures without revealing scenarios:** We report "the system failed to maintain steady state under concurrent load" not "we killed three database replicas and injected 200ms of network latency to the remaining one." The finding is about the SYSTEM'S behavior, not about OUR actions.

---

### Question 5: Avoiding Goodhart's Law

Chaos engineering has a built-in defense against Goodhart's Law that most testing frameworks lack: **we test for resilience, not compliance.**

Compliance testing asks: "Does this system handle scenario X?" The system can be hardened for X and brittle for everything else. Resilience testing asks: "Does this system maintain steady state under arbitrary perturbation?" You can't game "arbitrary perturbation" because you'd have to be resilient against everything — which means you'd have to be genuinely good.

**Specific mechanisms:**

1. **Explore, don't verify.** Traditional testing verifies known requirements. Chaos engineering explores unknown failure modes. Alien Eyes should allocate at least 30% of each audit to EXPLORATORY scenarios — randomly generated, novel combinations that have never been run before. You can't optimize for what you can't predict.

2. **Measure recovery, not just success.** A system that never fails is either overprovisioned (wasteful) or untested. A system that fails and recovers quickly is genuinely resilient. For Alien Eyes: intentionally push products to their limits, then measure how they recover. The recovery pattern (graceful degradation → error message → recovery) is more revealing than the failure itself.

3. **Chaos monkey principle: run continuously.** Don't just audit on demand. Offer a continuous monitoring mode where Alien Eyes periodically sends probes — small, lightweight tests that verify baseline behavior is maintained. This prevents "perform for the test" behavior because the test is always running. (This could also be a premium tier.)

4. **Evolve faster than the builders.** Goodhart's Law is a race condition: the builder tries to game the metric, the metric-maker tries to stay ahead. You win by evolving your scenario grammar faster than builders can reverse-engineer it. The cross-audit pattern detection (seeing failures across ALL products you test) gives you an information advantage — you see the whole landscape, each builder sees only their own product.

---

### The ONE Thing We're Most Likely to Get Wrong

**Testing only through the front door.** As an external testing harness, you can only interact with the product through its public interfaces (HTTP endpoints, UI, API). But the most dangerous failure modes are INTERNAL — state corruption, race conditions, memory leaks under sustained load, gradual performance degradation over hours. An API that works perfectly for a single request might corrupt data on the 10,000th concurrent request. If you can't test internal state, you'll give confident scores that miss catastrophic internal failures. You need to be honest about this limitation — and potentially offer integration modes (a lightweight agent the builder installs) that give you internal visibility.

### Mechanism to Steal: Steady State Hypothesis

Every chaos experiment starts with a **steady state hypothesis**: "We believe that under normal conditions, this system will continue to serve requests with <500ms latency and <0.1% error rate." Then we try to disprove it. The hypothesis is defined BEFORE the experiment, based on observed baseline behavior, not on what anyone says the system should do.

**For Alien Eyes:** Start every audit by observing the product for a baseline period. Define a steady state hypothesis based on observation. THEN run your test scenarios as attempts to violate the hypothesis. This elegantly solves the inference problem: you don't need to know what the product is supposed to do. You observe what it DOES do, hypothesize that it should keep doing that, and test whether it can. Deviations from steady state are findings. The size of the deviation is the severity.

---

---

# CROSS-PANEL SYNTHESIS

## Common Patterns (Appearing in 3+ Expert Fields)

### 1. Test Outcomes, Not Compliance (5/5 experts)
Every single expert emphasized this. Film: measure audience experience, not whether the director followed rules. Aviation: investigate what happened, not whether procedures were followed. Trials: measure patient health, not protocol adherence. Mystery shopping: ask "did you feel welcomed?" not "did they say welcome?" Chaos: test resilience under arbitrary conditions, not hardened responses to known tests.

**For Alien Eyes:** This is the foundational design principle. Your scenarios should test "can a user/agent accomplish the thing this product exists to enable?" — not "does this product implement best practice X?" Best practices are a checklist. Outcomes are a judgment. Checklists get gamed. Outcomes don't.

### 2. The Builder Sees Findings, Never Methodology (5/5 experts)
Universal agreement: report the gap between expected and actual outcome. Never reveal how you measured it. Film: "23% confused at act two" not "we asked a trick question at minute 47." Aviation: "probable cause: silent auth failure" not "we tested 47 JWT variations." Trials: "the drug didn't work" not "you scored 3 points below on the HDRS at week 8." Mystery shopping: "customer felt unwelcomed" not "shopper was instructed to arrive at 7:02 and time the greeting." Chaos: "system failed under load" not "we killed 3 replicas and injected 200ms latency."

**For Alien Eyes:** Describe the outcome gap with enough specificity to fix it ("auth endpoint returns 200 on invalid credentials"), but never the test procedure that found it ("we sent a malformed JWT with an expired timestamp and a valid signature from a different issuer").

### 3. Probabilistic Causation Chains, Not Single Root Causes (4/5 experts)
Aviation: Swiss Cheese Model — failures require aligned holes in multiple layers. Trials: multi-factor causation with contributing factors. Chaos: blast radius mapping across system dependencies. Film: cascading audience confusion where scene A poisons the experience of scene B.

**For Alien Eyes:** Every finding should be part of a causal chain. Don't report isolated bugs. Report: "Factor A (silent auth failure) + Factor B (no error schema in docs) + Factor C (no retry guidance) = Outcome: agent workflow fails 37% of the time." This is far more actionable because fixing ANY link in the chain improves the outcome.

### 4. Scenario Space Must Be Computationally Intractable to Game (4/5 experts)
Chaos: 15,000+ combinatorial scenarios from primitives. Mystery shopping: 200+ templates assembled from components. Trials: randomized allocation from protocol libraries. Film: different audiences get different instruments.

**For Alien Eyes:** Build a scenario GRAMMAR (composable primitives) not a scenario LIST (static scripts). If the scenario space has 10^6+ configurations, no builder can game it because they'd have to solve ALL configurations, which means they'd have to build a genuinely good product.

### 5. Include a Qualitative Narrative Alongside Quantitative Scores (4/5 experts)
Film: the focus group debrief. Mystery shopping: the comment card verbatim. Aviation: the narrative analysis section of the report. Trials: patient-reported outcomes.

**For Alien Eyes:** Generate a free-form narrative from the simulated user/agent's perspective for every audit. This narrative — a STORY of the experience — captures signal that structured findings miss. It's harder to game, more empathetic, and often more actionable than any score.

### 6. Longitudinal Assessment Over Single Snapshots (3/5 experts)
Mystery shopping: aggregate 12 shops per quarter, weight by recency. Trials: long-term follow-up to catch delayed effects. Chaos: continuous monitoring mode.

**For Alien Eyes:** A single audit is a snapshot. Encourage (and price for) longitudinal tracking. Trend lines are more honest than point-in-time scores. A builder who games one audit has 11 honest ones diluting the effect.

---

## Where the Experts Disagree

### Pre-defined Intent vs. Observed Baseline
- **Clinical Trials** and **Film** favor pre-specifying what you're testing. The trials expert wants a primary endpoint defined before the first audit. The film producer wants to know "what kind of movie is this?" before the screening.
- **Chaos Engineering** explicitly rejects this. They observe steady state (what the system DOES do) and test whether it maintains that behavior. No inference about what it's "supposed to do" is needed.
- **Resolution:** Use BOTH. Infer intended outcomes as the primary framework (clinical trials approach), but ALSO observe behavioral baseline and test for resilience (chaos approach). They're complementary. The inference catches "doesn't do what it says." The baseline catches "does what it says but breaks under stress."

### Whether Simulated Users Can Replace Real Users
- **Clinical Trials** is the most skeptical: "Real patients do things you didn't predict. Simulated patients can't surprise you."
- **Chaos Engineering** is the most comfortable with simulation: they simulate failures all the time and it works.
- **Resolution:** Acknowledge this as a known limitation. Simulated users/agents can cover the 80% of common interaction patterns. The 20% of surprising, creative, unexpected usage requires real-world data. Consider a hybrid model where simulated panels are supplemented by opt-in real usage data as the product matures.

### How Much to Reveal to the Builder
- **Aviation** favors maximum transparency of findings (but not methodology): publish everything, let the industry learn.
- **Mystery Shopping** is more cautious: too much detail helps the builder game the next evaluation.
- **Resolution:** Be transparent about WHAT was found and WHERE, but never HOW it was tested. Transparency about findings builds trust. Opacity about methodology maintains test integrity.

---

## The Single Most Important Insight

**Across all five fields, the deepest pattern is this: the separation between the entity being evaluated and the entity doing the evaluation is not a feature — it is the product.**

In film, the director can't test-screen their own movie. In aviation, the airline can't investigate its own crash. In trials, the drug company can't run its own trial. In mystery shopping, the restaurant can't evaluate its own service. In chaos engineering, the engineering team can't choose which failures to test.

This separation is not just about preventing bias. It's about creating a *category of knowledge that is impossible to obtain without an independent evaluator.* The director CANNOT see their film through fresh eyes. The builder CANNOT use their product as a first-time user. This is not a willingness problem — it's an epistemological impossibility. The builder's knowledge of how the product works permanently prevents them from experiencing it as someone who doesn't know how it works.

Alien Eyes's fundamental value proposition is not "we test your product." It's "we see what you are structurally incapable of seeing." That's the framing for pricing, positioning, and every customer conversation. You're not selling a testing service. You're selling an *alien perspective* — the perspective of someone who has never seen your product before, encountering it for the first time, trying to accomplish something real.

This is why the hidden scenarios matter. This is why the diverse simulated panels matter. This is why the output must describe the EXPERIENCE, not just the BUGS. The builder doesn't need help finding bugs — they have linters and CI and unit tests for that. What they need is someone who can tell them: "Here's what it actually feels like to use your product for the first time, from a perspective you will never, ever be able to have."

---

## Concrete Mechanisms to Steal (Ranked by Applicability)

| Rank | Mechanism | Source Field | Application to Alien Eyes |
|------|-----------|-------------|---------------------------|
| 1 | **Steady State Hypothesis** | Chaos Engineering | Observe baseline, hypothesize it holds, try to break it. Solves inference problem elegantly. |
| 2 | **Swiss Cheese Model** | Aviation | Map defensive layers, find aligned holes. Critical for causal chain analysis. |
| 3 | **Scenario Grammar** | Chaos + Mystery Shopping | Composable test primitives generating 10^6+ configurations. Anti-gaming defense. |
| 4 | **Adaptive Enrichment** | Clinical Trials | Focus testing resources on informative dimensions as audit progresses. Better signal per compute dollar. |
| 5 | **Comment Card Verbatim** | Mystery Shopping | Free-form narrative from simulated user's perspective. Captures signal scores miss. |
| 6 | **Focus Group Debrief** | Film Screening | LLM-generated experiential narrative. Empathy-generating output format. |
| 7 | **Pre-registered Endpoints** | Clinical Trials | Version and freeze scoring methodology before audits. Prevents self-hacking credibility. |
| 8 | **Party Separation** | Aviation | Builder participates (provides context) but cannot influence scope, method, or conclusions. |
| 9 | **Active Comparator Arms** | Clinical Trials | Score products against category peers, not absolute standards. Resists Goodhart's Law. |
| 10 | **Continuous Probing** | Chaos Engineering | Lightweight ongoing tests between full audits. Prevents "perform for the test" behavior. |

---

## Recommended Next Steps

1. **Define the scenario grammar.** Before writing any code, define the composable test primitives and how they combine. This is the core intellectual property.
2. **Define scoring methodology and freeze it.** Before the first audit, publish (at least internally) exactly how scores are computed. Version it. Don't change it based on results.
3. **Build the steady state observer first.** Before building any test scenarios, build the module that observes a product's baseline behavior and defines "normal." This is the foundation everything else rests on.
4. **Design the causal chain data model.** Don't start with a list of findings. Start with a graph of factors, their interactions, and their combined effect on outcomes.
5. **Prototype the verbatim narrative.** Test whether an LLM-generated "experience story" from a simulated user's perspective is actually more actionable than structured findings. If so, make it a first-class output, not an afterthought.
