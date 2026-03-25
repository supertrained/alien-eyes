# Final Naming Decision: Alien Eyes

> **Date:** 2026-03-10
> **Product:** Autonomous external quality auditor (formerly "Tool Tester")
> **Domain:** alieneyes.dev
> **CLI:** `ae` (short form) / `alieneyes` (long form)
> **Packages:** alien-eyes (npm) / alien-eyes (PyPI)
> **Process:** 6 generation waves (~250+ candidates), namespace screening, dual-cognition scoring, 4 expert/user panels (23 voters)

---

## Executive Summary

The product formerly called "Tool Tester" is **Alien Eyes** — the outside perspective on what you build.

The naming process evaluated ~250+ candidates across 6 generation waves, screened the top 20 for namespace conflicts (killing 12 including PROBE, GLINT, SWEEP, KILN, GAUGE, and GRAFT), scored 8 survivors on an 8-criterion dual-cognition framework, and validated the top 3 through 4 expert/user panels (23 voters).

ASSAY scored highest on the framework (8.81) and went 22-1 across panels. However, final namespace screening revealed assay.tools — an active product scoring MCP servers and APIs for agent-friendliness — creating direct brand confusion in the target audience. Additionally, the npm and PyPI "assay" packages were both claimed (dormant), and getassay.com was registered by an unknown party in February 2026.

Alien Eyes was selected as the final name by the product owner based on:
1. The concept IS the product — an outside, inhuman perspective that sees what builders can't
2. Clean namespace — alieneyes.dev available, npm/PyPI available, no funded competitor
3. Scales beyond websites — alien eyes can look at CLIs, APIs, MCP servers, GitHub repos
4. Memorable and emotionally resonant — nobody forgets "alien eyes"
5. Visual identity writes itself — the eye as logo/icon is instantly recognizable

---

## The Product

### What It Is

Alien Eyes is the outside perspective on what you build, automated. It examines digital products — websites, apps, CLIs, APIs, MCP servers, GitHub repos — the way a user encounters them: with no context, no insider knowledge, and no forgiveness.

It finds bugs, security holes, UX friction, accessibility failures, compliance gaps, performance issues, and agent-nativeness problems. Then it formats the findings for coding agents to fix automatically.

### What It Is NOT

