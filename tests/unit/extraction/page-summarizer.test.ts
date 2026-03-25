import { describe, expect, it } from 'vitest';
import type { CrawlResult, CrawledPage } from '@/types';
import { PageSummarizer } from '@/lib/extraction/page-summarizer';
import { buildPrimitivePayload, getTokenBudget } from '@/lib/extraction/token-budget';

const page: CrawledPage = {
  url: 'https://example.com',
  html: `
    <html>
      <head>
        <title>Alien Eyes</title>
        <meta name="description" content="Audit your site">
        <link rel="canonical" href="https://example.com/">
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Alien Eyes"}</script>
      </head>
      <body>
        <header><nav aria-label="Primary"><a href="/pricing">Pricing</a></nav></header>
        <main>
          <h1>See your site like an outsider</h1>
          <img src="/hero.png" alt="Dashboard preview" width="1200" height="630">
          <p>Visible copy for humans and agents.</p>
          <div hidden>hidden</div>
        </main>
      </body>
    </html>
  `,
  dom: '<html></html>',
  screenshot: '/tmp/example.png',
  consoleLogs: [
    { level: 'error', message: 'broken bundle', timestamp: new Date().toISOString() },
    { level: 'warning', message: 'deprecated', timestamp: new Date().toISOString() }
  ],
  networkRequests: [
    {
      url: 'https://example.com',
      method: 'GET',
      statusCode: 200,
      contentType: 'text/html',
      size: 1000,
      durationMs: 25,
      resourceType: 'document'
    },
    {
      url: 'https://cdn.example.net/app.js',
      method: 'GET',
      statusCode: 200,
      contentType: 'application/javascript',
      size: 5000,
      durationMs: 40,
      resourceType: 'script'
    }
  ],
  responseHeaders: {
    'content-security-policy': "default-src 'self'",
    'set-cookie': '_ga=1; Secure; HttpOnly; SameSite=Lax'
  },
  metaTags: { title: 'Alien Eyes' },
  statusCode: 200,
  loadTimeMs: 120,
  viewport: { width: 1440, height: 900 },
  deviceType: 'desktop',
  renderedSnapshot: {
    metaTags: {
      title: 'Alien Eyes Rendered',
      description: 'Audit your site',
      canonical: 'https://example.com/'
    },
    headings: [{ level: 1, text: 'Rendered heading' }],
    links: [{ href: '/pricing', text: 'Pricing', isInternal: true, nofollow: false }],
    images: [{ src: '/hero.png', alt: 'Dashboard preview', hasAlt: true, isDecorative: false, width: 1200, height: 630 }],
    ariaLandmarks: [{ role: 'main', label: 'Main content', isNative: true }],
    structuredData: [{ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Alien Eyes' }],
    visibleText: 'Rendered visible text'
  },
  accessibilityTree: {
    role: 'WebArea',
    name: 'Alien Eyes',
    children: [{ role: 'button', name: 'Start audit', children: [] }]
  },
  coreWebVitals: { lcpMs: 1800, cls: 0.02 },
  renderBlockingResourceCount: 1
};

describe('PageSummarizer', () => {
  it('builds a deterministic page summary without hidden text or raw logs', () => {
    const crawl: CrawlResult = {
      url: 'https://example.com',
      pages: [page],
      timestamp: new Date().toISOString(),
      browserProfile: 'clean',
      totalDurationMs: 120,
      pagesSkipped: 0,
      errors: [],
      robotsTxtStatus: 'not_found'
    };

    const [summary] = new PageSummarizer().summarize(crawl);
    expect(summary.title).toBe('Alien Eyes Rendered');
    expect(summary.headings[0]?.text).toBe('Rendered heading');
    expect(summary.structuredData).toHaveLength(1);
    expect(summary.consoleSummary.errorCount).toBe(1);
    expect(summary.consoleSummary.sampleErrors).toEqual(['broken bundle']);
    expect(summary.networkSummary.thirdPartyDomains).toEqual(['cdn.example.net']);
    expect(summary.sanitizedTextContent).toBe('Rendered visible text');
    expect(summary.tokenEstimate).toBeGreaterThan(0);
    expect(summary.performanceMetrics.renderBlockingCount).toBe(1);
    expect(summary.performanceMetrics.lcpMs).toBe(1800);
    expect(summary.accessibilityTree?.children?.[0]?.name).toBe('Start audit');
  });

  it('builds primitive payloads inside the configured token envelopes', () => {
    const summary = new PageSummarizer().summarizePage(page);
    const securityPayload = buildPrimitivePayload(summary, 'security');
    const agentPayload = buildPrimitivePayload(summary, 'agent-nativeness');

    expect(Number(securityPayload.tokenEstimate)).toBeLessThanOrEqual(getTokenBudget('security'));
    expect(Number(agentPayload.tokenEstimate)).toBeLessThanOrEqual(getTokenBudget('agent-nativeness'));
  });
});
