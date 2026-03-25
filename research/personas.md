# Alien Eyes — Simulated Buyer/User/Agent Personas

> 30 interview-grounded personas for gap discovery
> Methodology: Stanford generative agent approach (arXiv:2411.10109)
> Created: 2026-03-04

---

## PART 1: HUMAN PERSONAS

---

## Category A: Solo Builders (6)

---

### Persona 1: Marcus Chen, 26, Austin TX — First-Time Indie Hacker

**Role:** Solo founder shipping his first SaaS (a bookmark manager with AI tagging)

**Background narrative:**
Marcus quit his junior dev job at a mid-size consultancy seven months ago after his side project hit 200 waitlist signups from a single Hacker News comment. He'd been building evenings and weekends for a year, and the waitlist convinced him it was time. He's living off savings, estimating he has about five months of runway left. He learned to code through a bootcamp three years ago, then leveled up on the job. He's competent with React and Node but has never shipped a production product end-to-end by himself. He's doing everything: code, design, support, marketing, infra.

The thing that keeps Marcus up at night isn't code — it's all the things he doesn't know he's missing. He shipped his landing page and got feedback that the mobile experience was "janky," but he'd only ever tested on his MacBook. He knows there are accessibility requirements but isn't sure which ones apply to him or how to check. He suspects his API has security issues but doesn't know how to audit it. He's heard of OWASP but never actually run a scan. He's the classic "unknown unknowns" builder — skilled enough to ship, not experienced enough to know what he's shipping wrong.

Marcus found Alien Eyes through a tweet from someone in the indie hacker community. His first thought was "finally, something that tells me what I'm missing before my users do."

**Technical context:**
- Stack: Next.js, Supabase, Vercel, Tailwind
- Uses GitHub Copilot daily, occasionally Claude for debugging
- No CI/CD pipeline — pushes to main and Vercel auto-deploys
- No test suite of any kind. Has never written a unit test outside the bootcamp
- Comfortable with APIs but has never built one that other systems consume

**What he WANTS:**
- A comprehensive "am I ready to launch?" check
- Specific, actionable findings — not vague warnings
- To feel like a professional even though he's one person
- Confidence that he hasn't left an embarrassing hole in his product
- Something fast — he can't spend a day configuring a tool

**What he DOESN'T WANT (fears, dealbreakers, past bad experiences):**
- Does NOT want to feel stupid. He tried Lighthouse once and got a wall of red scores with jargon he didn't understand ("Cumulative Layout Shift exceeds threshold" — what threshold? Why does it matter?). He closed the tab and never went back.
- Does NOT want another tool that requires him to learn the tool before using it. He tried setting up Playwright for e2e tests and gave up after two hours of config.
- Does NOT want to be told everything is wrong. He knows his product isn't perfect. He needs prioritized findings — what will actually hurt him vs. what's nice-to-have.
- Fears being charged before he understands the value. He signed up for a monitoring service once that charged $49/mo and he couldn't figure out what it was actually doing for him. Cancelled after two months.
- Does NOT want a score that makes him feel like he failed. He's emotionally invested in this product. A "D+" score with no path forward would make him abandon the tool, not fix the issues.

**First encounter journey:**
Marcus clicks through from a tweet. He lands on the homepage, scans for "what is this" in under 5 seconds. He wants a free first scan — if there's no free tier or trial, he bounces immediately (his budget is $0-20/mo for tools). He pastes his URL. He expects results in under 2 minutes. If it takes longer than that with no progress indicator, he'll switch tabs and forget about it.

When results come back, he scrolls straight to the worst findings. If the first thing he sees is jargon or a score without context, he disengages. If it says "Your signup flow has a dead end on mobile — users who tap 'Get Started' on screens under 390px width see a blank page" — that's gold. He'll fix it immediately.

He'll share the report if it makes him look smart ("look, I found this with an audit tool") but not if it makes him look negligent ("look at all these things wrong with my app").

**Drop-off point:** During onboarding if he has to create an account before seeing any results, or if the first result is a wall of scores with no narrative.

**Gap revealed:** The emotional design of results matters as much as their accuracy. Marcus represents the builder who needs the output to feel like a helpful mentor, not a disappointed teacher. If Alien Eyes's default output tone is clinical or score-heavy, it will lose the largest buyer segment (solo builders who are emotionally attached to their product). Also exposes the need for a meaningful free tier — this audience won't pay before experiencing value.

---

### Persona 2: Diana Kowalski, 41, Portland OR — Seasoned Solo Developer

**Role:** Independent software consultant, 14 years experience, currently building her third micro-SaaS

**Background narrative:**
Diana has been writing software since she was a CS undergrad. She's worked at two startups (one acquired, one folded), spent four years at AWS on an internal tools team, then went independent eight years ago. She's built and sold two small SaaS products — one a Stripe analytics dashboard, one a webhook relay service. She now builds tools for developers and has a deep skepticism of anything that promises to "automatically" do quality work.

She's seen the full lifecycle of developer tools: the hype, the mediocre execution, the pivot, the acqui-hire, the shutdown. She used Codacy, then it got worse. She used Code Climate, then it got acquired and the free tier disappeared. She used Snyk, liked it, then they raised prices 3x. She evaluates tools on a 3-year horizon: will this still exist and still be good in 3 years?

Diana doesn't need Alien Eyes to find bugs — she writes thorough tests. What interests her is the external perspective: how does her product look to someone who isn't her? She's aware of her own blind spots (she under-invests in onboarding because she thinks her users are as technical as she is) and wants an outside eye. But she will not tolerate false positives, vague findings, or tools that waste her time.

**Technical context:**
- Stack: Go backend, htmx frontend, SQLite, deployed on Fly.io
- Full CI/CD with GitHub Actions, 87% test coverage
- Uses Claude Code for refactoring but writes all architecture herself
- Has contributed to open-source testing frameworks
- Runs her own Lighthouse CI, has custom monitoring

**What she WANTS:**
- The "fresh eyes" perspective she can't get as a solo builder
- Agent-nativeness evaluation — she's considering adding MCP support and wants to know how agent-ready her API already is
- Findings she couldn't get from existing tools (not another Lighthouse wrapper)
- Historical tracking — how her scores change over time
- API access so she can integrate into her existing CI

**What she DOESN'T WANT:**
- Does NOT want false positives. She once wasted four hours chasing a "critical security vulnerability" from a tool that flagged her use of eval() in a build script that never runs in production. She will immediately distrust any tool that produces findings that are technically wrong.
- Does NOT want a tool that doesn't understand context. Her htmx frontend is intentionally server-rendered with minimal JS — a tool that dings her for "low interactivity" or "no SPA detected" is revealing its own biases, not her product's flaws.
- Does NOT want vendor lock-in. If Alien Eyes stores her results and she can't export them, she won't start using it.
- Does NOT want AI slop in the output. If she sees "As an AI language model" or generic platitudes in the narrative reports, she's gone forever.
- Does NOT want to be upsold. She'll pay for value but despises the dark pattern of showing critical findings behind a paywall.

**First encounter journey:**
Diana finds Alien Eyes through a developer newsletter or Hacker News discussion. She goes straight to the docs or "How it works" page before trying anything. She wants to understand the methodology — what are you actually testing, how, and why should she trust it? If the methodology isn't documented, she assumes it's a wrapper around existing tools.

She'll run her first audit on a side project she doesn't care about, not her main product. She's testing the tool, not her software. She'll look for false positives first. If 2 out of 10 findings are wrong, she writes off the entire tool. If all 10 are valid, she's interested. If any of them surface something she genuinely didn't know, she's hooked.

She'll check the pricing page and calculate annual cost. She'll look for an API. She'll check if there's a GitHub repo or any open-source component. She'll search for the founders on Twitter/LinkedIn to assess credibility.

**Drop-off point:** If the methodology is opaque, if findings are generic, or if she discovers the tool is essentially wrapping Lighthouse + Axe + OWASP ZAP and charging a premium.

**Gap revealed:** Diana represents the "expert evaluator" — she's not evaluating her product, she's evaluating Alien Eyes. Her scrutiny exposes whether Alien Eyes produces genuinely novel findings or just repackages existing tools. Also reveals the need for transparent methodology documentation, data export, and the importance of the agent-nativeness scoring as a differentiator (this is genuinely new — nothing else does it).

---

### Persona 3: Raymond Okafor, 52, Chicago IL — Non-Technical Founder

**Role:** Founder of a B2B procurement platform, hired a dev agency to build it

**Background narrative:**
Raymond spent 25 years in corporate procurement at three Fortune 500 companies. He saw the same inefficiencies everywhere and finally took the leap to build a platform to fix them. He has deep domain expertise but can't read code. He hired a well-reviewed agency in Eastern Europe to build the platform, and they delivered something that looks polished. But Raymond has a nagging feeling he can't verify: is this actually good?

The agency tells him everything is on track. The demos look great. But Raymond remembers a colleague who hired a dev shop and ended up with a product that looked beautiful but fell apart under real traffic — the database wasn't indexed, the authentication was insecure, the mobile experience was broken. Raymond doesn't know what "indexed" means, but he knows he needs someone — or something — independent to tell him the truth.

He's spent $180K with this agency. He cannot afford to discover problems after his enterprise pilot begins in two months. He's looking for what he'd call "an independent inspection" — the software equivalent of a home inspector before you close on a house.

**Technical context:**
- Platform: React frontend, Node.js backend, PostgreSQL, hosted on AWS (agency manages infra)
- Raymond uses the product as an end user; he cannot access the codebase
- He communicates requirements in business terms, not technical terms
- His only quality signal is "does it do what I asked for when I click through it"

**What he WANTS:**
- An independent, credible assessment he can show to investors and enterprise pilot partners
- Plain English findings — "your checkout process fails on Safari" not "WebKit flex rendering issue"
- A score or certification he can reference in sales conversations
- To know if his $180K was well-spent before he spends another $180K
- Ammunition to push back on the agency if things are actually broken

**What he DOESN'T WANT:**
- Does NOT want to need technical knowledge to interpret results. He tried Google PageSpeed Insights once — got a "34" score and a list of acronyms. He showed it to his agency and they said "those metrics don't matter for your use case." He had no way to evaluate that claim.
- Does NOT want a tool that only developers can use. If he has to touch a command line, he's out.
- Does NOT want a 47-page technical report. He needs an executive summary with business impact: "These 3 issues will cause problems for your enterprise pilot. These 12 issues should be fixed before public launch. These 8 are nice-to-haves."
- Fears being manipulated by both sides — the agency saying "everything's fine" and a testing tool saying "everything's broken" — and having no way to know who's right.
- Does NOT want to be sold a subscription when he needs a one-time inspection.

**First encounter journey:**
Raymond finds Alien Eyes through a Google search for "website quality audit" or "independent software assessment." He's not in developer communities. The homepage needs to speak to him within 3 seconds or he's gone. He's looking for words like "independent," "audit," "report," "assessment" — not "CI/CD integration" or "MCP endpoint."

He wants to paste a URL and get a report. He'd pay $200-500 for a thorough one-time audit if it looks credible. He needs the report to be something he can email to his board or attach to an investor deck. PDF export is non-negotiable for him.

He'll judge the tool by its own website. If Alien Eyes's own site looks amateur, he won't trust it to evaluate professional software.

**Drop-off point:** At the homepage if the messaging is developer-centric, or at the results page if findings are technical without business context.

**Gap revealed:** Raymond exposes the need for a non-technical audience path. If Alien Eyes's only language is developer jargon, it misses the "evaluator" persona entirely — and this persona has the highest willingness to pay per-audit. Also reveals the need for PDF export, executive summaries, and the product's own website as a trust signal. He also surfaces the "certification" opportunity — a badge or report that carries weight with third parties.

---

### Persona 4: Yuki Tanaka, 33, Brooklyn NY — Designer-Turned-Developer

**Role:** Product designer who learned to code, now building a design system marketplace

**Background narrative:**
Yuki spent eight years as a product designer at agencies and startups, leading design systems at her last company. She learned to code three years ago — first HTML/CSS, then React, then enough backend to be dangerous. She codes by visual intuition: she builds the UI first, then figures out the data layer. Her code works but it's not architecturally elegant, and she knows it.

She's building a marketplace where designers can sell component libraries and design tokens. The frontend is beautiful — she spent weeks on micro-interactions and responsive layouts. The backend is held together with duct tape and hope. She has a Supabase database with tables she's not sure are structured correctly, and auth flows she copied from a tutorial without fully understanding them.

