import { describe, expect, it } from 'vitest';
import type { Finding } from '@/types';
import {
  BASE_RATE,
  CONFIDENCE_FLOOR,
  DIMENSION_WEIGHTS,
  HUMAN_NATIVE_WEIGHTS,
  calculateAgentNativenessScore,
  calculateDimensionScores,
  calculateHumanNativeScore,
  calculateSatisfactionScore,
  gradeFromScore
} from '@/lib/synthesis/scoring';

function makeFinding(
  severity: Finding['severity'],
  dimension: Finding['dimension'] = 'seo',
  confidence = 0.9
): Finding {
  return {
    id: `${dimension}-${Math.random().toString(36).slice(2, 6)}`,
    what: 'Test finding.',
    where: 'https://example.com',
    expected: 'Expected behavior.',
    why: 'Why it matters.',
    verify: 'How to verify.',
    severity,
    dimension,
    confidence,
    evidence: {
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      domSnapshotHash: 'hash',
      completeness: 0.8
    },
    lifecycle: { state: 'detected', updatedAt: new Date().toISOString() }
  };
}

describe('scoreFindingsDecay (via calculateDimensionScores)', () => {
  it('returns 100 for 0 findings', () => {
    const scores = calculateDimensionScores([], ['seo']);
    expect(scores.seo?.value).toBe(100);
  });

  it('scores ~85 for 2 MED + 3 LOW', () => {
    const findings = [
      makeFinding('medium'),
      makeFinding('medium'),
      makeFinding('low'),
      makeFinding('low'),
      makeFinding('low')
    ];
    const scores = calculateDimensionScores(findings, ['seo']);
    // 2 MED (0.06 * 0.9 = 0.054 each) + 3 LOW (0.02 * 0.9 = 0.018 each)
    // 100 * (1 - 0.054)^2 * (1 - 0.018)^3 = 100 * 0.8943 * 0.9467 ≈ 84.66
    expect(scores.seo!.value).toBeGreaterThanOrEqual(82);
    expect(scores.seo!.value).toBeLessThanOrEqual(88);
  });

  it('scores ~62 for 1 HIGH + 5 MED + 4 LOW', () => {
    const findings = [
      makeFinding('high'),
      ...Array.from({ length: 5 }, () => makeFinding('medium')),
      ...Array.from({ length: 4 }, () => makeFinding('low'))
    ];
    const scores = calculateDimensionScores(findings, ['seo']);
    expect(scores.seo!.value).toBeGreaterThanOrEqual(55);
    expect(scores.seo!.value).toBeLessThanOrEqual(68);
  });

  it('scores ~43 for 1 CRIT + 1 HIGH + 6 MED + 4 LOW', () => {
    const findings = [
      makeFinding('critical'),
      makeFinding('high'),
      ...Array.from({ length: 6 }, () => makeFinding('medium')),
      ...Array.from({ length: 4 }, () => makeFinding('low'))
    ];
    const scores = calculateDimensionScores(findings, ['seo']);
    expect(scores.seo!.value).toBeGreaterThanOrEqual(35);
    expect(scores.seo!.value).toBeLessThanOrEqual(50);
  });

  it('scores low but not 0 for 28 HIGH findings', () => {
    const findings = Array.from({ length: 28 }, () => makeFinding('high'));
    const scores = calculateDimensionScores(findings, ['seo']);
    // 100 * (1 - 0.15 * 0.9)^28 = 100 * (0.865)^28 ≈ 1.36 → rounds to 1
    expect(scores.seo!.value).toBeGreaterThanOrEqual(1);
    expect(scores.seo!.value).toBeLessThanOrEqual(10);
  });

  it('returns null for dimensions not in activeDimensions', () => {
    const scores = calculateDimensionScores([], ['seo']);
    expect(scores.accessibility).toBeNull();
    expect(scores.performance).toBeNull();
  });

  it('returns 100 for active dimensions with no findings', () => {
    const scores = calculateDimensionScores([], ['seo', 'accessibility', 'performance']);
    expect(scores.seo!.value).toBe(100);
    expect(scores.accessibility!.value).toBe(100);
    expect(scores.performance!.value).toBe(100);
  });
});

