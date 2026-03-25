# Compound Beads Context

> Portable memory for the next build session.

## Project

- **Project:** Alien Eyes (alieneyes.dev)
- **Tech stack:** Next.js 16, React 19, Tailwind 4, Supabase, BullMQ, Playwright, Anthropic/OpenAI SDKs
- **Current focus:** Phase 0 web-first engine after `WU-13` implementation and auth verification
- **Parent workspace:** `/Volumes/tomme 4TB/Dropbox/00_tommeco/Supertrained/`

## Current State

Phase 0 moved from planning into code, has a working local and hosted web surface, the first three adversarial remediation sprints implemented under TDD, the hosted audit lifecycle hardened and live-validated, Quality Sprint 4 (calibration fixes) complete, agent-native terminology revision applied, `WU-13` implemented, and magic-link auth verified locally and in production. **Next: quality/robustness fix sprint before `WU-15`.**

Implemented locally:
- `WU-00`, `WU-00a`, `WU-00b`
- `WU-01`, `WU-01.5`
- `WU-02`, `WU-03`, `WU-04`, `WU-05`
- `WU-06`
- `WU-07a`
- `WU-08` synthetic regression harness
- partial `WU-09` through `WU-12`
- adversarial remediation Sprint 1
- adversarial remediation Sprint 2
- adversarial remediation Sprint 3
- hosted audit lifecycle hardening
- Quality Sprint 4 (calibration fixes)
- `WU-13` account and dashboard
- auth verification and Vercel env alignment

Working runtime path:
- `URL -> validate -> crawl -> summarize -> primitives -> synthesize -> render -> CLI output`
- `Landing page -> POST /api/audit -> progress page -> results page -> copy payload`
- `Hosted Vercel API -> Railway worker -> Supabase persistence -> hosted results retrieval`
- `Supabase auth session -> account sync -> dashboard/API keys -> authenticated audits with owned history`
- `Magic-link callback -> /dashboard` locally and in production

Verified:
- `npm run build`
- `npm run typecheck`
- `npm test` (`74` passing tests / `32` files)
- `npm run cli -- audit https://example.com --quick --json`
- Playwright browser smoke against local Next app (`example.com` quick check)
- live hosted quick audit through `https://tool-tester.vercel.app`
- live Supabase row verification for audit/crawl_results/primitive_results/findings/reports

Environment setup completed:
- Playwright Chromium installed via `npx playwright install chromium`

## Main Blocker

The next blocker is **live output quality and crawl robustness**, not missing account/application code.

Evidence:
- `WU-13` is implemented and validated more deeply than before.
- The hosted audit loop works end to end through Vercel, Railway, and Supabase.
- All lifecycle races are fixed (completion ordering, monotonic progress guards).
- 74 tests across 32 files are passing. Zero TS errors.
- Local owned-account smoke passed with a disposable Supabase auth user:
  - account sync
  - API key generation
  - authenticated audit creation
  - dashboard history/trend retrieval
  - DB proof that audit and API key rows share the same `user_id`
