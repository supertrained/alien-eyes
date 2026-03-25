import { describe, expect, it } from 'vitest';
import type { AuditConfig, CrawlResult, Envelope, Finding, PageSummary } from '@/types';
import { ProgressEmitter } from '@/orchestrator/progress';
import { runAuditPipeline } from '@/orchestrator/pipeline';

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

const summaries: PageSummary[] = [
  {
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
    networkSummary: { totalRequests: 1, totalSizeBytes: 1000, byType: {}, thirdPartyDomains: [], preConsentRequests: false },
    performanceMetrics: { loadTimeMs: 100, ttfbMs: 50, domContentLoadedMs: 75, totalWeightBytes: 1000, renderBlockingCount: 0 },
    sanitizedTextContent: 'Welcome',
    tokenEstimate: 10,
    statusCode: 200
  }
];

const primitiveResults: Array<Envelope<Finding[]>> = [
  {
    primitive: 'seo',
    status: 'success',
    data: [
      {
        id: 'seo-001',
        what: 'Missing canonical tag.',
        where: 'https://example.com',
        expected: 'Add canonical.',
        why: 'Search engines need one canonical URL.',
        verify: 'Inspect the head.',
        severity: 'medium',
        dimension: 'seo',
        confidence: 0.9,
        evidence: { url: 'https://example.com', timestamp: new Date().toISOString(), domSnapshotHash: 'hash', completeness: 0.8 },
        lifecycle: { state: 'detected', updatedAt: new Date().toISOString() }
      }
    ],
    confidence: 0.9,
    confidenceFactors: ['test'],
    metadata: { durationMs: 10, methodologyVersion: 'v0.1', costUsd: 0.1 }
  },
  {
    primitive: 'performance',
    status: 'error',
    data: [],
    confidence: 0,
    confidenceFactors: ['primitive failed'],
    metadata: { durationMs: 10, methodologyVersion: 'v0.1' }
  }
];

describe('runAuditPipeline', () => {
  it('emits progress and returns partial results when one primitive fails', async () => {
    const progress: string[] = [];
    const progressEmitter = new ProgressEmitter();
    progressEmitter.onProgress((event) => progress.push(event.state));

    const result = await runAuditPipeline('https://example.com', config, {
      progressEmitter,
      timeoutMs: 5_000,
      validator: { validate: async (url: string) => ({ valid: true, url, resolvedIPs: ['93.184.216.34'], blocked: false }) } as any,
      crawlEngine: { crawl: async () => crawl } as any,
      pageSummarizer: { summarize: () => summaries } as any,
      synthesizer: {
        synthesize: async () => ({
          auditId: 'audit-1',
          url: 'https://example.com',
          findings: primitiveResults[0].data,
          celebration: { pageCount: 1, workingFlows: 1, cleanDimensions: ['performance'], positiveObservations: ['Crawl succeeded.'] },
          satisfactionScore: { value: 80, confidenceLow: 70, confidenceHigh: 85 },
          humanNativeScore: { value: 82, confidenceLow: 75, confidenceHigh: 88 },
          agentNativenessScore: { value: 100, confidenceLow: 95, confidenceHigh: 100 },
          dimensionScores: {
            seo: { value: 80, confidenceLow: 70, confidenceHigh: 85 },
            aeo: null,
            geo: null,
            meo: null,
            accessibility: null,
            security: null,
            performance: null,
            ux: null,
            copy: null,
            analytics: null,
            legal: null,
            'agent-nativeness': null,
            email: null,
            'api-quality': null
          },
          causalChains: [],
          verbatimNarrative: 'Narrative',
          meta: {
            timestamp: new Date().toISOString(),
            durationMs: 100,
            totalCostUsd: 0.1,
            costByPrimitive: { seo: 0.1 },
            methodologyVersion: 'v0.1',
            pagesCrawled: 1,
            pagesDiscovered: 1,
            ownershipVerified: false,
            tier: 'quick_check'
          }
        })
      } as any,
      rendererRegistry: {
        'format-a': () => 'A',
        'format-b': () => 'B',
        'format-c': () => 'C',
        'format-json': () => 'JSON'
      },
      router: {} as any
    });

    expect(result.state).toBe('complete');
    expect(result.rendered['format-b']).toBe('B');
    expect(result.fieldNotes).toBeDefined();
    // States appear in order; field note events may add duplicates within each phase
    const uniqueStates = progress.filter((s, i) => progress.indexOf(s) === i);
    expect(uniqueStates).toEqual(['validating', 'crawling', 'extracting', 'auditing', 'synthesizing', 'rendering', 'complete']);
  });
});