describe('gradeFromScore', () => {
  it('returns A for score >= 90', () => {
    expect(gradeFromScore(92).grade).toBe('A');
    expect(gradeFromScore(92).label).toBe('Excellent');
  });

  it('returns B for score >= 75', () => {
    expect(gradeFromScore(80).grade).toBe('B');
    expect(gradeFromScore(80).label).toBe('Good');
  });

  it('returns C for score >= 55', () => {
    expect(gradeFromScore(60).grade).toBe('C');
    expect(gradeFromScore(60).label).toBe('Needs Work');
  });

  it('returns D for score >= 30', () => {
    expect(gradeFromScore(40).grade).toBe('D');
    expect(gradeFromScore(40).label).toBe('Poor');
  });

  it('returns F for score < 30', () => {
    expect(gradeFromScore(10).grade).toBe('F');
    expect(gradeFromScore(10).label).toBe('Critical');
  });
});

describe('weighted geometric mean (via calculateSatisfactionScore)', () => {
  it('returns 100 when all dimension scores are 100', () => {
    const dimensionScores = calculateDimensionScores(
      [],
      ['seo', 'accessibility', 'security', 'performance', 'agent-nativeness', 'ux']
    );
    const satisfaction = calculateSatisfactionScore(dimensionScores);
    expect(satisfaction.value).toBe(100);
  });

  it('one low dimension pulls down the composite', () => {
    // Put 1 CRIT in seo (scores ~73), everything else 100
    const findings = [makeFinding('critical', 'seo')];
    const dimensionScores = calculateDimensionScores(
      findings,
      ['seo', 'accessibility', 'security', 'performance', 'agent-nativeness', 'ux']
    );
    const satisfaction = calculateSatisfactionScore(dimensionScores);
    // SEO should be ~73, other 5 dimensions at 100
    // Geometric mean will pull this down from 100 but not to 73
    expect(satisfaction.value).toBeLessThan(100);
    expect(satisfaction.value).toBeGreaterThan(dimensionScores.seo!.value);
  });
});

describe('calculateHumanNativeScore', () => {
  it('excludes agent-nativeness from the composite', () => {
    const findings = [makeFinding('critical', 'agent-nativeness')];
    const dimensionScores = calculateDimensionScores(
      findings,
      ['seo', 'accessibility', 'performance', 'ux', 'agent-nativeness']
    );
    const humanNative = calculateHumanNativeScore(dimensionScores);
    // Agent-nativeness is low but human-native should be 100 (only human dims, all clean)
    expect(humanNative.value).toBe(100);
  });
});

describe('calculateAgentNativenessScore', () => {
  it('returns the agent-nativeness dimension score directly', () => {
    const findings = [makeFinding('high', 'agent-nativeness')];
    const dimensionScores = calculateDimensionScores(findings, ['agent-nativeness']);
    const agentScore = calculateAgentNativenessScore(dimensionScores);
    expect(agentScore.value).toBe(dimensionScores['agent-nativeness']!.value);
  });

  it('returns 100 when agent-nativeness was not evaluated', () => {
    const dimensionScores = calculateDimensionScores([], ['seo']);
    const agentScore = calculateAgentNativenessScore(dimensionScores);
    expect(agentScore.value).toBe(100);
  });
});

describe('Score includes grade info', () => {
  it('dimension scores carry grade, label, guidance', () => {
    const findings = [makeFinding('critical', 'seo')];
    const scores = calculateDimensionScores(findings, ['seo']);
    const seo = scores.seo!;
    expect(seo.grade).toBeDefined();
    expect(seo.label).toBeDefined();
    expect(seo.guidance).toBeDefined();
    expect(['A', 'B', 'C', 'D', 'F']).toContain(seo.grade);
  });
});

describe('constants are exported for Part 2', () => {
  it('exports BASE_RATE, CONFIDENCE_FLOOR, DIMENSION_WEIGHTS, HUMAN_NATIVE_WEIGHTS', () => {
    expect(BASE_RATE.critical).toBe(0.30);
    expect(CONFIDENCE_FLOOR.critical).toBe(0.90);
    expect(DIMENSION_WEIGHTS.seo).toBe(0.15);
    expect(HUMAN_NATIVE_WEIGHTS.accessibility).toBe(0.30);
  });
});
