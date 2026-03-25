import { describe, expect, it } from 'vitest';
import type { AuditConfig, Finding } from '@/types';
import { PageSummarizer } from '@/lib/extraction/page-summarizer';
import { createPrimitiveRegistry } from '@/primitives';
import { summarizeRegression } from './finding-matcher';
import { syntheticCrawl } from '../fixtures/synthetic-crawl';

const regressionConfig: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: true,
  pageLimit: syntheticCrawl.pages.length,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false
};

describe('supertrained dogfood regression', () => {
  it('detects at least 10 of the 12 known findings without missing critical issues', async () => {
    const summaries = new PageSummarizer().summarize(syntheticCrawl);
    const primitives = createPrimitiveRegistry();
    const envelopes = await Promise.all(
      primitives.map((primitive) => primitive.run(syntheticCrawl, summaries, regressionConfig))
    );

    const findings = envelopes.flatMap((envelope) => envelope.data) as Finding[];
    const regression = summarizeRegression(findings);

    expect(regression.recall).toBeGreaterThanOrEqual(10 / 12);
    expect(regression.criticalMisses).toEqual([]);
  });
});
