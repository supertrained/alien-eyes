import { describe, expect, it } from 'vitest';
import type { Finding } from '@/types';
import { loadKnownFindings, scoreFindingMatch, summarizeRegression } from './finding-matcher';

const canonicalFinding: Finding = {
  id: 'seo-001',
  what: '7 pages have canonical URL pointing to https://supertrained.ai/ instead of the page itself.',
  where: '/services, /blog, /about, +4 more pages',
  expected: 'Each page should canonicalize to itself unless it is intentionally a duplicate.',
  why: 'Wrong canonicals can collapse multiple pages into one indexable URL.',
  verify: 'Check the canonical tag and confirm it matches each page URL.',
  severity: 'critical',
  dimension: 'seo',
  confidence: 0.98,
  evidence: { url: 'https://supertrained.ai/services', timestamp: new Date().toISOString(), domSnapshotHash: 'hash', completeness: 0.8 },
  lifecycle: { state: 'detected', updatedAt: new Date().toISOString() }
};

const securityFinding: Finding = {
  id: 'security-001',
  what: 'Strict-Transport-Security header is missing.',
  where: 'https://supertrained.ai/',
  expected: 'HTTPS sites should send HSTS.',
  why: 'Without HSTS, downgrade and first-request attacks stay possible.',
  verify: 'Confirm the response includes Strict-Transport-Security.',
  severity: 'medium',
  dimension: 'security',
  confidence: 0.95,
  evidence: { url: 'https://supertrained.ai/', timestamp: new Date().toISOString(), domSnapshotHash: 'hash-2', completeness: 0.8 },
  lifecycle: { state: 'detected', updatedAt: new Date().toISOString() }
};

describe('finding matcher', () => {
  it('scores strong semantic matches above threshold', () => {
    const known = loadKnownFindings().find((finding) => finding.id === 'known-001');
    expect(known).toBeDefined();
    expect(scoreFindingMatch(canonicalFinding, known!)).toBeGreaterThanOrEqual(0.45);
  });

  it('summarizes recall and critical misses', () => {
    const summary = summarizeRegression([canonicalFinding, securityFinding]);
    expect(summary.matchedCount).toBeGreaterThanOrEqual(2);
    expect(summary.criticalMisses).toEqual([]);
  });
});
