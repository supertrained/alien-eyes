# Alien Eyes Product Naming Decision

> Date: 2026-03-27
> Methodology: 5 generation rounds, 8 panels (50+ evaluators), agent-native compliance framework
> Products: Alien Eyes Preflight (builder), Alien Eyes Growth Audit (marketing)
> Feature tiers: Scan / Loop / Watch

---

## Decision

| Product | Name | For | Agent Confidence |
|---------|------|-----|-----------------|
| Builder auditor | **Alien Eyes Preflight** | Websites, APIs, CLIs, MCP servers, repos, packages | 0.87 |
| Marketing auditor | **Alien Eyes Growth Audit** | 13-dimension marketing presence assessment | 0.93 |

**Feature tiers (both products):** Scan (free/paid) / Loop (per-cycle) / Watch (subscription)

> "Alien Eyes Preflight before you ship. Alien Eyes Growth Audit after you launch."

---

## How We Got Here

### Round 1: Domain Words (FAILED)
Tested Stack, Market, Growth, Build, Pulse, Signal, Reach.
- Cold-exposure panels (8 humans + 5 agents): no candidate clearly signaled the core product
- "Market" triggered stock exchange associations (0/8 rated clearest)
- "Build" misrouted 5/5 agents to CI/CD
- "Growth" rejected by expert marketers (0/5)

### Round 2: Activity Words (PARTIAL)
Tested Recon, Sweep, Exam, Probe, Teardown, Exposure.
- Recon and Sweep resonated on positive/proactive tone
- Teardown and Exposure rejected (negative connotation)
- Owner feedback: names should feel empowering, like something you CHOOSE to do

### Round 3: Positive-Tone Generation
Tested Preflight, Prep, Polish, Align, Prime + Workup, Briefing, Triage, Vitals, Scope.
- Preflight stood out for builder product: aviation = responsible preparation
- Marketing candidates split: medical domain (Workup, Triage) rejected for domain mismatch with Preflight

### Round 4: Marketing-Specific Testing
Tested Benchmark, Workup, Briefing, Triage, Vitals, Scope, Snapshot, Readout, Profile, Baseline.
- Compliance review: only Benchmark passed all 8 tests (8/8)
- Cold exposure: Benchmark 6/6 human picks, 3/3 agent routing
- But Benchmark flagged as "commodity" — understood but forgettable

### Round 5: Audit Explored
Tested Audit, Growth Audit, Benchmark head-to-head.
- Compliance: Audit 7.5/8, Growth Audit 6.5/8, Benchmark 7.0/8
- Humans: split 4-4 (Audit vs Growth Audit). Benchmark: 0 votes
- Agents: Growth Audit 0.93 confidence vs Audit 0.61 vs Benchmark 0.50
- Owner decision: agents strongly prefer Growth Audit → go with that
- Feature tier "Audit" renamed to "Scan" to avoid collision

### Final Validation: Preflight Agent Confidence
- 6 agent personas tested Preflight against alternatives (Audit, Scan, Inspect, Review)
- Preflight: 0.87 mean, 4/6 first picks, 6/6 correct routing
- No alternative scored higher
- Pair disambiguation: Preflight + Growth Audit = zero routing ambiguity (perfect)

---

## Why Preflight

1. **Self-documenting.** Every developer and agent knows what a preflight check is.
2. **Positive/empowering.** "I ran a preflight" = being smart and responsible, not being judged.
3. **Aviation → technology bridge.** Pilots run preflight before every flight. Developers run Preflight before every deploy.
4. **Agent routing: 0.87.** Highest of all tested alternatives. Drops slightly for post-deployment QA tasks (0.72) but routes correctly 100% of the time.
5. **Zero vocabulary collisions.** Doesn't clash with any Alien Eyes term, Rhumb term, or major competitor.

## Why Growth Audit

1. **Highest agent routing confidence: 0.93.** "Growth" acts as a domain tag that eliminates routing ambiguity.
2. **Self-documenting.** Growth teams, marketers, and agents all understand "growth audit."
3. **Works for all use cases.** Outbound prospect research AND inbound self-assessment AND competitive benchmarking.
4. **Expert marketers validated it.** Cold-exposure panels confirmed marketers immediately self-select.
5. **Ongoing temporal fit.** "We run growth audits quarterly" is natural — not pre-launch, not one-time.

## Why Scan / Loop / Watch (Tier Names)

1. **Scan** (renamed from "Audit") — avoids collision with Growth Audit product name. "Run a scan" is universal.
2. **Loop** — describes the mechanism directly. Audit-fix-reaudit IS a loop.
3. **Watch** — standard developer vocabulary (npm watch, fswatch). Agents know "watch = keep running."

---

## Eliminated Candidates

### Builder Product
| Name | Why Eliminated |
|------|---------------|
| Build | Rhumb Build pillar collision + CLI verb collision (5/5 agents → CI/CD) |
| Stack | Clear to devs, opaque to non-devs. Reads as "tech stack detection" |
| Ship | Verb collision. "ae ship" → deployment command |
| Make | GNU Make collision |
| Craft | Artisanal/DIY connotation |
| Recon | Military/surveillance tone (owner feedback: negative) |
| Sweep | Parent brand namespace kill |

### Marketing Product
| Name | Why Eliminated |
|------|---------------|
| Market | Stock exchange, marketplace associations. 0/8 rated clearest |
| Growth | Expert marketers rejected (0/5): "sounds like a supplement brand" |
| Pulse | Agent misrouting to monitoring (4/5). Metaphor, same as "Autopsy" |
| Signal | Maximally polysemous (Unix, buying, brand signals) |
| Reach | Too narrow (metric, not domain) |
| Benchmark | Passed compliance but commodity — 0/8 human excitement, "forgettable" |
| Workup / Triage / Vitals | Medical domain mismatch with Preflight (aviation/technology) |

---

## Panel History

| Panel | Type | Size | Result |
|-------|------|------|--------|
| Round 1 compliance | Framework review | 5 reviewers | Stack, Growth, Market survived (25/25 each) |
| Round 1 brand | Expert naming | 5 voters | Build + Growth (5-0) — later killed by compliance |
| Round 1 devex | Developer experience | 5 voters | Stack + Market (5-0) |
| Round 1 marketing | Marketing users | 5 voters | Make + Pulse (4-1) — killed by compliance |
| Round 2 cold | Naive humans + agents | 8H + 5A | No clear winner for marketing. "Market" = stock exchange |
| Round 3 positive | Focused generation | 60+ candidates | Preflight emerged as builder frontrunner |
| Round 4 benchmark | Compliance + cold | 5R + 8H + 4A | Benchmark 8/8 compliance, 6/6 human, 3/3 agent |
| Round 5 audit | Compliance + cold | 3R + 8H + 4A | Growth Audit: 0.93 agent confidence, 4/8 human |
| Final validation | Agent-only | 6 agents | Preflight confirmed at 0.87 mean, 6/6 correct routing |
