import { describe, expect, it, vi } from 'vitest';
import type { AuditConfig, CrawlResult, PageSummary } from '@/types';
import { ModelRouter } from '@/lib/llm/model-router';
import {
  AccessibilityPrimitive,
  AgentNativenessPrimitive,
  CopyUxPrimitive,
  PerformancePrimitive,
  SecurityPrimitive,
  SeoPrimitive,
  createPrimitiveRegistry
} from '@/primitives';

const baseConfig: AuditConfig = {
  tier: 'full_audit',
  ownershipVerified: true,
  pageLimit: 30,
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

const summary: PageSummary = {
  url: 'https://example.com',
  title: 'Home',
  metaTags: {},
  headings: [{ level: 2, text: 'Problem' }],
  links: [],
  images: [{ src: '/hero.png', alt: null, hasAlt: false, isDecorative: false }],
  ariaLandmarks: [],
  structuredData: [],
  securityHeaders: {
    csp: null,
    hsts: null,
    xFrameOptions: null,
    xContentTypeOptions: null,
    referrerPolicy: null,
    permissionsPolicy: null,
    cookies: [{ name: 'session', httpOnly: false, secure: false, sameSite: null, isTracking: false }]
  },
  consoleSummary: { errorCount: 1, warningCount: 0, sampleErrors: ['boom'] },
  networkSummary: {
    totalRequests: 10,
    totalSizeBytes: 3_000_000,
    byType: { script: { count: 9, sizeBytes: 2_500_000 } },
    thirdPartyDomains: ['cdn.example.net'],
    preConsentRequests: false
  },
  performanceMetrics: {
    loadTimeMs: 5_500,
    ttfbMs: 1_500,
    domContentLoadedMs: 5_000,
    totalWeightBytes: 3_000_000,
    renderBlockingCount: 9,
    lcpMs: 3_200,
    cls: 0.35
  },
  sanitizedTextContent: 'Alien Eyes helps audit websites. Learn more.',
  tokenEstimate: 500,
  statusCode: 200
};

describe('primitive registry', () => {
  it('registers all six core primitives', () => {
    expect(createPrimitiveRegistry()).toHaveLength(6);
  });
});

describe('primitives', () => {
  it('produces deterministic findings for seo, accessibility, security, performance, agent nativeness, and copy ux', async () => {
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '[{"pageUrl":"https://example.com","what":"LLM gap","expected":"Expected","why":"Why","verify":"Verify","severity":"low","confidence":0.6}]' }],
          usage: { input_tokens: 100, output_tokens: 50 }
        })
      }
    } as never;
    const router = new ModelRouter({ anthropic });

    const primitives = [
      new SeoPrimitive({ router }),
      new AccessibilityPrimitive({ router }),
      new SecurityPrimitive({ router }),
      new PerformancePrimitive({ router }),
      new AgentNativenessPrimitive({ router }),
      new CopyUxPrimitive({ router })
    ];

    const results = await Promise.all(primitives.map((primitive) => primitive.run(crawl, [summary], baseConfig)));
    expect(results.every((result) => result.status === 'success')).toBe(true);
    expect(results[0]?.data.length).toBeGreaterThan(1);
    expect(results[1]?.data.length).toBeGreaterThan(1);
    expect(results[2]?.data.length).toBeGreaterThan(1);
    expect(results[3]?.data.length).toBeGreaterThan(1);
    expect(results[4]?.data.length).toBeGreaterThan(1);
    expect(results[5]?.data.length).toBeGreaterThan(1);
    expect(router.getCostSnapshot().currentSpend).toBeGreaterThan(0);
  });

  it('keeps unverified checks limited to passive public findings', async () => {
    const unverifiedConfig = { ...baseConfig, ownershipVerified: false, tier: 'quick_check' as const };
    const security = await new SecurityPrimitive().run(crawl, [summary], unverifiedConfig);
    const agentNativeness = await new AgentNativenessPrimitive().run(crawl, [summary], unverifiedConfig);

    expect(security.data.length).toBeGreaterThan(0);
    expect(security.data.some((finding) => finding.what.includes('cookie'))).toBe(false);
    expect(agentNativeness.data.length).toBeGreaterThan(0);
  });
});
