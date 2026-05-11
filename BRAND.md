# Alien Eyes — Brand Guide

> Last Updated: 2026-03-27
> Brand Status: COMPLETE
> Products: Alien Eyes Preflight, Alien Eyes Growth Audit

---

## Brand Identity

**Name:** Alien Eyes
**Domain:** alieneyes.dev
**CLI:** `ae` (short) / `alieneyes` (long)
**Packages:** alien-eyes (npm, PyPI)
**GitHub:** alieneyes (or alien-eyes)

**Tagline (primary):** "See what you can't see."
**Tagline (supporting):** "The outside perspective on what you build."

---

## What Alien Eyes Is

Alien Eyes is an independent quality auditor. It examines digital products and marketing presence from the outside — with zero context, zero insider knowledge, and zero forgiveness.

Two products, one brand, one mission:

| Product | Name | What It Audits | For Whom |
|---------|------|---------------|----------|
| **Preflight** | Alien Eyes Preflight | Websites, APIs, CLIs, MCP servers, repos, packages | Builders, developers, QA, AI agents |
| **Growth Audit** | Alien Eyes Growth Audit | Marketing presence across 13 dimensions | Growth teams, agencies, CMOs, in-house marketers |

**What unites them:** Both provide the outside perspective. Both surface findings with severity and evidence. Both are designed for agents to consume and act on.

---

## Brand Promise

**"The outside perspective."**

You can't see your own product clearly. You built it. You know where to click. You know the workarounds. Your marketing team is too close to their own campaigns.

Alien Eyes is the thing that has never seen your product or your marketing before. It has no context, no sympathy, and no agenda. It looks at what you shipped and tells you what's actually there.

**What this means in practice:**
- Alien Eyes is INDEPENDENT. It does not sell fixes. It does not profit from finding more problems.
- Alien Eyes is CLINICAL. Not friendly, not hostile — precise. Evidence-backed.
- Alien Eyes is AGENT-NATIVE. Findings are structured for coding agents to fix autonomously.

---

## Products

### Alien Eyes Preflight

**One-liner:** Pre-ship quality assessment for builders.

**What it does:** Points at websites, APIs, CLIs, MCP servers, repos, and packages. Crawls from the outside with clean browser profiles. Finds quality issues, security holes, UX friction, accessibility failures, performance problems, and agent-nativeness gaps. Outputs structured findings that coding agents fix autonomously.

**The core loop:**
```
Point at target -> Crawl from alien perspective -> Surface findings
  -> Paste into coding agent -> Agent fixes -> Re-audit -> Ship with proof
```

**Naming rationale:** "Preflight" = the responsible check before something important happens. Aviation: pilots run preflight checks before every flight. Developers: run Alien Eyes Preflight before every deploy. Self-documenting — agents route to it with 0.87 mean confidence.

**CLI:** `ae preflight audit example.com`

**For agents:** `alien_eyes_preflight` — pre-deployment quality check. External validation of deployment readiness.

### Alien Eyes Growth Audit

**One-liner:** Independent marketing presence assessment.

**What it does:** Analyzes 13 dimensions of a company's marketing presence from the outside: traffic, CRO, tracking, ads (Meta + Google), email, competitors, company enrichment, MEO (AI search visibility), agent-native readiness, brand reputation, social, and pricing. Outputs ranked problems with severity and evidence.

**The 13 dimensions:**
1. Traffic Analysis
2. Website CRO
3. Tracking & Analytics
4. Meta Ads
5. Google Ads
6. Email Marketing
7. Competitor Context
8. Company Enrichment
9. MEO (Meaning Engine Optimization)
10. Agent-Native Readiness
11. Brand Reputation
12. Social Organic
13. Pricing & Monetization

**Naming rationale:** "Growth Audit" = the agent-native term for marketing presence assessment. "Growth" signals the audience (growth teams, marketers). "Audit" describes the action. Agents route to it with 0.93 mean confidence — the strongest score in the product family.

**CLI:** `ae growth-audit audit example.com`

**For agents:** `alien_eyes_growth_audit` — marketing presence assessment across 13 dimensions. For evaluating a company's marketing effectiveness.

---

## Feature Tiers

Both products share the same three-tier structure:

