import { describe, it, expect } from 'vitest';
import { listPrimitives } from '@/orchestrator/primitive-runner';

describe('primitives list', () => {
  it('registers all 21 primitives', () => {
    const all = listPrimitives();
    expect(all.length).toBe(21);
  });

  it('has 6 quality crawl primitives and 15 marketing gather primitives', () => {
    const all = listPrimitives();
    const quality = all.filter(p => p.category === 'quality');
    const marketing = all.filter(p => p.category === 'marketing');
    expect(quality.length).toBe(6);
    expect(marketing.length).toBe(15);
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
