import type { Finding } from '@/types';

interface AggregateBucket {
  finding: Finding;
  urls: string[];
}

export function deduplicateFindings(findings: Finding[]): Finding[] {
  const exactBuckets = new Map<string, AggregateBucket>();

  for (const finding of findings) {
    const fingerprint = createExactFingerprint(finding);
    const existing = exactBuckets.get(fingerprint);
    if (!existing) {
      exactBuckets.set(fingerprint, { finding, urls: [finding.where] });
      continue;
    }

    existing.finding = mergeFindings(existing.finding, finding, existing.urls);
    existing.urls.push(finding.where);
  }

  const issueBuckets = new Map<string, AggregateBucket>();
  for (const bucket of exactBuckets.values()) {
    const issueKey = createIssueFingerprint(bucket.finding);
    const existing = issueBuckets.get(issueKey);
    if (!existing) {
      issueBuckets.set(issueKey, bucket);
      continue;
    }

    existing.finding = mergeFindings(existing.finding, bucket.finding, [...existing.urls, ...bucket.urls]);
    existing.urls.push(...bucket.urls);
  }

  return [...issueBuckets.values()].map(({ finding, urls }) => rewriteAggregatedFinding(finding, urls));
}

function mergeFindings(left: Finding, right: Finding, urls: string[]): Finding {
  return {
    ...left,
    confidence: Math.max(left.confidence, right.confidence),
    causalChain: unique([...(left.causalChain ?? []), ...(right.causalChain ?? [])]),
    why: left.why === right.why ? left.why : `${left.why} Also observed across similar pages.`,
    evidence: {
      ...left.evidence,
      reasoning: unique([left.evidence.reasoning, right.evidence.reasoning].filter(Boolean) as string[]).join(' | '),
      completeness: Math.min(1, Math.max(left.evidence.completeness, right.evidence.completeness) + 0.1),
      relevantHeaders: {
        ...(left.evidence.relevantHeaders ?? {}),
        ...(right.evidence.relevantHeaders ?? {})
      }
    },
    where: summarizeWhere(unique(urls))
  };
}

function rewriteAggregatedFinding(finding: Finding, urls: string[]): Finding {
  const uniqueUrls = unique(urls);
  if (uniqueUrls.length <= 1) {
    return { ...finding, where: uniqueUrls[0] ?? finding.where };
  }

  return {
    ...finding,
    what: summarizeWhat(finding.what, uniqueUrls.length),
    where: summarizeWhere(uniqueUrls)
  };
}

function createExactFingerprint(finding: Finding): string {
  return `${normalizeUrl(finding.where)}::${normalizeIssueText(finding.what)}::${finding.dimension}`;
}

function createIssueFingerprint(finding: Finding): string {
  return [
    finding.dimension,
    finding.severity,
    normalizeIssueText(finding.what),
    normalizeIssueText(finding.expected)
  ].join('::');
}

function normalizeIssueText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/[^\s)]+/g, '<url>')
    .replace(/\b\d+(\.\d+)?\b/g, '<n>')
    .replace(/for\s+['"][^'"]+['"]/g, 'for <el>')
    .replace(/['"][^'"]{3,}['"]/g, '<text>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(value: string): string {
  return value
    .split(',')[0]!
    .trim()
    .toLowerCase();
}

function summarizeWhat(what: string, count: number): string {
  const stripped = what.replace(/^page\s+/i, '').replace(/^\d+ pages?\s+/i, '').trim();
  if (/^is missing /i.test(stripped)) {
    return `${count} pages are missing ${stripped.replace(/^is missing /i, '')}`;
  }
  if (/^is /i.test(stripped)) {
    return `${count} pages are ${stripped.replace(/^is /i, '')}`;
  }
  if (/^has /i.test(stripped)) {
    return `${count} pages have ${stripped.replace(/^has /i, '')}`;
  }
  if (/^title duplicates /i.test(stripped)) {
    return `${count} pages have duplicate titles`;
  }
  return `${count} pages share this issue: ${stripped}`;
}

function summarizeWhere(urls: string[]): string {
  if (urls.length === 1) {
    return urls[0]!;
  }

  try {
    const parsed = urls.map((url) => new URL(url));
    const sameOrigin = parsed.every((candidate) => candidate.origin === parsed[0]!.origin);
    if (sameOrigin) {
      const paths = parsed.map((candidate) => candidate.pathname || '/');
      const preview = paths.slice(0, 3).join(', ');
      const more = paths.length - 3;
      return more > 0 ? `${preview}, +${more} more pages` : preview;
    }
  } catch {
    return urls.join(', ');
  }

  return urls.join(', ');
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
