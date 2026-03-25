import type { CrawlResult, CrawledPage, PageSummary } from '@/types';
import { InputSanitizer } from '@/lib/security/input-sanitizer';
import { extractAccessibilitySignals } from '@/lib/extraction/accessibility-extractor';
import { extractHeadings } from '@/lib/extraction/heading-extractor';
import { extractMetaTags } from '@/lib/extraction/meta-extractor';
import { extractSecurityHeaders, summarizeNetwork } from '@/lib/extraction/security-extractor';
import { extractStructuredData } from '@/lib/extraction/structured-data-extractor';
import { estimateTokens } from '@/lib/extraction/token-budget';

export interface PageSummarizerOptions {
  sanitizer?: InputSanitizer;
}

export class PageSummarizer {
  private readonly sanitizer: InputSanitizer;

  constructor(options: PageSummarizerOptions = {}) {
    this.sanitizer = options.sanitizer ?? new InputSanitizer();
  }

  summarizePage(page: CrawledPage): PageSummary {
    const sanitizedTextContent = page.renderedSnapshot?.visibleText ?? this.sanitizer.extractVisibleText(page.html);
    const { links, images, ariaLandmarks } = page.renderedSnapshot
      ? {
          links: page.renderedSnapshot.links,
          images: page.renderedSnapshot.images,
          ariaLandmarks: page.renderedSnapshot.ariaLandmarks
        }
      : extractAccessibilitySignals(page.html, page.url);
    const networkSummary = summarizeNetwork(page);
    const performanceMetrics = derivePerformanceMetrics(page, networkSummary.totalSizeBytes);
    const tokenEstimate = estimateTokens([
      page.url,
      page.metaTags.title ?? '',
      sanitizedTextContent,
      JSON.stringify(extractMetaTags(page.html)),
      JSON.stringify(page.renderedSnapshot?.structuredData ?? extractStructuredData(page.html))
    ].join(' '));

    return {
      url: page.url,
      title: page.renderedSnapshot?.metaTags.title ?? page.metaTags.title ?? extractTitle(page.html),
      metaTags: { ...extractMetaTags(page.html), ...page.metaTags },
      headings: page.renderedSnapshot?.headings ?? extractHeadings(page.html),
      links,
      images,
      ariaLandmarks,
      accessibilityTree: page.accessibilityTree,
      pageRole: classifyPageRole(page),
      structuredData: page.renderedSnapshot?.structuredData ?? extractStructuredData(page.html),
      interactiveElements: page.renderedSnapshot?.interactiveElements ?? [],
      contrastIssues: page.renderedSnapshot?.contrastIssues ?? [],
      trustSignals: deriveTrustSignals(page),
      securityHeaders: extractSecurityHeaders(page),
      consoleSummary: {
        errorCount: page.consoleLogs.filter((entry) => entry.level === 'error').length,
        warningCount: page.consoleLogs.filter((entry) => entry.level === 'warning').length,
        sampleErrors: page.consoleLogs
          .filter((entry) => entry.level === 'error')
          .slice(0, 3)
          .map((entry) => entry.message)
      },
      networkSummary,
      performanceMetrics,
      sanitizedTextContent,
      tokenEstimate,
      statusCode: page.statusCode
    };
  }

  summarize(crawl: CrawlResult): PageSummary[] {
    return crawl.pages.map((page) => this.summarizePage(page));
  }
}

function derivePerformanceMetrics(page: CrawledPage, totalWeightBytes: number) {
  const documentRequest = page.networkRequests.find((request) => request.resourceType === 'document');
  return {
    loadTimeMs: page.loadTimeMs,
    ttfbMs: documentRequest?.durationMs ?? page.loadTimeMs,
    domContentLoadedMs: page.loadTimeMs,
    totalWeightBytes,
    renderBlockingCount: page.renderBlockingResourceCount ?? 0,
    lcpMs: page.coreWebVitals?.lcpMs,
    cls: page.coreWebVitals?.cls
  };
}

function extractTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
}

function classifyPageRole(page: CrawledPage): PageSummary['pageRole'] {
  try {
    const url = new URL(page.url);
    const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const title = (page.renderedSnapshot?.metaTags.title ?? page.metaTags.title ?? '').toLowerCase();
    const text = (page.renderedSnapshot?.visibleText ?? '').toLowerCase();

    if (path === '/') return 'homepage';
    if (path.includes('contact') || title.includes('contact')) return 'contact';
    if (path.includes('service') || path.includes('solution')) return 'services';
    if (path.includes('pricing') || title.includes('pricing')) return 'pricing';
    if (path.includes('blog') || path.includes('post')) return 'blog';
    if (path.includes('docs') || path.includes('documentation') || text.includes('api reference')) return 'docs';
    if (path.includes('privacy') || path.includes('terms') || path.includes('legal')) return 'legal';
    if (path.includes('product') || title.includes('product')) return 'product';
  } catch {
    return 'other';
  }

  return 'other';
}

function deriveTrustSignals(page: CrawledPage): PageSummary['trustSignals'] {
  const html = page.html.toLowerCase();
  const links = page.renderedSnapshot?.links ?? [];
  const structuredData = page.renderedSnapshot?.structuredData ?? [];
  const reviewCount = structuredData.filter((item) => {
    const type = typeof item?.['@type'] === 'string' ? item['@type'].toLowerCase() : '';
    return type.includes('review') || type.includes('aggregaterating');
  }).length;

  return {
    testimonialCount: (html.match(/<blockquote\b/gi) ?? []).length,
    logoCount: (html.match(/logo/gi) ?? []).length,
    reviewCount,
    caseStudyLinkCount: links.filter((link) => /case stud|customer stor|testimonial/i.test(link.text)).length
  };
}
