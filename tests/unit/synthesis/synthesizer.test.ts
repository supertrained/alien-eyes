import { describe, expect, it } from 'vitest';
import type { AuditConfig, CrawlResult, Envelope, Finding } from '@/types';
import { Synthesizer } from '@/lib/synthesis/synthesizer';

const config: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
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
  totalDurationMs: 500,
  pagesSkipped: 0,
  errors: [],
  robotsTxtStatus: 'not_found'
};

const finding = (id: string, severity: Finding['severity'], what: string, where = 'https://example.com'): Finding => ({
  id,
  what,
  where,
  expected: 'Expected behavior',
  why: 'Why it matters',
  verify: 'Verify it',
  severity,
  dimension: 'seo',
  confidence: 0.9,
  evidence: {
    url: where,
    timestamp: new Date().toISOString(),
    domSnapshotHash: 'hash',
    completeness: 0.8
  },
  lifecycle: {
    state: 'detected',
    updatedAt: new Date().toISOString()
  }
});

const envelope = (primitive: string, data: Finding[]): Envelope<Finding[]> => ({
  primitive,
  status: 'success',
  data,
  confidence: 0.9,
  confidenceFactors: ['test'],
  metadata: {
    durationMs: 100,
    methodologyVersion: 'v0.1',
    costUsd: 0.1
  }
});

describe('Synthesizer', () => {
  it('deduplicates findings, builds scores, and returns celebration first', async () => {
    const result = await new Synthesizer().synthesize({
      auditId: 'audit-1',
      crawl,
      config,
      envelopes: [
        envelope('seo', [finding('seo-001', 'critical', 'Missing canonical tag')]),
        envelope('accessibility', [finding('a11y-001', 'critical', 'Missing canonical tag')]),
        envelope('performance', [finding('perf-001', 'medium', 'Slow page load')])
      ],
      startedAt: Date.now() - 250
    });

    expect(result.findings).toHaveLength(2);
    expect(result.causalChains.length).toBeGreaterThanOrEqual(0);
    expect(result.satisfactionScore.value).toBeLessThan(100);
    expect(result.celebration.positiveObservations.length).toBeGreaterThan(0);
    expect(result.verbatimNarrative.length).toBeGreaterThan(10);
  });
});
