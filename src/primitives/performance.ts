import type { AuditConfig, Finding, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { BasePrimitive, createFindingId, withPrimitiveEnvelope } from '@/primitives/base';

export class PerformancePrimitive extends BasePrimitive {
  readonly name = 'performance';
  readonly dimension = 'performance' as const;
  readonly requiresOwnershipVerification = false;
  readonly usesLLM = false;

  async run(crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];
      let index = 1;

      for (const summary of summaries) {
        const metrics = summary.performanceMetrics;
        if (metrics.loadTimeMs > 4_000) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Page load time is ${metrics.loadTimeMs}ms.`,
            expected: 'Core landing pages should load in under 4 seconds on the audit profile.',
            why: 'Long load times increase abandonment and reduce crawl quality.',
            verify: 'Re-run the audit or lab measurement and confirm load time drops below 4 seconds.',
            severity: metrics.loadTimeMs > 8_000 ? 'high' : 'medium',
            confidence: 0.94
          }));
        }
        if (metrics.ttfbMs > 1_000) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Time to first byte is ${metrics.ttfbMs}ms.`,
            expected: 'TTFB should stay under 1 second for primary pages.',
            why: 'Slow server response delays every downstream render step.',
            verify: 'Check backend timings or CDN caching and confirm TTFB drops below 1 second.',
            severity: 'medium',
            confidence: 0.9
          }));
        }
        if (metrics.totalWeightBytes > 2_000_000) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Page weight is ${(metrics.totalWeightBytes / 1_000_000).toFixed(2)}MB.`,
            expected: 'Initial page weight should stay closer to 2MB or below.',
            why: 'Heavy pages slow rendering and increase mobile data cost.',
            verify: 'Inspect network payloads and confirm image/script weight is reduced.',
            severity: 'medium',
            confidence: 0.89
          }));
        }
        if (metrics.lcpMs != null && metrics.lcpMs > 2_500) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Largest Contentful Paint is ${metrics.lcpMs}ms.`,
            expected: 'LCP should be under 2500ms to meet Google\'s "good" threshold.',
            why: 'LCP above 2.5s is rated "poor" by Core Web Vitals and hurts search ranking.',
            verify: 'Re-run the audit or use PageSpeed Insights and confirm LCP drops below 2500ms.',
            severity: metrics.lcpMs > 4_000 ? 'high' : 'medium',
            confidence: 0.95
          }));
        }
        if (metrics.cls != null && metrics.cls > 0.25) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Cumulative Layout Shift is ${metrics.cls.toFixed(3)}.`,
            expected: 'CLS should stay under 0.25 to meet Google\'s "good" threshold.',
            why: 'CLS above 0.25 is rated "poor" by Core Web Vitals and causes unexpected content jumps.',
            verify: 'Reload the page and confirm layout shifts are no longer visible or measurable above 0.25.',
            severity: metrics.cls > 0.5 ? 'high' : 'medium',
            confidence: 0.93
          }));
        }
        if (metrics.renderBlockingCount > 8) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Page has ${metrics.renderBlockingCount} render-blocking script or stylesheet requests.`,
            expected: 'Critical rendering path should minimize render-blocking assets.',
            why: 'Too many blocking resources delay first paint and interaction.',
            verify: 'Review the waterfall and confirm blocking resources are deferred, inlined, or reduced.',
            severity: 'low',
            confidence: 0.85
          }));
        }
      }

      for (const page of crawl.pages) {
        const hydrationError = page.consoleLogs.find((entry) => /hydration|react error #418|didn't match the client/i.test(entry.message));
        if (!hydrationError) {
          continue;
        }
        const summary = summaries.find((candidate) => candidate.url === page.url);
        if (!summary) {
          continue;
        }
        findings.push(this.createFinding({
          page: summary,
          id: createFindingId(this.name, index++),
          what: 'React hydration mismatch error appears during page load.',
          expected: 'Server and client renders should produce matching HTML without hydration errors.',
          why: 'Hydration mismatches degrade performance and can break interactive behavior.',
          verify: 'Load the page with the console open and confirm hydration errors no longer appear.',
          severity: 'medium',
          confidence: 0.96
        }));
      }

      return findings;
    });
  }
}
