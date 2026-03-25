Fix these 12 issues found by external testing of supertrained.ai:

1. CRITICAL: Every page except /meo has <link rel="canonical"> pointing to https://supertrained.ai/ instead of its own URL. This tells Google all pages are duplicates of the homepage. Fix the canonical tag on /services, /blog, /about, /method, /contact, /blueprint, and /work to point to their own URLs.

2. HIGH: On /contact, the Calendly booking widget doesn't render if cookies are declined — just a blank grey box. The fallback text exists but is tiny and invisible. Either load Calendly without cookie consent (it's functional, not analytics) or show a clearly styled fallback with a direct Calendly link.

3. MEDIUM: React hydration error #418 fires on /blog, /work, and /blueprint (server/client HTML mismatch). Likely caused by date/time rendering or conditional content based on window/cookies. Fix the server/client disagreement.

4. MEDIUM: Homepage stat counters ("hrs/week", "$K+/yr", "%") start at 0 and animate up — but screen readers, AI agents, and search engines see "0". Set the initial DOM values to the final numbers (20, 50, 80 or whatever they are) and animate from there, or add aria-labels with real values.

5. MEDIUM: /services meta description still says "Workflow Automation, Custom AI Agents, Managed AI Operations" but the page now shows sprint-based services (Revenue Signal Sprint, Demand Capture Sprint, Reliability Sprint). Update meta description to match current content.

6. LOW: og:description on /services, /about, and /contact all use the same generic "Boutique AI automation agency" text. Give each page a unique OG description matching its content.

7. LOW: /blueprint page title is "Free AI Automation Blueprint | SuperTrained | SuperTrained" — brand name appears twice. Remove the duplicate.

8. MEDIUM: <nav> and <footer> are children of <main>. They should be siblings of <main>, not inside it. Move nav into a <header> element and footer out of main. Screen readers use landmarks to navigate and this structure breaks that.

9. MEDIUM: No Content-Security-Policy or Strict-Transport-Security response headers. Add CSP (at minimum default-src 'self' with allowances for your script sources) and HSTS (max-age=31536000; includeSubDomains).

10. LOW: H3 headings for "CloneICP" and "SnowThere" in the products section have empty text — product names are only in img alt text. Add visible text or aria-label to the H3 elements.

11. MEDIUM: Google Analytics and Google Ads requests fire before cookie consent action (even with npa=1 / Consent Mode). Under strict GDPR, no tracking requests should fire before consent. Defer all GA4/Google Ads scripts until after consent is granted.

12. LOW: robots.txt has llms.txt references commented out (# llms.txt: ...) but the llms.txt file exists and is excellent. Uncomment the references or remove the dead comments.