- Local and production magic-link callbacks both reach `/dashboard` using generated Supabase links.
- GitHub OAuth reaches the real GitHub login page with the correct callback chain to `tool-tester.vercel.app/auth/callback`.
- Vercel runtime envs had to be realigned to the current Supabase project; before that, production auth failed with JWT key mismatch.
- Scoring magic numbers (issue #5 from calibration memo) deferred to post-alpha with methodology v0.1 disclaimer.
- Remaining auth-only gap is a real GitHub credentialed browser login.
- New higher-priority product gap from live validation:
  - `supertrained.ai` quick check now returns `141` findings, which is not ship-clean
  - non-Next.js live runs on `stripe.com` and `python.org` stalled without producing CLI output in a reasonable window
- Claude's quality calibration memo was reviewed and mostly accepted; two caveats were recorded: its test-count snapshot was stale, and `agent-nativeness.ts` having `usesLLM = true` is not itself a defect because `full_audit` still uses `maybeGenerateLlmFindings()`.
- No additional planning loop is needed before the next quality sprint.
- Adversarial review re-confirmed that all 10 CRITICAL + 10 HIGH findings from March 7 panels are already integrated into v3 spec and v2 GTM.

## Important Files Added This Session

Core engine:
- `src/lib/crawler/*`
- `src/lib/extraction/*`
- `src/lib/llm/*`
- `src/primitives/*`
- `src/lib/synthesis/*`
- `src/renderers/*`
- `src/orchestrator/*`
- `src/cli/*`
- `src/lib/queue.ts`

Tests:
- `tests/unit/crawler/*`
- `tests/unit/extraction/page-summarizer.test.ts`
- `tests/unit/primitives/*-advanced.test.ts`
- `tests/unit/model-router.test.ts`
- `tests/unit/primitives/primitives.test.ts`
- `tests/unit/synthesis/synthesizer.test.ts`
- `tests/unit/renderers/renderers.test.ts`
- `tests/unit/cli/audit.test.ts`
- `tests/integration/pipeline.test.ts`
- `tests/integration/api-audit-routes.test.ts`
- `tests/integration/audit-repository.test.ts`
- `tests/integration/audit-jobs.test.ts`
- `tests/integration/audit-ui-state.test.ts`
- `tests/integration/supabase-audit-repository.test.ts`

Runtime wrappers:
- `bin/ae`
- `bin/alieneyes`

Web surface:
- `src/app/*`
- `src/components/landing/*`
- `src/components/audit/*`
- `src/components/results/*`
- `src/components/dashboard/*`
- `src/components/account/*`
- `src/components/ui/*`
- `docs/DESIGN-SYSTEM.md`
- `next.config.ts`

Persistence:
- `src/lib/audit-repository.ts`
- `src/lib/supabase-admin.ts`
- `src/lib/auth.ts`

## Ready Tasks

- [READY] Quality/robustness sprint on live runs
  - reduce over-reporting on `supertrained.ai`
  - tighten grouping/deduplication/location formatting
  - diagnose non-Next.js crawl stalls
- [READY] GitHub OAuth credentialed browser verification
- [READY] `WU-15` hosted API/queue continuation (after quality pass)
- [READY] Worker/queue observability hardening
- [DEFERRED] Scoring calibration (post-alpha, methodology v0.1 disclaimer)

## Blocked Tasks

- [BLOCKED] Full GitHub OAuth completion requires real credentials/browser login

## Decisions Made

- Quick mode must not instantiate or call the model router.
- CLI runtime uses `tsx`, not Node strip-types, because runtime path aliases need tsconfig resolution.
- Current implementation favors deterministic defaults with optional LLM hooks behind the router.
- Results-page preview state should flow through an API boundary, not direct server-memory reads, because Next app routes can render in separate server contexts.
- `npm run typecheck` is reliable when run alone; running `typecheck` and `build` in parallel still produces transient `.next/types` races.
- The correct next bottleneck after Sprint 3 is validating live output quality and hosted persistence, not adding more local-only UI or more blind primitive surface area.
- Public/posture security checks and passive agent-nativeness checks should run without ownership verification; verified mode unlocks the more sensitive disclosure layer.
- Supplemental mobile capture belongs in the crawl result as a separate artifact, not as duplicate desktop pages mixed into the primary page list.
- In Supabase-backed hosted flow, the audit row must be marked `complete` only after reports are persisted, otherwise the hosted API can return `complete` with no `result`.
- In hosted flow, progress updates must be monotonic and DB-guarded; in-memory ordering checks alone are not enough because read lag can let stale progress overwrite terminal state.
- Review memos are prioritization inputs, not ground truth. Claims about test counts, flags, and completion status still need to be checked against the live code before they become continuity truth.
- Account/dashboard work is only real if new audits attach `user_id`. Auth UI without ownership propagation is cosmetic.
- Non-human smoke can validate most of WU-13: create disposable Supabase user -> sync account -> generate API key -> run authenticated audit -> verify dashboard/API rows. The remaining gap is human delivery, not backend ownership.
- Production auth failures can come from env drift, not code drift. In this case, Vercel was still pointing at an older Supabase project, which produced JWT key mismatches until the runtime env vars were updated.
- Generated Supabase magic links are enough to verify callback behavior without waiting on a real inbox. That is the fastest way to separate auth code bugs from email-delivery dependencies.
- Live quality validation can and should override the planned WU order. A working account system is less important than a quick check that returns 141 findings or hangs on mainstream non-Next.js sites.

## Recent Activity

| Date | Activity |
|------|----------|
| 2026-03-11 | Gate 1 approved after WU-00 / 00a / 00b |
| 2026-03-11 | Built crawl worker, extraction layer, primitives, synthesis, renderers, pipeline, and local CLI |
| 2026-03-11 | Installed Chromium for Playwright runtime |
| 2026-03-11 | First live quick audit succeeded on `example.com` |
| 2026-03-11 | First live quick audit on `supertrained.ai` exposed duplicate/noisy findings; identified quality blocker |
| 2026-03-12 | Landed Gate 4 partial web UI: landing, progress, and results pages |
| 2026-03-12 | Browser smoke passed locally after results-page state moved behind API fetch |
| 2026-03-12 | Added repository abstraction with memory fallback and optional Supabase persistence |
| 2026-03-13 | Closed adversarial remediation Sprint 1-3 under TDD |
| 2026-03-13 | Added passive security posture, contrast, accessible-name, structural CTA/trust, endpoint probing, sitemap/topology, stack, and mobile crawl coverage |
| 2026-03-13 | Verification state: 44 passing tests, `npm run build`, `npm run typecheck` |
| 2026-03-14 | Hosted audit lifecycle hardening complete: repository, API, orchestration, UI state, and live infrastructure validation |
| 2026-03-14 | Deployed current code to Vercel production and validated live audit completion with `result` present and `progress: 100` |
| 2026-03-18 | Agent-native terminology revision applied to `research/naming/FINAL-DECISION-ALIEN-EYES.md` — vision-metaphor vocabulary (sighting, gaze, stare, lens, iris, blink) replaced with industry-standard terms (finding, audit, dimension, evidence, coverage, score). CLI subcommands simplified. MEMORY.md updated. |
| 2026-03-18 | Quality Sprint 4 complete: LCP/CLS checks added to performance primitive, keyword text matching removed from agent-nativeness, Calendly check removed + CTA patterns expanded in copy-ux, confidence + verify added to Format B renderer. 66 tests / 30 files passing, 0 TS errors. |
| 2026-03-18 | Quality calibration memo reviewed against the current code. Direction accepted; next agent should start `WU-13` instead of reopening Sprint 4 planning. |
| 2026-03-18 | Ran adversarial review against original PRODUCT-SPEC.md v2 + GO-TO-MARKET.md v1. Confirmed all findings already addressed in v3/v2 updates from March 7 panels. No new action items. |
| 2026-03-18 | Implemented `WU-13`: auth helpers, account routes, login/signup/callback/dashboard pages, API key generation, trend chart, audit list, and authenticated audit ownership wiring. |
| 2026-03-18 | Full verification after `WU-13`: `npm test` (74/74), `npm run typecheck`, `npm run build`. |
| 2026-03-18 | Local owned-account smoke passed with disposable Supabase user. |
| 2026-03-19 | Verified magic-link callback locally and in production using generated Supabase links. |
| 2026-03-19 | Realigned Vercel Supabase env vars with the current project after production auth failed with JWT key mismatch. |
| 2026-03-19 | Live quality validation became the next real blocker: `supertrained.ai` returned 141 findings; `stripe.com` and `python.org` stalled in the CLI path. |
