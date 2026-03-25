# Learnings

> Compounded insights across rounds. Updated as patterns emerge.

## Observations

- The product is NOT a testing tool — it's an "alien perspective" service. The builder is structurally incapable of seeing their product through fresh eyes.
- "An audit" is actually 5+ different products: full-site CI gates, single-feature spot checks, single-page verification, incremental change detection, standardized bulk evaluations.
- The output format problem is the single largest design challenge: Marcus needs encouragement, Diana needs terse data, Raymond needs PDF, Yuki needs screenshots, Jaylen needs TikTok-ready graphics, agents need JSON.
- The determinism paradox: CI agents need identical scores for identical inputs, but Stanford-style persona testing requires randomization. Need two modes.
- Web-only is a blind spot for ~40% of the market (React Native, CLIs, APIs, MCP servers, libraries).
- Vibe coders (Jaylen) are the fastest-growing builder segment and they want to paste results into Claude Code with "fix these."
- Non-technical founders (Raymond) have the HIGHEST willingness to pay per-audit ($200-500) but need plain English + PDF export.
- Documented findings create legal obligations (David/compliance). Need a finding lifecycle model.
- StrongDM-style scenario grammar (composable test primitives → 10^6+ configurations) prevents gaming.
- Steady State Hypothesis (Chaos Engineering) elegantly solves outcome inference: observe what it DOES, test whether it keeps doing that.
- Swiss Cheese Model (Aviation) for findings as causal chains, not isolated bugs.
- "Tested 37 minutes ago" is the single strongest trust signal for developers (all Rhumb panels confirmed).
- VALIDATED: Format B (condensed, no file paths) produced 12/12 correct fixes when pasted into Claude Code in regular mode. Builder agent found correct files across 22+ files without hints. File-aware Format C may be unnecessary as default.
- The payload ingredients that matter: specific observable behavior, clear expected behavior, severity ranking, causal connections between findings. Scores, methodology, marketing language are noise.
- The loop works end-to-end: audit → copy → paste into builder → fixes applied → build passes. Ready for re-test validation.
- VALIDATED (Loop 2): Re-test found 5 new issues + 3 partials. Generated 8-item payload. Builder fixed all 8, correctly triaged 2 as "no action needed," and pushed back on 1 false positive (cookie consent was working, Playwright test state was stale). Two loops took supertrained.ai from 12 findings to ~0.
- False positives are inevitable with browser-based testing — stale state (cookies, localStorage) can make working features appear broken. The audit tool MUST use clean browser profiles for each run.
- Builder agents are smart enough to triage "no action needed" items without wasting effort. Including them for completeness is fine — the builder skips them.
- Builder pushback is a FEATURE, not a bug. When the builder says "this is actually working correctly," that's signal about audit accuracy. The re-test loop is self-correcting.
- The docs currently conflate two endpoint universes: Alien Eyes's own interfaces (web/API/CLI/MCP) and the external product surfaces Alien Eyes wants to evaluate (websites/APIs/MCP/CLI/GitHub/webhooks). Treating them as one planning problem hides major gaps.
- Website auditing is the only target surface that is currently mapped end-to-end. API auditing, MCP server auditing, CLI auditing, GitHub-native workflows, and webhook/streaming evaluation are still strategy claims, not design-complete capabilities.
- The Stanford result supports a method principle, not a shortcut: the value comes from rich grounding plus synthesis plus validation. For Alien Eyes, that means per-audit personas should be generated from a business-context evidence packet, not from generic market archetypes.
- Persona generation and persona selection are different steps. Generate a wider candidate pool per audit, then select a smaller mixed panel for execution.
- Once full-vision docs exist, a canonical scope-control doc becomes mandatory. Otherwise teams will over-build against future design artifacts that were meant only to preserve optionality.
- In a Next.js App Router preview, direct reads from an in-memory job map are not a safe source of truth for both API routes and server-rendered pages. Fetching results through the API boundary avoids cross-context state holes.
- `format-json` is enough to act as the authoritative persisted synthesis snapshot for the results UI. Persist normalized tables for analysis, but use the JSON report to reconstruct the page fast.
- The panel synthesis was useful as an implementation backlog only after it was turned into failing tests. Without that translation step, “Sprint complete” claims drifted away from the code.
- Parallel `build` and `typecheck` against the same Next.js workspace still create false negatives. Build first or typecheck first, but verify them sequentially.
- Hosted lifecycle bugs hid in ordering, not missing features: `complete` before report persistence and stale progress overwrites were both race conditions that only showed up against live infrastructure.

