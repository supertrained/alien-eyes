# Feedback Payload Design

> The most important design decision in the product.
> Optimized for: "what format produces the best fix when pasted into a coding agent?"

## The Constraint

The payload must work when a builder literally copies it and pastes it into:
- Claude Code (terminal)
- Cursor (IDE chat)
- Lovable (web builder)
- Bolt (web builder)
- Windsurf (IDE chat)
- Any future coding agent

The builder adds minimal instruction — ideally just "fix these" or nothing at all.
The coding agent must produce correct, complete fixes from the payload alone.

## What Coding Agents Need (Ordered by Impact on Fix Quality)

1. **What's wrong** — specific observable behavior, not a category label
2. **Where** — URL, endpoint, page section, or component (file path if GitHub connected)
3. **What should happen instead** — the expected behavior
4. **Why it matters** — who is affected and how (human users, agents, both)
5. **How to verify** — a concrete check the agent can run after fixing
6. **Severity** — so the agent (or builder) knows what to fix first
7. **Causal chain** — when multiple findings interact, show the connection

## What Coding Agents DON'T Need

- Marketing language ("we recommend considering...")
- Scores (the agent doesn't care about a number)
- Methodology explanations
- Comparisons to benchmarks
- Executive summaries
- Disclaimers

## Prototype Payloads

### Format A: Structured Findings List

```
## Alien Eyes Findings — yoursite.com
## Tested: 2026-03-05 | Satisfaction: 71% | 8 findings (2 critical, 3 high, 3 medium)

### [CRITICAL] Auth endpoint accepts invalid tokens silently
- **What:** POST /api/auth returns 200 with empty body when token is malformed or expired
- **Where:** Authentication endpoint /api/auth
- **Should:** Return 401 with JSON body: {"error": "invalid_token", "message": "..."}
- **Why:** Agents and users proceed thinking they're authenticated. 3/5 simulated agents continued with unauthenticated sessions, corrupting subsequent requests.
- **Verify:** POST /api/auth with token "invalid" → expect 401 with JSON error body
- **Connects to:** Finding #4 (no error schema) — agents can't detect failure even if they check

### [CRITICAL] Signup form gives no feedback after submission
- **What:** After clicking Submit on /signup, the form clears but nothing else happens
- **Where:** /signup page, form submission handler
- **Should:** Show success message, redirect to /welcome, or show error state
- **Why:** 4/5 simulated human users clicked Submit again (double submission). 2/5 left the page assuming it was broken.
- **Verify:** Submit form with valid data → visible confirmation within 2 seconds

### [HIGH] No structured error responses anywhere in API
- **What:** All API error states return HTML error pages (default framework error handler)
- **Where:** All /api/* endpoints
- **Should:** Return JSON: {"error": string, "code": number, "detail": string}
- **Why:** Agents cannot parse HTML error pages. Every API failure becomes an unrecoverable dead end for agent consumers.
- **Verify:** Trigger any API error → response Content-Type is application/json
- **Connects to:** Finding #1 (silent auth failure) — this is why agents can't detect the auth problem

### [HIGH] Mobile nav menu doesn't close after selecting item
- **What:** Hamburger menu opens but tapping a nav item navigates without closing the menu overlay
- **Where:** Mobile viewport (<768px), navigation component
- **Should:** Close menu overlay on nav item click, then navigate
- **Why:** Simulated mobile users saw content through the still-open overlay. 2/5 tapped "back" thinking the page hadn't changed.
- **Verify:** On mobile viewport, open menu, tap nav item → menu closes, page navigates

### [HIGH] No meta description or OG tags on any page
- **What:** <head> contains no meta description, og:title, og:description, or og:image
- **Where:** All pages (checked /, /pricing, /docs, /signup)
- **Should:** Each page has unique meta description (<160 chars) and OG tags
- **Why:** Search engines show auto-generated snippets. AI answer engines have no summary to cite. Social shares show blank previews.
- **Verify:** View source on each page → <meta name="description"> and <meta property="og:*"> tags present

### [MEDIUM] No skip-to-content link for keyboard/screen reader users
- **What:** Tab key starts at browser chrome, then hits every nav item before reaching main content
- **Where:** Site-wide, <body> element
- **Should:** First focusable element is a "Skip to content" link targeting <main>
- **Why:** Keyboard and screen reader users must tab through 8 nav items on every page load.
- **Verify:** Press Tab on page load → first focused element is skip link → Enter key jumps to main content

### [MEDIUM] Images missing alt text
- **What:** 6 of 9 images across tested pages have no alt attribute or alt=""
- **Where:** /pricing (hero image, 3 feature icons), / (team photo, logo)
- **Should:** Decorative images: alt="". Content images: descriptive alt text.
- **Why:** Screen readers announce "image" with no context. AI crawlers can't understand page content.
- **Verify:** All <img> tags have alt attribute. Content images have descriptive text.

### [MEDIUM] Console errors on page load
- **What:** 3 JavaScript errors fire on initial load of every page (undefined property access)
- **Where:** Site-wide, appears in main bundle
- **Should:** No console errors on clean page load
- **Why:** May cause silent failures in interactive features. Signals unhandled edge cases.
- **Verify:** Open browser console on / → no errors on load
```

### Format B: Same Findings, Condensed for Quick Paste

```
Fix these 8 issues found by external testing of yoursite.com:

1. CRITICAL: POST /api/auth returns 200 on invalid tokens. Should return 401 with JSON error body {"error": "invalid_token"}. Agents proceed thinking they're authenticated.

2. CRITICAL: /signup form clears after submit but shows no confirmation, redirect, or error. Users click submit again (double submission). Add visible success/error state.

3. HIGH: All API errors return HTML pages. Should return JSON {"error": string, "code": number}. Agents can't parse HTML errors — every failure is a dead end. (Connected to #1 — this is why agents can't detect auth failure.)

4. HIGH: Mobile hamburger menu doesn't close after tapping nav item. Users see content through open overlay. Close menu on nav click.

5. HIGH: No meta description or OG tags on any page. Search/AI engines have no summary. Social shares blank. Add to all pages.

6. MEDIUM: No skip-to-content link. Keyboard users tab through 8 nav items to reach content. Add skip link targeting <main>.

7. MEDIUM: 6/9 images missing alt text on /pricing and /. Add descriptive alt for content images, alt="" for decorative.

8. MEDIUM: 3 JS console errors on every page load (undefined property access). Fix or catch.
```

### Format C: GitHub-Connected (File-Aware)

```
Fix these 8 issues found by external testing of yoursite.com:

1. CRITICAL: POST /api/auth returns 200 on invalid tokens
   File: src/app/api/auth/route.ts (line ~23, the catch block returns empty 200)
   Fix: Return NextResponse.json({error: "invalid_token"}, {status: 401})
   Verify: POST /api/auth with token "invalid" → 401 with JSON

2. CRITICAL: /signup form shows no feedback after submission
   File: src/components/SignupForm.tsx (no loading/success/error states)
   Fix: Add useState for form status, show spinner during submit, show success or error message
   Verify: Submit form → visible confirmation within 2 seconds

3. HIGH: All API errors return HTML
   Files: src/app/api/*/route.ts (multiple files)
   Fix: Add try/catch to all route handlers, return JSON error responses
   Verify: Trigger error on any API endpoint → Content-Type is application/json

[...etc with file paths and line numbers for each]
```

## Design Decision: Which Format Wins?

The answer is probably: **generate Format A internally, deliver the format that matches the builder's context.**

| Builder Context | Optimal Format | Why |
|----------------|---------------|-----|
| URL-only (no GitHub) | Format B (condensed) | No file paths available, builder needs to paste into agent |
| GitHub connected | Format C (file-aware) | File paths make fixes dramatically faster and more accurate |
| MCP/API call from agent | Format A as JSON | Agent needs structured data, not markdown |
| Human reading dashboard | Format A (full) | Needs the "why" and verification to understand priority |
| Non-technical evaluator | Executive summary + Format A | Needs business impact framing around the findings |

The ONE CLICK action is: **Copy findings to clipboard** (in the format optimized for their context).

## The Clipboard is the Product

The entire product experience culminates in a single button: "Copy to Builder."

What that button produces is the most important thing we design.

If the builder pastes that text into Claude Code and the fixes are correct — we've delivered value.
If the fixes are wrong or incomplete — we've failed, regardless of how pretty the dashboard is.

## What Makes This Hard to Replace

1. **The alien perspective** — no other tool tests from simulated user AND agent perspectives simultaneously
2. **The causal chains** — "Finding #1 connects to Finding #4" means the agent fixes the root cause, not symptoms
3. **The verification criteria** — the agent knows HOW to confirm the fix worked, enabling the re-test loop
4. **The "why it matters" framing** — uses simulated user evidence ("3/5 users clicked submit again"), not rule citations
5. **The agent-nativeness findings** — nobody else tests whether the product works for AI agent consumers
6. **The steady-state testing** — we don't check a list, we observe behavior and try to break it — different every time

## Pricing Implication

If the loop is build → test → fix → re-test, then pricing must support LOOPING, not single audits.

| Model | Problem |
|-------|---------|
| $49 per audit | Discourages re-testing. Builder fixes 3 things and doesn't verify. |
| $99/month unlimited | No marginal cost for looping. But flat subscription has churn risk. |
| $29/month + $5 per audit | Supports looping (re-tests are cheap) while maintaining revenue floor |
| Free first audit + $5 per re-test | Perfect for vibe coders. First one hooks them. Re-tests are cheap enough to loop. |

The "first audit free, re-tests cheap" model aligns pricing with the product's core value: the loop.

Re-testing the SAME URL within 7 days should be cheaper than a fresh audit — because we already have the baseline, the scenarios are selected, and the comparison is the valuable part.

## Open Questions

1. Should "Copy to Builder" auto-detect which builder they're using (Claude Code vs Cursor vs Lovable) and optimize format?
2. Should there be a direct MCP integration where Claude Code calls Alien Eyes and receives findings natively (no copy-paste)?
3. Should the re-test automatically compare to the previous audit and highlight what improved / what regressed / what's new?
4. How do we handle findings that require HUMAN judgment (brand voice, business strategy, design taste)? Do they appear in the builder payload with a flag, or are they separated?
