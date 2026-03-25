import type { AuditDimension, Finding, Score } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIMENSIONS: AuditDimension[] = [
  'seo',
  'aeo',
  'geo',
  'meo',
  'accessibility',
  'security',
  'performance',
  'ux',
  'copy',
  'analytics',
  'legal',
  'agent-nativeness',
  'email',
  'api-quality'
];

/** Per-severity multiplicative penalty rate. */
export const BASE_RATE: Record<Finding['severity'], number> = {
  critical: 0.30,
  high: 0.15,
  medium: 0.06,
  low: 0.02
};

/** Minimum confidence applied per severity (floors low-confidence findings). */
export const CONFIDENCE_FLOOR: Record<Finding['severity'], number> = {
  critical: 0.90,
  high: 0.50,
  medium: 0.25,
  low: 0.25
};

/** Weights for overall satisfaction (all 6 V1 dimensions). */
export const DIMENSION_WEIGHTS: Partial<Record<AuditDimension, number>> = {
  seo: 0.15,
  accessibility: 0.20,
  security: 0.15,
  performance: 0.15,
  'agent-nativeness': 0.15,
  ux: 0.20
};

/** Weights for human-native composite (excludes agent-nativeness). */
export const HUMAN_NATIVE_WEIGHTS: Partial<Record<AuditDimension, number>> = {
  seo: 0.20,
  accessibility: 0.30,
  performance: 0.20,
  ux: 0.30
};

// ---------------------------------------------------------------------------
// Grade system
// ---------------------------------------------------------------------------

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeInfo {
  grade: Grade;
  label: string;
  guidance: string;
}

export function gradeFromScore(score: number): GradeInfo {
  if (score >= 90) return { grade: 'A', label: 'Excellent', guidance: 'Ship with confidence. Minor polish only.' };
  if (score >= 75) return { grade: 'B', label: 'Good', guidance: 'Solid. Address HIGHs before launch.' };
  if (score >= 55) return { grade: 'C', label: 'Needs Work', guidance: 'Functional but users will notice gaps.' };
  if (score >= 30) return { grade: 'D', label: 'Poor', guidance: 'Fix the top 5 before your next deploy.' };
  return { grade: 'F', label: 'Critical', guidance: 'Start with the CRITICALs.' };
}

// ---------------------------------------------------------------------------
// Core scoring — multiplicative decay
// ---------------------------------------------------------------------------

/**
 * Multiplicative decay scoring: each finding multiplies the remaining score
 * by (1 - penalty), where penalty = BASE_RATE[severity] * clampedConfidence.
 * Floors at 1 (never zero).
 */
function scoreFindingsDecay(findings: Finding[]): number {
  if (findings.length === 0) return 100;
  const score = findings.reduce((remaining, finding) => {
    const conf = Math.max(CONFIDENCE_FLOOR[finding.severity], finding.confidence);
    const penalty = BASE_RATE[finding.severity] * conf;
    return remaining * (1 - penalty);
  }, 100);
  return Math.round(Math.max(1, score));
}

function buildScore(value: number, findingCount: number): Score {
  const uncertainty = clamp(findingCount * 2, 3, 15);
  const gradeInfo = gradeFromScore(value);
  return {
    value,
    confidenceLow: clamp(value - uncertainty, 0, 100),
    confidenceHigh: clamp(value + Math.max(3, Math.round(uncertainty / 2)), 0, 100),
    grade: gradeInfo.grade,
    label: gradeInfo.label,
    guidance: gradeInfo.guidance
  };
}

// ---------------------------------------------------------------------------
// Weighted geometric mean
// ---------------------------------------------------------------------------

function weightedGeometricMean(
  dimensionScores: Record<string, number>,
  weights: Record<string, number>
): number {
  const active = Object.keys(dimensionScores).filter((d) => d in weights);
  if (active.length === 0) return 100;
  const totalWeight = active.reduce((s, d) => s + weights[d], 0);
  const logScore = active.reduce((s, d) => {
    const w = weights[d] / totalWeight;
    return s + w * Math.log(Math.max(1, dimensionScores[d]));
  }, 0);
  return Math.round(Math.max(1, Math.exp(logScore)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate per-dimension scores.
 * Dimensions in `activeDimensions` with 0 findings get score 100.
 * Dimensions NOT in `activeDimensions` get null.
 */
export function calculateDimensionScores(
  findings: Finding[],
  activeDimensions: AuditDimension[]
): Record<AuditDimension, Score | null> {
  const activeSet = new Set(activeDimensions);

  return Object.fromEntries(
    DIMENSIONS.map((dimension) => {
      if (!activeSet.has(dimension)) {
        return [dimension, null];
      }
      const dimensionFindings = findings.filter((finding) => finding.dimension === dimension);
      const value = scoreFindingsDecay(dimensionFindings);
      return [dimension, buildScore(value, dimensionFindings.length)];
    })
  ) as Record<AuditDimension, Score | null>;
}

/**
 * Weighted geometric mean of dimension scores.
 */
export function calculateSatisfactionScore(
  dimensionScores: Record<AuditDimension, Score | null>
): Score {
  const scored = extractScoredDimensions(dimensionScores);
  const value = weightedGeometricMean(scored, DIMENSION_WEIGHTS as Record<string, number>);
  const totalFindings = Object.keys(scored).length;
  return buildScore(value, totalFindings);
}

/**
 * Human-native composite: geometric mean with HUMAN_NATIVE_WEIGHTS.
 */
export function calculateHumanNativeScore(
  dimensionScores: Record<AuditDimension, Score | null>
): Score {
  const scored = extractScoredDimensions(dimensionScores);
  const value = weightedGeometricMean(scored, HUMAN_NATIVE_WEIGHTS as Record<string, number>);
  const totalFindings = Object.keys(scored).length;
  return buildScore(value, totalFindings);
}

/**
 * Agent-native score: the agent-nativeness dimension score directly.
 */
export function calculateAgentNativenessScore(
  dimensionScores: Record<AuditDimension, Score | null>
): Score {
  const agentScore = dimensionScores['agent-nativeness'];
  if (agentScore) return agentScore;
  return buildScore(100, 0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractScoredDimensions(
  dimensionScores: Record<AuditDimension, Score | null>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, score] of Object.entries(dimensionScores)) {
    if (score !== null) {
      result[key] = score.value;
    }
  }
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
