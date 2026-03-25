import { describe, expect, it, vi } from 'vitest';
import type { AuditConfig, CrawlResult, PageSummary } from '@/types';
import { SeoPrimitive } from '@/primitives';

const config: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
  pageLimit: 10,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false
};

describe('SeoPrimitive advanced checks', () => {
  it('uses structured data, sitemap coverage, and link topology signals', async () => {
    const crawl: CrawlResult = {
      url: 'https://example.com',
      pages: [],
      timestamp: new Date().toISOString(),
      browserProfile: 'clean',
      totalDurationMs: 100,
      pagesSkipped: 0,
      errors: [],
      robotsTxtStatus: 'found',
      sitemapUrls: ['https://example.com/', 'https://example.com/pricing', 'https://example.com/orphan']
    } as CrawlResult;

    const homepage = {
      url: 'https://example.com/',
      title: 'Alien Eyes for Technical SEO Audits With Very Long Title That Keeps Going Past Best Practice Limits',
      metaTags: {
        description: 'Short',
        canonical: 'https://example.com/',
        'og:title': 'Alien Eyes'
      },
      headings: [{ level: 1, text: 'Alien Eyes' }],
      links: [{ href: '/pricing', text: 'Pricing', isInternal: true, nofollow: false }],
      images: [],
      ariaLandmarks: [],
      structuredData: [{ name: 'Alien Eyes' }],
      securityHeaders: {
        csp: null,
        hsts: null,
        xFrameOptions: null,
        xContentTypeOptions: null,
        referrerPolicy: null,
        permissionsPolicy: null,
        cookies: []
      },
      consoleSummary: { errorCount: 0, warningCount: 0, sampleErrors: [] },
      networkSummary: {
        totalRequests: 1,
        totalSizeBytes: 100,
        byType: {},
        thirdPartyDomains: [],
        preConsentRequests: false,
        mixedContentRequests: []
      },
      performanceMetrics: {
        loadTimeMs: 100,
        ttfbMs: 50,
        domContentLoadedMs: 100,
        totalWeightBytes: 100,
        renderBlockingCount: 0
      },
      sanitizedTextContent: 'Visible text',
      tokenEstimate: 100,
      statusCode: 200
    } as PageSummary;

    const pricing = {
      ...homepage,
      url: 'https://example.com/pricing',
      title: 'Pricing',
      metaTags: {
        description: 'This description is long enough to be useful to searchers and unique to the pricing page.',
        canonical: 'https://example.com/pricing',
        'og:title': 'Pricing'
      },
      links: []
    } as PageSummary;

    crawl.pages = [
      { url: homepage.url, html: '<html></html>', dom: '', screenshot: '', consoleLogs: [], networkRequests: [], responseHeaders: {}, metaTags: {}, statusCode: 200, loadTimeMs: 1, viewport: { width: 1, height: 1 }, deviceType: 'desktop' },
      { url: pricing.url, html: '<html></html>', dom: '', screenshot: '', consoleLogs: [], networkRequests: [], responseHeaders: {}, metaTags: {}, statusCode: 200, loadTimeMs: 1, viewport: { width: 1, height: 1 }, deviceType: 'desktop' }
    ] as any;

    const result = await new SeoPrimitive({ fetchFn: vi.fn() } as any).run(crawl, [homepage, pricing], config);
    const texts = result.data.map((finding) => finding.what);

    expect(texts.some((text) => text.includes('title') && text.includes('length'))).toBe(true);
    expect(texts.some((text) => text.includes('meta description') && text.includes('length'))).toBe(true);
    expect(texts.some((text) => text.includes('structured data'))).toBe(true);
    expect(texts.some((text) => text.includes('sitemap'))).toBe(true);
    expect(texts.some((text) => text.includes('internal links') || text.includes('orphan'))).toBe(true);
  });
});
