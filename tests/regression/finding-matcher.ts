import knownFindings from '../fixtures/known-findings.json';
import type { Finding } from '@/types';

export interface KnownFinding {
  id: string;
  severity: Finding['severity'];
  summary: string;
  keywords: string[];
  paths: string[];
  dimension: string;
}

export interface MatchResult {
  knownFindingId: string;
  matchedFindingId?: string;
  score: number;
}

export function loadKnownFindings(): KnownFinding[] {
  return knownFindings as KnownFinding[];
}

export function matchFindings(generated: Finding[], known = loadKnownFindings()): MatchResult[] {
  return known.map((candidate) => {
    let bestScore = 0;
    let bestFinding: Finding | undefined;

    for (const finding of generated) {
      const score = scoreFindingMatch(finding, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestFinding = finding;
      }
    }

    return {
      knownFindingId: candidate.id,
      matchedFindingId: bestScore >= 0.45 ? bestFinding?.id : undefined,
      score: Number(bestScore.toFixed(2))
    };
  });
}

export function scoreFindingMatch(finding: Finding, known: KnownFinding): number {
  const text = `${finding.what} ${finding.expected} ${finding.why} ${finding.verify} ${finding.where}`.toLowerCase();
  const matchedKeywords = known.keywords.filter((keyword) => text.includes(keyword.toLowerCase()));
  const keywordScore = matchedKeywords.length / known.keywords.length;

  const pathScore = known.paths.some((path) => text.includes(path.toLowerCase())) ? 0.2 : 0;
  const severityScore = finding.severity === known.severity ? 0.15 : 0;
  const dimensionScore = finding.dimension === known.dimension ? 0.15 : 0;

  return Math.min(1, keywordScore + pathScore + severityScore + dimensionScore);
}

export function summarizeRegression(generated: Finding[], known = loadKnownFindings()) {
  const matches = matchFindings(generated, known);
  const matched = matches.filter((match) => match.matchedFindingId);
  const criticalMisses = known
    .filter((candidate) => candidate.severity === 'critical')
    .filter((candidate) => !matches.some((match) => match.knownFindingId === candidate.id && match.matchedFindingId));

  return {
    recall: matched.length / known.length,
    matchedCount: matched.length,
    knownCount: known.length,
    criticalMisses: criticalMisses.map((candidate) => candidate.id),
    matches
  };
}
