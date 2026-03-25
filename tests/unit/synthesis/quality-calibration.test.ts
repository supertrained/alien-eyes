import { describe, expect, it } from 'vitest';
import type { Finding } from '@/types';
import { buildCausalChains } from '@/lib/synthesis/causal-chains';
import { deduplicateFindings } from '@/lib/synthesis/deduplicator';

function createFinding(id: string, overrides: Partial<Finding>): Finding {
  return {
    id,
    what: 'Page is missing a canonical URL.',
    where: 'https://example.com/page-a',
    expected: 'Every indexable page should declare a canonical URL.',
    why: 'Search engines can split ranking signals across duplicate URLs when canonical is absent.',
    verify: 'Inspect the page head and confirm a canonical link is present and self-referential.',
    severity: 'medium',
    dimension: 'seo',
    confidence: 0.95,
    evidence: { url: 'https://example.com/page-a', timestamp: new Date().toISOString(), domSnapshotHash: id, completeness: 0.8 },
    lifecycle: { state: 'detected', updatedAt: new Date().toISOString() },
    ...overrides
  };
}

describe('quality calibration', () => {
  it('aggregates repeated multi-page findings into one grouped issue', () => {
    const deduped = deduplicateFindings([
      createFinding('seo-001', { where: 'https://example.com/services' }),
      createFinding('seo-002', { where: 'https://example.com/blog' }),
      createFinding('seo-003', { where: 'https://example.com/about' })
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.what).toContain('3 pages');
    expect(deduped[0]?.where).toContain('/services');
  });

  it('does not create giant causal chains for weakly related same-page findings', () => {
    const chains = buildCausalChains([
      createFinding('seo-001', { where: 'https://example.com', dimension: 'seo' }),
      createFinding('a11y-001', {
        what: 'Page has no visible skip-to-content link.',
        expected: 'Keyboard users should be able to bypass repeated navigation.',
        why: 'Without a skip link, keyboard navigation is slower and more frustrating.',
        verify: 'Tab from the top of the page and confirm a skip link appears.',
        where: 'https://example.com',
        dimension: 'accessibility'
      }),
      createFinding('ux-001', {
        what: 'Page provides weak trust reinforcement.',
        expected: 'Decision pages should surface concrete trust signals.',
        why: 'Without trust cues, evaluators have to take the product on faith.',
        verify: 'Confirm the page now includes trust signals.',
        where: 'https://example.com',
        dimension: 'ux',
        severity: 'low'
      })
    ]);

    expect(chains.length).toBeLessThanOrEqual(1);
  });
});
