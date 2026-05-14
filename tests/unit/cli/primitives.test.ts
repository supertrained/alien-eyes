import { describe, it, expect } from 'vitest';
import { listPrimitives } from '@/orchestrator/primitive-runner';

describe('primitives list', () => {
  it('registers all 22 primitives', () => {
    const all = listPrimitives();
    expect(all.length).toBe(22);
  });

  it('has 6 quality crawl primitives and 16 marketing gather primitives', () => {
    const all = listPrimitives();
    const quality = all.filter(p => p.category === 'quality');
    const marketing = all.filter(p => p.category === 'marketing');
    expect(quality.length).toBe(6);
    expect(marketing.length).toBe(16);
    expect(quality.every(p => p.type === 'crawl')).toBe(true);
    expect(marketing.every(p => p.type === 'gather')).toBe(true);
  });

  it('resolves dependencies correctly', () => {
    const all = listPrimitives();
    const competitorContext = all.find(p => p.name === 'competitor-context');
    expect(competitorContext?.dependencies).toContain('traffic-analysis');
    expect(competitorContext?.dependencies).toContain('company-enrichment');
  });
});
