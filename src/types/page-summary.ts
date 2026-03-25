import type { AccessibilityNode } from '@/types/crawl';

/**
 * Compressed representation of a page for LLM consumption.
 * 2-5K tokens per page.
 */
export interface PageSummary {
  /** Page URL */
  url: string;
  /** Page title from title tag */
  title: string;
  /** All meta tags (name → content) */
  metaTags: Record<string, string>;
  /** Heading hierarchy */
  headings: Heading[];
  /** Internal and external links */
  links: Link[];
  /** Images with alt text status */
  images: ImageInfo[];
  /** ARIA landmarks and roles */
  ariaLandmarks: AriaLandmark[];
  /** Browser accessibility tree snapshot when available */
  accessibilityTree?: AccessibilityNode | null;
  /** Heuristic page-role classification used for context-aware checks */
  pageRole?: PageRole;
  /** Structured data (JSON-LD, microdata) */
  structuredData: any[];
  /** Interactive controls observed in the rendered DOM */
  interactiveElements?: InteractiveElement[];
  /** Precomputed contrast failures observed in the rendered DOM */
  contrastIssues?: ContrastIssue[];
  /** Structural trust cues observed in the rendered DOM */
  trustSignals?: TrustSignalSummary;
  /** Security-relevant headers */
  securityHeaders: SecurityHeaders;
  /** Console log summary */
  consoleSummary: ConsoleSummary;
  /** Network request summary */
  networkSummary: NetworkSummary;
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
  /** Visible text content, sanitized */
  sanitizedTextContent: string;
  /** Estimated token count of this summary */
  tokenEstimate: number;
  /** HTTP status code */
  statusCode: number;
}

export interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface Link {
  href: string;
  text: string;
  isInternal: boolean;
  /** Whether rel contains nofollow */
  nofollow: boolean;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
  /** Whether alt="" (decorative) vs missing entirely */
  hasAlt: boolean;
  isDecorative: boolean;
  width?: number;
  height?: number;
}

export interface AriaLandmark {
  role: string;
  label?: string;
  /** Whether it's a native HTML5 landmark */
  isNative: boolean;
}

export interface SecurityHeaders {
  csp: string | null;
  hsts: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  permissionsPolicy: string | null;
  accessControlAllowOrigin?: string | null;
  accessControlAllowCredentials?: string | null;
  /** Cookie attributes for each cookie */
  cookies: CookieInfo[];
}

export interface CookieInfo {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none' | null;
  /** Whether this appears to be a tracking cookie */
  isTracking: boolean;
}

export interface ConsoleSummary {
  errorCount: number;
  warningCount: number;
  /** Sample error messages (first 3, truncated) */
  sampleErrors: string[];
}

export interface NetworkSummary {
  totalRequests: number;
  totalSizeBytes: number;
  byType: Record<string, { count: number; sizeBytes: number }>;
  /** Third-party domains contacted */
  thirdPartyDomains: string[];
  /** Whether any requests fired before cookie consent */
  preConsentRequests: boolean;
  /** Absolute insecure resource URLs requested from an HTTPS page */
  mixedContentRequests?: string[];
}

export interface PerformanceMetrics {
  loadTimeMs: number;
  ttfbMs: number;
  domContentLoadedMs: number;
  /** Total page weight in bytes */
  totalWeightBytes: number;
  /** Number of render-blocking resources */
  renderBlockingCount: number;
  /** Largest Contentful Paint (if measurable) */
  lcpMs?: number;
  /** Cumulative Layout Shift (if measurable) */
  cls?: number;
}

export type PageRole =
  | 'homepage'
  | 'services'
  | 'pricing'
  | 'contact'
  | 'blog'
  | 'docs'
  | 'legal'
  | 'product'
  | 'other';

export interface InteractiveElement {
  tag: string;
  role?: string;
  text: string;
  accessibleName?: string;
  href?: string;
  type?: string;
}

export interface ContrastIssue {
  text: string;
  ratio: number;
  foreground: string;
  background: string;
  largeText: boolean;
}

export interface TrustSignalSummary {
  testimonialCount: number;
  logoCount: number;
  reviewCount: number;
  caseStudyLinkCount: number;
}