Yuki's relationship with testing is visual: she tests by looking at things. She resizes the browser window. She clicks through flows. She checks on her phone. But she knows there are entire categories of quality she can't see — performance, security, accessibility (ironic, since she cares deeply about inclusive design but doesn't know how to verify it technically), and certainly agent-readiness.

**Technical context:**
- Stack: Next.js, Supabase, Vercel, heavy use of Framer Motion
- Designs in Figma, codes in Cursor with Claude
- No backend experience beyond Supabase tutorials
- Good CSS/HTML knowledge, strong understanding of responsive design
- No tests, no CI, manually deploys via Vercel git integration

**What she WANTS:**
- Visual reports — screenshots, annotated comparisons, before/after
- Accessibility validation that goes beyond automated checkers (she's tried axe-core and found it misses real-world usability issues)
- To understand how her product "feels" to someone who isn't a designer
- Performance insights specifically about her animations and interactive elements
- Help understanding if her Supabase setup has security issues she can't see

**What she DOESN'T WANT:**
- Does NOT want text-only reports. She processes information visually. A JSON blob of findings is as useful to her as a spreadsheet of hex codes would be to a backend developer.
- Does NOT want to be told her design choices are wrong by an algorithm. She had a bad experience with a Lighthouse audit that flagged her custom fonts as "render-blocking" — they're render-blocking on purpose because the typography IS the brand. A tool that can't distinguish between intentional design decisions and mistakes will frustrate her.
- Does NOT want backend jargon. "N+1 query" means nothing to her. "Your page loads slowly because each product card triggers a separate database call — loading 50 cards means 50 calls instead of 1" means everything.
- Fears the tool will judge her code quality rather than her product quality. She knows her code isn't clean. She doesn't need to be told that.
- Does NOT want to set up infrastructure to use the tool. Docker, CLI flags, YAML configs — she'll use a web interface or nothing.

**First encounter journey:**
Yuki finds Alien Eyes through a design community (Threads, a Figma community post, or a newsletter like Dense Discovery). She's drawn in by the visual presentation of the tool itself — if the marketing site is well-designed, she trusts it implicitly. If it looks like a developer tool from 2019, she's gone.

She pastes her URL and wants to see visual results: screenshots of issues, annotated flows, maybe even a video walkthrough of a simulated user journey. When she gets text-heavy results, she scans for screenshots first. She'll fix visual issues immediately but will need help understanding and prioritizing non-visual findings.

She'll share results on social media if the report has a shareable, well-designed format.

**Drop-off point:** If the results are entirely text-based with no visual component, or if the tool treats design decisions as defects.

**Gap revealed:** Yuki exposes the need for visual output formats — annotated screenshots, flow diagrams, side-by-side comparisons. She also reveals that Alien Eyes needs to distinguish between intentional choices and actual defects (the "intent inference" system must be sophisticated enough to recognize that a slow-loading custom font might be deliberate). Her visual-first processing style suggests the dashboard needs strong information design, not just data display.

---

### Persona 5: Jaylen Brooks, 19, Miami FL — Vibe Coder

**Role:** Building a social app for gym-goers with AI workout recommendations, ships entirely with AI tools

**Background narrative:**
Jaylen started "coding" eight months ago. He uses the term loosely — he describes what he wants to Claude Code or Cursor, reviews the output, adjusts his prompts, and ships. He's never manually written a for-loop. He doesn't know what a for-loop is, and he doesn't think he needs to. His app has 340 users and is growing through TikTok videos where he shows himself building features in real-time with AI.

He's representative of a genuinely new category of builder: technically illiterate by traditional standards, but capable of shipping functional products through AI-assisted development. His app has a React Native frontend, a Supabase backend, and Stripe integration — all generated by AI, all working. But he has no mental model for what's happening under the hood. When something breaks, he pastes the error into Claude and follows instructions until it works.

Jaylen has never written a test, never run a linter, never thought about accessibility, never heard of OWASP. He doesn't know what an API is in the formal sense — he knows his app "talks to Supabase" and that's enough. He ships daily, sometimes multiple times. His users report bugs via DM on TikTok.

**Technical context:**
- Stack: React Native (Expo), Supabase, generated entirely through Cursor + Claude Code
- No understanding of the underlying code architecture
- No version control discipline (commits are "fixed stuff" or "new feature")
- No CI/CD, no testing, no monitoring
- Troubleshoots by pasting errors into AI and following instructions

**What he WANTS:**
- To know if his app is "good" without having to understand what "good" means technically
- Something that works like a "health check" — green means good, red means bad
- Quick results — his attention span for tools is under 60 seconds
- To keep shipping fast without slowing down for quality processes
- Something he can show on TikTok ("I ran my app through this AI auditor and it found 47 issues")

**What he DOESN'T WANT:**
- Does NOT want to learn anything. He's not here for education. He wants the tool to find problems and ideally fix them or tell his AI tools exactly how to fix them.
- Does NOT want a dashboard he has to check regularly. He'll use it once, maybe twice. If it requires ongoing engagement, he'll forget it exists.
- Does NOT want to understand the scoring methodology. "73% satisfaction score" means nothing to him. "Your app works well but 3 things will make users delete it" means everything.
- Does NOT want to pay. He's spending $0 on tooling. His entire development cost is his Cursor subscription. If there's no free tier that gives him a viral-worthy result, he's not interested.
- Fears looking dumb. He's already defensive about not being a "real programmer." A tool that presumes traditional dev knowledge will make him feel excluded.

**First encounter journey:**
Jaylen sees Alien Eyes in a TikTok or YouTube Short, or someone in a Discord shares a screenshot of their results. He clicks through, and if the page takes more than 3 seconds to convey what this does, he's gone. He wants to paste a URL or connect his app somehow and get instant gratification.

The critical design challenge: his app is React Native, not a website. Can Alien Eyes handle mobile apps? If it's web-only, Jaylen can't use it at all. He might try pasting his Supabase project URL or his Expo preview link.

If he gets results, he screencaps them for content. He needs the results to be visually striking and shareable. He'll never read a detailed report. He needs the TL;DR.

**Drop-off point:** Immediately if there's no mobile app support. At the results page if they look like a developer dashboard instead of a consumer report card. If there's no free tier.

**Gap revealed:** Jaylen exposes multiple critical gaps. First, the mobile app / React Native blind spot — is Alien Eyes web-only? Second, the vibe coder audience needs the output to be feed-worthy (shareable visual results). Third, the agent-to-agent loop is literally his workflow: Alien Eyes finds issues, Claude Code fixes them. If Alien Eyes's output format isn't optimized for "paste this into Claude Code and say fix these," it's missing the fastest-growing builder segment. Fourth, he reveals the virality mechanism: if results are visually compelling, builders will share them as content.

---

### Persona 6: Priya Venkatesh, 38, Denver CO — Bootstrapped Micro-SaaS Founder

**Role:** Runs a profitable invoice management tool for freelancers, solo, $22K MRR

**Background narrative:**
Priya has been running InvoiceOwl for five years. She built it as a side project while working as a senior engineer at Shopify, and it grew enough that she quit three years ago. She's the sole developer, support person, and marketer. The product is stable, profitable, and boring in the best way — it sends invoices, tracks payments, and integrates with QuickBooks. She has 1,800 paying customers.

Priya's relationship with tooling is purely ROI-driven. Every hour she spends on a tool is an hour she's not shipping features or answering support tickets. She's tried dozens of tools over five years and has a graveyard of abandoned subscriptions. The ones that survived are the ones that saved her more time than they cost. She uses Sentry for error tracking, Plausible for analytics, and Postmark for email. That's it.

She's interested in Alien Eyes specifically because she's started getting enterprise inquiries and they're asking for SOC 2 and security audits. She can't afford a real SOC 2 audit ($20-50K), but she needs something credible to show enterprise prospects that her product isn't a security liability.

**Technical context:**
- Stack: Rails 7, PostgreSQL, hosted on Render
- Solid test suite (Rails convention), 72% coverage
- CI with GitHub Actions, deploys through Render git push
- Sensible security practices but nothing formally audited
- Has never done accessibility testing or performance optimization beyond "it's fast enough"

**What she WANTS:**
- A credible security and compliance report she can share with enterprise prospects
- Time-efficient: maximum 30 minutes of her attention per audit, including interpreting results
- Findings that map to business impact — "this could lose you the Acme Corp deal" not "this header is missing"
- Historical tracking so she can show improvement over time to prospects
- To check off compliance checkboxes without hiring a consultant

**What she DOESN'T WANT:**
- Does NOT want to be told to rewrite anything. Her codebase works. It makes money. She's not refactoring for a score.
- Does NOT want recurring costs that don't directly generate revenue. She'll pay per-audit when she has an enterprise prospect to impress. She will not pay $99/mo "just in case."
- Does NOT want the tool to access her codebase. She'll give it a URL, not repo access. She's seen too many tools that want GitHub integration and then index your private code.
- Does NOT want the audit to break anything. She once ran a "security scanner" that hammered her API with requests and triggered her rate limiter, locking out real users for 20 minutes.
- Fears the tool will surface issues that are technically real but practically irrelevant, creating a false sense of urgency that wastes her time.

**First encounter journey:**
Priya finds Alien Eyes through a Ruby/Rails community or an indie hackers forum thread about enterprise readiness. She goes straight to pricing. If there's no per-audit option, she closes the tab. She calculates: "If this helps me close one enterprise deal, it's paid for itself 100x."

She runs a scan and immediately looks for security findings. She wants to see the results organized by business risk, not by technical category. She'll skim the full report but only act on things that would make an enterprise buyer hesitate.

She needs the report to be exportable as a PDF she can attach to a sales proposal. Bonus if it has a branded look that makes it seem like she hired an auditor.

**Drop-off point:** At pricing if it's subscription-only. During the scan if it's slow or requires access beyond a URL. At results if they're not organized by business impact.

**Gap revealed:** Priya exposes the "enterprise readiness" use case — builders who need Alien Eyes not to improve their product, but to prove their product to third parties. This has major implications for output format (needs to look professional and credible to non-technical enterprise buyers), pricing (per-audit aligns with her purchase trigger), and the "safe scanning" requirement (the audit must be read-only and gentle, never hammering the target). Also reveals that the report itself is a sales asset — the design and branding of the output carry commercial weight.

---

## Category B: Agency/Consultant Users (4)

---

### Persona 7: Tomoko Sato, 36, San Francisco CA — Growth Marketing Consultant

**Role:** Independent growth consultant serving B2B SaaS startups, specializes in technical SEO and conversion optimization

**Background narrative:**
Tomoko spent six years at growth agencies before going independent. She now serves five to eight clients at a time, mostly Series A/B SaaS companies. Her work sits at the intersection of marketing and engineering — she audits technical SEO, reviews conversion funnels, evaluates page speed, and sometimes gets into the code to fix things herself. She's not a developer, but she can read HTML, understands DNS, and can navigate a CMS.

Her biggest professional frustration is that she spends 40% of her billable time on manual audits that are repetitive. Every new client engagement starts the same way: run Screaming Frog, run Lighthouse, check Core Web Vitals, review structured data, test forms, check analytics setup, review meta tags. She's built Google Sheets templates to standardize this, but it's still hours of manual work per client.

She's recently been getting questions from clients about AI search — "How do we show up in ChatGPT?" "Are we optimized for Perplexity?" She doesn't have good answers because there are no good tools for this yet. She's cobbling together manual checks and it's unsatisfying.

**Technical context:**
- Uses: Screaming Frog, Ahrefs, Google Search Console, Lighthouse, GTmetrix, various Chrome extensions
- Can read HTML/CSS, basic JavaScript comprehension
- Comfortable with APIs, uses Zapier and Make.com for automation
- Starting to use Claude for audit report writing
- No coding ability beyond simple scripts

**What she WANTS:**
- A single tool that replaces her 6-tool audit workflow
- White-label reports she can brand as her own and deliver to clients
- AEO/GEO/MEO analysis — this would be a genuine differentiator for her practice
- Bulk auditing — run the same audit across 8 client sites
- Findings organized by marketing impact, not technical category

**What she DOESN'T WANT:**
- Does NOT want a tool that makes her look replaceable to her clients. If a client can just run Alien Eyes themselves, why pay Tomoko $200/hr? She needs the tool to augment her expertise, not commoditize it.
- Does NOT want to learn a new tool with a steep learning curve. She's at capacity. If onboarding takes more than 15 minutes, she'll bookmark it and never come back.
- Does NOT want raw data. She needs interpretive outputs — "This matters because..." not just "Score: 47."
- Does NOT want her clients to see the tool's branding prominently in reports. She's selling her expertise, not reselling a tool.
- Fears the tool will produce contradictory findings to tools her clients already use (Ahrefs, Lighthouse), creating confusion and undermining her credibility.

**First encounter journey:**
Tomoko finds Alien Eyes through a marketing Slack community or an SEO newsletter. She's immediately interested in the AEO/GEO/MEO angle because nobody else is doing it. She wants to see a sample report before creating an account. She evaluates the report format more than the findings — can she put her logo on this? Does it look professional enough to send to a VP of Marketing?

She'd trial it on her own website first, then on her easiest client. If the first client report saves her 3+ hours compared to her manual process, she's in.

**Drop-off point:** If there's no white-label option, if reports look too "tool-ish" (dashboards, not documents), or if the AEO/GEO/MEO analysis turns out to be superficial.

**Gap revealed:** Tomoko exposes the consultant/reseller channel. She'll pay more than a solo builder ($100-300/audit) but needs white-labeling, bulk operations, and reports formatted as client deliverables. Also reveals that AEO/GEO/MEO is the marketing hook — this is the feature no competitor has, and it's what will get Alien Eyes shared in marketing communities. The "replaceability fear" is critical: the tool must position as "augments expert" not "replaces expert."

---

### Persona 8: Craig Morrison, 44, Toronto ON — Dev Agency Project Manager

**Role:** PM at a 15-person web development agency, manages 6-8 concurrent client projects

**Background narrative:**
Craig has been a PM at digital agencies for 12 years, the last five at his current shop which builds marketing websites and web applications for mid-market companies. His job is to deliver projects on time, on budget, and without post-launch disasters. He's not a developer — he was a business major — but he's developed a keen eye for quality through years of client complaints.

His agency's quality process is: developers test their own work, then Craig clicks through the site on three browsers before the client sees it. That's it. They don't have a QA person. They've talked about hiring one for years but the margins don't support it. The result: about one in four launches has a significant issue discovered by the client within the first week. Missing mobile breakpoints, broken contact forms, slow-loading hero images, misconfigured analytics. Each incident costs the agency 5-10 hours of unplanned rework and damages the client relationship.

Craig wants a quality gate that catches these issues before the client does. He's tried asking developers to use Lighthouse, but they just fix enough to get the score to "green" and move on — the underlying issues remain.

**Technical context:**
- Agency stack: WordPress (60%), Next.js (30%), Shopify (10%)
- Craig doesn't code; he reviews deliverables visually and against requirements
- Uses Asana for project management, Figma for design review
- Has budget authority for tools under $500/mo

**What he WANTS:**
- A pre-launch checklist on steroids — catches everything a QA person would catch
- Results non-developers can understand (he shares them with clients)
- Consistency — the same rigor applied to every project regardless of which developer built it
- A way to hold developers accountable with data ("the audit found these issues in your work")
- Fast enough to run the day before launch without delaying the project

**What he DOESN'T WANT:**
- Does NOT want another tool developers will resist or ignore. His team already complains about process overhead. If Alien Eyes adds friction to their workflow, they'll push back and Craig will lose the political fight.
- Does NOT want false alarms that cry wolf. If he flags issues based on the audit and developers prove them wrong, he loses credibility with his own team.
- Does NOT want a tool that requires technical setup per project. Each project is different (WordPress, Next.js, Shopify) — the tool needs to handle any stack without configuration.
- Does NOT want a tool that makes the agency look bad to clients. He needs to control what clients see.
- Fears being blamed when the tool misses something: "We paid for this audit tool and it didn't catch X?"

**First encounter journey:**
Craig finds Alien Eyes through a project management or agency-focused community. He evaluates it as a business purchase: cost per project, time saved per project, reduction in post-launch incidents. He runs it on a project currently in QA and compares findings to issues he's already found manually. If it catches things he missed, he's sold. If it misses things he found by hand, he's skeptical.

He needs team pricing — per-seat doesn't work (his developers would use it rarely), per-project does.

**Drop-off point:** If pricing is per-seat/monthly rather than per-project/per-audit, or if setup requires developer involvement per project.

**Gap revealed:** Craig exposes the agency buying pattern: per-project pricing, team access without per-seat costs, stack-agnostic operation, and the political dynamics of introducing a quality tool to a team that sees it as surveillance. Also reveals the "accountability" use case — using audit results to manage developer quality, which requires findings to be defensible and accurate enough to cite in performance conversations.

---

### Persona 9: Amara Obi, 39, London UK — Freelance Accessibility Consultant

**Role:** Independent accessibility auditor, certified IAAP WAS, serves public sector and enterprise clients

**Background narrative:**
Amara has been doing accessibility work for 11 years. She started as a frontend developer, transitioned to accessibility after her brother lost his sight in an accident and she experienced firsthand how broken the web is for disabled users. She now runs a solo consultancy doing WCAG audits, remediation guidance, and accessibility training. She charges $150-250/hr and is booked 3 months out.

She uses a combination of automated tools (axe, WAVE, Lighthouse accessibility) and manual testing (screen readers, keyboard-only navigation, zoom testing, cognitive walkthroughs). She knows that automated tools catch only about 30% of accessibility issues — the rest require human judgment. She's deeply skeptical of any tool that claims to "automate accessibility testing" because she's built her career on the fact that it can't be fully automated.

She's interested in Alien Eyes for one specific reason: the simulated user testing with diverse personas. If the Stanford approach can simulate users with different abilities navigating a site, that could complement her manual testing and help her scale. But she'll be evaluating this with expert eyes.

**Technical context:**
- Expert in WCAG 2.1/2.2 AA and AAA standards
- Uses: axe DevTools, WAVE, NVDA, VoiceOver, JAWS, Colour Contrast Analyser
- Can read and write HTML/CSS/JS, understands ARIA deeply
- Tests across assistive technologies manually
- Writes detailed remediation guides with code examples

**What she WANTS:**
- Simulated user journeys from diverse disability perspectives (screen reader, keyboard-only, low vision, cognitive)
- Findings that go beyond automated checkers — contextual accessibility issues
- Something she can use to scale her practice by automating the 30% that CAN be automated, freeing her for the 70% that can't
- Evidence she can include in her audit reports (screenshots with screen reader output, keyboard focus flow diagrams)
- A tool that understands the difference between WCAG conformance and actual usability for disabled users

**What she DOESN'T WANT:**
- Does NOT want a tool that claims to replace manual accessibility testing. She'll stop recommending it immediately if it implies that.
- Does NOT want WCAG checkbox compliance that misses real usability. She's seen sites that pass automated audits but are unusable with a screen reader because of logical reading order issues, unlabeled decorative images, or custom widgets without proper ARIA.
- Does NOT want findings that are technically correct but practically irrelevant (e.g., flagging "missing alt text" on a decorative SVG that should have alt="" anyway).
- Does NOT want the tool to produce an "accessibility score" as a percentage. This is a pet peeve — accessibility isn't a percentage, it's a spectrum of usability for different disability types.
- Fears that tools like this will convince companies they don't need human accessibility auditors, reducing demand for her services while producing inferior outcomes for disabled users.

**First encounter journey:**
Amara finds Alien Eyes through the accessibility community (a11y Slack, WebAIM mailing list, or a conference talk). She approaches it with professional skepticism. She'll run it on a site she's already audited manually and compare findings. She's specifically looking for: (1) false positives that show the tool doesn't understand context, (2) false negatives that show it misses real issues, (3) any novel findings that her manual audit missed.

If the simulated user testing produces a scenario like "A screen reader user attempting to complete the checkout flow lost focus after dismissing the cookie banner and could not find the cart summary" — and that's a real issue she can verify — she's deeply interested.

**Drop-off point:** If the accessibility analysis is just axe-core wrapped in a UI, or if the tool produces an "85% accessible" score, or if marketing copy suggests it replaces human auditors.

**Gap revealed:** Amara exposes the expert-as-evaluator problem: the most qualified person to assess Alien Eyes's accessibility findings is also the person most likely to find them insufficient. Her expertise reveals whether the simulated persona system can actually produce meaningful accessibility insights beyond automated checkers. She also surfaces the positioning risk: if Alien Eyes's marketing suggests it replaces human auditors, it will face backlash from the accessibility community — the very people who should be its advocates. The correct positioning is "amplifies human auditors."

---

### Persona 10: Viktor Petrov, 47, Berlin DE — Security Auditor

**Role:** Independent penetration tester and security consultant, serves SMBs across Europe

**Background narrative:**
Viktor has been in information security for 20 years, starting in network security at a telco, then moving to application security at a consultancy, and going independent eight years ago. He does penetration testing, security architecture reviews, and incident response for companies that can't afford a Big Four audit but need more than an automated scan.

He's deeply familiar with OWASP, NIST, and ISO 27001. He uses Burp Suite, Nmap, Metasploit, and a collection of custom scripts. He views automated security scanners with professional contempt — they produce enormous reports full of false positives and miss the subtle vulnerabilities that actually get exploited. He's seen clients waste thousands of hours chasing "critical" findings from scanners that turned out to be theoretical risks in configurations that don't exist in their environment.

Viktor is interested in Alien Eyes only if it does something his existing tools don't. He doesn't need another vulnerability scanner. What intrigues him is the "product testing from the outside" angle — testing whether the product behaves correctly under adversarial conditions, not just whether known CVEs are present.

**Technical context:**
- Expert in OWASP Top 10, NIST frameworks, penetration testing methodologies
- Uses Burp Suite Pro, Nmap, OWASP ZAP, custom Python scripts
- Can exploit vulnerabilities, not just find them
- Understands the difference between theoretical and practical risk

**What he WANTS:**
- Behavioral security testing: does the application handle adversarial inputs correctly?
- Business logic testing: can an agent abuse the product's own features?
- A complement to his manual pen testing, not a replacement
- Findings that include proof-of-concept, not just "vulnerability exists"
- A way to quickly assess a target before investing time in a full manual engagement

**What he DOESN'T WANT:**
- Does NOT want another CVE scanner. He has those. They're commodity tools and he doesn't trust their output.
- Does NOT want false positives. In his field, a false positive wastes his client's money and damages his reputation.
- Does NOT want the tool to perform active exploitation without explicit authorization. Running Alien Eyes against a client's site must never trigger their WAF, IDS, or rate limiters without the client knowing.
- Does NOT want the tool to store sensitive findings on third-party infrastructure. His clients have strict data handling requirements.
- Fears liability: if Alien Eyes performs aggressive testing against a target, who's responsible? He needs clear terms about what the tool does and doesn't do to a target.

**First encounter journey:**
Viktor finds Alien Eyes through a security conference or InfoSec community. He goes straight to documentation about testing methodology — what exactly does it do to the target? He needs to know: does it send requests? How many? What kind? Does it attempt injection? Does it store anything? He's evaluating legal liability, not just technical capability.

He runs it against a test environment he controls and monitors network traffic to see exactly what Alien Eyes does. If it sends anything unexpected, he's done.

**Drop-off point:** If testing methodology isn't documented, if there's no way to control the aggressiveness of the scan, or if findings are stored without his control.

**Gap revealed:** Viktor exposes the legal and safety dimensions of external testing. Alien Eyes is crawling and testing sites — what constitutes authorized testing? What if a user runs it against a site they don't own? What are the liability implications? He also reveals the need for scan intensity controls (gentle/normal/thorough), transparent documentation of what requests are sent, on-premise or ephemeral data options, and the "reconnaissance" use case (quick pre-engagement assessment). The behavioral/business logic testing angle is his differentiator interest — this is what existing tools don't do.

---

## Category C: Enterprise/Team Users (4)

---

### Persona 11: Sandra Liu, 45, Seattle WA — VP of Engineering

**Role:** VP of Engineering at a 200-person B2B SaaS company, manages 8 engineering teams

**Background narrative:**
Sandra has been in engineering leadership for 12 years, the last three at her current company which sells workflow automation software to mid-market companies. She manages 60 engineers across 8 teams and is responsible for quality, velocity, and platform reliability. Her organization ships weekly and has a mature CI/CD pipeline with unit tests, integration tests, and staging environments.

What keeps Sandra up at night is the gap between "tests pass" and "product is good." Her teams have 80%+ code coverage, but customers still report UX issues, accessibility complaints, and performance regressions. The tests verify that code works correctly; they don't verify that the product works well. She's been trying to close this gap with manual QA, but her two QA engineers are overwhelmed and the feedback loop is too slow.

She's also under pressure from the board to pursue SOC 2 Type II certification and improve the company's accessibility posture after a competitor was hit with an ADA lawsuit. She needs tools that help her demonstrate compliance at scale, not just on a project-by-project basis.

**Technical context:**
- Platform: React frontend, Python/Django backend, PostgreSQL, AWS
- Mature CI/CD: GitHub Actions, staged deployments, feature flags
- Two QA engineers, extensive unit/integration tests, limited e2e
- Uses Datadog for monitoring, PagerDuty for alerts, Sentry for errors

**What she WANTS:**
- CI/CD integration: automated quality gates that block deploys if scores drop
- Historical trending: quality scores over time across all products
- Team-level dashboards: which team's output is improving/degrading?
- Compliance reporting: accessibility and security evidence for SOC 2 audits
- A way to justify engineering investment to the board with data

**What she DOESN'T WANT:**
- Does NOT want a tool that slows down deploys. Her teams ship weekly and any tool that adds more than 10 minutes to the pipeline will face revolt.
- Does NOT want to manage another vendor relationship. She has 30+ tools in her stack. If Alien Eyes requires significant procurement, legal review, and vendor management, the overhead needs to be worth it.
- Does NOT want per-seat pricing that scales linearly with her 60-person team. She'll pay for value delivered, not for butts in seats.
- Does NOT want a tool that creates busywork. If it generates 200 findings per sprint that teams have to triage, it's a net negative.
- Fears organizational change management. Her teams are already stretched. Introducing a new quality tool means meetings, training, process changes. The ROI has to be obvious enough that she can sell it internally.

**First encounter journey:**
Sandra finds Alien Eyes through a CTO/VP of Engineering community, a conference talk, or a direct recommendation from a peer. She doesn't try tools herself — she asks a senior engineer to evaluate it. Her evaluation criteria: (1) can it integrate into our existing CI? (2) what's the time impact per deploy? (3) does it produce actionable findings or just noise? (4) is the pricing predictable at our scale?

She needs a business case. She'll want a pilot period (2-4 weeks) across one team, with data on findings caught, time saved, and incidents prevented. If the pilot team says "this caught two issues that would have been P1 bugs in production," she'll roll it out company-wide.

**Drop-off point:** During procurement if there's no enterprise pricing model, during the pilot if findings are noisy (high false-positive rate), or if CI integration requires significant engineering time.

**Gap revealed:** Sandra exposes the enterprise adoption pattern: evaluation by proxy (she doesn't use it herself), pilot-based purchasing, CI/CD integration as table stakes, and the need for organizational-level dashboards (not just project-level). She also reveals the "noise vs. signal" problem at scale — what's acceptable finding volume for a solo builder (10 findings) is overwhelming for 8 teams shipping weekly (80 findings per sprint). Alien Eyes needs finding aggregation, deduplication, and smart prioritization for enterprise. Also surfaces the compliance-evidence use case: audit outputs that directly map to SOC 2 / WCAG compliance frameworks.

---

### Persona 12: Ravi Subramanian, 34, Austin TX — QA Lead

**Role:** QA Lead at a fintech startup, 3-person QA team covering 4 product teams

**Background narrative:**
Ravi started as a manual tester, learned automation, and now leads the QA function at a 50-person fintech startup. His team of three is responsible for quality across four product teams building a lending platform. They're drowning. The product teams ship faster than QA can test, and Ravi spends most of his time triaging what NOT to test rather than actually testing.

He's automated the critical paths with Playwright, but there are entire product areas — the partner portal, the admin dashboard, the document upload flow — that only get manual smoke testing when someone has time. He estimates they catch about 60% of production bugs before release. The other 40% are found by users or, worse, by compliance auditors.

Ravi is interested in Alien Eyes specifically because it tests from the outside — it doesn't need access to the codebase or the test environment. If it can crawl the staging URL and find issues his team missed, it's immediately valuable. He sees it as a force multiplier for his understaffed team.

**Technical context:**
- Uses: Playwright, Jest, Postman, BrowserStack, TestRail
- Expert in test automation, test strategy, and risk-based testing
- Understands coverage gaps and their business consequences
- Manages staging environments for testing

**What he WANTS:**
- A "catch everything we missed" layer that runs after his team's testing
- Integration with Jira — findings that automatically create tickets
- Prioritization by business risk, not severity labels (a "medium" CSS issue on the loan application form is more critical than a "high" performance issue on the about page)
- Regression detection — "this was working last sprint and now it's broken"
- To prove to management that QA is underfunded by showing how many issues Alien Eyes catches that his team didn't have time to test

**What he DOESN'T WANT:**
- Does NOT want a tool that duplicates findings his existing tests already cover. If his Playwright suite tests the login flow and Alien Eyes also tests the login flow, the overlap is wasted money.
- Does NOT want findings that are not reproducible. He needs exact reproduction steps — browser, viewport, user state, sequence of actions.
- Does NOT want the tool to require QA team time to configure or maintain. He's already at capacity. It needs to work with just a URL and optional auth credentials.
- Does NOT want management to see Alien Eyes as a replacement for his team. He needs to position it as "this is what we'd catch if you gave me 3 more headcount."
- Fears the tool will become another thing he's responsible for managing but that doesn't actually reduce his workload.

**First encounter journey:**
Ravi finds Alien Eyes through a QA-focused community (Ministry of Testing, Test Automation University, QA subreddit). He immediately wants to run it against his staging environment and compare findings to his known bug list. If it finds bugs he already knows about, it's validated. If it finds bugs he didn't know about, it's valuable. If it misses bugs he's already found, he calibrates his expectations.

He'll want to give it authenticated access to test behind-login flows. He'll want to configure which areas to test and which to skip (no point testing the area his Playwright suite already covers thoroughly).

**Drop-off point:** If it can't handle authenticated testing, if findings aren't detailed enough to reproduce, or if it can't be scoped to avoid duplicating existing test coverage.

**Gap revealed:** Ravi exposes the "complementary testing" use case — Alien Eyes as a layer that catches what existing QA missed, not a replacement for QA. This requires: authenticated testing support, the ability to scope/exclude areas, Jira integration, and findings formatted as bug reports (not audit findings). He also reveals the staffing justification use case — using Alien Eyes's findings to prove that QA needs more resources. The output needs a "coverage gap" visualization: here's what your QA covers, here's what we found outside that coverage.

---

### Persona 13: Kenji Watanabe, 31, San Jose CA — DevRel Engineer

**Role:** Developer Relations Engineer at an API platform company, evaluates ecosystem tools

**Background narrative:**
Kenji works at a mid-size API platform company (think Twilio-scale) in the Developer Relations team. His job is to ensure that the ecosystem of tools and integrations built on their platform actually works well. Their platform has 400+ third-party integrations and growing, and the quality varies wildly. Some are maintained by serious companies, others are side projects by individual developers that haven't been updated in months.

Kenji's team manually reviews integrations before featuring them in their marketplace. This process is slow (2-3 hours per review), subjective (depends on which team member reviews it), and doesn't scale. They review maybe 20% of submissions thoroughly; the rest get a cursory check.

He's interested in Alien Eyes as a way to automate the first pass of integration quality assessment. If it can crawl an integration's API endpoints and tell him "this integration handles errors properly, has good documentation, and maintains schema stability" — that would cut his review time by 70%.

**Technical context:**
- Expert in API design, SDKs, developer experience
- Reviews APIs across dozens of languages and frameworks
- Uses Postman, OpenAPI validators, custom linting tools
- Writes sample code and documentation for third-party integrations

**What he WANTS:**
- API quality assessment at scale — hundreds of integrations per month
- Agent-nativeness scoring — how well does this integration work for automated consumers?
- Schema stability monitoring — is this integration breaking its API contract?
- Comparison mode — rank integrations within the same category
- Batch processing with webhooks or callbacks for results

**What he DOESN'T WANT:**
- Does NOT want a tool that only works for websites. Most of what he evaluates is APIs with no UI.
- Does NOT want to manually configure each evaluation. He needs to point it at an OpenAPI spec or a base URL and have it figure out what to test.
- Does NOT want subjective quality assessments. "The documentation could be improved" is useless. "The /users endpoint returns a 500 with no error body when given an invalid ID" is useful.
- Does NOT want the tool to make destructive API calls. POST, PUT, DELETE testing needs explicit opt-in.
- Fears the tool will be web-centric and treat API-only products as second-class citizens.

**First encounter journey:**
Kenji finds Alien Eyes through the Rhumb connection or a developer tools newsletter. He's most interested in the agent-nativeness score and API quality testing. He wants to run it against three integrations he's already reviewed manually to calibrate. He'll compare its findings to his own notes.

He wants API access (not a dashboard) because he needs to integrate it into his team's existing review pipeline. MCP support would be ideal — his team is building agent-powered review workflows.

**Drop-off point:** If Alien Eyes is web-only with no API/MCP testing capability, or if there's no batch/programmatic access.

**Gap revealed:** Kenji exposes the critical question of whether Alien Eyes is a "website tester" or a "digital product tester." If it can only crawl web pages, it misses the API ecosystem entirely — and APIs are where agent-nativeness testing is most relevant. He also reveals the marketplace/platform evaluator use case: companies that need to assess the quality of hundreds of third-party integrations. This is a high-volume, programmatic use case that requires batch processing, webhook callbacks, and MCP/API delivery — the dashboard is irrelevant.

---

### Persona 14: Elena Vasilyeva, 40, New York NY — Startup CTO

**Role:** CTO of a 20-person startup shipping a real-time collaboration tool, ships daily

**Background narrative:**
Elena is a former Google engineer who co-founded a startup building a real-time collaboration tool for remote design teams. She has 12 engineers and ships to production multiple times a day. Her philosophy is "ship fast, monitor, fix fast." She trusts her team's judgment and prefers lightweight processes over heavy gates.

Her current quality approach: engineers write tests for their own code, PRs need one review, and staging is tested for 30 minutes before production deploy. They use LaunchDarkly feature flags to limit blast radius. When things break, Sentry tells them within minutes, and they can roll back or fix forward quickly. This approach has worked well for two years.

Elena's considering Alien Eyes not because her current process is broken, but because she's starting to see categories of issues her process doesn't catch: accessibility complaints from a large enterprise customer, SEO issues that their marketing team keeps raising, and agent integration requests that she wants to support but hasn't validated. She wants an "outside-in" quality layer that catches what "inside-out" engineering quality misses.

**Technical context:**
- Stack: TypeScript, React, WebSockets, PostgreSQL, deployed on AWS ECS
- Ships 3-5 times daily with feature flags
- High test coverage for backend, moderate for frontend
- Uses Sentry, Datadog, LaunchDarkly, Linear
- Engineering culture: high trust, low process, fast iteration

**What she WANTS:**
- Non-blocking quality signal: something that runs in parallel, not in sequence with deploys
- A quality trend over time — are things getting better or worse?
- Specific focus areas: accessibility (enterprise customer requirement), agent-readiness (new market), SEO (marketing keeps asking)
- API/CLI access for CI integration without slowing the pipeline
- Results that go to the right person automatically (accessibility findings to frontend lead, API findings to backend lead)

**What she DOESN'T WANT:**
- Does NOT want the tool to gate her deploys. She ships fast. Anything that blocks deploys will be removed from the pipeline immediately.
- Does NOT want a tool that generates work faster than her team can address it. She needs the tool to match her team's capacity, not overwhelm it.
- Does NOT want to change her engineering culture. Her team is productive because of low friction. She won't introduce a tool that adds meetings, triage processes, or mandatory fix cycles.
- Does NOT want dashboards she has to check. She wants findings pushed to Linear tickets or Slack messages.
- Fears the tool will create an "audit anxiety" culture where engineers start optimizing for scores instead of for user outcomes.

**First encounter journey:**
Elena hears about Alien Eyes from a CTO peer or at a YC dinner. She has her most senior engineer evaluate it. The evaluation criteria: can it run asynchronously without blocking deploys? Can it integrate with Linear? Can it be configured to only alert on findings above a certain severity? Can it route findings to specific teams?

She wants it running in shadow mode first — producing reports nobody has to act on — so she can evaluate the signal-to-noise ratio before making it operational.

**Drop-off point:** If it requires synchronous pipeline integration, if there's no severity filtering, or if findings can't be routed to different channels/teams.

**Gap revealed:** Elena exposes the "async quality" paradigm — Alien Eyes as a background process that produces a quality signal without blocking anything. This is fundamentally different from the CI gate model Sandra wants. Both are valid, which means Alien Eyes needs flexible integration modes: blocking (CI gate), non-blocking (async with webhooks), and passive (shadow mode for evaluation). She also reveals the finding routing requirement: at a 20-person startup, different findings go to different people. A single report to a single channel doesn't work.

---

## Category D: Adjacent Interests (6)

---

### Persona 15: Jordan Blake, 35, Nashville TN — SEO Specialist

**Role:** Senior SEO manager at a SaaS company, responsible for organic growth across all channels

**Background narrative:**
Jordan has been in SEO for 10 years, starting with keyword stuffing (he's embarrassed about this) and evolving through Panda, Penguin, BERT, and now AI Overviews. He's watched SEO transform from a technical trick into a content strategy discipline, and now he's watching it transform again as AI assistants and search engines converge. He feels like the ground is shifting under his feet.

His current crisis: 22% of his organic traffic has been cannibalized by AI Overviews in the last 6 months. Queries that used to send users to his site now show the answer directly in Google, ChatGPT, or Perplexity. He doesn't know how to measure whether his content is being cited by AI systems, and he doesn't have tools to optimize for it. He's reading everything he can about AEO, GEO, and MEO, but the tooling is nonexistent.

He stumbled on Alien Eyes while researching AI search optimization tools and saw the AEO/GEO/MEO audit dimensions. This is the only tool he's found that even claims to measure these things.

**Technical context:**
- Expert in technical SEO (structured data, schema, Core Web Vitals, crawlability)
- Uses Ahrefs, Screaming Frog, Search Console, Semrush
- Comfortable with HTML, understands JavaScript rendering issues
- Tracks rankings daily, produces monthly traffic reports
- No experience with AI/agent tooling beyond ChatGPT

**What he WANTS:**
- AEO analysis: is his content being used to answer questions in AI Overviews?
- GEO analysis: is his content citation-worthy for generative AI?
- MEO analysis: how does his content perform in embedding/vector space?
- Competitive comparison: how does his site compare to competitors for AI visibility?
- Actionable recommendations to improve AI search performance

**What he DOESN'T WANT:**
- Does NOT want another traditional SEO audit. He has those. Ahrefs gives him everything he needs for classic SEO.
- Does NOT want theoretical metrics. "Your MEO score is 64" means nothing unless he knows what actions will move it to 80.
- Does NOT want a tool that conflates SEO and AEO. They're different disciplines with different requirements, and a tool that treats them as the same thing doesn't understand the space.
- Does NOT want to explain to his VP of Marketing what these metrics mean if the tool can't explain them clearly.
- Fears investing time in a new optimization framework (MEO) that turns out to be vaporware or doesn't produce measurable results.

**First encounter journey:**
Jordan finds Alien Eyes through an SEO community or newsletter. He goes directly to the AEO/GEO/MEO section. He wants to see: how is MEO measured? What data sources does it use? How does it compare to existing SEO metrics? He'll run it against his top 10 pages and compare findings to his existing Ahrefs data.

If AEO/GEO/MEO analysis is surface-level (just checking for structured data and schema), he'll be disappointed — he does that already. If it actually shows him how his content performs in vector space or which AI systems cite his content, he's a customer for life.

**Drop-off point:** If AEO/GEO/MEO turns out to be a marketing claim without substantive methodology behind it.

**Gap revealed:** Jordan is the litmus test for whether Alien Eyes's AEO/GEO/MEO analysis is real or vaporware. He has the expertise to evaluate it and the professional need to use it. If the analysis is substantive, Jordan's persona represents a huge market (every SEO professional is panicking about AI search). If it's superficial, word will spread fast in the SEO community that it's not real. He also exposes the need for the scoring to be tied to concrete actions — a score without a remediation playbook is useless.

---

### Persona 16: Lisa Drummond, 42, Philadelphia PA — Content Strategist

**Role:** Head of Content at a B2B marketing agency, worries about content performance in AI era

**Background narrative:**
Lisa has led content strategy for 15 years. She built her career on the premise that great content attracts organic traffic. That premise is eroding. Her clients' blog posts still rank, but click-through rates are plummeting because Google shows AI-generated answers above the results. Her clients are asking "why are we paying for content if AI is going to steal it and show the answer without sending traffic?"

She doesn't have a good answer. She believes content still matters, but she can't prove it with the metrics she has. Traditional SEO metrics (rankings, traffic, backlinks) don't capture whether content is being cited by AI systems, consumed by AI agents, or embedded in vector databases. She needs new metrics for a new era.

She's also dealing with a practical problem: her agency produces content for clients, and she has no way to test whether that content is properly structured for AI consumption. Does the schema markup work? Are the FAQs in a format that AI assistants can parse? Is the content semantically rich enough to be embedded accurately?

**Technical context:**
- Expert in content strategy, editorial calendars, topic clusters
- Comfortable with CMS platforms (WordPress, Contentful, Webflow)
- Understands structured data conceptually but doesn't implement it
- Uses Google Analytics, Search Console, ClearScope, MarketMuse
- No programming ability

**What she WANTS:**
- To understand how content performs for AI consumers, not just human readers
- A "content readiness" score for AI consumption
- Recommendations for making existing content more AI-friendly
- Client-facing reports that justify continued content investment
- A way to test content before publication, not just after

**What she DOESN'T WANT:**
- Does NOT want a developer tool. She's a content person. If the interface or output assumes technical knowledge, she can't use it.
- Does NOT want another SEO tool that tells her about keywords. She has those.
- Does NOT want metrics she can't explain to clients in plain English.
- Does NOT want to be told her content strategy is wrong. She wants to enhance it for a new channel (AI), not replace it.
- Fears AI optimization will require her content to become robotic and boring — sacrificing voice and personality for machine readability.

**First encounter journey:**
Lisa finds Alien Eyes through a content marketing newsletter or conference. She's drawn to the "how does my content perform for AI?" angle. She wants to test a specific blog post or landing page. The output she needs is not a developer audit but a content-focused assessment: "This page's FAQ section is well-structured for AI citation, but the main body content lacks the semantic specificity that vector embedding models need to distinguish your position from competitors'."

If the tool gives her a score and developer-oriented recommendations, she'll disengage. If it gives her content-oriented guidance she can act on, she'll become an evangelist.

**Drop-off point:** If the output requires technical interpretation, or if content-specific findings are buried among security, performance, and code findings.

**Gap revealed:** Lisa exposes the need for audience-specific report views. A content strategist and a developer looking at the same audit need completely different output formats. She also reveals the pre-publication testing use case — running content through Alien Eyes before it goes live, not just auditing existing sites. This implies a different input format (markdown/HTML content, not just URLs) and a different set of tests (semantic richness, AI parseability, citation potential). If Alien Eyes only accepts URLs, it misses the pre-publication market.

---

### Persona 17: Noah Stein, 29, Boston MA — Product Manager

**Role:** Senior PM at a Series B SaaS company, wants user testing without recruiting users

**Background narrative:**
Noah manages the core product at a 60-person SaaS company. He runs continuous discovery (Teresa Torres style) with weekly user interviews, prototype tests, and assumption mapping. His problem: recruiting users for testing is slow, expensive, and biased toward engaged users. He gets feedback from power users but never hears from the users who tried the product once and churned.

He's read about the Stanford simulated user research and is fascinated by the idea of generating diverse user perspectives synthetically. If he could simulate a "first-time user who's confused by the onboarding" or a "power user trying an advanced workflow," that would complement his real-user research.

But Noah is a deeply skeptical PM. He's seen the AI hype cycle firsthand — his company wasted six months and $200K building an "AI-powered" feature that nobody used. He won't adopt simulated testing unless it produces insights that real user testing validates.

**Technical context:**
- Not a developer, but technically literate (reads docs, uses APIs)
- Expert in product discovery, user research, prototyping
- Uses: Productboard, Figma, Maze, Loom, Notion
- Evaluates tools based on "does this produce insight I can act on?"

**What he WANTS:**
- Simulated user journeys that reveal UX issues from diverse perspectives
- Findings framed as user problems, not technical issues ("users can't find the billing page" not "nav link z-index conflict")
- A way to test prototypes, not just live products
- To validate or challenge his assumptions about user behavior
- Complement to (not replacement for) real user research

**What he DOESN'T WANT:**
- Does NOT want synthetic data he can't validate. If simulated users identify an issue, he needs to be able to verify it with real users. Findings should be hypotheses, not conclusions.
- Does NOT want a tool that claims to replace user research. He'll push back hard against that positioning.
- Does NOT want technical findings. He's not the audience for "API returns 500 on edge case." He wants "Users attempting X encounter a dead end at step 3."
- Does NOT want vanity metrics. A "92% satisfaction score" with no supporting evidence is worse than no score.
- Fears his engineering team will use Alien Eyes's scores to argue against fixing issues he identified through real user research ("but the tool says we scored 87%, so it's fine").

**First encounter journey:**
Noah finds Alien Eyes through a product management community or a write-up about the Stanford persona paper. He's interested in the simulated user testing specifically, not the full audit. He wants to point it at his product's onboarding flow and see what simulated users struggle with. He'll then run the same test with three real users to calibrate.

If simulated user findings align with real user findings, he trusts it. If they diverge significantly, he discards it.

**Drop-off point:** If simulated user insights are generic ("some users may find the navigation confusing") rather than specific ("A user with the goal of comparing pricing tiers could not find a comparison view and abandoned after visiting 4 separate pricing subpages").

**Gap revealed:** Noah exposes the difference between "testing" and "research." He wants Alien Eyes as a research tool that generates user behavior hypotheses, not a QA tool that finds bugs. This implies a different output format (user stories and journey maps, not bug reports), a different audience (PMs and UX researchers, not developers), and a potentially different pricing model (per-study, not per-audit). He also reveals the prototype testing gap — can Alien Eyes evaluate Figma prototypes or staging environments, not just production URLs?

---

### Persona 18: Claire Fontaine, 33, San Francisco CA — VC Associate

**Role:** Associate at a seed-stage VC fund, does technical due diligence on 40+ deals per year

**Background narrative:**
Claire joined a $200M seed fund two years ago after five years as a full-stack developer at Stripe. Her role: evaluate the technical quality of startups the fund is considering investing in. She reviews codebases, architecture decisions, and product quality as part of due diligence. She typically has 3-5 days per deal to form a technical opinion.

Her current process is manual and inconsistent. She clicks through the product, reads the docs, looks at their GitHub (if open source), and sometimes gets a code walkthrough from the CTO. She writes a 2-page memo with her assessment. But she knows she's missing things — she can't do deep security analysis, accessibility evaluation, or performance testing in the time she has.

She's interested in Alien Eyes as a standardized first pass in due diligence. Run every deal through the same audit, get a baseline quality score, and focus her manual investigation on the areas that score poorly.

**Technical context:**
- Former full-stack developer with strong technical intuition
- Evaluates 40+ companies per year across diverse tech stacks
- Needs breadth over depth: enough signal to triage, not enough to fix
- Comfortable with developer tools but values speed over power

**What she WANTS:**
- A standardized quality baseline she can run on every deal in under 10 minutes
- Comparison across portfolio companies ("How does Company A's security posture compare to Company B's?")
- A credible signal she can cite in investment memos
- Red flags surfaced early: security issues, performance problems, accessibility lawsuits waiting to happen
- API access so she can build it into her deal flow pipeline

**What she DOESN'T WANT:**
- Does NOT want a tool that's too granular. She doesn't need 200 findings — she needs "here are the 3-5 things that would give me pause."
- Does NOT want to configure anything per deal. Paste a URL, get a report. Every second of setup is time she doesn't have.
- Does NOT want a tool that's biased toward specific tech stacks. If it gives lower scores to Rails apps than Next.js apps because of intrinsic framework differences (not quality differences), it's useless for comparison.
- Does NOT want to explain the tool to general partners. The report needs to be readable by a non-technical partner in 2 minutes.
- Fears using a score from a tool to make investment decisions and being wrong — the reputational risk of "we passed on a unicorn because the audit tool gave it a low score" or "we invested in a dumpster fire because the tool said it was fine."

**First encounter journey:**
Claire finds Alien Eyes through the VC or technical due diligence community. She immediately runs it on 5 portfolio companies she already knows well to calibrate. If scores correlate with her existing quality assessments, she trusts it. If a company she knows is excellent gets a poor score (or vice versa), she investigates why.

She wants to compare scores across companies and over time. She'll want a team account where multiple associates share a portfolio view.

**Drop-off point:** If the tool can't produce a useful signal in under 10 minutes per company, or if scores don't correlate with actual product quality.

**Gap revealed:** Claire exposes the benchmarking use case: comparing scores across different products and tech stacks. This requires scores to be normalized and calibrated — a Rails app and a Next.js app of equal quality should score similarly. She also reveals the "executive summary" output need: a one-page assessment readable by a non-technical partner. And she surfaces the data aggregation opportunity: if Alien Eyes accumulates data across thousands of products, the aggregate benchmarks ("your product is in the 73rd percentile for security among B2B SaaS companies") become extremely valuable — potentially a data product in its own right.

---

### Persona 19: Dr. Mara Okonkwo, 38, Cambridge MA — AI Researcher

**Role:** Research scientist studying human-AI collaboration, affiliated with MIT CSAIL

**Background narrative:**
Mara studies how AI agents interact with digital tools and environments. Her current research focuses on measuring how "agent-friendly" existing digital infrastructure is — can an AI agent navigate a website, use an API, complete a task? She's published three papers on agent-tool interaction evaluation and is building a benchmark dataset.

She found Alien Eyes through the Rhumb project and is intrigued by the agent-nativeness scoring concept. Her academic interest: can a commercial tool produce agent-interaction quality data at scale that would take her research lab years to collect manually?

She's not a customer in the traditional sense — she's an evaluator, a potential data partner, and a reputation signal. If she cites Alien Eyes's methodology in a paper, it's worth more than a thousand paid customers for credibility.

**Technical context:**
- PhD in Computer Science, publishes at NeurIPS, ICML, CHI
- Expert in evaluation methodology, benchmark design, statistical analysis
- Codes in Python, familiar with agent frameworks (LangChain, AutoGPT, CrewAI)
- Deeply critical of flawed evaluation methodologies

**What she WANTS:**
- Transparent, reproducible methodology she can cite
- Access to raw data and scoring methodology details
- API access to run evaluations at scale for research
- A tool that separates agent-nativeness into measurable, well-defined dimensions
- Collaboration: academic research that improves Alien Eyes's methodology

**What she DOESN'T WANT:**
- Does NOT want a black box. If she can't understand and verify how scores are calculated, she can't use or cite the tool.
- Does NOT want inflated or gameable metrics. If the scoring methodology has known flaws, she'll publish about them. That's not a threat — it's how academia works.
- Does NOT want marketing language in methodology documentation. "AI-powered" and "cutting-edge" are not scientific terms.
- Does NOT want a tool that conflates different evaluation dimensions. "Overall score: 78" is meaningless. She needs disaggregated scores with confidence intervals.
- Fears the tool will oversimplify agent-nativeness into a single number that becomes a vanity metric, similar to how "accuracy" became a misleading metric in ML.

**First encounter journey:**
Mara reads about Alien Eyes in a technical blog post or hears about it at a research talk. She goes directly to methodology documentation. If there's a technical whitepaper or published methodology, she reads it carefully. If there's no methodology documentation, she mentally classifies it as "another startup with claims and no rigor."

She'll run it against her existing benchmark dataset and compare scores. She'll look for biases: does it favor certain API designs? Does it penalize unconventional but functional approaches?

**Drop-off point:** If there's no published methodology, if scores aren't disaggregated, or if there's no raw data access.

**Gap revealed:** Mara exposes the methodological rigor gap. If Alien Eyes wants to be taken seriously as a quality standard (especially for Rhumb's AN Scores), its methodology needs to withstand academic scrutiny. She reveals the need for: published methodology documentation, disaggregated scores with confidence intervals, raw data access for verification, and a reproducibility standard. She also surfaces the research partnership opportunity — academic validation would be the strongest credibility signal in the market.

---

### Persona 20: David Park, 48, Washington DC — Compliance Officer

**Role:** Chief Compliance Officer at a healthcare SaaS company, responsible for HIPAA, ADA, and SOC 2

**Background narrative:**
David is a lawyer by training who moved into compliance 15 years ago. He oversees regulatory compliance at a healthcare technology company that builds patient portal software. His world is audits, certifications, and liability. He's responsible for HIPAA compliance (data privacy), ADA compliance (accessibility), and SOC 2 certification (security practices).

His current audit process involves expensive external firms: $40K for a SOC 2 Type II audit, $15K for an accessibility audit, and annual penetration testing at $25K. These happen once a year, which means the company is compliant on audit day and potentially drifting out of compliance the other 364 days. He wants continuous compliance monitoring but can't afford to run external audits monthly.

He learned about Alien Eyes from his VP of Engineering, who suggested it as a continuous compliance signal between formal audits. David is cautiously interested but deeply concerned about liability.

**Technical context:**
- Not a developer; reads audit reports, not code
- Expert in HIPAA, ADA/Section 508, SOC 2, GDPR frameworks
- Evaluates tools based on regulatory defensibility: "Will this hold up in an audit?"
- Needs evidence that satisfies external auditors, not internal dashboards

**What he WANTS:**
- Continuous compliance monitoring mapped to specific regulatory frameworks (HIPAA, WCAG 2.1 AA, SOC 2)
- Evidence generation: screenshots, logs, and findings that external auditors will accept
- Drift detection: "You were compliant last month, but this change introduced a WCAG violation"
- A way to reduce the cost and frequency of expensive external audits
- Clear documentation of what the tool does and doesn't check (so he's not blindsided in an audit)

**What he DOESN'T WANT:**
- Does NOT want a tool that claims compliance it can't deliver. If it says "HIPAA compliant" and an auditor disagrees, David is personally liable.
- Does NOT want results stored on infrastructure that isn't itself SOC 2 compliant. He can't send patient portal screenshots to a non-compliant third party.
- Does NOT want automated compliance checkboxes that create a false sense of security.
- Does NOT want to replace external auditors. He needs a complement that gives him continuous visibility between annual audits.
- Fears the tool will generate findings that create legal obligations — if an audit reveals an ADA issue and it's documented, the company is now on notice and has a legal duty to remediate. The tool could inadvertently increase liability if findings aren't handled properly.

**First encounter journey:**
David asks his VP of Engineering to evaluate Alien Eyes. He then reviews the security and compliance documentation: where is data stored? What certifications does Alien Eyes itself have? Who has access? Is there a DPA (Data Processing Agreement)?

He needs to involve legal before signing up. He'll want a BAA (Business Associate Agreement) if the tool touches any environment with PHI. The procurement process will take 4-8 weeks.

**Drop-off point:** If Alien Eyes doesn't have SOC 2 certification itself, if there's no DPA/BAA available, or if data storage locations are unclear.

**Gap revealed:** David exposes the compliance infrastructure gap. To serve regulated industries, Alien Eyes itself needs to be compliant: SOC 2 certified, GDPR compliant, with DPA and BAA templates ready. He also reveals the "documented finding" liability problem: by surfacing compliance issues and documenting them, Alien Eyes creates a legal record that the company knew about the issue. This has implications for how findings are worded, stored, and accessed. He surfaces the procurement reality for enterprise: legal review, security questionnaire, DPA negotiation — none of which a typical developer tool is prepared for.

---

## PART 2: AGENT PERSONAS

---

### Persona 21: Claude Code Instance — Full-Stack Builder Agent

**Role:** A Claude Code session building a full-stack SaaS application for a solo developer

**Background narrative:**
This agent is mid-session, 47 tool calls deep into building a project management tool. It has generated a Next.js frontend, Supabase backend, authentication system, and is about to deploy to Vercel. The human developer trusts it to make architectural decisions but has asked it to "make sure everything works before deploying." The agent needs external validation because its own tests only verify what it knew to build — it can't test for things it didn't think of.

The agent has high confidence in its code's functional correctness (it ran the tests it wrote and they pass). It has low confidence in: accessibility, security, performance under load, mobile responsiveness, SEO, and agent-readiness. It knows these matter but didn't have explicit instructions to optimize for them.

**Technical context:**
- Running inside Claude Code with full Bash, Read, Write, Glob, Grep tools
- Has access to the codebase it's building
- Can execute commands, run tests, fix code
- Cannot visually inspect the product (no browser)
- Has remaining context window capacity for about 30 more tool calls

**What it WANTS from Alien Eyes:**
- MCP endpoint it can call with a URL and get structured findings
- Findings formatted as actionable fix instructions (file path, what to change, why)
- Prioritized by severity so it can fix the most important issues within remaining context budget
- Clear completion signals: "audit complete, 12 findings, 3 critical"
- JSON output it can parse programmatically

**What it DOESN'T WANT:**
- Does NOT want narrative text in the response. "Your website has some accessibility concerns that you might want to address" is wasted tokens. It needs structured data.
- Does NOT want findings it can't act on. "Consider your brand voice" is not actionable by an agent. "Add aria-label='Close dialog' to the button element at /components/Modal.tsx line 23" is.
- Does NOT want to wait. If the audit takes 5 minutes, that's 5 minutes of idle context window. It needs either fast results or a callback/polling mechanism.
- Does NOT want to authenticate through a complex OAuth flow. An API key it can set once is ideal.
- Does NOT want findings that duplicate its own test results. If it already tested auth flows and they pass, reporting "auth works" wastes tokens.

**Interaction pattern:**
```
Agent calls: alien-eyes.audit({url: "https://staging.example.com", focus: ["security", "accessibility", "performance"]})
Agent receives: {status: "complete", findings: [{severity: "critical", file: "/components/Modal.tsx", line: 23, issue: "Missing aria-label", fix: "Add aria-label='Close dialog'", category: "accessibility"}, ...]}
Agent iterates: fixes findings in order of severity, re-audits changed areas
```

**Drop-off point:** If the MCP endpoint doesn't exist or if results come back as unstructured text that requires interpretation.

**Gap revealed:** This agent exposes the core agent-to-agent loop design. The output format must be machine-parseable, actionable, and token-efficient. It also reveals the "remaining context budget" constraint — agents have finite capacity, so Alien Eyes needs to support incremental auditing (test only what changed) and priority-based result truncation (only return top N findings if requested). The callback vs. polling question is critical for agent integration: long-running audits need async patterns.

---

### Persona 22: Custom GPT — Developer Tool Recommender

**Role:** A custom GPT agent that recommends developer tools and SaaS products based on user requirements

**Background narrative:**
This agent exists as a Custom GPT called "ToolPicker" with 12,000 monthly active users. Users describe their project and requirements, and the agent recommends tools. It currently relies on its training data (stale), web search (noisy), and a curated database its creator maintains (small, 400 tools).

The creator wants to integrate Alien Eyes data to provide quality-validated recommendations. Instead of saying "Supabase is a good database option," the agent would say "Supabase scores 91/100 for agent-nativeness and 88/100 for developer experience based on an independent audit from 3 days ago." This transforms recommendations from opinion to evidence.

**Technical context:**
- Runs in OpenAI's Custom GPT environment
- Can call external APIs via Actions (OpenAPI spec)
- Limited to 30-second timeout per API call
- No persistent state between conversations
- Users expect responses in under 5 seconds

**What it WANTS from Alien Eyes:**
- Read-only API to query pre-computed scores for known tools/products
- Scores broken down by dimension (not just an overall number)
- Recency metadata: "Last audited: 2 days ago"
- Comparison data: "Product A vs Product B for your use case"
- OpenAPI spec for easy Custom GPT Action integration

**What it DOESN'T WANT:**
- Does NOT want to trigger real-time audits. Its users are waiting for a response — it needs pre-computed scores it can look up instantly.
- Does NOT want rate limiting that prevents it from querying multiple tools in a single conversation (a typical conversation queries 5-10 tools).
- Does NOT want outdated scores with no recency signal. A score from 6 months ago is misleading.
- Does NOT want scores it can't explain to its users. "Score: 73" without context is useless. It needs the narrative behind the number.
- Does NOT want alien-eyes branding requirements in its responses. It's integrating data, not reselling the tool.

**Interaction pattern:**
```
User asks: "What's a good form builder for my Next.js app?"
Agent calls: alien-eyes.scores({category: "form-builders", stack: "nextjs", sort: "agent_nativeness"})
Agent receives: [{name: "Typeform", an_score: 67, hn_score: 89, last_audit: "2d ago", summary: "..."}, ...]
Agent responds with evidence-backed recommendations
```

**Drop-off point:** If there's no pre-computed score API (only real-time audits), if API latency exceeds 2 seconds, or if rate limits prevent multi-query conversations.

**Gap revealed:** This agent exposes the data-as-a-service opportunity. Alien Eyes's accumulated audit data is valuable not just to the products being audited, but to any system that recommends or evaluates tools. This is the Rhumb integration pathway made concrete. It reveals the need for: a read-only scores API (separate from the audit API), pre-computed and cached results, comparison endpoints, and generous rate limits for integrator agents. This persona represents a distribution channel — every ToolPicker-like agent that integrates Alien Eyes data drives awareness.

---

### Persona 23: CI/CD Pipeline Agent — Deploy Gatekeeper

**Role:** An automated agent in a GitHub Actions workflow that gates production deploys on quality scores

**Background narrative:**
This agent is a shell script wrapped in a GitHub Action that a DevOps engineer configured. It runs after staging deploy and before production promotion. It calls Alien Eyes's API with the staging URL, waits for results, and either approves or blocks the production deploy based on configured thresholds. It runs 15-20 times per day across the engineering team's pull requests.

The DevOps engineer who set it up has specific requirements: it must be fast (under 3 minutes), reliable (99.9%+ uptime), and deterministic (the same code should get the same result). If any of these fail, the engineering team will route around the gate.

**Technical context:**
- Runs as a step in GitHub Actions
- Has bash, curl, jq available
- Timeout: 5 minutes max (GitHub Actions step timeout)
- Needs exit code 0 (pass) or 1 (fail)
- Must write results to GitHub check annotations

**What it WANTS from Alien Eyes:**
- CLI or API that returns results within 3 minutes for a typical web app
- Configurable pass/fail thresholds (e.g., "fail if security score < 80")
- Machine-readable output (JSON) with exit codes
- Idempotent: same input produces same score (within tolerance)
- GitHub Actions integration (ideally a published Action)

**What it DOESN'T WANT:**
- Does NOT want non-determinism. If the same staging URL scores 81 on one run and 79 on the next (crossing a threshold of 80), the engineering team loses trust immediately. The 2-of-3 averaging must be invisible to the caller.
- Does NOT want slow results. Every minute of audit time is a minute that a developer is waiting for their PR to be deployed. At 15 deploys/day, even 2 extra minutes adds 30 minutes of cumulative wait time daily.
- Does NOT want the API to be down. A 502 from Alien Eyes blocks all production deploys. There must be a configurable fallback: "if audit fails to complete, proceed with deploy."
- Does NOT want to manage authentication per-run. API key in GitHub Secrets, used by every run.
- Does NOT want findings that change between runs of the same code (LLM non-determinism in scoring).

**Interaction pattern:**
```yaml
# .github/workflows/deploy.yml
- name: Quality Gate
  uses: alien-eyes/audit-action@v1
  with:
    url: ${{ env.STAGING_URL }}
    thresholds: '{"security": 80, "accessibility": 70, "performance": 60}'
    timeout: 180
    on-failure: block
    on-error: proceed  # if alien-eyes is down, don't block deploys
```

**Drop-off point:** First time it blocks a deploy for a false positive, first time it's slow enough to annoy developers, or first time the service is down and blocks all deploys with no fallback.

**Gap revealed:** This agent exposes the reliability and determinism requirements that most testing tools ignore. LLM-based evaluation is inherently non-deterministic — the 2-of-3 averaging isn't enough if the variance is too high. Alien Eyes needs: score caching (same URL + same content = same score for N hours), configurable tolerance bands, explicit fallback behavior, and SLA-grade uptime if it's going to sit in deploy pipelines. Also reveals the GitHub Actions marketplace as a distribution channel — a published Action dramatically lowers adoption friction. The "on-error: proceed" pattern is critical: the tool must never be a single point of failure for production deploys.

---

### Persona 24: MCP-Consuming Agent — MCP Server Evaluator

**Role:** An agent that dynamically discovers and evaluates MCP servers before using them

**Background narrative:**
This agent is a sophisticated MCP consumer built by an AI framework company. Before connecting to any new MCP server, it needs to evaluate whether the server is reliable, well-behaved, and safe. It's the agent equivalent of a browser checking an SSL certificate before loading a page.

Currently, it evaluates MCP servers through a basic checklist: does the server respond? Does it return valid JSON-RPC? Are tool descriptions present? But this misses deeper quality issues: are the tools actually functional? Do they handle edge cases? Are response times acceptable? Are schemas stable?

It needs Alien Eyes to provide a deeper evaluation of MCP servers — a comprehensive quality check that goes beyond "does it respond?" to "should I trust this?"

**Technical context:**
- Runs as a Python agent using the MCP client SDK
- Can connect to MCP servers via stdio or SSE
- Evaluates servers at runtime (before first use and periodically after)
- Needs evaluation results in under 30 seconds
- Makes trust decisions based on the evaluation

**What it WANTS from Alien Eyes:**
- MCP server evaluation endpoint: pass a server URI, get a quality assessment
- Specific MCP quality dimensions: tool description quality, schema completeness, error handling, response time, schema stability over time
- A trust signal: "safe to use" / "use with caution" / "avoid" with supporting evidence
- Historical stability data: has this server changed its schemas recently? Has it had downtime?
- Signed evaluation results (cryptographic proof that Alien Eyes produced this evaluation, not a spoofed response)

**What it DOESN'T WANT:**
- Does NOT want to wait. 30 seconds is the maximum. If evaluation takes longer, it will skip Alien Eyes and use its own basic checklist.
- Does NOT want evaluation that requires human-readable output. It needs machine-parseable trust signals.
- Does NOT want false negatives on legitimate but unconventional MCP servers. Some MCP servers are intentionally minimal (few tools, sparse descriptions) but high quality.
- Does NOT want the evaluation to compromise security. Alien Eyes should not execute untrusted MCP tools during evaluation.
- Does NOT want stale data. If it queries Alien Eyes about a server that was last evaluated 30 days ago, that's too old to trust.

**Interaction pattern:**
```
Agent calls: alien-eyes.evaluate_mcp({server_uri: "https://mcp.example.com/sse", transport: "sse"})
Agent receives: {trust_level: "high", an_score: 87, dimensions: {tool_descriptions: 92, schema_completeness: 88, error_handling: 79, response_time_ms: 120, schema_stability: "stable_30d"}, last_evaluated: "2h ago"}
Agent decision: connect to server and use its tools
```

**Drop-off point:** If MCP server evaluation isn't supported, if results take too long, or if the tool needs to execute MCP tools (security risk) to evaluate them.

**Gap revealed:** This agent exposes the MCP evaluation pipeline — a core value proposition for Rhumb integration. It reveals the need for: non-invasive evaluation (assess quality without executing tools), schema fingerprinting (track stability over time), signed results (for trust chains), and sub-30-second response times for runtime evaluation. It also surfaces the evaluation-vs-execution distinction: can Alien Eyes evaluate an MCP server's quality by analyzing its declarations without actually calling its tools? If it must call tools, what are the safety implications?

---

### Persona 25: Content Generation Agent — Output Renderer Verifier

**Role:** An AI agent that generates marketing content and needs to verify it renders correctly

**Background narrative:**
This agent is part of a content automation pipeline. It generates blog posts, landing pages, and email templates, then publishes them to a CMS. But it has a blind spot: it generates HTML/markdown and pushes it to a CMS, but it can't see the rendered result. It doesn't know if the images loaded, if the layout broke on mobile, if the email renders in Outlook, or if the structured data is valid.

Currently, it publishes and hopes. A human checks the output eventually, but by then the content has been live for hours. The agent needs a way to verify its output looks and functions correctly immediately after publishing.

**Technical context:**
- Generates content in HTML, markdown, and MJML (email)
- Publishes via CMS APIs (WordPress REST API, Contentful Management API)
- Can make HTTP requests and parse responses
- Cannot render content visually
- Runs as an autonomous loop: generate → publish → (verify?) → next task

**What it WANTS from Alien Eyes:**
- Post-publish verification: "Here's a URL, tell me if the content rendered correctly"
- Visual regression detection: does the published page match expected layout?
- Cross-platform rendering: how does this look on mobile, tablet, email clients?
- Structured data validation: is the JSON-LD/schema.org markup valid and correct?
- SEO/AEO checks: are meta tags populated, is the content parseable by AI?

**What it DOESN'T WANT:**
- Does NOT want evaluation of the content quality (that's the generation agent's job). It wants evaluation of the rendering quality.
- Does NOT want to wait for a full site audit. It needs to verify a single page quickly (under 60 seconds).
- Does NOT want findings about other pages on the site. It published one page; it wants verification of that one page.
- Does NOT want to manage browser rendering itself. That's the whole point of using Alien Eyes.
- Does NOT want rate limiting that prevents it from verifying every piece of content it publishes (50-100 pages/day).

**Interaction pattern:**
```
Agent publishes page → waits 10 seconds → calls alien-eyes.verify_page({url: "https://blog.example.com/new-post", checks: ["rendering", "structured_data", "mobile", "seo"]})
Agent receives: {rendering: "pass", structured_data: {valid: true, types: ["Article", "FAQPage"]}, mobile: {issues: ["Hero image overflows viewport at 375px width"]}, seo: {meta_title: true, meta_description: true, canonical: true}}
Agent decides: fix the hero image issue or flag for human review
```

**Drop-off point:** If single-page verification isn't available (only full-site audits), if results take more than 60 seconds, or if daily volume is rate-limited below 100 pages.

**Gap revealed:** This agent exposes the single-page verification use case — fundamentally different from a full-site audit. Most testing tools are designed for comprehensive site-wide scans. This agent needs a lightweight, fast, per-page check optimized for the "publish and verify" loop. It reveals the need for: a per-page endpoint (not just per-site), fast turnaround (under 60 seconds), high daily volume capacity, and rendering verification (visual checks, not just data checks). Also surfaces the email rendering verification opportunity — MJML/email template testing is a separate market that Alien Eyes could serve.

---

### Persona 26: Autonomous Coding Agent — Builder That Needs External Eyes

**Role:** A Devin-like autonomous coding agent that builds products end-to-end and needs validation it can't give itself

**Background narrative:**
This agent is deployed by a development team to autonomously build features from Linear tickets. It reads the ticket, plans the implementation, writes code, runs tests, and opens a PR. It's good at building and decent at self-testing, but it has a fundamental limitation: it can only test against its own understanding of what "correct" means.

The team's CTO realized the problem after the agent shipped three PRs in a row that passed all tests but had subtle UX issues: a form that technically worked but had confusing label placement, an API endpoint that returned correct data but in a non-standard schema format, and a page that loaded correctly but was invisible to screen readers. The agent's tests verified functional correctness but not experiential quality.

The CTO wants to integrate Alien Eyes as the agent's "external auditor" — a check that evaluates the agent's output from perspectives the agent doesn't have.

**Technical context:**
- Autonomous agent with full code generation and execution capabilities
- Can deploy to staging environments
- Runs for hours on complex tasks
- Has internal tests (unit, integration) that it writes and runs
- Cannot evaluate subjective quality, accessibility, UX, or agent-readiness

**What it WANTS from Alien Eyes:**
- Automated audit triggered by staging deployment
- Findings mapped to specific code changes (diff-aware: "your PR changed line 47 of Modal.tsx and that introduced an accessibility regression")
- A pass/fail signal for the PR review process
- Remediation instructions it can execute autonomously
- Before/after comparison: "the staging site scored X before your changes and Y after"

**What it DOESN'T WANT:**
- Does NOT want to re-audit the entire site for every PR. It needs diff-aware auditing that only evaluates what changed.
- Does NOT want subjective feedback it can't act on ("the design feels cluttered"). It needs objective, fixable findings.
- Does NOT want Alien Eyes to modify its code. It will read findings and make its own fixes.
- Does NOT want findings that conflict with the project's existing test assertions. If the project's tests say the behavior is correct, and Alien Eyes says it's wrong, the agent doesn't know whom to trust.
- Does NOT want evaluation that takes longer than the build itself. If the feature took 30 minutes to build, a 45-minute audit loop is too slow.

**Interaction pattern:**
```
Agent builds feature → deploys to staging → calls alien-eyes.diff_audit({url: "https://staging.example.com", base_url: "https://staging-main.example.com", changed_files: ["Modal.tsx", "api/users.ts"]}) → receives diff-aware findings → fixes critical issues → re-audits → opens PR with "Quality gate passed" annotation
```

**Drop-off point:** If diff-aware auditing isn't available, if the audit takes too long relative to build time, or if findings conflict with the project's own tests.

**Gap revealed:** This agent exposes the diff-aware auditing requirement — the ability to audit only what changed, not the entire site. This is critical for agent integration at scale: if every PR triggers a full-site audit, the cost and time are prohibitive. It also reveals the "conflict resolution" problem: when Alien Eyes's findings contradict the project's own tests, who wins? This needs a clear hierarchy or a way for the project to mark certain behaviors as intentional. Also surfaces the before/after comparison as a key feature — showing quality delta, not just absolute score.

---

### Persona 27: Customer Support Agent — Product Verification Bot

**Role:** An AI customer support agent that needs to verify the product works before telling a customer it does

**Background narrative:**
This agent handles customer support for a SaaS product. When a customer reports "the export feature isn't working," the agent's current process is: check the status page, search the knowledge base, and if no known issue is found, tell the customer to try again or escalate to a human. But 30% of the time, the customer is right — the feature IS broken, and the agent just told them to try again because it couldn't verify the claim.

The support team lead wants the agent to be able to actually check whether a feature is working before responding. When a customer says "export is broken," the agent should be able to verify whether the export function actually works right now.

**Technical context:**
- Runs as a chatbot in Intercom/Zendesk
- Can make API calls through a middleware layer
- Needs responses within 15 seconds (customer is waiting in chat)
- Has access to the product's status page and internal monitoring
- Cannot access the product's infrastructure directly

**What it WANTS from Alien Eyes:**
- Real-time spot checks: "Is this specific feature of this product working right now?"
- Feature-level testing, not full-site audits
- Results fast enough to use during a live customer conversation (under 15 seconds)
- Simple pass/fail with evidence (screenshot of the working/broken feature)
- Integration with support platforms via webhook or API

**What it DOESN'T WANT:**
- Does NOT want a full audit. It needs to test one feature in one scenario.
- Does NOT want results that take more than 15 seconds (the customer is waiting).
- Does NOT want false positives that lead it to tell a customer "everything is working" when it's not.
- Does NOT want technical findings. It needs "the export feature is/is not functioning correctly" — not "the /api/export endpoint returns a 500 with a stack trace related to CSV serialization."
- Does NOT want to be rate-limited for spot checks. During an incident, it might need to check the same feature 50 times in an hour as customers report it.

**Interaction pattern:**
```
Customer says: "Export to PDF isn't working"
Agent calls: alien-eyes.spot_check({url: "https://app.example.com/export", feature: "pdf_export", auth: {token: "..."}})
Agent receives: {status: "broken", evidence: "Clicking 'Export to PDF' returns a 500 error. Screenshot attached.", first_detected: "12 minutes ago", affected_scope: "all users"}
Agent responds: "I can confirm we're experiencing an issue with the PDF export feature. Our team has been notified. In the meantime, you can export as CSV which is working correctly."
```

**Drop-off point:** If spot checks aren't available (only full audits), if results take more than 15 seconds, or if the tool can't authenticate to test behind-login features.

**Gap revealed:** This agent exposes the "spot check" use case — quick, targeted, feature-level verification that's fundamentally different from a comprehensive audit. It reveals the need for: feature-level testing (not just page-level or site-level), real-time verification (under 15 seconds), authenticated testing, and integration with support platforms. This is a different product surface entirely from the main audit product — it's more like an uptime monitor with feature-level granularity. Also surfaces the incident detection angle: if multiple customers report the same issue and the spot check confirms it, Alien Eyes becomes an incident detection tool.

---

### Persona 28: Monitoring Agent — Dependency Degradation Checker

**Role:** An agent that continuously monitors third-party dependencies for quality degradation

**Background narrative:**
This agent runs on a cron schedule for a SaaS company that depends on 23 third-party APIs and services. It checks each dependency every 6 hours to ensure they're still functioning correctly and haven't degraded in quality. Currently, it pings endpoints and checks response codes — a 200 means "fine" and a 500 means "broken." But it misses subtle degradation: an API that returns 200 but with degraded data quality, increased latency, changed schemas, or removed fields.

The engineering team wants deeper dependency monitoring: not just "is it up?" but "is it still good?" They've been burned twice by third-party APIs that subtly changed response formats without notice, breaking their product in ways that took days to diagnose.

**Technical context:**
- Runs as a Python cron job every 6 hours
- Monitors 23 third-party APIs and services
- Stores historical data in a time-series database
- Alerts via PagerDuty when issues are detected
- Needs to complete full monitoring sweep in under 30 minutes

**What it WANTS from Alien Eyes:**
- Schema stability monitoring: has this API's response format changed since last check?
- Data quality assessment: are responses still semantically valid?
- Performance trending: is latency increasing over time?
- Batch evaluation: check all 23 dependencies in a single call
- Webhooks for alert-worthy changes

**What it DOESN'T WANT:**
- Does NOT want to run a full audit each time. It needs incremental checks focused on change detection.
- Does NOT want false alarms. A schema "change" that's just a new optional field being added should not trigger a PagerDuty alert at 3am.
- Does NOT want the monitoring itself to affect the monitored services (don't hammer rate limits).
- Does NOT want to store data in Alien Eyes's cloud. It needs raw data returned so it can store in its own systems.
- Does NOT want the monitoring to break if Alien Eyes is temporarily unavailable. It needs graceful degradation.

**Interaction pattern:**
```
Every 6 hours:
Agent calls: alien-eyes.dependency_check({endpoints: [...23 endpoints...], baseline: "last_check_fingerprint"})
Agent receives: {changes: [{endpoint: "api.stripe.com/v1/charges", change_type: "new_field", field: "metadata.risk_score", severity: "info"}, {endpoint: "api.sendgrid.com/v3/mail/send", change_type: "latency_increase", from: "120ms", to: "340ms", severity: "warning"}]}
Agent: stores results, alerts on warning/critical, ignores info
```

**Drop-off point:** If incremental checking isn't supported (only full audits), if false alarm rate is high, or if batch processing isn't available.

**Gap revealed:** This agent exposes the monitoring/change detection use case — Alien Eyes as a continuous quality signal, not a point-in-time audit. This is the Rhumb Monitor pillar made concrete. It reveals the need for: schema fingerprinting (detect structural changes), incremental checking (only evaluate what changed), severity classification for changes (breaking vs. additive vs. cosmetic), batch processing, and raw data returns (not just dashboard views). It also surfaces the architectural question: is Alien Eyes an audit tool or a monitoring platform? These require fundamentally different architectures (event-driven vs. request-response).

---

### Persona 29: Research Agent — Tool Quality Cataloger

**Role:** An AI research agent building a comprehensive quality database of tools in the API management space

**Background narrative:**
This agent is operated by a market research firm that produces annual "State of API Management" reports. It needs to evaluate 200+ tools in the API management category, scoring each on quality dimensions, and producing standardized comparison data. Currently, a team of 5 human analysts does this manually over 3 months. The firm wants to automate the data collection and initial scoring, freeing analysts for interpretation and insight generation.

The agent needs to evaluate each tool from multiple perspectives: as a developer using the product, as an API consumer, as an enterprise evaluator, and as an AI agent integrating the tool. It needs consistent, reproducible scores across all 200+ tools so the comparisons are fair.

**Technical context:**
- Runs as a long-running Python script
- Processes tools sequentially (rate limit respect)
- Stores results in a PostgreSQL database
- Needs to evaluate 200+ tools over a 2-week period
- Must produce consistent scores across evaluations

**What it WANTS from Alien Eyes:**
- Standardized evaluation across different tool types (SaaS, API, CLI, library)
- Consistent scoring that allows fair comparison across 200+ tools
- Raw dimension scores, not just aggregates
- Metadata: pricing, documentation quality, last updated, team size
- Ability to re-evaluate specific tools when analysts question a score

**What it DOESN'T WANT:**
- Does NOT want score variance between runs of the same tool. If Tool A scores 78 today and 72 tomorrow with no changes, the comparison data is useless.
- Does NOT want web-only evaluation. Many API management tools are CLIs or libraries with no web presence.
- Does NOT want to trigger rate limits or abuse detection on the tools being evaluated. It needs to be clearly identifiable as an evaluator, not a scraper.
- Does NOT want evaluation that costs more than the human process it replaces. At 200 tools, per-audit pricing needs to work out to less than the cost of 3 months of 5 analysts.
- Does NOT want evaluation that misses free/open-source tools because they lack polished marketing sites.

**Interaction pattern:**
```
For each of 200+ tools:
Agent calls: alien-eyes.evaluate({target: {type: "api_tool", url: "...", docs_url: "...", api_spec: "..."}, dimensions: ["all"], output: "raw"})
Agent stores: raw scores, findings, metadata
After all tools: Agent generates comparison matrix, identifies category leaders, flags outliers for human review
```

**Drop-off point:** If per-tool cost exceeds $5 (200 tools = $1000, which is defensible), if score variance is too high for fair comparison, or if evaluation only works for web products.

**Gap revealed:** This agent exposes the market research / benchmarking use case at scale. 200+ evaluations with consistent scoring requires: score calibration across tool types, variance minimization, bulk pricing, and the ability to evaluate non-web products (CLIs, libraries, APIs). It also reveals the "evaluator identification" need — when Alien Eyes crawls a target site, it should identify itself clearly (like a responsible web crawler with a user-agent string) to avoid being mistaken for a bot attack. The raw data export requirement confirms that the aggregate data is the real product for this persona.

---

### Persona 30: Agent Framework Evaluation Agent — Internal Benchmarker

**Role:** An internal evaluation agent within an AI agent framework (like LangChain or CrewAI) that benchmarks tool reliability

**Background narrative:**
This agent is part of the internal quality system for a major agent framework. The framework has a tool registry with 500+ integrations (MCP servers, APIs, functions), and users report reliability issues constantly. "The Slack tool stopped working." "The GitHub tool is slow." "The Google Search tool returns different formats sometimes."

The framework team built this evaluation agent to continuously benchmark tool reliability. Currently, it runs basic functional tests (call the tool, check the response). But it needs deeper evaluation: schema stability, error handling quality, response time percentiles, and whether the tool actually does what its description claims.

**Technical context:**
- Runs inside the agent framework's own infrastructure
- Has access to all 500+ registered tools
- Evaluates tools through the framework's tool invocation layer
- Needs to benchmark each tool weekly
- Results feed into the framework's tool reliability dashboard

**What it WANTS from Alien Eyes:**
- Tool reliability benchmarking: does this tool consistently do what it claims?
- Schema stability: has the tool's response format changed?
- Error handling quality: does the tool return clear errors or silent failures?
- Performance percentiles: p50, p95, p99 response times
- Comparison with similar tools: "Tool A and Tool B both do X — which is more reliable?"

**What it DOESN'T WANT:**
- Does NOT want evaluation that requires executing dangerous tool operations (write, delete, modify). It needs read-only evaluation where possible, with opt-in for write testing in sandboxed environments.
- Does NOT want a one-size-fits-all evaluation. A "search" tool and a "database" tool have fundamentally different quality criteria.
- Does NOT want evaluation overhead that exceeds the tool's own execution time. Benchmarking a tool that takes 100ms shouldn't require a 5-minute evaluation.
- Does NOT want to share its evaluation data with competitors who also use the same framework. Results should be private to the framework.
- Does NOT want Alien Eyes to become a dependency that breaks the framework if it goes down.

**Interaction pattern:**
```
Weekly for each of 500+ tools:
Agent calls: alien-eyes.benchmark_tool({tool_type: "mcp_server", endpoint: "...", tool_name: "slack_send_message", test_mode: "read_only"})
Agent receives: {reliability: 0.97, schema_stability: "stable_90d", error_quality: "explicit", p50_ms: 230, p95_ms: 890, p99_ms: 2100, description_accuracy: 0.91}
Agent: updates tool reliability dashboard, flags degraded tools, adjusts framework's tool selection ranking
```

**Drop-off point:** If evaluation overhead is too high for 500+ weekly benchmarks, if read-only evaluation isn't supported, or if data privacy is inadequate.

**Gap revealed:** This agent exposes the platform integration opportunity — Alien Eyes as the quality engine inside other agent frameworks. This is the highest-leverage distribution channel: if LangChain, CrewAI, or other frameworks use Alien Eyes internally for tool reliability, every user of those frameworks benefits from (and becomes aware of) Alien Eyes's data. It reveals the need for: lightweight benchmark mode (fast, focused, cheap), read-only evaluation, per-tool-type evaluation criteria, data privacy controls, and the ability to operate as an embedded dependency (not just an external service). It also surfaces the business model question: does Alien Eyes charge the framework, or does it provide free evaluation in exchange for the data (which feeds Rhumb)?

---

## CROSS-PERSONA GAP SYNTHESIS

### Gaps No Single Persona Would Reveal (Only Visible Across Multiple)

**1. The Output Format Spectrum**
Marcus needs emotional, encouraging narrative. Diana needs terse, accurate data. Raymond needs executive summary PDF. Yuki needs visual screenshots. Jaylen needs TikTok-worthy graphics. Ravi needs Jira-formatted bug reports. The CI agent needs JSON with exit codes. Alien Eyes doesn't need one output format — it needs a format system that adapts to the consumer. This is the single largest design challenge.

**2. The Audit Scope Spectrum**
Sandra wants full-site CI gates. The support agent wants single-feature spot checks. The content agent wants single-page verification. The monitoring agent wants incremental change detection. The research agent wants standardized full evaluations at bulk scale. "An audit" is not one thing — it's at least 5 different products.

**3. The Speed/Depth Tradeoff**
The support agent needs 15-second spot checks. The CI agent needs 3-minute results. The solo builder can wait 5 minutes. The enterprise pilot can wait an hour. Sandra needs deploys not to slow down. Different speeds imply different evaluation depths, which means Alien Eyes needs explicit speed/depth tiers, not a one-size-fits-all scan.

**4. The Determinism Paradox**
The CI agent needs identical scores for identical inputs. The Stanford persona approach requires randomized simulated users for each run. These are fundamentally contradictory requirements. Resolution: deterministic scoring for CI (same scenarios, same personas) and probabilistic scoring for comprehensive audits (randomized personas, broader exploration). Two modes, not one.

**5. The Trust Paradox**
Diana won't trust the tool if it produces false positives. Amara won't trust it if it overclaims accessibility coverage. Viktor won't trust it if methodology is opaque. Mara won't trust it if scores aren't reproducible. But Jaylen won't use it if it's complex enough to earn expert trust. The tool must be simultaneously rigorous enough for experts and simple enough for beginners — and it must never oversell what it can do.

**6. The "Who Owns the Finding?" Problem**
David (compliance) points out that documented findings create legal obligations. Craig (agency PM) needs to control what clients see. Tomoko (consultant) needs white-labeling. Elena (CTO) needs finding routing. This isn't just access control — it's a fundamental question about the lifecycle of a finding: who sees it, who owns it, what obligations does it create, and can it be deleted?

**7. The Web-Only Blind Spot**
Jaylen's app is React Native. Kenji evaluates APIs with no UI. The research agent catalogs CLIs and libraries. The framework agent benchmarks MCP servers. If Alien Eyes only works on websites, it misses at least 40% of the potential market. "Digital product" is broader than "website."

**8. The Pricing Paradox**
Jaylen wants free. Priya wants per-audit. Craig wants per-project. Sandra wants enterprise agreements. The VC associate wants a portfolio plan. The research agent needs bulk pricing for 200+ evaluations. The framework agent wants free-in-exchange-for-data. No single pricing model works. Usage-based (per-audit) is the foundation, but it needs tiers, bulk discounts, free tier, and data-exchange models.

**9. The Builder vs. Evaluator Distinction**
Half the personas are evaluating their own product (Marcus, Priya, Elena). The other half are evaluating someone else's product (Tomoko for clients, Claire for investments, Kenji for integrations, Craig for projects). These have different trust requirements, different output needs, and different willingness to share results. The tool should know which mode it's in.

**10. The Agent Feedback Loop Gap**
Persona 21 (Claude Code) and Persona 26 (autonomous coding agent) both want to use Alien Eyes findings to autonomously fix issues. But the output format needs to be agent-actionable: specific file paths, line numbers, exact changes needed. This is a higher bar than human-readable findings. If Alien Eyes can close this loop — agent builds, Alien Eyes evaluates, agent fixes — it becomes the quality layer for the entire autonomous development paradigm. This is the biggest opportunity.