- Brand metaphors belong in marketing, not in CLIs or data models. An agent reading `"type": "finding"` knows what it is; an agent reading `"type": "sighting"` has to guess. The brand name carries the metaphor; the interfaces speak plain English.
- Keyword matching against page body text is not a reliable proxy for capability detection. A page mentioning "API" or "JSON" in marketing copy is not the same as having an unexposed structured endpoint. Actual HTTP probes (checking /openapi.json, /llms.txt, etc.) are reliable; text heuristics are not.
- Product-specific checks (e.g., "does the page use Calendly?") don't belong in general-purpose primitives. They fire as false positives on every site that doesn't use that product. General patterns (dead-end pages, missing CTAs) are reusable; brand-name checks are not.
- Core Web Vitals (LCP, CLS) must be checked if the crawl layer collects them. A performance primitive that ignores Google's ranking signals is a credibility killer for any builder who knows web vitals.
- Format B needs more than what/expected/why for machine consumers. Confidence scores let coding agents triage ambiguous findings, and verify steps let them confirm their fix worked. Both are cheap to include (~2 lines per finding) and directly improve paste-to-fix accuracy.
- Review memos drift. They are useful for prioritization, but specific claims like test counts, bug labels, and completion status still need to be verified against the current code before they become continuity truth.
- Account features are not complete just because auth pages exist. They only become real when authenticated actions actually attach ownership to the core product objects (`audits.user_id`, `api_keys.user_id`) and the dashboard can read them back.
- A disposable Supabase user is enough to validate almost all of an account/dashboard build without waiting on a human inbox. It covers account sync, API keys, owned audit creation, dashboard retrieval, and DB ownership checks.
- Supabase magic-link verification can return auth in the URL hash, not only `?code=`. Callback pages that only call `exchangeCodeForSession(code)` will work in some environments and fail in others. Support both flows explicitly.
- Production auth bugs can be pure environment mismatch. A valid callback can still fail with `invalid JWT ... unrecognized kid` if Vercel runtime envs point at a different Supabase project than the browser client.
- A quick check that returns 141 findings on the dogfood site is not “good enough to proceed.” Live over-reporting outranks roadmap order; quality must retake priority when real output gets that noisy.
- Mainstream non-Next.js sites stalling in the CLI path are a product-level robustness issue, not just an implementation curiosity. Cross-stack live validation needs timeouts/classified failures, not silent hangs.

## Patterns

