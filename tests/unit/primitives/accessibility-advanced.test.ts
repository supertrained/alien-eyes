import { describe, expect, it } from 'vitest';
import type { AuditConfig, CrawlResult, PageSummary } from '@/types';
import { AccessibilityPrimitive } from '@/primitives';

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

describe('AccessibilityPrimitive advanced checks', () => {
  it('flags contrast failures and unnamed interactive controls with WCAG references', async () => {
    const summary = {
      url: 'https://example.com',
      title: 'Home',
      metaTags: {},
      headings: [{ level: 1, text: 'Home' }],
      links: [{ href: '#main', text: 'Skip to content', isInternal: true, nofollow: false }],
      images: [],
      ariaLandmarks: [{ role: 'main', isNative: true }],
      accessibilityTree: {
        role: 'WebArea',
        children: [
          { role: 'button', name: '', children: [] },
          { role: 'link', name: 'Learn more', children: [] }
        ]
      },
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
      statusCode: 200,
      contrastIssues: [
        {
          text: 'Muted legal copy',
          ratio: 2.9,
          foreground: '#777777',
          background: '#ffffff',
          largeText: false
        }
      ]
    } as PageSummary;

    const result = await new AccessibilityPrimitive().run(crawl, [summary], config);
    const descriptions = result.data.map((finding) => `${finding.what} ${finding.verify}`);

    expect(descriptions.some((text) => text.includes('contrast'))).toBe(true);
    expect(descriptions.some((text) => text.includes('WCAG 1.4.3'))).toBe(true);
    expect(descriptions.some((text) => text.includes('accessible name'))).toBe(true);
    expect(descriptions.some((text) => text.includes('WCAG 4.1.2'))).toBe(true);
  });
});