| Tier | Name | What It Is | Pricing Model |
|------|------|-----------|---------------|
| **Scan** | One-time assessment | Single-pass audit. Point, scan, get findings. | Free (Quick) / Paid (Full) |
| **Loop** | Audit-fix-reaudit cycle | Scan, paste findings to agent, agent fixes, re-scan. Repeat until clean. | Per-cycle ($3-5) |
| **Watch** | Continuous monitoring | Ongoing surveillance for regressions and new issues. Alerts when quality degrades. | Subscription ($29/mo) |

**Why these tier names:**
- **Scan** (renamed from "Audit" to avoid collision with Growth Audit product name) — self-documenting. "Run a scan." "I scanned the site."
- **Loop** — describes the mechanism directly. Audit-fix-reaudit IS a loop.
- **Watch** — standard developer vocabulary (npm watch, fswatch). Agents know "watch" means "keep running."

---

## Visual Identity

### Logo

A single stylized eye. Alien, geometric, precise. Not cute, not friendly. Clinical and authoritative. The eye of something that sees everything and judges honestly.

**Design direction:** CBS Eye meets sci-fi HUD. One eye — because you only need one to see the truth. Geometric iris pattern. Minimal line work. Works at 16x16 favicon and 512x512 social.

### Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Electric violet | `#7C3AED` | Brand color. Headers, CTAs, logo. Alien, non-human. |
| **Active / Scan** | Acid green | `#84CC16` | Scan in progress, findings highlighted, active states. |
| **Background** | Near-black | `#0F0F0F` | Terminal dark. The darkness the eye peers into. |
| **Text** | Pure white | `#FFFFFF` | Clarity, contrast, what's revealed. |
| **Critical** | Signal red | `#EF4444` | Critical findings. |
| **Warning** | Amber | `#F59E0B` | High/medium findings. |
| **Pass** | Teal | `#14B8A6` | Clean checks, passing dimensions. |

### Icon States

| State | Visual |
|-------|--------|
| Idle | Eye closed or dim |
| Scanning | Eye open, scan line moving |
| Finding detected | Contracted pupil |
| Audit complete | Eye with checkmark |
| Critical finding | Eye shifts to red |
| Watch mode | Eye half-open, pulsing |

---

## Voice & Tone

### Brand Voice: Clinical Precision

Alien Eyes speaks with the authority of a lab report and the clarity of a terminal. Not warm, not cold — precise. Every word earns its place.

**Do:**
- State facts. "4 critical findings across 3 dimensions."
- Be specific. "CSP header missing on /checkout — allows XSS injection."
- Use industry-standard terms. "Finding," not "issue." "Evidence," not "proof."

**Don't:**
- Be chatty. Not "Hey! We found some interesting stuff..."
- Be judgmental. Not "Your site is terrible." Say "Your site has 4 critical findings."
- Use brand metaphors in structured output. "Finding," not "sighting." "Dimension," not "lens."

### Tone by Surface

| Surface | Tone |
|---------|------|
| Marketing / Landing page | Confident, slightly provocative. "See what you can't see." |
| Documentation | Clear, technical, minimal. Instructions, not explanations. |
| CLI output | Terse, structured, machine-readable. No prose. |
| Error messages | Diagnostic, helpful, actionable. "X failed because Y. Try Z." |
| Blog / Content | Thoughtful, evidence-based, slightly unsettling. The alien's perspective on the human web. |

---

## Terminology

### Agent-Native Terms (use everywhere — API, JSON, CLI, MCP, docs)

| Term | Meaning | Why This Word |
|------|---------|---------------|
| **Finding** | An issue discovered during audit | Industry standard (security, QA). No glossary needed. |
| **Dimension** | An audit category (security, a11y, UX, performance, SEO, agent-nativeness) | Standard analytics term. |
| **Evidence** | Proof attached to a finding (screenshots, logs, DOM snapshots) | Legal/QA standard. |
| **Surface** | The type of target (web, CLI, API, MCP, repo, package) | Self-documenting. |
| **Coverage** | Audit scope — what was examined | Standard QA term. |
| **Score** | Quality rating (0-100) | Universal. |
| **Severity** | Finding priority: critical, high, medium, low | Standard. |
| **Scan** | Single-pass assessment (feature tier) | Industry standard for quick automated check. |
| **Loop** | Audit-fix-reaudit cycle (feature tier) | Describes the mechanism directly. |
| **Watch** | Continuous monitoring (feature tier) | Standard developer vocabulary. |
| **Preflight** | Builder product name | Aviation: pre-flight readiness check. |
| **Growth Audit** | Marketing product name | Marketing-native: growth + audit. |

### Brand Terms (human marketing ONLY — never in API/JSON/MCP)

