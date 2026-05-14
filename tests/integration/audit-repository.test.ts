import { beforeEach, describe, expect, it } from 'vitest';
import type { AuditConfig } from '@/types';
import type { AuditPipelineResult } from '@/orchestrator/pipeline';
import {
  createMemoryAuditRepositoryForTests,
  resetAuditRepositoryForTests,
  setAuditRepositoryForTests,
  type AuditJobRecord
} from '@/lib/audit-repository';

const config: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
  pageLimit: 10,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false
};

function createJob(): AuditJobRecord {
  const now = new Date().toISOString();
  return {
    id: 'audit-1',
    url: 'https://example.com',
    status: 'pending',
    progress: 0,
    phase: 'pending',
    message: 'Queued for audit.',
    createdAt: now,
    updatedAt: now,
    config
  };
}

function createPipelineResult(): AuditPipelineResult {
  return {
    state: 'complete',
    crawl: {
      url: 'https://example.com',
      pages: [],
      timestamp: new Date().toISOString(),
      browserProfile: 'clean',
      totalDurationMs: 100,
      pagesSkipped: 0,
      errors: [],
      robotsTxtStatus: 'not_found'
    },
    summaries: [],
    primitiveResults: [],
    synthesis: {
      auditId: 'audit-1',
      url: 'https://example.com',
      findings: [],
      celebration: {
        pageCount: 0,
        workingFlows: 1,
        cleanDimensions: ['seo'],
        positiveObservations: ['Audit completed.']
      },
      satisfactionScore: { value: 100, confidenceLow: 95, confidenceHigh: 100, grade: 'A' as const, label: 'Excellent', guidance: 'Ship with confidence. Minor polish only.' },
      humanNativeScore: { value: 100, confidenceLow: 95, confidenceHigh: 100, grade: 'A' as const, label: 'Excellent', guidance: 'Ship with confidence. Minor polish only.' },
      agentNativenessScore: { value: 100, confidenceLow: 95, confidenceHigh: 100, grade: 'A' as const, label: 'Excellent', guidance: 'Ship with confidence. Minor polish only.' },
      dimensionScores: {
        seo: null,
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
        'api-quality': null,
        traffic: null,
        cro: null,
        ads: null,
        competitors: null,
        company: null,
        brand: null,
        social: null,
        pricing: null,
        content: null,
        messaging: null,
        technical: null
      },
      causalChains: [],
      verbatimNarrative: 'Audit complete.',
      meta: {
        timestamp: new Date().toISOString(),
        durationMs: 100,
        totalCostUsd: 0,
        costByPrimitive: {},
        methodologyVersion: 'v0.1',
        pagesCrawled: 0,
        pagesDiscovered: 0,
        ownershipVerified: false,
        tier: 'quick_check'
      }
    },
    rendered: {
      'format-a': 'A',
      'format-b': 'B',
      'format-c': 'C',
      'format-json': JSON.stringify({
        auditId: 'audit-1',
        url: 'https://example.com',
        findings: []
      })
    },
    fieldNotes: []
  };
}

describe('audit repository persistence', () => {
  beforeEach(() => {
    resetAuditRepositoryForTests();
  });

  it('round-trips job create, update, complete, and get through the memory repository', async () => {
    const repository = createMemoryAuditRepositoryForTests();
    setAuditRepositoryForTests(repository);

    const job = createJob();
    await repository.create(job);
    await repository.update(job.id, {
      status: 'running',
      phase: 'crawling',
      progress: 25,
      message: 'Crawling pages.'
    });
    await repository.complete(job.id, createPipelineResult(), config);

    const stored = await repository.get(job.id);

    expect(stored?.status).toBe('complete');
    expect(stored?.progress).toBe(100);
    expect(stored?.phase).toBe('complete');
    expect(stored?.result?.rendered['format-b']).toBe('B');
    expect(stored?.result?.synthesis.auditId).toBe('audit-1');
  });

  it('isolates repository state between resets', async () => {
    const repository = createMemoryAuditRepositoryForTests();
    setAuditRepositoryForTests(repository);
    await repository.create(createJob());

    resetAuditRepositoryForTests();
    const fresh = createMemoryAuditRepositoryForTests();

    await expect(fresh.get('audit-1')).resolves.toBeUndefined();
  });
});
