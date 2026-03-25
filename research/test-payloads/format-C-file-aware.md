Fix these 12 issues found by external testing of supertrained.ai. File paths are from the products/supertrained-ai/ directory.

1. CRITICAL: Canonical URLs all point to homepage instead of their own URLs
   Files: Likely in app/layout.tsx or a shared metadata config — look for where <link rel="canonical"> is generated
   Fix: Each page's canonical must point to itself. /services → https://supertrained.ai/services, /blog → https://supertrained.ai/blog, etc. Only /meo currently has the correct canonical.
   Verify: On each page, document.querySelector('link[rel="canonical"]').href should match window.location.href

2. HIGH: Calendly widget on /contact doesn't render when cookies are declined
   Files: The /contact page component — look for Calendly embed or InlineWidget
   Fix: Either (a) classify Calendly as a functional cookie and load it regardless of consent, or (b) replace the invisible fallback text with a prominently styled card that says "Accept cookies to see calendar" with a direct link to the Calendly page as alternative
   Verify: Decline cookies, navigate to /contact → Calendly renders OR clear fallback with direct booking link is visible

3. MEDIUM: React hydration error #418 on /blog, /work, /blueprint
   Files: The page components for /blog, /work, /blueprint — look for anything that renders differently on server vs client (dates, window checks, randomized content)
   Fix: Ensure server and client render identical HTML. Common fix: wrap client-only content in useEffect or dynamic() with ssr: false
   Verify: Load /blog, /work, /blueprint with browser console open → zero React errors

4. MEDIUM: Homepage stat counters show "0" in DOM before animation
   Files: The stats/counter component on the homepage — look for animated number components
   Fix: Set initial DOM text content to the final values (e.g., "20 hrs/week" not "0 hrs/week"). Animate from the real value using CSS or JS animation that doesn't change the DOM text. Alternatively, add aria-label with the real values.
   Verify: Before any scroll or animation trigger, the DOM text for each stat shows the real number, not 0

5. MEDIUM: /services meta description references old service names
   Files: app/services/page.tsx or wherever /services metadata is defined
   Fix: Update meta description from "Workflow Automation, Custom AI Agents, Managed AI Operations" to reflect current sprint-based services (Revenue Signal Sprint, Demand Capture Sprint, Reliability Sprint)
   Verify: document.querySelector('meta[name="description"]').content on /services references sprint services

6. LOW: Identical og:description on /services, /about, /contact
   Files: Metadata config for each page
   Fix: Give each page a unique og:description matching its specific content
   Verify: og:description is different on each page

7. LOW: /blueprint title has duplicate "SuperTrained"
   Files: app/blueprint/page.tsx or wherever /blueprint metadata is defined
   Fix: Change title from "Free AI Automation Blueprint | SuperTrained | SuperTrained" to "Free AI Automation Blueprint | SuperTrained"
   Verify: document.title on /blueprint contains "SuperTrained" exactly once

8. MEDIUM: Nav and footer are children of <main>
   Files: app/layout.tsx — the root layout where nav, main content, and footer are structured
   Fix: Restructure so <header> (containing nav) and <footer> are siblings of <main>, not children. Layout should be: <body> → <header><nav>...</nav></header> → <main>{children}</main> → <footer>...</footer>
   Verify: document.querySelector('main').contains(document.querySelector('nav')) returns false

9. MEDIUM: No CSP or HSTS response headers
   Files: next.config.ts or vercel.json — where security headers are configured
   Fix: Add Content-Security-Policy and Strict-Transport-Security headers. For Next.js on Vercel, use the headers() function in next.config.ts or vercel.json headers config.
   Verify: curl -I https://supertrained.ai/ shows both content-security-policy and strict-transport-security headers

10. LOW: H3 product headings have empty text (names are img-only)
    Files: The products/case studies section component on the homepage
    Fix: Add aria-label="CloneICP" and aria-label="SnowThere" to the H3 elements, or add visually-hidden text alongside the images
    Verify: H3 elements have non-empty textContent or aria-label

11. MEDIUM: GA4 and Google Ads fire before cookie consent
    Files: Look for GA4/gtag initialization — likely in app/layout.tsx or a script component
    Fix: Wrap all GA4 and Google Ads script loading in a consent check. Only load/fire after user clicks "Accept". Google Consent Mode v2 cookieless pings should also be deferred under strict GDPR.
    Verify: Load site with network tab open → no requests to google-analytics.com or googlesyndication.com before clicking Accept

12. LOW: llms.txt references commented out in robots.txt
    Files: public/robots.txt
    Fix: Uncomment the llms.txt and llms-full.txt references, or remove the dead comments
    Verify: robots.txt contains uncommented references to llms.txt
