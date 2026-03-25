# Alien Eyes — Agent Handoff Protocol

> Version: 1.0 | Date: 2026-03-10
> Purpose: Define how Opus 4.6 and Codex (ChatGPT 5.4) coordinate, hand off work, and communicate across work units.
> This is the operating agreement between agents.

---

## Agents

| Agent | Identity | Strengths | WU Assignment |
|-------|----------|-----------|---------------|
| **Opus 4.6** | Claude Opus 4.6 (Claude Code) | Complex architecture, LLM integration, synthesis, judgment calls, type design, security | WU-00, 00a, 00b, 01, 01.5, 03, 05, 06, 08, 09, 12, 14, 16, 17, 19, 20 |
| **Codex 5.4** | ChatGPT 5.4 Pro / Codex | Parallel subsystem implementation, deterministic modules, UI components, API routes | WU-02, 04, 07a, 07b, 10, 11, 13, 15, 18 |
| **Human** | Tom (product owner) | Review gates, strategic decisions, final approval | 5 review gates (~2 hours total) |

---

## Pre-Read Requirements

Before starting ANY work unit, the agent MUST read:

1. **This document** (`docs/AGENT-HANDOFF-PROTOCOL.md`)
2. **Type spec** (`docs/TYPE-SPEC.md`) — the frozen types contract
3. **Their WU spec** (`docs/WORK-UNITS.md`) — specific WU they're working on
4. **CLAUDE.md** — product context and principles

For WUs involving LLM integration, also read:
5. **Methodology v0.1** (`docs/METHODOLOGY-v0.1.md`)

For WUs involving database, also read:
6. **Schema spec** (`docs/SCHEMA.md`)

---

## Handoff Protocol

### When a WU is Complete

The completing agent writes a `HANDOFF-WU-{number}.md` file in `docs/handoffs/` with:

```markdown
# Handoff: WU-{number} — {title}

## Agent: {Opus 4.6 | Codex 5.4}
## Status: Complete
## Date: {date}

### What Was Built
- File 1: description
- File 2: description

### Tests That Pass
- Test 1: what it verifies
- Test 2: what it verifies

### Deviations from Spec
- [any deviations from WORK-UNITS.md, with rationale]

### What the Next Agent Needs to Know
- [critical context that isn't in the spec]
- [gotchas, edge cases, design decisions made during implementation]

### Open Questions for Human Review
- [anything that needs human judgment before the next WU proceeds]

### Files Modified
- src/types/finding.ts (created)
- src/types/envelope.ts (created)
- ...
```

### When Starting a WU That Depends on Another Agent's Output

1. Read the handoff file for the dependency WU
2. Check that the dependency's tests pass
3. Import from the agreed types — don't redefine them
4. If something in the handoff is unclear, flag it in YOUR handoff when you're done

---

## Coordination Rules

### Rule 1: Types Are the Contract

Both agents import from `src/types/`. Neither agent redefines types. If a type is insufficient, document the need in the handoff file and wait for human approval of a type change.

### Rule 2: No Shared Runtime Files (Phase 2)

During Phase 2 (parallel work), the only shared files are in `src/types/`. Each agent's WU produces its own files in its own directories. Integration happens in Phase 3 (WU-06).

### Rule 3: Tests Are the Acceptance Criteria

A WU is complete when its acceptance criteria (from `docs/WORK-UNITS.md`) are met. This is verified by tests. "It works on my machine" is insufficient.

### Rule 4: Deviations Must Be Documented

If an agent deviates from the spec (different function signature, additional dependency, different approach), it MUST be documented in the handoff file with rationale. Undocumented deviations create integration failures.

### Rule 5: No Gold Plating

Build exactly what the spec says. No extra features, no premature optimization, no "while I'm here" improvements. The WU spec defines the scope.

### Rule 6: Security Modules Are Not Optional

WU-00b (URLValidator, InputSanitizer, CostBudget) outputs are REQUIRED inputs for WU-01 and WU-02. Skipping security because "I'll add it later" is a bug.

### Rule 7: Cost Tracking Is Required

Every LLM call must go through the ModelRouter (WU-05), which tracks cost. Hardcoded LLM calls that bypass the router break cost tracking and the per-audit budget. This is a hard rule.

---

## Human Review Gates

| Gate | After WUs | What Human Reviews | Duration |
|------|-----------|-------------------|----------|
| **Gate 1** | WU-00, 00a, 00b | Types, schema, security architecture, worker runtime, methodology doc | ~30 min |
| **Gate 2** | WU-01-05 | Primitives, synthesis logic, renderers, model router. Run integration tests with mock data. | ~30 min |
| **Gate 3** | WU-06-08 | Run CLI against live site. Verify dogfood regression. Approve core engine. | ~20 min |
| **Gate 4** | WU-09-13 | Review all frontend pages, emotional design moments, copy button UX, celebration-first flow. | ~20 min |
| **Gate 5** | WU-14-20 | Full end-to-end test. Deploy approval. Alpha launch decision. | ~20 min |

**Gate protocol:**
1. Agent completes WU and writes handoff
2. Human reads handoff + runs tests
3. Human approves or requests changes
4. If changes requested: agent fixes, updates handoff, human re-reviews
5. Once approved: next phase begins

---

## Communication Format

### Agent → Human (Handoff Summary)

After completing a WU:
```
WU-{XX} COMPLETE — {title}
✅ {N} acceptance criteria met
⚠️ {N} deviations from spec (see handoff)
❓ {N} questions for human review
📁 {N} files created/modified
```

### Human → Agent (Review Feedback)

After reviewing:
```
WU-{XX} APPROVED — proceed to WU-{YY}
or
WU-{XX} CHANGES REQUESTED:
1. [specific change]
2. [specific change]
```

### Agent → Agent (Via Handoff Files)

Agents do NOT communicate directly. All coordination happens through:
1. Frozen types (`src/types/`)
2. Handoff files (`docs/handoffs/`)
3. Test files (`tests/`)

---

## Parallel Work Schedule

### Phase 1 (Sequential — Gate 1 Required)
```
WU-00 → WU-00a + WU-00b → [GATE 1]
```

### Phase 2 (Parallel — Both Agents Working Simultaneously)
```
Opus:  WU-01 → WU-01.5 → WU-03 → (waits for WU-02)
Codex: WU-05 (can start immediately after Gate 1)
       WU-02 (starts after WU-01.5 complete)
       WU-04 (starts after WU-03 complete)
[GATE 2]
```

### Phase 3 (Sequential)
```
Opus:  WU-06 → WU-08
Codex: WU-07a (after WU-06)
[GATE 3]
```

### Phase 4 (Parallel)
```
Opus:  WU-09 → WU-12
Codex: WU-10, WU-11, WU-13 (after WU-09)
[GATE 4]
```

### Phase 5 (Parallel)
```
Opus:  WU-14, WU-16
Codex: WU-15
[GATE 5 prep]
```

### Phase 6 (Sequential)
```
Opus:  WU-17 → WU-19 → WU-20
Codex: WU-18, WU-07b
[GATE 5]
```

---

## Error Handling

### If a WU Fails

1. Agent documents what failed and why in the handoff file
2. Human evaluates: fix the WU or redesign?
3. If dependency failure: downstream WUs are blocked until resolved
4. Partial completion is documented — don't start over from scratch

### If Types Need Changing

1. Agent documents the needed change in handoff file
2. Human approves or rejects
3. If approved: TYPE-SPEC.md updated, both agents notified
4. Version bump if breaking change

### If Agents Disagree on Approach

1. Both agents document their approach in their handoff files
2. Human decides
3. Decision recorded in ADR.md
