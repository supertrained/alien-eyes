# Handoff: WU-00 — Architecture & Types

## Agent: Codex 5.4
## Status: Complete
## Date: 2026-03-11

### What Was Built
- Added root `package.json` with core app dependencies and scripts for `typecheck` and `test`
- Added root `tsconfig.json` with strict mode and `@/types` path aliases
- Implemented the frozen type surface in `src/types/`
- Added barrel export at `src/types/index.ts`
- Copied `docs/METHODOLOGY-v0.1.md` to `methodology/v0.1.md`
- Added `supabase/migrations/001_initial.sql` based on `docs/SCHEMA.md`
- Added integration test stubs for envelope creation, finding validation, crawl contract, and renderer parity
- Installed dependencies and generated `package-lock.json`

### Tests That Pass
- `npm run typecheck`
- `npm test` (all 4 integration files present as `todo` stubs; Vitest run succeeds)

### Deviations from Spec
- Added extra type files not listed explicitly in WU outputs:
  - `src/types/page-summary.ts`
  - `src/types/synthesis.ts`
  - `src/types/model.ts`
  - `src/types/security.ts`
  Rationale: the frozen type spec defines these contracts explicitly and splitting them keeps imports sane.
- Implemented `runPrimitive` in `src/types/envelope.ts` even though WU-00 says “No runtime code.”
  Rationale: `docs/TYPE-SPEC.md` explicitly defines the helper. This is a minimal utility attached directly to the type contract, not product runtime.
- Did not execute the Supabase migration against a live Supabase project.
  Rationale: no provisioned project in this turn. SQL file is present and type-level scaffold is complete, but migration runtime validation is still needed at Gate 1.

### What the Next Agent Needs to Know
- Current scaffold is intentionally minimal and web-first.
- The migration still includes `scheduled_audits` because `docs/SCHEMA.md` still defines it, even though current Phase 0 scope treats scheduled monitoring as deferred. If scope wants stricter Phase 0 purity, schema may need a review before applying in production.
- `src/types/index.ts` is the intended single import surface for `@/types`.
- Path aliases are working under `tsc --noEmit`.

### Open Questions for Human Review
- Keep `runPrimitive` in WU-00 despite the “No runtime code” line, or move it later and leave only type declarations here?
- Should `scheduled_audits` remain in the initial schema migration even though monitoring is deferred from current scope?

### Files Modified
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `src/types/crawl.ts`
- `src/types/envelope.ts`
- `src/types/evidence.ts`
- `src/types/finding.ts`
- `src/types/index.ts`
- `src/types/model.ts`
- `src/types/page-summary.ts`
- `src/types/primitive.ts`
- `src/types/renderer.ts`
- `src/types/security.ts`
- `src/types/synthesis.ts`
- `methodology/v0.1.md`
- `supabase/migrations/001_initial.sql`
- `tests/integration/crawl-result.test.ts`
- `tests/integration/envelope.test.ts`
- `tests/integration/finding.test.ts`
- `tests/integration/renderer-parity.test.ts`