| Term | Where It Belongs |
|------|-----------------|
| "Blind spot" | Marketing copy, landing pages |
| "Perspective" | Taglines, positioning |
| "The alien perspective" | Brand story, about page |
| "See what you can't see" | Tagline, hero sections |
| "The outside perspective on what you build" | Positioning statement |
| "Ship with proof" | CTA, campaign language |

### Eliminated Terms (cut for agent-native compliance)

| Cut Term | Replaced By | Why |
|----------|-------------|-----|
| Sighting | Finding | Brand metaphor, not industry-standard |
| Gaze | `ae audit` | Verbs, not metaphors |
| Stare | `ae audit --deep` | Flags are self-documenting |
| Lens | Dimension | Standard analytics term |
| Witness | Evidence | Standard QA/legal term |
| Field of vision | Coverage | Standard testing term |
| Pulse | (rejected for product name) | Monitoring metaphor, misroutes agents |
| Passage | (rejected, retained as marketing language) | Brand metaphor, same category as "Autopsy" in Rhumb |

---

## Positioning

### For Developers (Preflight)

"Alien Eyes Preflight examines your product the way your users experience it — from the outside, with no context, no forgiveness, and no blind spots. Then it hands the findings to your coding agent to fix."

### For Growth Teams (Growth Audit)

"Alien Eyes Growth Audit assesses your marketing presence across 13 dimensions — from the outside, the way your prospects and search engines actually see you. Ranked problems. Evidence. What to fix first."

### For Agents

"Autonomous external quality primitive. Point at any target. Get structured findings with severity, evidence, and fix instructions."

### For Business / Executives

"Independent quality verification for everything you ship and everything you market. Automated. Evidence-based. Agent-powered."

### The Uncomfortable Truth

You can't see your own product clearly. You built it. You know where to click. You know the workarounds. Your marketing team is too close to their own campaigns to see what prospects actually experience.

You need alien eyes.

---

## Brand Architecture

```
Alien Eyes (brand)
  |
  +-- Alien Eyes Preflight (builder product)
  |     +-- Scan (free/paid one-time)
  |     +-- Loop (paid audit-fix cycle)
  |     +-- Watch (subscription monitoring)
  |
  +-- Alien Eyes Growth Audit (marketing product)
        +-- Scan (free/paid one-time)
        +-- Loop (paid audit-fix cycle)
        +-- Watch (subscription monitoring)
```

### Relationship to SuperTrained Ecosystem

| Brand | Role | Relationship |
|-------|------|-------------|
| **Alien Eyes** | Independent quality auditor | Judges things. Does NOT sell fixes. |
| **SuperTrained** | AI automation agency + services | Does things. Delivers AI-powered solutions. |
| **Rhumb** | Agent tool discovery + routing | Maps things. Routes agents to the right services. |

