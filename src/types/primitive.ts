import type { CrawlResult } from '@/types/crawl';
import type { Envelope } from '@/types/envelope';
import type { Finding } from '@/types/finding';
import type { PageSummary } from '@/types/page-summary';

/**
 * All audit dimensions.
 * V1 implements: seo, accessibility, security, performance, agent-nativeness, copy-ux.
 */
export type AuditDimension =
  | 'seo'
  | 'aeo'
  | 'geo'
  | 'meo'
  | 'accessibility'
  | 'security'
  | 'performance'
  | 'ux'
  | 'copy'
  | 'analytics'
  | 'legal'
  | 'agent-nativeness'
  | 'email'
  | 'api-quality'
  // Marketing dimensions
  | 'traffic'
  | 'cro'
  | 'ads'
  | 'competitors'
  | 'company'
  | 'brand'
  | 'social'
  | 'pricing'
  | 'content'
  | 'messaging'
  | 'technical';

/**
 * Audit configuration passed to every primitive.
 */
export interface AuditConfig {
  /** Audit tier: quick_check = free/deterministic, full_audit = paid/LLM */
  tier: 'quick_check' | 'full_audit';
  /** Whether the URL owner has been verified */
  ownershipVerified: boolean;
  /** Maximum pages to audit */
  pageLimit: number;
  /** Maximum LLM cost for this audit */
  costBudget: number;
  /** Methodology version to use */
  methodologyVersion: string;
  /** Whether this is a re-audit */
  isReAudit: boolean;
  /** Previous audit ID (if re-audit) */
  previousAuditId?: string;
  /** Targeted dimensions (empty = all) */
  targetedDimensions?: AuditDimension[];
}

/**
 * Every audit primitive implements this interface.
 */
export interface AuditPrimitive {
  /** Unique name of this primitive (e.g., seo, accessibility) */
  name: string;
  /** Which dimension this primitive evaluates */
  dimension: AuditDimension;
  /** Whether this primitive requires ownership verification to run */
  requiresOwnershipVerification: boolean;
  /** Whether this primitive uses LLM (false = deterministic, no cost) */
  usesLLM: boolean;
  /** Run the primitive against crawl data. */
  run(
    crawl: CrawlResult,
    summaries: PageSummary[],
    config: AuditConfig
  ): Promise<Envelope<Finding[]>>;
}
