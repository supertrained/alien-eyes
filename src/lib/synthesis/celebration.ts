import type { AuditDimension, CelebrationSection, Finding } from '@/types';
import type { CrawlResult } from '@/types';

const CORE_DIMENSIONS: AuditDimension[] = ['seo', 'accessibility', 'security', 'performance', 'agent-nativeness', 'ux'];

export function buildCelebration(findings: Finding[], crawl: CrawlResult): CelebrationSection {
  const cleanDimensions = CORE_DIMENSIONS.filter((dimension) => findings.every((finding) => finding.dimension !== dimension));
  const positiveObservations = [
    crawl.robotsTxtStatus !== 'not_found' ? 'robots.txt is present and reachable.' : 'The crawl completed without robots.txt blocks.',
    crawl.pages.length > 0 ? `Crawl covered ${crawl.pages.length} page${crawl.pages.length > 1 ? 's' : ''} with a clean browser profile.` : 'Crawl completed from a clean browser profile.',
    crawl.detectedStack?.length ? `Detected stack signals: ${crawl.detectedStack.join(', ')}.` : 'No brittle stack-specific errors prevented the crawl.'
  ];

  return {
    pageCount: crawl.pages.length,
    workingFlows: Math.max(1, crawl.pages.length - findings.filter((finding) => finding.severity === 'critical').length),
    cleanDimensions,
    positiveObservations
  };
}
