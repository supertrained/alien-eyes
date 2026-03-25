import { describe, expect, it, vi } from 'vitest';
import type { AuditConfig, CrawlResult, PageSummary } from '@/types';
import { SecurityPrimitive } from '@/primitives';

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

function createSummary(): PageSummary {
  return {
    url: 'https://example.com',
    title: 'Home',
    metaTags: {},
    headings: [{ level: 1, text: 'Home' }],
    links: [],
    images: [],
    ariaLandmarks: [],
    structuredData: [],
    securityHeaders: {
      csp: "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'",
      hsts: null,
      xFrameOptions: null,
      xContentTypeOptions: null,
      referrerPolicy: null,
      permissionsPolicy: null,
      accessControlAllowOrigin: '*',
      accessControlAllowCredentials: 'true',
      cookies: [{ name: 'session', httpOnly: false, secure: false, sameSite: null, isTracking: false }]
    },
    consoleSummary: { errorCount: 0, warningCount: 0, sampleErrors: [] },
    networkSummary: {
      totalRequests: 2,
      totalSizeBytes: 100,
      byType: {},
      thirdPartyDomains: [],
      preConsentRequests: true,
      mixedContentRequests: ['http://insecure.example.com/script.js']
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
  };
}

describe('SecurityPrimitive advanced checks', () => {
  it('returns passive posture findings for unverified targets without leaking verified-only checks', async () => {
    const config: AuditConfig = {
      tier: 'quick_check',
      ownershipVerified: false,
      pageLimit: 10,
      costBudget: 5,
      methodologyVersion: 'v0.1',
      isReAudit: false
    };

    const result = await new SecurityPrimitive().run(crawl, [createSummary()], config);
    const texts = result.data.map((finding) => finding.what);

    expect(texts.some((text) => text.includes('X-Frame-Options'))).toBe(true);
    expect(texts.some((text) => text.includes('unsafe-inline') || text.includes('unsafe-eval'))).toBe(true);
    expect(texts.some((text) => text.includes('Access-Control-Allow-Origin'))).toBe(true);
    expect(texts.some((text) => text.includes('mixed-content'))).toBe(true);
    expect(texts.some((text) => text.includes('cookie'))).toBe(false);
  });

  it('adds verified-only cookie and exposed file findings when ownership is verified', async () => {
    const config: AuditConfig = {
      tier: 'quick_check',
      ownershipVerified: true,
      pageLimit: 10,
      costBudget: 5,
      methodologyVersion: 'v0.1',
      isReAudit: false
    };
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/.git/HEAD')) {
        return new Response('ref: refs/heads/main', { status: 200 });
      }
      return new Response('', { status: 404 });
    });

    const result = await new SecurityPrimitive({ fetchFn } as any).run(crawl, [createSummary()], config);
    const texts = result.data.map((finding) => finding.what);

    expect(texts.some((text) => text.includes('cookie'))).toBe(true);
    expect(texts.some((text) => text.includes('.git/HEAD'))).toBe(true);
  });
});