- Not a synthetic monitoring tool (it doesn't run 24/7 — it audits on demand)
- Not a test framework (it doesn't run your tests — it brings its own perspective)
- Not a linter or static analysis tool (it doesn't read your code — it experiences your product from the outside)
- Not a dashboard (the findings go to your coding agent, not a UI you stare at)

### The Core Loop

```
Point Alien Eyes at something you built
  → It examines it from the outside
    → It finds what you missed
      → Findings go to your coding agent
        → Agent fixes the issues
          → Alien Eyes re-audits
            → Repeat until clean
              → Ship with proof
```

### Multi-Surface Vision (Roadmap)

Alien Eyes sees whatever you point it at:

| Surface | How It Looks | What It Finds |
|---------|-------------|---------------|
| **Website/App** | Browser-based (Playwright) | UX friction, broken flows, a11y failures, security holes, SEO issues, performance |
| **CLI Tool** | Shell execution | Confusing help text, missing flags, error handling gaps, install friction |
| **API** | HTTP requests | Schema inconsistencies, error response quality, auth flow friction, rate limit behavior |
| **MCP Server** | Tool manifest + invocation | Tool description clarity, parameter naming, error handling, response structure |
| **GitHub Repo** | Repo analysis | README quality, onboarding friction, contributor experience, documentation gaps |
| **npm/PyPI Package** | Install + usage | Install friction, import ergonomics, TypeScript types, documentation |

The alien perspective is the constant. The surface changes.

---

## Name Architecture

```
Brand name:    Alien Eyes
CLI (short):   ae
CLI (long):    alieneyes
npm package:   alien-eyes
PyPI package:  alien-eyes
Domain:        alieneyes.dev
GitHub org:    alieneyes (or alien-eyes)
```

### Why `ae` as the CLI Short Form

The pattern is established:
- `gh` = GitHub CLI
- `az` = Azure CLI
- `aws` = AWS CLI
- `gcloud` = Google Cloud CLI
- `ae` = Alien Eyes

Two characters. Home row. Fast to type. Distinct from all existing CLI tools.

---

## Positioning

### One-Liner

**"The outside perspective on what you build."**

### For Developers

"Alien Eyes examines your product the way your users experience it — from the outside, with no context, no forgiveness, and no blind spots. Then it hands the findings to your coding agent to fix."

### For Agents

"Autonomous external quality primitive. Point at any target — URL, CLI, API, MCP server. Get structured findings with severity, evidence, and fix instructions."

### For Business

"Independent quality verification for everything you ship. Automated. Continuous. Agent-powered."

### The Uncomfortable Truth

You can't see your own product clearly. You built it. You know where to click. You know the workarounds. You need something with no context and no sympathy to look at it fresh. You need alien eyes.

---

## Brand Story

> You've been staring at your product for weeks. You know every page, every flow, every edge case — or you think you do.
>
> Your users don't. They arrive with zero context, a bad connection, a screen reader, an outdated browser, a toddler on their lap, and seven seconds of patience.
>
> Your API consumers don't. They hit your endpoint for the first time, get a 403 with no body, and move on to a competitor.
>
> Your agent users don't. They read your MCP tool description, try to invoke it, get a schema mismatch, and route to something else.
>
> You need an outsider. Something that has never seen your product before. Something that doesn't care about your intentions, your roadmap, or how hard that feature was to build. Something that looks at what you shipped and tells you what's actually there.
>
> That's Alien Eyes.
>
> Point it at anything you've built. It sees what you can't — broken flows, security holes, accessibility failures, compliance gaps, confusing UX, slow loads, dead ends, schema mismatches, and missing documentation. Then it hands the evidence to your coding agent, and the fixes happen automatically.
>
> Audit. Fix. Re-audit. Ship with proof.

---

## CLI Architecture

### Primary Invocation

```bash
# Quick audit (default surface: web)
ae mysite.com

# Specify surface type
ae --web mysite.com                     # Website audit
ae --cli ./my-tool                      # CLI tool audit
ae --api https://api.example.com        # API audit
ae --mcp my-mcp-server                  # MCP server audit
ae --repo github.com/user/repo          # GitHub repo audit
ae --pkg stripe@npm                     # Package audit

# Audit modes
ae mysite.com                           # Standard audit
ae mysite.com --quick                   # Quick 5-page sample
ae mysite.com --deep                    # Deep audit (all pages, all dimensions)
ae mysite.com --security                # Security-focused
ae mysite.com --a11y                    # Accessibility-focused
ae mysite.com --agent                   # Agent-nativeness focused

# Output
ae mysite.com --format json             # Structured JSON (for agents)
ae mysite.com --format md               # Markdown (for humans)
ae mysite.com --format clipboard        # Copy to clipboard (for pasting into coding agent)

# The loop
ae loop mysite.com                      # Audit-fix-reaudit until clean

# Comparison
ae diff mysite.com                      # What changed since last audit
ae grade mysite.com                     # Overall quality grade
```

### Subcommand Vocabulary

Agent-native principle: **every command name is self-documenting.** An agent encountering `ae audit` knows exactly what it does. No glossary required. No metaphorical mapping.

| Command | Action | Why This Word |
|---------|--------|---------------|
| `ae audit` | Run a full audit | Industry standard. Every agent understands "audit." Default command. |
| `ae scan` | Quick surface-level check | Standard security/QA term. Fast, shallow. |
| `ae diff` | Before/after comparison | Universal developer term. `git diff` established the pattern. |
| `ae watch` | Continuous monitoring | Standard (`npm run watch`, `fswatch`). Agents know this means "keep running." |
| `ae report` | Formatted findings output | Self-documenting. |
| `ae loop` | Audit-fix-reaudit cycle | Describes the mechanism directly. |
| `ae grade` | Quality score | Clear output expectation. |

**Eliminated:** `ae look`, `ae stare`, `ae gaze`, `ae focus`, `ae blink` — these require agents to map brand metaphors to standard operations. An agent that reads `ae stare` must guess it means "deep audit." An agent that reads `ae audit --deep` knows immediately.

**Flags replace metaphors:**
- `ae audit --deep` instead of `ae stare`
- `ae audit --dimension security` instead of `ae focus security`
- `ae scan` instead of `ae look` (scan is already industry-standard)

---

## Terminology: Agent-Native First

The brand name carries the metaphor. The data model speaks plain English.

**Design principle:** Every term an agent encounters in structured output must be parseable without a glossary. An agent reading `"type": "finding"` knows what it is. An agent reading `"type": "sighting"` has to guess.

### Data Model Terms (used in JSON output, APIs, CLI flags)

| Term | Meaning | Why |
|------|---------|-----|
| **Finding** | An issue discovered during audit | Industry standard (security audits, code review, QA). Every agent trained on this word. |
| **Audit** | A single audit pass | Self-documenting. "Audit #3 found 8 findings." |
| **Dimension** | An audit category (security, a11y, UX, performance, SEO, agent-nativeness) | Standard analytics/scoring term. Replaces "lens." |
| **Evidence** | Proof attached to a finding (screenshots, HTTP logs, DOM snapshots) | Legal/QA standard. Replaces "witness." |
| **Surface** | The type of target being audited (web, CLI, API, MCP, repo, package) | Already agent-native. **Keep.** |
| **Coverage** | Audit scope — what was examined | Standard QA/testing term. Replaces "field of vision." |
| **Score** | Quality rating (0-100) | Universal. |
| **Severity** | Finding priority (critical, high, medium, low) | Standard. |

### Brand Terms (used in marketing, docs, human-facing copy only)

| Term | Where It Appears | Usage |
|------|-----------------|-------|
| **Blind spot** | Marketing copy, landing pages | "Your checkout has 4 blind spots" — humans understand this instantly |
| **Perspective** | Tagline, positioning | "The outside perspective on what you build" |
| **The alien perspective** | Brand story, about page | Emotional resonance for humans, not in structured output |

### What Was Cut

| Former Term | Replaced By | Why |
|-------------|-------------|-----|
| Sighting | Finding | "Sighting" is novel; "finding" is universal in auditing |
| Gaze | Audit | Every agent knows "audit" |
| Stare | `ae audit --deep` | Flags are self-documenting; metaphors aren't |
| Blink test | `ae scan` | "Scan" is industry standard for quick check |
| Lens | Dimension | Standard term in analytics and scoring |
| Iris | (unnamed — it's just the scoring engine) | Internal naming doesn't need brand vocabulary |
| Witness | Evidence | Standard QA/legal term |
| Field of vision | Coverage | Standard testing term |
| Focus | `--dimension` flag | Flags describe behavior; verbs create ambiguity |

---

## Visual Identity

### Logo

A single stylized eye. Alien, geometric, precise. Not cute, not friendly. Clinical and authoritative. The eye of something that sees everything and judges honestly.

**Design direction:** Think the CBS Eye meets a sci-fi HUD. One eye — because you only need one to see the truth. Geometric iris pattern. Minimal line work. Works at 16x16 favicon and 512x512 social.

### Color Palette

| Role | Color | Hex | Rationale |
|------|-------|-----|-----------|
| **Primary** | Electric violet | `#7C3AED` | Alien, non-human, stands out from dev tool blues. Distinct from SuperTrained coral. |
| **Scan / Active** | Acid green | `#84CC16` | Active state. Scan in progress. Findings highlighted. |
| **Background** | Near-black | `#0F0F0F` | Terminal dark. Professional. The darkness the eye peers into. |
| **Text / Findings** | Pure white | `#FFFFFF` | Clarity. Contrast. What's revealed. |
| **Critical** | Signal red | `#EF4444` | Critical findings. |
| **Warning** | Amber | `#F59E0B` | Medium/high findings. |
| **Pass** | Teal | `#14B8A6` | Clean checks. |

### Icon States

| State | Visual |
|-------|--------|
| Idle | Eye closed or dim |
| Scanning | Eye open, scan line moving |
| Finding detected | Eye with contracted pupil |
| Audit complete | Eye with checkmark |
| Critical finding | Eye shifts to red |
| Watch mode | Eye half-open, pulsing |

### Terminal Output Aesthetic

```
  👁 Alien Eyes v0.1.0
  ─────────────────────

  Target:  supertrained.ai
  Surface: web
  Mode:    deep (all pages, all dimensions)

  Scanning ████████████████████░░░░ 83%

  12 findings
  ├── 2 critical (security)
  ├── 3 high (accessibility)
  ├── 4 medium (UX)
  └── 3 low (performance)

  Score: 61/100 (C+)

  ae report --format clipboard   Copy findings for your agent
  ae loop                        Fix and re-audit
```

---

## How Alien Eyes Pairs with RHUMB

| | RHUMB | ALIEN EYES |
|--|-------|------------|
| **Function** | Route agents to the right tools | Verify the quality of what's built |
| **Metaphor** | Navigation (charts, courses, bearings) | Observation (audits, findings, dimensions) |
| **Tagline** | "Chart the course" | "See what you can't see" |
| **Primary action** | Discovery and routing | Auditing and verification |
| **Data relationship** | Alien Eyes AN Scores feed Rhumb's index | Rhumb routes agents to Alien Eyes for quality checks |
| **Brand energy** | Precise, nautical, cartographic | Unsettling, alien, clinical |
| **Naming pattern** | Loaded obscurity (specialist word) | Evocative compound (plain words, unusual pairing) |
| **Parent brand** | SuperTrained | SuperTrained |

They're complementary: Rhumb is the map. Alien Eyes is the inspector. One helps you find the right tools; the other tells you if what you built is actually good.

---

## The Three Pillars (Expanded for Multi-Surface)

### 1. Audit (Free tier — drives adoption)

Point Alien Eyes at anything. Get findings. First audit free. The "clipboard is the product" — findings formatted for direct paste into coding agents.

Surfaces: websites, CLIs, APIs, MCP servers, repos, packages.

### 2. Loop (Paid — per-cycle revenue)

The audit-fix-reaudit cycle. Alien Eyes audits, your agent fixes, Alien Eyes re-audits. Each cycle costs $3-5. The loop runs until clean — or until you say stop.

### 3. Watch (Paid — subscription revenue)

Continuous monitoring. Alien Eyes watches your product for regressions. When something changes or breaks, it alerts you (or your agent). Monthly subscription.

### The Flywheel

Every audit generates data about what's broken in the wild → improves the audit engine → feeds AN Scores into Rhumb → Rhumb routes more agents to Alien Eyes → more audits → more data → repeat.

---

## Availability Summary

| Asset | Status | Action |
|-------|--------|--------|
| alieneyes.dev | **AVAILABLE** | Register immediately |
| alieneyes.ai | **AVAILABLE** | Defensive registration |
| alieneyes.sh | **AVAILABLE** | Defensive registration |
| alien-eyes.dev | **AVAILABLE** | Defensive registration |
| npm "alien-eyes" | **AVAILABLE** | Claim with placeholder package |
| PyPI "alien-eyes" | **AVAILABLE** | Claim with placeholder package |
| GitHub "alien-eyes" | **AVAILABLE** (no significant repos) | Create org |
| Trademark "ALIEN EYES" | File in IC 009 + IC 042 | Research existing marks first |

### Domains NOT available (monitor only)

| Domain | Status | Threat |
|--------|--------|--------|
| alieneyes.com | Parked since 2015 (NameBright) | Low — could attempt acquisition |
| alieneye.com | Parked since 2004 (GoDaddy) | Low — different spelling |
| alieneyes.net | Alien Eyes Inc. (Cairo, digital agency) | Low — different market/geography |

---

## Taglines

- **"See what you can't see."** (primary)
- "The outside perspective on what you build."
- "No context. No mercy. No blind spots."
- "Audit. Fix. Re-audit. Ship."
- "Ship with proof."
- "Your product, through alien eyes."
- "The perspective you're missing."

---

## Weaknesses to Manage

| Weakness | Severity | Mitigation |
|----------|----------|------------|
| Compound name (9 chars) | Medium | `ae` short form for all CLI usage. `alieneyes` for packages/docs only. |
| Can't verb naturally | Medium | Don't try. Use "run an audit" / "put alien eyes on it." CLI uses standard verbs: `audit`, `scan`, `diff`, `watch`. |
| Sci-fi/campy risk | Medium | Visual identity must be clinical and precise, not playful. The eye should feel like a surveillance system, not a cartoon. Tone is expert authority, not novelty. |
| alieneyes.com unavailable | Low | alieneyes.dev is the correct TLD for a developer tool. .dev signals "this is for builders." |
| Alien Eyes Inc. (Cairo) | Low | Different market, geography, product category. No trademark conflict in US/EU for software. |
| npm "eyes" is taken (2.8M downloads/week) | Low | Using "alien-eyes" not "eyes." No conflict. |
| Different naming pattern than RHUMB | Neutral | Sister products complement, they don't match. One nautical word + one evocative compound = memorable pairing. |

---

## Naming Journey Summary

| Phase | Method | Outcome |
|-------|--------|---------|
| Generation | 6 parallel waves (expert scout, outside eye, quality/alchemy, loop/speed, unhinged creative, phonetic-first) | ~250+ raw candidates |
| Screening | Namespace due diligence (npm, PyPI, GitHub, domains, trademarks, funded companies) | 12 killed (PROBE, GLINT, SWEEP, KILN, GAUGE, GRAFT, STARK, BOLT, SNAG, CATCH, TRACE, PROOF) |
| Scoring | 8-criterion dual-cognition framework (50% human / 50% machine) | ASSAY #1 (8.81), TRIAGE #2 (8.00), PLUMB #3 (7.88) |
| Panels | 4 panels, 23 voters (brand/linguistics, devex, human users, agent users) | ASSAY 22-1 |
| Final screening | Deep namespace check on ASSAY | assay.tools collision discovered (adjacent product scoring MCP servers) |
| Owner decision | Product owner selected Alien Eyes | Clean namespace, scales beyond websites, emotionally resonant, visual identity writes itself |

---

## Immediate Next Steps

1. **Register alieneyes.dev** — Primary domain
2. **Register alieneyes.ai, alieneyes.sh, alien-eyes.dev** — Defensive
3. **Claim npm "alien-eyes"** — Placeholder package
4. **Claim PyPI "alien-eyes"** — Placeholder package
5. **Create GitHub org** — alien-eyes or alieneyes
6. **Trademark search** — "ALIEN EYES" in IC 009 (software) + IC 042 (SaaS)
7. **Design the eye** — Commission or generate logo/icon
8. **Write llms.txt** — Machine-discovery description
9. **Update CLAUDE.md** — Replace "Tool Tester" with "Alien Eyes"
10. **Write PRD v1** — Product requirements with multi-surface vision roadmap

---

*After ~250 candidates across 6 waves, 12 kills by namespace screening, 4 panels (23 voters), and one final collision discovery on the framework winner — Alien Eyes is the name.*

*The outside perspective on what you build.*
