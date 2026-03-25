import { describe, expect, it } from 'vitest';
import type { AuditConfig, CrawlResult, PageSummary } from '@/types';
import { CopyUxPrimitive } from '@/primitives';
import { PageSummarizer } from '@/lib/extraction/page-summarizer';

const config: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
  pageLimit: 10,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false
};

const crawl: CrawlResult = {
  url: 'https://example.com/services',
  pages: [],
  timestamp: new Date().toISOString(),
  browserProfile: 'clean',
  totalDurationMs: 100,
  pagesSkipped: 0,
  errors: [],
  robotsTxtStatus: 'not_found'
};

describe('CopyUxPrimitive advanced checks', () => {
  it('uses structural CTA and trust detection instead of raw keyword scanning', async () => {
    const summary = {
      url: 'https://example.com/services',
      title: 'Services',
      metaTags: {},
      headings: [{ level: 1, text: 'Revenue Signal Sprint' }],
      links: [],
      images: [],
      ariaLandmarks: [],
      structuredData: [],
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
      sanitizedTextContent: 'We help revenue teams improve demand capture.',
      tokenEstimate: 100,
      statusCode: 200,
      pageRole: 'services',
      interactiveElements: [],
      trustSignals: { testimonialCount: 0, logoCount: 0, reviewCount: 0, caseStudyLinkCount: 0 }
    } as PageSummary;

    const result = await new CopyUxPrimitive().run(crawl, [summary], config);
    const texts = result.data.map((finding) => finding.what);

    expect(texts.some((text) => text.includes('call to action'))).toBe(true);
    expect(texts.some((text) => text.includes('trust'))).toBe(true);
  });

  it('classifies page roles from rendered summaries', () => {
    const summary = new PageSummarizer().summarizePage({
      url: 'https://example.com/contact',
      html: '<html><head><title>Contact</title></head><body><h1>Contact us</h1></body></html>',
      dom: '<html></html>',
      screenshot: '/tmp/contact.png',
      consoleLogs: [],
      networkRequests: [],
      responseHeaders: {},
      metaTags: { title: 'Contact' },
      statusCode: 200,
      loadTimeMs: 1,
      viewport: { width: 1440, height: 900 },
      deviceType: 'desktop'
    } as any);

    expect(summary.pageRole).toBe('contact');
  });
});
