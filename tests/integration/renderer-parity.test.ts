import { describe, expect, it } from 'vitest';
import type { SynthesisResult } from '@/types';
import { renderFormatA } from '@/renderers/format-a';
import { renderFormatB } from '@/renderers/format-b';
import { renderFormatC } from '@/renderers/format-c';
import { renderFormatJson } from '@/renderers/format-json';

describe('Renderer parity', () => {
  it('verifies all renderers consume the same SynthesisResult without dropping findings', () => {
    const result: SynthesisResult = {
      auditId: 'audit-1',
      url: 'https://example.com',
      findings: [
        {
          id: 'seo-001',
          what: 'Missing canonical URL.',
          where: 'https://example.com',
          expected: 'Add a canonical tag.',
          why: 'Search engines need a canonical URL.',
          verify: 'Inspect the head.',
          severity: 'medium',
          dimension: 'seo',
          confidence: 0.9,
          evidence: {
            url: 'https://example.com',
            timestamp: new Date().toISOString(),
            domSnapshotHash: 'hash',
            completeness: 0.8
          },
          lifecycle: {
            state: 'detected',
            updatedAt: new Date().toISOString()
          }
        }
      ],
      celebration: {
        pageCount: 1,
        workingFlows: 1,
        cleanDimensions: ['accessibility'],
        positiveObservations: ['Crawl succeeded.']
      },
      satisfactionScore: { value: 80, confidenceLow: 70, confidenceHigh: 85, grade: 'B' as const, label: 'Good', guidance: 'Solid. Address HIGHs before launch.' },
      humanNativeScore: { value: 82, confidenceLow: 75, confidenceHigh: 88, grade: 'B' as const, label: 'Good', guidance: 'Solid. Address HIGHs before launch.' },
      agentNativenessScore: { value: 90, confidenceLow: 85, confidenceHigh: 95, grade: 'A' as const, label: 'Excellent', guidance: 'Ship with confidence. Minor polish only.' },
      dimensionScores: {
        seo: { value: 80, confidenceLow: 70, confidenceHigh: 85, grade: 'B' as const, label: 'Good', guidance: 'Solid. Address HIGHs before launch.' },
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
      verbatimNarrative: 'Narrative.',
      meta: {
        timestamp: new Date().toISOString(),
        durationMs: 100,
        totalCostUsd: 0,
        costByPrimitive: {},
        methodologyVersion: 'v0.1',
        pagesCrawled: 1,
        pagesDiscovered: 1,
        ownershipVerified: false,
        tier: 'quick_check'
      }
    };

    const outputs = [
      renderFormatA(result),
      renderFormatB(result),
      renderFormatC(result),
      renderFormatJson(result)
    ];

    expect(outputs.every((output) => output.includes('Missing canonical URL.'))).toBe(true);
    expect(JSON.parse(outputs[3]!).findings).toHaveLength(1);
  });
});
