# Site Audit: supertrained.ai
**Date:** 2026-03-05
**Auditor:** Alien Eyes (automated + manual browser testing)
**Target:** https://supertrained.ai

---

## Finding 1: Canonical URLs Point to Homepage on Nearly Every Page

- **Severity:** CRITICAL
- **What:** The `<link rel="canonical">` tag on /services, /blog, /about, /method, /contact, /blueprint, and /work all point to `https://supertrained.ai/` (the homepage) instead of their own URL. Only /meo has the correct canonical.
- **Where:** Every page except /meo. Verified by extracting `document.querySelector('link[rel="canonical"]').href` on each page.
- **Should:** Each page's canonical should point to itself (e.g., /services should have `canonical="https://supertrained.ai/services"`).
- **Why:** Search engines interpret this as "all these pages are duplicates of the homepage." This means Google may ignore /services, /blog, /work, /contact, and /blueprint entirely in search results, collapsing the site's indexable surface to a single page. This is the single most damaging SEO issue on the site.
- **Verify:** After fix, run `document.querySelector('link[rel="canonical"]').href` on each page and confirm it matches `window.location.href`.
- **Connects to:** Finding 5 (meta description mismatch on /services)

---

## Finding 2: Calendly Widget Blocked When Cookies Declined

- **Severity:** HIGH
- **What:** On /contact, the Calendly booking widget does not render if the user has not accepted cookies. The area shows a blank grey box. The DOM contains the text "To view the booking calendar, please accept cookies. Calendly uses cookies to display the scheduling widget." but this message is not visually prominent -- it appears as small text that blends into the blank area.
- **Where:** https://supertrained.ai/contact -- the "Strategy Session" booking card
- **Should:** Either (a) show the Calendly widget without requiring cookie consent (it's a functional cookie, not analytics), or (b) display a clearly visible, styled fallback with a prominent "Accept cookies to see calendar" button and a direct Calendly link as an alternative.
- **Why:** A user who clicked "Book a Conversation" (the primary CTA across the entire site) and previously declined cookies hits a dead end. The email fallback exists below the fold but the primary booking mechanism appears broken. Privacy-conscious users (especially in EU) routinely decline cookies.
- **Verify:** Navigate to /contact, decline cookies, confirm the calendar renders or a clear fallback with direct link is visible.
- **Connects to:** None

---

## Finding 3: React Hydration Error #418 on Multiple Pages

- **Severity:** MEDIUM
- **What:** Console error `Minified React error #418` fires on /blog, /work, and /blueprint. Error #418 is "Hydration failed because the server rendered HTML didn't match the client." This means the server-rendered HTML and client-side React tree disagree on content.
- **Where:** /blog, /work, /blueprint (confirmed via console monitoring). Stack traces point to the main React chunk (`f3886ab8f9be5a2f.js`).
- **Should:** Server and client renders should produce identical HTML. Common causes: date/time rendering, conditional content based on `window` or cookies, or randomized content.
- **Why:** Hydration mismatches cause React to discard the server-rendered DOM and re-render from scratch on the client. This wastes the performance benefit of SSR, can cause visible layout shifts (flash of content), and in edge cases can break interactive elements. Not user-visible in most cases but degrades performance and indicates a code issue.
- **Verify:** After fix, load /blog, /work, and /blueprint with console open and confirm zero React errors.
- **Connects to:** None

---

## Finding 4: Animated Counters Show "0" in Initial Snapshot

- **Severity:** MEDIUM
- **What:** The statistics section on the homepage shows "0 hrs/week", "$0K+/yr", and "0%" in the accessibility tree / DOM snapshot. These are animated counters that count up when scrolled into view, but they render with a value of 0 before the animation triggers.
- **Where:** Homepage, "Your team is brilliant" section -- the three stat cards.
- **Should:** The initial/fallback values should show the final numbers (e.g., "20 hrs/week", "$50K+/yr", "80%") in the HTML, with the animation as progressive enhancement. Or use `aria-label` attributes with the real values.
- **Why:** (1) Screen readers announce "0 hrs/week" which is meaningless. (2) AI agents scraping the page extract zero values. (3) Users on slow connections or with JavaScript disabled see zeros. (4) Search engines index the zero values, not the animated ones.
- **Verify:** Check the DOM for the stat elements before any scroll/intersection occurs. Values should be the final numbers. Check with a screen reader that the correct values are announced.
- **Connects to:** Finding 8 (agent consumer perspective)

---

## Finding 5: /services Meta Description Describes Old Service Names

- **Severity:** MEDIUM
- **What:** The meta description for /services reads: "Workflow Automation, Custom AI Agents, Managed AI Operations, and Fractional AI Department. SuperTrained builds, runs, and improves AI for your team." But the actual page content describes sprint-based services: Revenue Signal Sprint, Demand Capture Sprint, and Reliability Sprint. The old service names do not appear anywhere on the page.
- **Where:** https://supertrained.ai/services -- `<meta name="description">` tag
- **Should:** The meta description should match the current page content, e.g., "Signal-first growth sprints: Revenue Signal, Demand Capture, and Reliability. Fixed scope, clear ROI gates, stop-or-scale decisions."
- **Why:** A user searching for "AI automation services" sees a snippet promising "Workflow Automation, Custom AI Agents" but arrives at a page about sprints. This mismatch increases bounce rate. It also signals to search engines that the metadata is stale.
- **Verify:** After update, confirm `document.querySelector('meta[name="description"]').content` references the sprint-based services.
- **Connects to:** Finding 1 (canonical issue), Finding 6 (OG description mismatch)

---

## Finding 6: OG Description is Generic/Identical Across Multiple Pages

- **Severity:** LOW
- **What:** The `og:description` for /services, /about, and /contact all use the same generic text: "Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best." Only /blog and /blueprint have page-specific OG descriptions.
- **Where:** /services, /about, /contact -- `<meta property="og:description">` tags
- **Should:** Each page should have a unique OG description matching its content, so social shares show relevant previews.
- **Why:** When someone shares the /services or /contact page on LinkedIn/Slack/Twitter, the preview shows a generic agency description rather than page-specific content. This reduces click-through from social shares.
- **Verify:** Check `og:description` on each page and confirm it's unique and page-specific.
- **Connects to:** Finding 5 (meta description mismatch)

---

## Finding 7: /blueprint Page Title Contains Duplicate Brand Name

- **Severity:** LOW
- **What:** The `<title>` tag for /blueprint is "Free AI Automation Blueprint | SuperTrained | SuperTrained" -- the brand name "SuperTrained" appears twice.
- **Where:** https://supertrained.ai/blueprint -- `<title>` element
- **Should:** "Free AI Automation Blueprint | SuperTrained" (brand name once).
- **Why:** Duplicate brand names in the title tag look unprofessional in search results and waste character space that could be used for descriptive keywords.
- **Verify:** After fix, confirm `document.title` on /blueprint contains "SuperTrained" exactly once.
- **Connects to:** None

---

## Finding 8: Nav and Footer are Inside `<main>` Element

- **Severity:** MEDIUM
- **What:** The `<nav>` and `<footer>` elements are children of `<main>`. There is no `<header>` element. The document structure is essentially `<body> > <div> > <main>` with everything inside `<main>`.
- **Where:** Every page -- verified with `main.contains(nav)` = true, `footer.parentElement.tagName` = "MAIN".
- **Should:** The document should have `<header>` (containing nav), `<main>` (containing page content), and `<footer>` as siblings. The `<main>` landmark should contain only the primary content of the page.
- **Why:** Screen readers use landmarks to navigate. When nav and footer are inside `<main>`, a user jumping to "main content" lands on the navigation, defeating the purpose. The skip link (which does exist and targets `#main-content`) partially mitigates this, but the landmark structure is still semantically incorrect. This also affects agent consumers parsing the page structure.
- **Verify:** After fix, confirm `document.querySelector('main').contains(document.querySelector('nav'))` returns false.
- **Connects to:** Finding 4 (accessibility), Finding 10 (agent consumer)

---

## Finding 9: No Content-Security-Policy Header

- **Severity:** MEDIUM
- **What:** The site does not set a `Content-Security-Policy` HTTP header. Other security headers are present: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. But `Strict-Transport-Security` and `Content-Security-Policy` are both missing.
- **Where:** Response headers on `GET https://supertrained.ai/`
- **Should:** Set a CSP header (at minimum `default-src 'self'; script-src 'self' ...`) and an HSTS header (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
- **Why:** Without CSP, the site is more vulnerable to XSS attacks -- any injected script can load resources from any domain. Without HSTS, browsers may not enforce HTTPS on repeat visits. For a site that handles client data through the blueprint tool, this is relevant.
- **Verify:** After adding headers, check response headers with `curl -I https://supertrained.ai/` and confirm both CSP and HSTS are present.
- **Connects to:** None

---

## Finding 10: H3 Product Headings Render as Empty Text

- **Severity:** LOW
- **What:** The H3 headings for "CloneICP" and "SnowThere" in the homepage "Products we've shipped" section have empty text content when read from the DOM. The product names are rendered as `<img alt="CloneICP">` inside the H3, so the heading text is technically empty while the image alt text provides the name.
- **Where:** Homepage, "Products we've shipped" section -- the two `<h3>` elements containing product logo images.
- **Should:** Either add visible text alongside the image (with the image as decorative), or ensure the heading has `aria-label="CloneICP"` so the heading hierarchy is meaningful to screen readers and crawlers.
- **Why:** A screen reader user navigating by headings hears the image alt text but the heading itself is structurally empty. Search engine crawlers parsing the heading hierarchy see empty H3s. An AI agent extracting the page structure gets blank product names at the H3 level.
- **Verify:** Check that `document.querySelectorAll('h3')[0].textContent.trim()` returns the product name, or that the H3 has an appropriate aria-label.
- **Connects to:** Finding 8 (semantic structure)

---

## Finding 11: Third-Party Tracking Fires Before Cookie Consent

- **Severity:** MEDIUM
- **What:** On initial page load (before any cookie consent action), network requests are made to `pagead2.googlesyndication.com` (Google Ads) and `www.google-analytics.com` (GA4). The GA4 request includes `gcs=G100` and `npa=1` which suggest Consent Mode is active (no personalization), but the requests themselves still fire before consent.
- **Where:** Network tab on initial load of any page. Observed: POST to `pagead2.googlesyndication.com/ccm/collect` and POST to `google-analytics.com/g/collect` with `npa=1`.
- **Should:** Under strict GDPR/ePrivacy interpretation, no tracking requests should fire before consent. Google Consent Mode v2 allows "cookieless pings" but some EU DPAs consider even these to require consent. At minimum, document this in the cookie policy.
- **Why:** A privacy-conscious user or a GDPR auditor may flag this. The `npa=1` flag indicates no-personalization mode, which is better than full tracking, but the requests still transmit data (page URL, timestamp, client ID) to Google servers before consent.
- **Verify:** Load the site with network monitoring, confirm no requests to google-analytics.com or googlesyndication.com fire before the user clicks "Accept."
- **Connects to:** Finding 2 (cookie consent interaction)

---

## Finding 12: llms.txt References Commented Out in robots.txt

- **Severity:** LOW
- **What:** The robots.txt file contains references to llms.txt and llms-full.txt, but they are commented out: `# llms.txt: https://supertrained.ai/llms.txt` and `# llms-full.txt: https://supertrained.ai/llms-full.txt`. However, the llms.txt file actually exists and is well-structured. There is no standard requiring robots.txt to reference llms.txt, but the commented-out lines suggest unfinished work or uncertainty.
- **Where:** https://supertrained.ai/robots.txt
- **Should:** Either uncomment the references (following the emerging llms.txt standard) or remove the comments entirely. The llms.txt file itself is excellent and should be discoverable.
- **Why:** AI agents checking robots.txt for llms.txt hints will see the comments but may not parse them as active references. The llms.txt content is comprehensive and would benefit from being explicitly referenced.
- **Verify:** Check robots.txt for uncommented llms.txt references, or confirm they're removed.
- **Connects to:** None

---

## Positive Observations (Not Findings)

These are things the site does well, noted for completeness:

1. **Skip link works correctly.** The "Skip to main content" link exists and targets a real `#main-content` element.
2. **All images have alt text.** Zero images with missing alt attributes across the pages tested.
3. **Excellent performance.** TTFB 16ms, DOMContentLoaded 34ms, full load 68ms. 59 resources total. Vercel edge network delivers fast.
4. **Comprehensive llms.txt.** Well-structured, includes services, pricing, products, blog posts, and all relevant URLs. Best-in-class for agent discoverability.
5. **Rich structured data (JSON-LD).** Homepage has ProfessionalService and WebSite schemas with founders, services, pricing range, social links, and contact info.
6. **Mobile responsive.** Hamburger menu works correctly, tap targets are appropriately sized, no text overflow observed.
7. **Cookie consent banner.** Present, functional, with Accept/Decline options and a link to cookie policy.
8. **robots.txt explicitly welcomes AI crawlers.** GPTBot, ClaudeBot, PerplexityBot, and others all have explicit Allow rules.
9. **Sitemap is comprehensive.** 30+ URLs with priorities, lastmod dates, and change frequencies.
10. **Zero console errors on homepage.** Clean JavaScript execution on the primary landing page.
11. **Good heading hierarchy on most pages.** Single H1 per page, logical H2/H3 nesting.
12. **Strong CTA architecture.** Multiple conversion paths (Book a Conversation, Automation Blueprint, Scope this sprint) with clear hierarchy.

---

## Summary Table

| # | Severity | Finding | Perspective |
|---|----------|---------|-------------|
| 1 | CRITICAL | Canonical URLs all point to homepage | SEO |
| 2 | HIGH | Calendly blocked when cookies declined | Human User |
| 3 | MEDIUM | React hydration error #418 on 3 pages | Performance |
| 4 | MEDIUM | Animated counters show "0" to screen readers/agents | Accessibility / Agent |
| 5 | MEDIUM | /services meta description describes old services | SEO |
| 6 | LOW | OG description identical across multiple pages | SEO / Social |
| 7 | LOW | /blueprint title has duplicate brand name | SEO |
| 8 | MEDIUM | Nav and footer inside `<main>` landmark | Accessibility |
| 9 | MEDIUM | No CSP or HSTS headers | Security |
| 10 | LOW | H3 product headings render as empty text | Accessibility / Agent |
| 11 | MEDIUM | Tracking fires before cookie consent | Privacy / Security |
| 12 | LOW | llms.txt references commented out in robots.txt | Agent Consumer |
