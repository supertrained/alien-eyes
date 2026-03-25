# AGENTS.md

> Compound Beads v3.0 | Project: Alien Eyes | Initialized: 2026-03-04

## Methodology: Compound Beads

Core loop: START ROUND > WORK > COMPOUND (Arc + learnings) > CLOSE (push + update)

Files: CLAUDE.md (handoff) | .compound-beads/QUICKSTART.md (continuity) | context.md (state) | rounds.jsonl (history) | learnings.md (insights)

Round types: feature | bug_fix | triage | polish | infrastructure
Sizing: 30min-4hr. Break larger work into multiple rounds.

### Session Protocol
Start: Read QUICKSTART.md > context.md > scan recent learnings
End: git commit > session intelligence capture > update tracking files > regenerate QUICKSTART.md > git push
Rule: Work is not done until pushed AND tracking files updated.

### Auto-Triggers
| Condition | Action |
|-----------|--------|
| Session start + .compound-beads/ exists | Load QUICKSTART.md and context.md |
| Context window > 80% full | Run handoff protocol |
| Round has >5 file modifications | Update context.md |
| Round marked complete | Capture Arc + extract learnings |
| Session ending detected | Run session close protocol |
| Significant work completed | Update CLAUDE.md |
| Pattern discovered | Add to learnings.md |
| Bead open > 7 days | Prompt: close, defer, or update? |
| Completion signals ("that worked") | Capture learnings |
| 3+ decisions made | Capture rationale |
| Error or dead end | Record for future avoidance |

### Narrative Capture
Every round: We started believing > We ended believing > The transformation

## Project Rules

- **Separation of concerns**: The tool that BUILDS must never have access to the test scenarios. This is cardinal.
- **Probabilistic default**: Satisfaction scores (0-1), not boolean pass/fail. Deterministic only when legally required.
- **Agent-native first**: Every feature accessible to both humans and agents. Parity is non-negotiable.
- **Dual scoring**: Every audit produces both a Human-Native Score and an Agent-Nativeness Score.
- **Privacy by default**: Users can opt out of storing results. Rhumb-bound data is anonymized.
- **Reuse GMPF patterns**: Envelope, browser pool, model router, phased orchestrator — don't reinvent.

## Skills
<!-- Run /compound:discover to scan available skills and add to this project -->
<!-- Format: name | description | trigger phrases | output -->
(pending discovery — run /compound:discover)

## Tools & MCPs
<!-- Populated during skill discovery or when tools are added -->
playwright | Browser automation | screenshots, form testing, network interception, multi-device
firecrawl | Web scraping | site crawling, content extraction
exa | Search API | semantic search, competitor discovery, code context
brave-search | Web search | research, current events
replicate | ML models | image generation, analysis
glif | Creative AI | image generation workflows
context7 | Documentation | library docs, code examples
