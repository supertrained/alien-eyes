# Handoff: WU-00b — Security Architecture

## Agent: Codex 5.4
## Status: Complete
## Date: 2026-03-11

### What Was Built
- Added `src/lib/security/url-validator.ts`
- Added `src/lib/security/input-sanitizer.ts`
- Added `src/lib/security/rate-limiter.ts`
- Added `src/lib/security/cost-budget.ts`
- Added unit tests for URL validation and input sanitization
- Added `vitest.config.ts` for `@` alias resolution in test runtime
- Added `cheerio` dependency for deterministic HTML sanitization

### Tests That Pass
- `npm run typecheck`
- `npm test`

### Deviations from Spec
- `rate-limiter.ts` is currently configuration-only, not a full runtime limiter.
  Rationale: WU-00b output asked for rate limiting config. Enforcement can layer on top later.
- `InputSanitizer` currently removes `aria-hidden="true"` content globally.
  This matches the WU text, but ADR-015 notes a possible future nuance for accessibility-specific extraction. That nuance is not implemented yet.
- URL validator uses injectable DNS lookup function for deterministic tests.
  Rationale: avoids network dependency while still testing anti-rebinding logic.

### What the Next Agent Needs to Know
- `CostBudgetTracker` is measurement-only. Warning at `$5`, no kill switch.
- `URLValidator` blocks hostname literals like `localhost` and metadata hosts before DNS lookup.
- `InputSanitizer.createPromptPayload()` is the current shared pattern for instruction/data separation.

### Open Questions for Human Review
- Keep stripping `aria-hidden="true"` content globally, or preserve it for some extractors later per ADR-015 nuance?
- Is configuration-only rate limiting sufficient for Phase 0, or should minimal in-memory enforcement be added before WU-15?

### Files Modified
- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/lib/security/url-validator.ts`
- `src/lib/security/input-sanitizer.ts`
- `src/lib/security/rate-limiter.ts`
- `src/lib/security/cost-budget.ts`
- `tests/unit/url-validator.test.ts`
- `tests/unit/input-sanitizer.test.ts`
