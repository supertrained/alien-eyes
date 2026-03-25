# Alien Eyes -- Persona Methodology

> Version: 0.1
> Date: 2026-03-11
> Status: Draft spec
> Purpose: Define how Alien Eyes generates business-specific human and agent personas for each audit.

---

## 1. Decision

Alien Eyes should **generate a fresh, business-specific persona pool for every audit**.

It should **not** rely only on a fixed global bank of personas.

But it also should **not** pretend that these are exact digital twins of real users.

The correct framing is:

- **Context-grounded simulated personas**
- generated from the audited business's observable evidence
- sampled differently on different audits
- validated over time against real-world signals

This preserves the product vision:
- external eyes
- business-specific testing
- probabilistic success criteria
- fresh combinations that are hard to game

---

## 2. What We Learned From Stanford

Source principles:
- Stanford HAI summary: https://hai.stanford.edu/news/ai-agents-simulate-1052-individuals-personalities-with-impressive-accuracy
- Paper: https://arxiv.org/abs/2411.10109

The important lessons are not "LLMs can invent personas."
The important lessons are:

1. **Interview-grounded beats demographic-only.**
   The paper found interview-based agents outperformed agents built from only demographics or short self-descriptions.

2. **Rich qualitative context matters.**
   Their agents were built from long interviews about life stories, views, and follow-up questions, not thin labels.

3. **Higher-level synthesis helps.**
   They added expert-style syntheses on top of transcripts to capture traits and tendencies at a more abstract level.

4. **Accuracy must be measured against ground truth.**
   They evaluated the agents against actual participant responses and experiments.

5. **Privacy and control matter.**
   The Stanford team explicitly treated these agents as sensitive representations, not disposable content.

---

## 3. Translation For Alien Eyes

Alien Eyes usually will not have:
- 2-hour interviews with real users
- direct access to customer research
- consent to build digital twins of named individuals

So we should not copy Stanford literally.

We should adapt the method:

### Stanford method
- Real person
- Deep interview transcript
- Higher-level synthesis
- Behavioral evaluation against ground truth

### Alien Eyes method
- Real business or product
- Deep business-context evidence bundle
- Higher-level audience and usage synthesis
- Audit findings calibrated against real-world verification signals

This means our personas are:
- more grounded than stereotypes
- less grounded than Stanford's digital twins
- useful if they are explicit about confidence and evidence

---

## 4. The Goal

The purpose of persona generation is not to produce interesting characters.

It is to produce **credible behavioral lenses** that answer:

- Who is likely to arrive here?
- What are they actually trying to do?
- What do they honestly not want?
- Where would they abandon, mistrust, or misinterpret the product?
- What would success or failure feel like from their perspective?

For Alien Eyes, "don't wants" are more valuable than "wants."

That means each persona should be optimized for:
- friction detection
- confusion detection
- trust breakdown detection
- abandonment detection
- machine-compatibility detection

---

## 5. Persona Generation Modes

Alien Eyes should support two modes.

### A. Deterministic Mode

Used for:
- CI/CD
- regression tracking
- comparable re-audits

Rules:
- fixed seed
- fixed persona selection logic
- same context -> same generated persona pool
- same selected personas -> same scenarios

### B. Probabilistic Mode

Used for:
- full audits
- exploratory testing
- discovering blind spots

Rules:
- regenerate candidate persona pool per audit
- sample different personas and conditions each run
- preserve required coverage constraints
- expose confidence intervals, not fake certainty

---

## 6. Inputs To Persona Generation

Each audit should construct an **evidence bundle for audience inference** before generating personas.

### Required inputs

From crawl and extraction:
- homepage copy
- nav labels
- titles and meta descriptions
- pricing page or pricing signals
- docs/help/support pages
- signup/login/account language
- product screenshots and visible workflows
- structured data
- legal/privacy/trust pages
- agent-facing assets: API docs, OpenAPI, MCP references, `llms.txt`, developer docs

### Optional inputs

From user submission:
- product URL
- declared category
- declared core job to be done
- primary audience
- secondary audience
- biggest fear before launch
- whether audit is for humans, agents, or both

### Future inputs

If available later:
- search snippets
- support docs
- changelog
- public reviews
- app store copy
- onboarding emails
- usage analytics summaries
- support-ticket themes

---

## 7. Audience Inference Layer

Before generating personas, Alien Eyes should infer a structured audience model.

This layer should extract:

- business type
- product category
- price point
- self-serve vs sales-led
- individual vs team buyer
- regulated vs low-risk context
- beginner vs expert audience signals
- B2B vs B2C vs developer-tool vs internal-tool signals
- web-first vs API-first vs agent-first signals
- trust stakes
- switching cost
- likely core tasks

