import type { EvidenceBundle, FindingLifecycle } from '@/types/evidence';
import type { AuditDimension } from '@/types/primitive';

/**
 * The atomic unit of Alien Eyes output.
 * All formats are views of the same finding.
 */
export interface Finding {
  /** Unique identifier. Format: dimension-NNN */
  id: string;
  /** What is wrong — specific observable behavior */
  what: string;
  /** Where in the product — URL, endpoint, page section, or component */
  where: string;
  /** What should happen instead */
  expected: string;
  /** Why it matters — who is affected and how */
  why: string;
  /** How to verify the fix */
  verify: string;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Which audit dimension produced this finding */
  dimension: AuditDimension;
  /** Causal chain IDs of related findings */
  causalChain?: string[];
  /** Confidence score 0-1 */
  confidence: number;
  /** Whether this finding requires human judgment */
  requiresHumanJudgment?: boolean;
  /** Why human judgment is required */
  humanJudgmentReason?: string;
  /** Evidence bundle — every finding must carry proof */
  evidence: EvidenceBundle;
  /** Resolution state — tracks the lifecycle of this finding */
  lifecycle: FindingLifecycle;
}
