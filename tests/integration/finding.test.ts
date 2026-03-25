import { describe, expect, it } from 'vitest';
import { findingSchema } from '@/primitives/base';

describe('Finding validation', () => {
  it('validates the frozen Finding shape and required fields', () => {
    const finding = findingSchema.parse({
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
    });

    expect(finding.id).toBe('seo-001');
    expect(finding.dimension).toBe('seo');
    expect(finding.evidence.completeness).toBe(0.8);
  });
});
