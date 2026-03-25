# Quick Start — Alien Eyes

> **Last Updated:** 2026-03-18
> **Current Round:** 7 — Auth Verification + Live Quality Validation
> **Round Type:** feature
> **Status:** Production magic-link auth is verified. The next blocker is live quality/robustness again: `supertrained.ai` produced 141 findings, and two non-Next.js live audits stalled. Fix quality before `WU-15`.

## Immediate Context

Alien Eyes now has:
- crawl, extraction, primitives, synthesis, renderers, pipeline, local CLI
- landing page, progress page, results page, copy flow, light/dark theme toggle
- local API routes for audit start/status plus account sync/dashboard/API-key routes
- repository abstraction with memory fallback and optional Supabase admin path
- deterministic synthetic dogfood regression for the original `supertrained.ai` 12-finding baseline
- live quick audits that run end to end in both CLI and local web app
- Sprint 1 crawler upgrades: rendered DOM extraction, AXTree snapshot capture, CWV capture, retry/backoff, structured crawl errors, supplemental mobile snapshot
- Sprint 2 primitive upgrades: all six security headers, CSP/CORS/mixed-content checks, color contrast, accessible names, structured-data validation, title/description length checks, structural CTA/trust checks
- Sprint 3 capability upgrades: tiered security disclosure, passive agent-endpoint probing, sitemap reconciliation, internal link topology, richer stack detection, page-role classification
- hosted lifecycle hardening:
  - repository and Supabase completion ordering fixed
  - API route contracts tested
  - job/worker orchestration dependency-injected and tested
  - progress/results UI state machine normalized
  - no skipped integration placeholders remain
  - live Vercel + Railway + Supabase validation passed
- `WU-13` account surface:
  - login page
  - signup page
  - auth callback page
  - dashboard page
  - audit history list
  - score trend chart
  - API key generation
  - authenticated audits now attach `user_id`
- auth verification:
  - local magic-link callback verified with generated Supabase link
  - production magic-link callback verified with generated Supabase link after Vercel env alignment
  - GitHub OAuth reaches the real GitHub login page with the correct callback chain

Current validation split:
- synthetic fixture validates detection logic
- live run validates the real stack

## Pick Up Here

1. `CLAUDE.md`
2. `.compound-beads/context.md`
3. `src/primitives/*`
4. `src/lib/crawler/*`
5. `src/lib/synthesis/*`
6. `src/renderers/format-b.ts`

Then run:
- `npm run build`
- `npm run typecheck`
- `npm test`
- reproduce live quality signals if needed:
  - `npm run cli -- audit https://supertrained.ai --quick --format b`

## What Is Done

- `WU-00` through `WU-07a` implemented locally
- synthetic `WU-08` fixture + matcher implemented
- regression threshold `>= 10/12` now passes deterministically
- crawler listener leakage and browser shutdown bugs fixed
- grouping / deduplication / causal-chain quality improved
- adversarial remediation Sprint 1 complete under TDD
- adversarial remediation Sprint 2 complete under TDD
- adversarial remediation Sprint 3 complete under TDD
- hosted audit lifecycle hardening complete under TDD
- `WU-13` implemented:
  - `src/app/auth/login/page.tsx`
  - `src/app/auth/signup/page.tsx`
  - `src/app/auth/callback/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/components/dashboard/*`
  - `src/components/account/*`
  - `src/app/api/account/*`
- partial Gate 4 web product surface implemented:
  - `WU-09` design tokens/components/doc stub
  - `WU-10` landing page
  - `WU-11` progress page
  - `WU-12` results page
- real browser smoke passed locally:
  - URL submit
  - progress route
  - results route
  - copy-ready output visible
- in-memory preview state moved behind a repository abstraction with optional Supabase persistence
- full verification on current code state:
  - `npm run build`
  - `npm run typecheck`
  - `npm test`
- current verification state:
  - `74` passing tests across `32` files
  - local `WU-13` smoke passed with disposable authenticated Supabase user
  - GitHub OAuth provider returns a real Supabase OAuth URL (`skipBrowserRedirect: true`)
