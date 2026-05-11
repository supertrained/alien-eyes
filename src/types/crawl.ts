import type { AriaLandmark, ContrastIssue, Heading, ImageInfo, InteractiveElement, Link } from '@/types/page-summary';

/**
 * Result of crawling a site. One per audit.
 * Every primitive reads from this shared result.
 */
export interface CrawlResult {
  /** The URL that was submitted for audit */
  url: string;
  /** All pages discovered and crawled */
  pages: CrawledPage[];
  /** ISO 8601 timestamp when the crawl started */
  timestamp: string;
  /** Always clean — every audit uses a fresh browser profile */
  browserProfile: 'clean';
  /** Total crawl duration in milliseconds */
  totalDurationMs: number;
  /** Number of pages discovered but not crawled */
  pagesSkipped: number;
  /** Structured errors from failed page crawls */
  errors: CrawlError[];
  /** URLs discovered from sitemap.xml for reconciliation checks */
  sitemapUrls?: string[];
  /** Detected technology stack */
  detectedStack?: string[];
  /** Whether robots.txt was found and respected */
  robotsTxtStatus: 'found' | 'not_found' | 'blocked_some_pages';
  /** Supplemental mobile capture of the seed URL */
  mobileSnapshot?: CrawledPage;
  /** AI crawler access directives parsed from robots.txt */
  aiCrawlerDirectives?: AICrawlerDirective[];
  /** Tracking tools and pixels detected from network requests and HTML */
  trackingInventory?: TrackingToolDetection[];
}

export interface AICrawlerDirective {
  /** User-agent name (e.g., GPTBot, ClaudeBot) */
  botName: string;
  /** Which AI platform this bot serves */
  platform: string;
  /** Whether this bot is explicitly blocked via Disallow: / */
  blocked: boolean;
  /** Specific paths disallowed for this bot (empty if fully blocked or fully allowed) */
  disallowedPaths: string[];
}

export interface TrackingToolDetection {
  name: string;
  category: 'analytics' | 'advertising' | 'heatmap' | 'crm' | 'consent' | 'social' | 'other';
  detectedVia: 'network' | 'script' | 'html';
  matchedUrl?: string;
}

export interface CrawledPage {
  /** Full URL of the page */
  url: string;
  /** Raw HTML content. Stored but never fed to LLMs directly. */
  html: string;
  /** Simplified DOM representation for analysis */
  dom: string;
  /** Storage path to full-page screenshot */
  screenshot: string;
  /** Console log entries captured during page load */
  consoleLogs: ConsoleEntry[];
  /** Network requests made during page load */
  networkRequests: NetworkEntry[];
  /** HTTP response headers */
  responseHeaders: Record<string, string>;
  /** Meta tags extracted from head */
  metaTags: Record<string, string>;
  /** HTTP status code */
  statusCode: number;
  /** Page load time in milliseconds */
  loadTimeMs: number;
  /** Viewport used for this capture */
  viewport: { width: number; height: number };
  /** Device type used */
  deviceType: 'desktop' | 'mobile';
  /** Rendered DOM snapshot collected post-hydration */
  renderedSnapshot?: RenderedSnapshot;
  /** Accessibility tree from the browser runtime */
  accessibilityTree?: AccessibilityNode | null;
  /** Core Web Vitals collected via PerformanceObserver */
  coreWebVitals?: CoreWebVitals;
  /** Number of render-blocking resources detected in the rendered DOM */
  renderBlockingResourceCount?: number;
}

export interface RenderedSnapshot {
  metaTags: Record<string, string>;
  headings: Heading[];
  links: Link[];
  images: ImageInfo[];
  ariaLandmarks: AriaLandmark[];
  interactiveElements?: InteractiveElement[];
  contrastIssues?: ContrastIssue[];
  structuredData: any[];
  visibleText: string;
}

export interface CoreWebVitals {
  /** Largest Contentful Paint in milliseconds */
  lcpMs?: number;
  /** Cumulative Layout Shift score */
  cls?: number;
}

export interface ConsoleEntry {
  level: 'error' | 'warning' | 'info' | 'log' | 'debug';
  message: string;
  /** Truncated to 500 chars to prevent PII leakage */
  timestamp: string;
}

export interface NetworkEntry {
  url: string;
  method: string;
  statusCode: number;
  contentType: string;
  /** Size in bytes */
  size: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Only type/category, not request/response bodies */
  resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'xhr' | 'fetch' | 'other';
}

/** Structured error from a failed page crawl */
export interface CrawlError {
  url: string;
  error: string;
  errorType: 'timeout' | 'navigation' | 'validation' | 'robots' | 'unknown';
  retryCount: number;
  timestamp: string;
}

export interface AccessibilityNode {
  role: string;
  name?: string;
  children?: AccessibilityNode[];
}