This is not yet a persona.
This is the **grounding substrate** for persona creation.

---

## 8. Persona Families

Every audit should generate personas from families, not from scratch without structure.

### Human families

- first-time evaluator
- returning user
- economic buyer
- end user
- expert evaluator
- accessibility-constrained user
- privacy-sensitive user
- mobile / slow-network user
- skeptical enterprise evaluator
- non-technical founder

### Agent families

- coding agent
- API integrator agent
- MCP-consuming agent
- CI gatekeeper agent
- monitoring agent
- recommendation agent
- support-verification agent
- benchmarking / cataloging agent

The business context determines which families are relevant.

Example:
- consumer SaaS: more end-user and mobile personas
- dev tool: more expert evaluator and integrator agent personas
- enterprise workflow tool: more buyer, evaluator, support, and CI personas

---

## 9. Persona Schema

Each generated persona should follow a stable schema.

```ts
interface AuditPersona {
  id: string;
  type: 'human' | 'agent';
  family: string;
  label: string;

  confidence: number;

  grounding: {
    observedFacts: string[];
    inferredFacts: string[];
    missingCriticalContext: string[];
  };

  context: {
    skillLevel: 'novice' | 'intermediate' | 'expert';
    urgency: 'low' | 'medium' | 'high';
    trustSensitivity: 'low' | 'medium' | 'high';
    switchingCost: 'low' | 'medium' | 'high';
    environment: string[];
  };

  goals: string[];
  antiGoals: string[];
  frustrations: string[];
  abandonmentTriggers: string[];

  likelyEntryPoints: string[];
  likelyTasks: string[];

  evaluationLens: {
    dimensionsToStress: string[];
    expectedSignalsOfSuccess: string[];
    expectedSignalsOfFailure: string[];
  };

  narrativeSeed: string;
}
```

### Key rule

`antiGoals`, `frustrations`, and `abandonmentTriggers` are required.

Those are the highest-yield fields for Alien Eyes.

---

## 10. Generation Pipeline

### Step 1: Build the business context packet

Create a normalized summary of the audited product:
- what it appears to do
- for whom
- how it is sold
- what trust it asks for
- what action it wants visitors or agents to take

### Step 2: Infer audience hypotheses

Generate 6-12 likely audience segments:
- primary buyer
- primary user
- skeptical evaluator
- constrained user
- agent consumer
- operations/integration actor

Each segment should include confidence and rationale.

### Step 3: Expand into candidate personas

Generate 12-24 candidate personas across relevant families.

Rules:
- at least 1 primary-audience persona
- at least 1 constrained / edge persona
- at least 1 trust-sensitive persona
- at least 1 agent persona when agent-facing signals exist
- at least 1 expert or skeptical evaluator for high-consideration products

### Step 4: Attach business-specific "don't wants"

For each persona, derive:
- what they do not want to happen
- what makes them bounce
- what feels sketchy, slow, confusing, or risky

This should come from product context, not generic UX platitudes.

### Step 5: Sample the audit panel

From the candidate pool, select:
- Quick Check: 3 fixed persona slots
- Full Audit: 5-7 personas
- Deep Audit later: 8-12 personas

Selection should balance:
- core audience coverage
- edge-case discovery
- agent coverage
- business-specific relevance
- diversity of failure modes

### Step 6: Convert personas into scenarios

A persona should never receive a testing checklist.

It should receive:
- a role
- a goal
- a context
- a tolerance profile
- a likely path

Then the scenario grammar composes:
- entry point
- intent
- condition
- dimension emphasis

---

## 11. Selection Rules Per Audit

### Quick Check

Keep this stable and cheap.

Use:
- first-time visitor
- mobile user
- search crawler

Rationale:
- deterministic
- fast
- high generality

### Full Audit

Generate a new pool and select 5-7 personas with these minimum slots:

1. one likely primary human audience
2. one skeptical or trust-sensitive human
3. one constrained human
4. one agent persona if agent-facing evidence exists
5. one evaluator persona for high-cost or B2B products

Optional slots:
- returning user
- non-English user
- buyer/user split persona

### Re-audit

Use a mixed policy:
- keep 40-60% of personas stable for comparability
- rotate 40-60% to surface new blind spots

---

## 12. How "Don't Wants" Are Derived

Alien Eyes should derive "don't wants" from evidence, not vibes.

### Signals to use

- pricing complexity -> fear of hidden cost
- enterprise language -> fear of risk, compliance, credibility gaps
- self-serve CTA -> intolerance for friction and unclear activation
- developer docs -> intolerance for vague errors and weak schemas
- consumer onboarding -> intolerance for hesitation, dead ends, mobile friction
- privacy pages/cookie banners -> privacy-sensitivity
- support/contact-only conversion -> fear of time waste or bait-and-switch