- auth validation state:
  - local magic-link callback reaches `/dashboard`
  - production magic-link callback reaches `/dashboard`
  - GitHub OAuth reaches `github.com/login` with `tool-tester.vercel.app/auth/callback` in the redirect chain
- authenticated ownership validation passed:
  - `POST /api/audit` with bearer token creates audit rows with `user_id`
  - `/api/account/dashboard` returns owned audit history and trend series
  - `/api/account/api-keys` creates and lists API keys for the same user
- live hosted validation passed:
  - production Vercel deployment updated
  - Railway worker ready
  - hosted quick audit completed with `progress: 100` and `result` present
  - Supabase rows verified for audit, crawl_result, primitive_results, findings, reports

## Next Tasks

- [ ] Fix live quality / robustness regressions before expanding scope:
  - `supertrained.ai` quick check currently returns `141` findings
  - homepage duplicate locations still show `/, /`
  - non-Next.js live runs (`stripe.com`, `python.org`) stalled with no CLI result in a reasonable window
- [ ] Verify GitHub OAuth with a real browser login if credentials are available
- [ ] **Quality sprint first, then `WU-15`**
- [ ] Scoring calibration (issue #5 from Quality Sprint 4 memo) — deferred to post-alpha with methodology v0.1 disclaimer
- [ ] Worker/queue observability hardening

## Recent History

| Date | Activity |
|------|----------|
| 2026-03-11 | Implemented WU-01 through WU-07a |
| 2026-03-11 | Built synthetic crawl fixture and known-findings matcher for WU-08 |
| 2026-03-11 | Fixed crawler listener leakage and pipeline/browser shutdown |
| 2026-03-11 | Synthetic dogfood regression now passes at >=10/12 with no critical misses |
| 2026-03-12 | Implemented landing/progress/results web surface and design system doc |
| 2026-03-12 | Fixed local results-page state bug by loading results through API instead of direct server memory |
| 2026-03-12 | Added repository abstraction: memory fallback now, Supabase path when env is configured |
| 2026-03-12 | Verified local browser flow: URL -> progress -> results -> copy-ready payload |
| 2026-03-13 | Closed adversarial remediation Sprints 1-3 under TDD and widened the suite to 44 passing tests |
| 2026-03-14 | Completed hosted audit lifecycle hardening under TDD, deployed fixes to Vercel, and validated live persistence/result retrieval |
| 2026-03-18 | Agent-native terminology revision: replaced vision-metaphor vocabulary with industry-standard terms in brand doc |
| 2026-03-18 | Quality Sprint 4: LCP/CLS checks, keyword FP removal, Calendly removal, CTA expansion, Format B confidence+verify. 66 tests / 30 files passing, 0 TS errors |
| 2026-03-18 | Ran full adversarial review against PRODUCT-SPEC.md v2 + GO-TO-MARKET.md v1 (pre-adversarial versions). 5 CRITICAL + 5 HIGH + 5 MEDIUM. All findings already integrated into v3/v2 docs and ADRs from the March 7 adversarial panels. |
| 2026-03-18 | Reviewed Claude's quality calibration memo against the live code. Direction accepted; caveats recorded: stale test-count snapshot and `agent-nativeness.ts` `usesLLM = true` is not itself a defect. No more planning needed before `WU-13`. |
| 2026-03-18 | Implemented `WU-13` under TDD: auth helpers, account routes, login/signup/callback/dashboard pages, trend chart, audit list, API key generation, and authenticated audit ownership wiring. Full suite now at 74 tests / 32 files. |
| 2026-03-18 | Local owned-account smoke passed using a disposable Supabase auth user: account sync 200, API key creation 200, authenticated audit completed, dashboard returned owned audit history, and DB rows confirmed shared `user_id`. |
| 2026-03-19 | Verified local and production magic-link callback flows with generated Supabase links. Fixed callback handling for hash-based token returns and aligned Vercel Supabase env vars with the current project. |
| 2026-03-19 | Live quality validation exposed a new blocker: `supertrained.ai` quick check returned 141 findings, and non-Next.js runs (`stripe.com`, `python.org`) stalled without producing CLI output in a reasonable time window. |
