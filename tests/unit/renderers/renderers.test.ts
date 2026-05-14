import { describe, expect, it } from 'vitest';
import type { SynthesisResult } from '@/types';
import { renderFormatA } from '@/renderers/format-a';
import { renderFormatB } from '@/renderers/format-b';
import { renderFormatC } from '@/renderers/format-c';
import { renderFormatJson } from '@/renderers/format-json';

const result: SynthesisResult = {
  auditId: 'audit-1',
  url: 'https://example.com',
  findings: [
    {
      id: 'seo-001',
      what: 'Missing canonical tag.',
      where: 'https://example.com',
      expected: 'Add a canonical tag.',
      why: 'Search engines need it.',
      verify: 'Inspect the head.',
      severity: 'critical',
      dimension: 'seo',
      confidence: 0.95,
      evidence: { url: 'https://example.com', timestamp: new Date().toISOString(), domSnapshotHash: 'hash', completeness: 0.8 },
      lifecycle: { state: 'detected', updatedAt: new Date().toISOString() }
    },
    {
      id: 'perf-001',
      what: 'Slow page load.',
      where: 'https://example.com/pricing',
      expected: 'Reduce load time.',
      why: 'Users abandon slow pages.',
      verify: 'Run performance audit.',
      severity: 'medium',
      dimension: 'performance',
      confidence: 0.8,
      evidence: { url: 'https://example.com/pricing', timestamp: new Date().toISOString(), domSnapshotHash: 'hash-2', completeness: 0.8 },
      lifecycle: { state: 'detected', updatedAt: new Date().toISOString() }
    }
  ],
  celebration: {
    pageCount: 2,
    workingFlows: 1,
    cleanDimensions: ['accessibility'],
    positiveObservations: ['The crawl completed cleanly.']
  },
  satisfactionScore: { value: 71, confidenceLow: 65, confidenceHigh: 76, grade: 'C' as const, label: 'Needs Work', guidance: 'Functional but users will notice gaps.' },
  humanNativeScore: { value: 70, confidenceLow: 64, confidenceHigh: 75, grade: 'C' as const, label: 'Needs Work', guidance: 'Functional but users will notice gaps.' },
  agentNativenessScore: { value: 88, confidenceLow: 82, confidenceHigh: 92, grade: 'B' as const, label: 'Good', guidance: 'Solid. Address HIGHs before launch.' },
  dimensionScores: {
    seo: { value: 50, confidenceLow: 45, confidenceHigh: 60, grade: 'D' as const, label: 'Poor', guidance: 'Fix the top 5 before your next deploy.' },
    aeo: null,
    geo: null,
    meo: null,
    accessibility: null,
    security: null,
    performance: { value: 82, confidenceLow: 75, confidenceHigh: 88, grade: 'B' as const, label: 'Good', guidance: 'Solid. Address HIGHs before launch.' },
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
  verbatimNarrative: 'I explored the site and hit a canonical issue followed by slow loading.',
  meta: {
    timestamp: new Date().toISOString(),
    durationMs: 1000,
    totalCostUsd: 0.3,
    costByPrimitive: { seo: 0.1, performance: 0.2 },
    methodologyVersion: 'v0.1',
    pagesCrawled: 2,
    pagesDiscovered: 2,
    ownershipVerified: false,
    tier: 'quick_check'
  }
};

describe('renderers', () => {
  it('preserves finding ids across all four formats', () => {
    const formatA = renderFormatA(result);
    const formatB = renderFormatB(result);
    const formatC = renderFormatC(result);
    const formatJson = renderFormatJson(result);

    expect(formatA).toContain('Missing canonical tag.');
    expect(formatB).toContain('Alien Eyes audit of example.com');
    expect(formatB).toContain('Fix these 2 issues:');
    expect(formatB).toContain('(0.95)');
    expect(formatB).toContain('Verify: Inspect the head.');
    expect(formatB).toContain('Verify: Run performance audit.');
    expect(formatC).toContain('Where: https://example.com');
    expect(formatJson).toContain('"seo-001"');
    expect(formatJson).toContain('"perf-001"');
  });

  it('renders all findings and omits scores and branding', () => {
    const expanded: SynthesisResult = {
      ...result,
      findings: Array.from({ length: 6 }, (_, index) => ({
        ...result.findings[0],
        id: `seo-00${index + 1}`,
        what: `Issue ${index + 1}.`
      }))
    };

    const formatB = renderFormatB(expanded);
    expect(formatB).toContain('Issue 6.');
    expect(formatB).not.toContain('more findings available');
    expect(formatB).toContain('Alien Eyes audit of');
    expect(formatB).toContain('Checked');
  });
});