### Bad output

- "Wants a seamless experience"
- "Values good UX"

### Good output

- "Does not want to book a demo before seeing pricing"
- "Does not want to enter work email before understanding integration limits"
- "Does not want HTML error pages when an API request fails"
- "Does not want a cookie banner to block the primary booking flow"

---

## 13. Agent Persona Rules

Agent personas should not be treated as humans with robot names.

They need explicit machine-native fields:

- transport or interface type
- latency tolerance
- schema strictness
- error recovery behavior
- fallback behavior
- required completion signal
- retry strategy

Example additions:

```ts
interface AgentRuntimeProfile {
  interfaceType: 'api' | 'mcp' | 'cli' | 'web-browsing';
  timeoutMs: number;
  acceptsUnstructuredOutput: boolean;
  retriesOnFailure: boolean;
  requiresStableSchema: boolean;
  maxInteractionSteps: number;
}
```

Agent personas should mainly expose:
- ambiguity
- missing structure
- weak error semantics
- hidden side effects
- parity gaps

---

## 14. Persona Output Per Audit

Each audit should persist:

- full generated candidate persona pool
- selected panel for the audit
- why each persona was selected
- grounding evidence for each persona
- confidence score
- which findings each persona contributed to

This is required for:
- reproducibility
- false-positive review
- methodology evolution

---

## 15. Validation And Calibration

This is the part most "persona systems" skip.

Alien Eyes should validate personas through:

### A. Finding verification

Can a human independently reproduce the issue?

### B. Builder dispute rate

Which persona families produce findings that get disputed?

### C. External signal comparison

When available, compare persona findings against:
- analytics drop-off
- support tickets
- usability studies
- customer complaints
- conversion bottlenecks

### D. Novelty tracking

Did rotating personas produce genuinely new findings, or just noise?

### E. Calibration reviews

Retire or downgrade persona-generation patterns that:
- produce vague findings
- over-index on generic friction
- create unfixable stylistic criticism

---

## 16. Guardrails

### Do not overclaim

These are not replicas of real named customers.
They are context-grounded simulations.

### Do not generate personas from demographics alone

Demographics may appear, but only as weak supporting context.

### Do not let personas become test scripts

Personas must pursue goals, not execute checklists.

### Do not hide uncertainty

Every persona should record missing context and confidence.

### Do not use persona output as sole truth

Persona-derived findings are hypotheses until verified by evidence.

---

## 17. Recommended Product Behavior

Alien Eyes should present persona-derived findings like this:

- observed issue
- affected persona
- why this persona would fail or abandon
- evidence
- confidence
- verification step

And optionally:
- first-person narrative

Example:

> A privacy-sensitive evaluator trying to book a meeting after declining cookies sees the calendar area appear broken and is likely to abandon rather than hunt for an email fallback.

That is much stronger than:

> Calendly bug on contact page.

---

## 18. Proposed Implementation Shape

### New core modules

- `src/lib/personas/context-packet.ts`
- `src/lib/personas/audience-inference.ts`
- `src/lib/personas/persona-generator.ts`
- `src/lib/personas/panel-selector.ts`
- `src/lib/personas/persona-schema.ts`
- `src/lib/personas/calibration.ts`

### Suggested outputs

- `AuditPersona[]`
- `SelectedPersonaPanel`
- `PersonaContributionMap`

---

## 19. Practical Recommendation For V1

Do not try to generate "a few dozen full personas" and run them all every time.

Instead:

1. generate 12-24 candidate personas from business context
2. select 5-7 for the actual audit
3. persist the full pool for traceability
4. rotate the selected panel in probabilistic mode
5. keep a stable subset in deterministic mode

This keeps:
- cost bounded
- audits fresh
- output grounded
- methodology explainable

---

## 20. Open Questions

1. How much user-supplied business context should we request before persona quality meaningfully improves?
2. Should persona generation use only audited-site evidence in V1, or also public web evidence like reviews and docs?
3. What is the minimum confidence threshold for a persona to influence scoring?
4. Should persona-derived findings affect scores equally with deterministic findings?
5. How much persona rotation is ideal on re-audit before comparability degrades?

---

## 21. Hard Conclusion

The Stanford work supports the direction, but it does **not** justify free-form persona invention.

For Alien Eyes, the right approach is:

- per-audit persona generation
- grounded in business-specific evidence
- explicit uncertainty
- varied panel selection
- validation against real-world signals over time

That gives Alien Eyes what it wants:
- specific to the business
- less deterministic
- more realistic
- still defensible
