import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditConfig } from '@/types';
import type { AuditPipelineResult } from '@/orchestrator/pipeline';
import {
  createMemoryAuditRepositoryForTests,
  resetAuditRepositoryForTests,
  setAuditRepositoryForTests,
  type AuditJobRecord
} from '@/lib/audit-repository';
import {
  getAuditJob,
  resetAuditJobDependenciesForTests,
  runAuditJob,
  setAuditJobDependenciesForTests,
  startAuditJob
} from '@/lib/audit-jobs';

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
        technical: null,
        'api-quality': null
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

function runningJob(id = 'audit-1'): AuditJobRecord {
  const now = new Date().toISOString();
  const config: AuditConfig = {
    tier: 'quick_check',
    ownershipVerified: false,
    pageLimit: 10,
    costBudget: 5,
    methodologyVersion: 'v0.1',
    isReAudit: false
  };

  return {
    id,
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

describe('audit job orchestration', () => {
  beforeEach(() => {
    resetAuditRepositoryForTests();
    resetAuditJobDependenciesForTests();
    setAuditRepositoryForTests(createMemoryAuditRepositoryForTests());
  });

  afterEach(() => {
    resetAuditRepositoryForTests();
    resetAuditJobDependenciesForTests();
  });

  it('enqueues jobs when queue configuration is available', async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);

    setAuditJobDependenciesForTests({
      getQueueConfig: () => ({ connection: { host: 'localhost', port: 6379 } }),
      createQueue: () => ({ add, close })
    });

    const job = await startAuditJob({ url: 'https://example.com', quick: true, pageLimit: 5 });

    expect(add).toHaveBeenCalledTimes(1);
    expect(job.status).toBe('pending');
    expect(job.phase).toBe('pending');
  });

  it('falls back to the local runner when queue configuration is absent', async () => {
    const runLocalAudit = vi.fn().mockResolvedValue(undefined);
    setAuditJobDependenciesForTests({
      getQueueConfig: () => null,
      runLocalAudit
    });

    const job = await startAuditJob({ url: 'https://example.com' });

    expect(runLocalAudit).toHaveBeenCalledTimes(1);
    expect(job.status).toBe('pending');
  });

  it('persists completion when the audit pipeline succeeds', async () => {
    const repository = createMemoryAuditRepositoryForTests();
    setAuditRepositoryForTests(repository);
    await repository.create(runningJob());

    setAuditJobDependenciesForTests({
      loadPipeline: async () => async () => createPipelineResult()
    });

    await runAuditJob({
      auditId: 'audit-1',
      url: 'https://example.com',
      config: runningJob().config
    });

    const stored = await getAuditJob('audit-1');
    expect(stored?.status).toBe('complete');
    expect(stored?.result?.rendered['format-b']).toBe('B');
  });

  it('persists error state when the audit pipeline fails', async () => {
    const repository = createMemoryAuditRepositoryForTests();
    setAuditRepositoryForTests(repository);
    await repository.create(runningJob());

    setAuditJobDependenciesForTests({
      loadPipeline: async () => {
        throw new Error('pipeline failed');
      }
    });

    await expect(runAuditJob({
      auditId: 'audit-1',
      url: 'https://example.com',
      config: runningJob().config
    })).rejects.toThrow('pipeline failed');

    const stored = await getAuditJob('audit-1');
    expect(stored?.status).toBe('error');
    expect(stored?.error).toBe('pipeline failed');
    expect(stored?.progress).toBe(100);
  });

  it('does not let late progress events overwrite a completed audit', async () => {
    const repository = createMemoryAuditRepositoryForTests();
    setAuditRepositoryForTests(repository);
    await repository.create(runningJob());

    setAuditJobDependenciesForTests({
      loadPipeline: async () => async (_url, _config, { progressEmitter }) => {
        setTimeout(() => {
          progressEmitter.emitProgress({
            state: 'extracting',
            progress: 40,
            message: 'Late progress event'
          });
        }, 0);
        return createPipelineResult();
      }
    });

    await runAuditJob({
      auditId: 'audit-1',
      url: 'https://example.com',
      config: runningJob().config
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const stored = await getAuditJob('audit-1');
    expect(stored?.status).toBe('complete');
    expect(stored?.progress).toBe(100);
    expect(stored?.phase).toBe('complete');
  });
});
