import { describe, expect, it } from 'vitest';
import type { AuditPipelineResult } from '@/orchestrator/pipeline';
import { runAuditCommand } from '@/cli/audit';

function createIO() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      stdout: { write: (chunk: string) => void stdout.push(chunk) },
      stderr: { write: (chunk: string) => void stderr.push(chunk) }
    },
    stdout,
    stderr
  };
}

const pipelineResult: AuditPipelineResult = {
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
    celebration: { pageCount: 0, workingFlows: 1, cleanDimensions: ['seo'], positiveObservations: ['Looks good.'] },
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
    verbatimNarrative: 'Narrative',
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
    'format-json': '{"ok":true}'
  },
  fieldNotes: []
};

describe('runAuditCommand', () => {
  it('writes the selected format to stdout and returns 0 for clean audits', async () => {
    const { io, stdout } = createIO();
    const exitCode = await runAuditCommand(
      'https://example.com',
      { format: 'format-json', pageLimit: 10, quick: true, verbose: false },
      io,
      async () => pipelineResult
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('')).toContain('{"ok":true}');
  });

  it('returns 2 when a full audit runs without ANTHROPIC_API_KEY', async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const { io, stderr } = createIO();

    const exitCode = await runAuditCommand(
      'https://example.com',
      { format: 'format-b', pageLimit: 10, quick: false, verbose: false },
      io,
      async () => pipelineResult
    );

    expect(exitCode).toBe(2);
    expect(stderr.join('')).toContain('ANTHROPIC_API_KEY');

    if (previous) {
      process.env.ANTHROPIC_API_KEY = previous;
    }
  });
});
