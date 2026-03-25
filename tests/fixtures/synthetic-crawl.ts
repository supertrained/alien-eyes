import type { ConsoleEntry, CrawlResult, CrawledPage, NetworkEntry } from '@/types';

const TIMESTAMP = '2026-03-05T12:00:00Z';
const VIEWPORT = { width: 1440, height: 900 };

export const syntheticCrawl: CrawlResult = {
  url: 'https://supertrained.ai/',
  timestamp: TIMESTAMP,
  browserProfile: 'clean',
  totalDurationMs: 42_000,
  pagesSkipped: 0,
  errors: [],
  detectedStack: ['next.js', 'cloudflare'],
  robotsTxtStatus: 'found',
  pages: [
    createPage({
      path: '/',
      html: `
        <html>
          <head>
            <title>SuperTrained | AI Marketing Systems</title>
            <meta name="description" content="Signal-first AI growth systems for teams that need momentum.">
            <meta property="og:title" content="SuperTrained">
            <meta property="og:description" content="Grow with signal-first AI systems.">
            <script type="application/ld+json">
              {"@context":"https://schema.org","@type":"ProfessionalService","name":"SuperTrained"}
            </script>
          </head>
          <body>
            <main id="main-content">
              <a href="#content">Skip to main content</a>
              <nav aria-label="Primary navigation">
                <a href="/services">Services</a>
                <a href="/contact">Book a Conversation</a>
              </nav>
              <section aria-label="Stats">
                <div><span>0</span> hrs/week</div>
                <div><span>$0K+/yr</span></div>
                <div><span>0%</span></div>
              </section>
              <section id="content">
                <h1>See your market before your competitors do</h1>
                <p>Trusted by operators who want clarity, privacy, and evidence.</p>
                <img src="/hero.png" alt="Dashboard preview">
                <h2>Products we've shipped</h2>
                <h3><img src="/cloneicp.svg" alt="CloneICP"></h3>
                <h3><img src="/snowthere.svg" alt="SnowThere"></h3>
              </section>
              <footer>
                <a href="/privacy">Privacy</a>
              </footer>
            </main>
          </body>
        </html>
      `,
      responseHeaders: {
        server: 'cloudflare',
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'camera=(), microphone=(), geolocation=()',
        'set-cookie': 'session=abc; Secure; HttpOnly; SameSite=Lax'
      },
      metaTags: {
        description: 'Signal-first AI growth systems for teams that need momentum.',
        'og:title': 'SuperTrained',
        'og:description': 'Grow with signal-first AI systems.'
      },
      networkRequests: [
        documentRequest('/'),
        scriptRequest('https://www.google-analytics.com/g/collect'),
        scriptRequest('https://pagead2.googlesyndication.com/ccm/collect'),
        scriptRequest('https://cdn.supertrained.ai/app.js'),
        scriptRequest('https://cdn.supertrained.ai/vendor.js'),
        stylesheetRequest('https://cdn.supertrained.ai/site.css')
      ]
    }),
    createPage({
      path: '/services',
      html: `
        <html>
          <head>
            <title>AI Services | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="Workflow Automation, Custom AI Agents, Managed AI Operations, and Fractional AI Department.">
            <meta property="og:title" content="AI Services | SuperTrained">
            <meta property="og:description" content="Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/contact">Contact</a></nav></header>
              <section id="content">
                <h1>Signal-first growth sprints</h1>
                <h2>Revenue Signal Sprint</h2>
                <h2>Demand Capture Sprint</h2>
                <h2>Reliability Sprint</h2>
                <img src="/services.png" alt="Services overview">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'Workflow Automation, Custom AI Agents, Managed AI Operations, and Fractional AI Department.',
        'og:title': 'AI Services | SuperTrained',
        'og:description': 'Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best.'
      }
    }),
    createPage({
      path: '/blog',
      html: `
        <html>
          <head>
            <title>Blog | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="Essays about AI visibility and demand capture.">
            <meta property="og:title" content="Blog | SuperTrained">
            <meta property="og:description" content="Essays about AI visibility and demand capture.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/services">Services</a></nav></header>
              <section id="content">
                <h1>Blog</h1>
                <img src="/blog.png" alt="Blog hero">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'Essays about AI visibility and demand capture.',
        'og:title': 'Blog | SuperTrained',
        'og:description': 'Essays about AI visibility and demand capture.'
      },
      consoleLogs: [reactHydrationError()]
    }),
    createPage({
      path: '/about',
      html: `
        <html>
          <head>
            <title>About | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="About SuperTrained.">
            <meta property="og:title" content="About | SuperTrained">
            <meta property="og:description" content="Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/contact">Contact</a></nav></header>
              <section id="content">
                <h1>About</h1>
                <img src="/about.png" alt="Founder portrait">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'About SuperTrained.',
        'og:title': 'About | SuperTrained',
        'og:description': 'Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best.'
      }
    }),
    createPage({
      path: '/method',
      html: `
        <html>
          <head>
            <title>Method | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="How SuperTrained works.">
            <meta property="og:title" content="Method | SuperTrained">
            <meta property="og:description" content="Method overview.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/services">Services</a></nav></header>
              <section id="content">
                <h1>Method</h1>
                <img src="/method.png" alt="Method diagram">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'How SuperTrained works.',
        'og:title': 'Method | SuperTrained',
        'og:description': 'Method overview.'
      }
    }),
    createPage({
      path: '/contact',
      html: `
        <html>
          <head>
            <title>Contact | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="Book a strategy session with SuperTrained.">
            <meta property="og:title" content="Contact | SuperTrained">
            <meta property="og:description" content="Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <section id="content">
                <h1>Book a Conversation</h1>
                <div id="calendly-widget" style="min-height:420px;background:#e5e5e5"></div>
                <p>To view the booking calendar, please accept cookies. Calendly uses cookies to display the scheduling widget.</p>
                <a href="https://calendly.com/supertrained/intro-call">Direct Calendly link</a>
                <img src="/contact.png" alt="Contact card">
                <h1>Secondary heading causing hierarchy issue</h1>
                <h3>FAQ</h3>
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'Book a strategy session with SuperTrained.',
        'og:title': 'Contact | SuperTrained',
        'og:description': 'Boutique AI automation agency. Custom AI agents that eliminate repetitive work so your team focuses on what humans do best.'
      }
    }),
    createPage({
      path: '/blueprint',
      html: `
        <html>
          <head>
            <title>Free AI Automation Blueprint | SuperTrained | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="Free AI Automation Blueprint.">
            <meta property="og:title" content="Free AI Automation Blueprint | SuperTrained">
            <meta property="og:description" content="Blueprint overview.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/contact">Contact</a></nav></header>
              <section id="content">
                <h1>Blueprint</h1>
                <img src="/blueprint.png" alt="Blueprint cover">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'Free AI Automation Blueprint.',
        'og:title': 'Free AI Automation Blueprint | SuperTrained',
        'og:description': 'Blueprint overview.'
      },
      consoleLogs: [reactHydrationError()]
    }),
    createPage({
      path: '/work',
      html: `
        <html>
          <head>
            <title>Work | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/">
            <meta name="description" content="Selected work.">
            <meta property="og:title" content="Work | SuperTrained">
            <meta property="og:description" content="Selected work.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/services">Services</a></nav></header>
              <section id="content">
                <h1>Work</h1>
                <h3>Outcomes</h3>
                <h5>Deep case study</h5>
                <img src="/work.png" alt="Work snapshot">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/',
        description: 'Selected work.',
        'og:title': 'Work | SuperTrained',
        'og:description': 'Selected work.'
      },
      consoleLogs: [reactHydrationError()]
    }),
    createPage({
      path: '/meo',
      html: `
        <html>
          <head>
            <title>MEO | SuperTrained</title>
            <link rel="canonical" href="https://supertrained.ai/meo">
            <meta name="description" content="Machine experience optimization.">
            <meta property="og:title" content="MEO | SuperTrained">
            <meta property="og:description" content="Machine experience optimization.">
          </head>
          <body>
            <main>
              <a href="#content">Skip to main content</a>
              <header><nav aria-label="Primary"><a href="/services">Services</a></nav></header>
              <section id="content">
                <h1>MEO</h1>
                <p>Machine experience optimization for teams that ship with evidence.</p>
                <img src="/meo.png" alt="MEO diagram">
              </section>
            </main>
          </body>
        </html>
      `,
      metaTags: {
        canonical: 'https://supertrained.ai/meo',
        description: 'Machine experience optimization.',
        'og:title': 'MEO | SuperTrained',
        'og:description': 'Machine experience optimization.'
      }
    }),
    createPage({
      path: '/robots.txt',
      html: `
        <pre>
User-agent: *
Allow: /
# llms.txt: https://supertrained.ai/llms.txt
# llms-full.txt: https://supertrained.ai/llms-full.txt
        </pre>
      `,
      metaTags: {},
      responseHeaders: {
        server: 'cloudflare',
        'content-type': 'text/plain; charset=utf-8'
      },
      statusCode: 200
    })
  ]
};

function createPage(options: {
  path: string;
  html: string;
  metaTags?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  consoleLogs?: ConsoleEntry[];
  networkRequests?: NetworkEntry[];
  statusCode?: number;
}): CrawledPage {
  const url = new URL(options.path, 'https://supertrained.ai').toString();
  return {
    url,
    html: options.html.trim(),
    dom: options.html.trim(),
    screenshot: `.tmp/screenshots/${sanitizePath(options.path)}.png`,
    consoleLogs: options.consoleLogs ?? [],
    networkRequests: options.networkRequests ?? [documentRequest(options.path)],
    responseHeaders: options.responseHeaders ?? {
      server: 'cloudflare',
      'content-type': 'text/html; charset=utf-8',
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()'
    },
    metaTags: options.metaTags ?? {},
    statusCode: options.statusCode ?? 200,
    loadTimeMs: 120,
    viewport: VIEWPORT,
    deviceType: 'desktop'
  };
}

function documentRequest(path: string): NetworkEntry {
  return {
    url: new URL(path, 'https://supertrained.ai').toString(),
    method: 'GET',
    statusCode: 200,
    contentType: 'text/html; charset=utf-8',
    size: 24_000,
    durationMs: 35,
    resourceType: 'document'
  };
}

function scriptRequest(url: string): NetworkEntry {
  return {
    url,
    method: 'GET',
    statusCode: 200,
    contentType: 'application/javascript',
    size: 12_000,
    durationMs: 22,
    resourceType: 'script'
  };
}

function stylesheetRequest(url: string): NetworkEntry {
  return {
    url,
    method: 'GET',
    statusCode: 200,
    contentType: 'text/css',
    size: 4_000,
    durationMs: 18,
    resourceType: 'stylesheet'
  };
}

function reactHydrationError(): ConsoleEntry {
  return {
    level: 'error',
    message: 'Minified React error #418: Hydration failed because the server rendered HTML did not match the client.',
    timestamp: TIMESTAMP
  };
}

function sanitizePath(path: string): string {
  return path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'homepage';
}
