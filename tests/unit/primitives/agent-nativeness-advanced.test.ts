import { describe, expect, it, vi } from 'vitest';
import type { AuditConfig, CrawlResult, PageSummary } from '@/types';
import { AgentNativenessPrimitive } from '@/primitives';

const config: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
  pageLimit: 10,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false
};

const crawl: CrawlResult = {
  url: 'https://example.com',
  pages: [],
  timestamp: new Date().toISOString(),
  browserProfile: 'clean',
  totalDurationMs: 100,
  pagesSkipped: 0,
  errors: [],
  robotsTxtStatus: 'not_found'
};

describe('AgentNativenessPrimitive advanced checks', () => {
  it('runs passive endpoint checks without ownership verification', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/openapi.json')) {
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('', { status: 404 });
    });

    const summary = {
      url: 'https://example.com',
      title: 'Home',
      metaTags: {},
      headings: [{ level: 1, text: 'Home' }],
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
      sanitizedTextContent: 'Visible text',
      tokenEstimate: 100,
      statusCode: 200
    } as PageSummary;

    const result = await new AgentNativenessPrimitive({ fetchFn } as any).run(crawl, [summary], config);
    const texts = result.data.map((finding) => finding.what);

    expect(texts.some((text) => text.includes('llms.txt') || text.includes('agent guidance'))).toBe(true);
    expect(texts.some((text) => text.includes('OpenAPI') || text.includes('machine-consumable'))).toBe(false);
  });
});
