import type { CausalChain, Finding } from '@/types';

const STOPWORDS = new Set([
  'the', 'and', 'page', 'pages', 'missing', 'issue', 'should', 'with', 'that', 'this', 'from', 'into', 'your', 'their', 'have', 'has', 'are', 'for'
]);

export function buildCausalChains(findings: Finding[]): CausalChain[] {
  const chains: CausalChain[] = [];
  const usedPairs = new Set<string>();

  for (let index = 0; index < findings.length; index += 1) {
    const current = findings[index]!;
    for (let candidateIndex = index + 1; candidateIndex < findings.length; candidateIndex += 1) {
      const candidate = findings[candidateIndex]!;
      if (!isRelated(current, candidate)) {
        continue;
      }

      const pairKey = [current.id, candidate.id].sort().join('::');
      if (usedPairs.has(pairKey)) {
        continue;
      }
      usedPairs.add(pairKey);

      const rootCause = severityRank(current.severity) <= severityRank(candidate.severity) ? current : candidate;
      const dependent = rootCause.id === current.id ? candidate : current;
      chains.push({
        findingIds: [rootCause.id, dependent.id],
        description: `${dependent.what} is likely downstream of ${rootCause.what}`,
        rootCauseId: rootCause.id
      });
    }
  }

  return chains;
}

function isRelated(left: Finding, right: Finding): boolean {
  if (left.dimension === right.dimension) {
    return false;
  }

  const leftTokens = extractTokens(`${left.what} ${left.why}`);
  const rightTokens = extractTokens(`${right.what} ${right.why}`);
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token));

  const sameSurface = normalizeSurface(left.where) === normalizeSurface(right.where);
  if (sameSurface && overlap.length >= 2) {
    return true;
  }

  return overlap.length >= 3;
}

function extractTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3 && !STOPWORDS.has(token))
  );
}

function normalizeSurface(where: string): string {
  return where.split(',')[0]!.trim().toLowerCase();
}

function severityRank(severity: Finding['severity']): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity];
}