**The guardrail:** Alien Eyes is independent. It does not sell remediation services. It does not profit from finding more problems. Growth Audit can recommend multiple agencies (including SuperTrained's marketing services) transparently, but the recommendation is disclosed, non-exclusive, and the audit methodology is public. This independence is the brand's most valuable asset.

**Ecosystem flywheel:**
- Alien Eyes audits products and marketing → findings feed Rhumb's AN Scores
- Rhumb routes agents to quality services → agents use Alien Eyes to verify quality
- SuperTrained builds the AI infrastructure → powers both Alien Eyes and Rhumb

---

## CLI Architecture

### Product Commands

```bash
# Preflight (builder)
ae preflight example.com                    # Full quality audit
ae preflight example.com --quick            # Quick scan (free tier)
ae preflight example.com --deep             # Deep audit (all dimensions)
ae preflight example.com --dimension a11y   # Accessibility-focused
ae preflight example.com --surface api      # API surface
ae preflight example.com --format json      # Structured output for agents
ae preflight example.com --format clipboard # Copy findings to clipboard

# Growth Audit (marketing)
ae growth-audit example.com                 # Full 13-dimension assessment
ae growth-audit example.com --quick         # Quick marketing scan
ae growth-audit example.com --dimension seo # SEO-focused

# Loop (both products)
ae preflight loop example.com               # Audit-fix-reaudit until clean
ae growth-audit loop example.com            # Marketing audit-fix cycle

# Watch (both products)
ae preflight watch example.com              # Monitor for quality regressions
ae growth-audit watch example.com           # Monitor marketing presence

# Utilities
ae diff example.com                         # What changed since last audit
ae report example.com                       # Formatted findings output
```

### Terminal Output Aesthetic

```
$ ae preflight example.com

Alien Eyes Preflight
Target: example.com
Surface: web

Scanning... [===========================] 100%

FINDINGS (12)
  CRITICAL  1   CSP header missing on /checkout
  HIGH      3   Missing alt text on 14 images
  MEDIUM    5   Duplicate meta descriptions (3 pages)
  LOW       3   Non-semantic heading hierarchy

DIMENSIONS
  Security     3/10   1 critical, 2 medium
  Accessibility 5/10  3 high
  Performance  8/10   1 low
  SEO          6/10   5 medium
  UX           7/10   2 low
  Agent-Native 4/10   3 medium

Copy findings? [Y/n]
```

---

## MCP Tool Definitions

### For Agent Discovery

```json
{
  "name": "alien_eyes_preflight",
  "description": "External quality audit of websites, APIs, CLIs, MCP servers, repos, and packages. Examines from the outside with zero context. Returns structured findings with severity, evidence, and fix instructions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": { "type": "string", "description": "URL, CLI path, or package name to audit" },
      "surface": { "type": "string", "enum": ["web", "api", "cli", "mcp", "repo", "package"], "default": "web" },
      "depth": { "type": "string", "enum": ["quick", "standard", "deep"], "default": "standard" },
      "dimensions": { "type": "array", "items": { "type": "string" }, "description": "Filter to specific dimensions" }
    },
    "required": ["target"]
  }
}
```

```json
{
  "name": "alien_eyes_growth_audit",
  "description": "Independent marketing presence assessment across 13 dimensions: traffic, CRO, tracking, ads, email, competitors, enrichment, MEO, agent-readiness, reputation, social, pricing. Returns ranked problems with severity and evidence.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": { "type": "string", "description": "Company URL to audit" },
      "depth": { "type": "string", "enum": ["quick", "standard", "deep"], "default": "standard" },
      "dimensions": { "type": "array", "items": { "type": "string" }, "description": "Filter to specific dimensions" }
    },
    "required": ["target"]
  }
}
```

---

## Competitive Positioning

| Competitor | What They Do | How Alien Eyes Differs |
|-----------|-------------|----------------------|
| Lighthouse | Automated web auditing (performance, a11y, SEO) | AE adds security, UX, agent-nativeness, multi-surface. AE outputs are agent-native (Format B → clipboard → coding agent fixes). |
| TestSprite | MCP-first code testing | Inside-out (tests your code) vs outside-in (tests your experience). Complement, not competitor. |
| SEMrush / Ahrefs | SEO and marketing analytics | Dashboard-centric, ongoing metrics. AE is audit-centric, finding-focused, agent-native. AE's 13-dimension Growth Audit covers more than SEO. |
| HubSpot Website Grader | Free website scoring | Score only, no findings, no evidence, no agent integration. AE provides actionable findings with fix instructions. |

**The moat:** Cross-product pattern intelligence. Every audit generates anonymized findings that feed a pattern database. "95% of Next.js sites have this CSP issue." Nobody else has this data at scale.

---

## llms.txt (Machine Discovery)

```
# Alien Eyes

## Overview
Alien Eyes is an independent quality auditor for digital products and marketing. It examines targets from the outside — with zero context, zero insider knowledge, and zero forgiveness — and returns structured findings with severity, evidence, and fix instructions.

## Products
- Alien Eyes Preflight: Quality audit for websites, APIs, CLIs, MCP servers, repos, packages
- Alien Eyes Growth Audit: Marketing presence assessment across 13 dimensions

## Key Features
- Agent-native output: findings formatted for coding agents to fix autonomously
- Multi-surface: web, API, CLI, MCP, repo, package
- Evidence-backed: every finding carries screenshots, logs, DOM snapshots
- Independent: does not sell fixes, does not profit from finding problems

## Integration
- MCP tools: alien_eyes_preflight, alien_eyes_growth_audit
- CLI: ae preflight, ae growth-audit
- API: REST endpoints at alieneyes.dev/api/v1/
- Formats: JSON (agents), Markdown (humans), Clipboard (paste into coding agent)

## Pricing
- Scan (free): Quick deterministic check, no LLM
- Scan (paid): Full audit with AI synthesis
- Loop: Per-cycle audit-fix-reaudit ($3-5/cycle)
- Watch: Continuous monitoring ($29/month)
```
