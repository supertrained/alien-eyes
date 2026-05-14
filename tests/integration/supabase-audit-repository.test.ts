import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AuditConfig } from '@/types';
import type { AuditPipelineResult } from '@/orchestrator/pipeline';
import { createSupabaseAuditRepositoryForTests } from '@/lib/audit-repository';
import { resetSupabaseAdminClientForTests, setSupabaseAdminClientForTests } from '@/lib/supabase-admin';

const config: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
  pageLimit: 10,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false
};

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

describe('Supabase audit repository completion ordering', () => {
  beforeEach(() => {
    resetSupabaseAdminClientForTests();
  });

  afterEach(() => {
    resetSupabaseAdminClientForTests();
  });

  it('marks audits complete only after reports and findings are persisted', async () => {
    const operations: string[] = [];
    const fakeClient = {
      from(table: string) {
        return {
          update(payload: unknown) {
            operations.push(`update:${table}`);
            return {
              eq: async () => ({ error: null, data: payload })
            };
          },
          upsert(payload: unknown) {
            operations.push(`upsert:${table}`);
            return Promise.resolve({ error: null, data: payload });
          },
          delete() {
            operations.push(`delete:${table}`);
            return {
              eq: async () => ({ error: null })
            };
          },
          insert(payload: unknown) {
            operations.push(`insert:${table}`);
            return Promise.resolve({ error: null, data: payload });
          }
        };
      }
    };

    setSupabaseAdminClientForTests(fakeClient as any);
    const repository = createSupabaseAuditRepositoryForTests();

    await repository.complete('audit-1', createPipelineResult(), config);

    expect(operations.at(-1)).toBe('update:aeb_audits');
    expect(operations).toContain('insert:aeb_reports');
    expect(operations.indexOf('insert:aeb_reports')).toBeLessThan(operations.indexOf('update:aeb_audits'));
  });

  it('guards progress updates so terminal rows cannot regress', async () => {
    const filters: Array<{ type: string; value?: unknown }> = [];
    const fakeClient = {
      from(_table: string) {
        return {
          update(_payload: unknown) {
            return {
              eq(_column: string, _value: string) {
                filters.push({ type: 'eq' });
                return this;
              },
              neq(_column: string, value: unknown) {
                filters.push({ type: 'neq', value });
                return this;
              },
              lte(_column: string, value: unknown) {
                filters.push({ type: 'lte', value });
                return Promise.resolve({ error: null });
              }
            };
          }
        };
      }
    };

    setSupabaseAdminClientForTests(fakeClient as any);
    const repository = createSupabaseAuditRepositoryForTests();
    await repository.update('audit-1', {
      phase: 'extracting',
      progress: 40,
      message: 'Extracting.'
    });

    expect(filters.filter((item) => item.type === 'neq').map((item) => item.value)).toEqual(['complete', 'error']);
    expect(filters.find((item) => item.type === 'lte')?.value).toBe(40);
  });
});