- **"Clipboard is the product" — CONFIRMED.** The entire product value chain culminates in what the builder pastes into their coding agent. If that produces correct fixes, we win. Validated with 12/12 on supertrained.ai audit.
- **The loop converges.** Loop 1: 12 findings → 8 fixed, 3 partial, 5 new. Loop 2: 8 items → all resolved, 1 false positive caught. Two iterations took a site from "critical SEO issue" to clean. This IS the product.
- **Format B is sufficient.** Condensed format (no file paths) produced correct fixes across two full loops. Builder agents find the right files without hints.
- **Non-web coverage needs its own specs.** "API/MCP/CLI support" cannot live as loose roadmap language. Each surface needs its own input contract, threat model, scenario grammar, and evidence model before it is claimed.
- **Per-audit personas are the right model.** Keep a stable subset for deterministic mode and rotate the rest for probabilistic mode. This preserves comparability without collapsing into a static test checklist.
- **Future-design docs need explicit non-binding status.** Strong long-range specs are helpful only if current build docs still have clear precedence.
- **Tiered disclosure is the right gate pattern.** Publicly observable security and agent-surface checks should run for everyone; ownership gates should apply only to more sensitive or interpretation-heavy checks.
- **Supplemental mobile capture should be additive, not duplicative.** Store mobile evidence separately from the main crawl graph so the primitives can use it without corrupting desktop page counts or deduplication.
- **Supabase-backed completion must be write-ordered.** Persist reports/findings first, then mark the audit row `complete`. Otherwise the hosted API can legally observe a “complete” audit with no retrievable result.
- **DB guards beat read-before-write checks for progress races.** Once status is terminal, progress updates need server-side query guards (`neq status complete/error`, monotonic `lte progress`) rather than relying on a prior read in app code.

## Guidelines

- Always use a clean/incognito browser profile for audits — stale localStorage/cookies cause false positives.
- Include "no action needed" items in payloads for completeness but flag them clearly — builder agents handle triage correctly.
- Expect and welcome builder pushback — it improves audit accuracy over time.
- Before promising endpoint coverage, separate: (1) Alien Eyes interface contracts and (2) target-product surface contracts. Then pre-register a test matrix for each surface family.
- Before using persona findings in scoring, record: grounding evidence, inferred assumptions, confidence, and which findings each persona contributed to.
- Before handing docs to a team, publish one canonical build-scope document with precedence rules. "Well-specified future" is not the same as "build now."

## Dead Ends

(Approaches that failed — avoid repeating)

## Prevention Rules

- Before reporting a "missing UI element" finding, verify with a clean browser profile. Stale consent state is the #1 false positive source.
- A working end-to-end pipeline is not the same as a credible audit engine. The first live `supertrained.ai` quick audit surfaced noisy duplicate findings and over-connected causal chains even though the entire stack compiled and ran.
- Quick mode must not instantiate the model router at all. Passing an optional router into synthesis is enough to accidentally trigger paid-model code paths.
- Runtime path aliases make `node --experimental-strip-types` a trap for CLI execution. `tsx` is the safer runtime bridge until the project has a proper build step.
- `tsc` and `next build` should not be run in parallel against the same `.next` directory. The generated route-type files are stable enough for sequential verification, not concurrent verification.
- A regression target tied to a historical live site is only valid if the historical crawl state is frozen. Audit writeups and expected findings are not enough to honestly claim engine recall against a site that has since changed.
- Reusing one Playwright page across many URLs without isolating listeners quietly corrupts later findings. One browser context per audit is fine; one event-attached page per audit is not.
- Quality gains came more from synthesis discipline than from adding more rules: grouping repeated issues and cutting weak causal links reduced live `supertrained.ai` output from 38 noisy findings to 7 grouped findings.
- A synthetic crawl fixture can legitimately replace a drifting live-site regression target when the goal is to validate detector logic, as long as the live site remains a separate manual smoke test.
- The useful split is now clear: synthetic regression for logic stability, live smoke for stack reality.
- “Sprint complete” is not a document state. It is a test state plus build/typecheck verification on the exact code being handed off.
- Hosted validation needs two proofs: the public API payload and the backing rows in storage. One without the other is not enough.
- A quality calibration memo (code read → ranked issues → focused sprint) is an effective pre-expansion gate. It prevents shipping known credibility gaps to the first external users.
- Once a calibration memo is accepted and continuity already reflects the post-calibration state, the next handoff should point directly at the next work unit instead of repeating the planning debate.
- The remaining gap after backend-owned account smoke is human auth delivery, not application logic. Treat magic-link inbox verification and GitHub browser completion as external validation tasks, then move to the next work unit.
- If magic-link auth is validated by generated links and GitHub reaches the real login page with the correct callback target, the remaining auth blocker is credentials, not architecture.
