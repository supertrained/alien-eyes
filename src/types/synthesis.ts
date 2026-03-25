import type { Finding } from '@/types/finding';
import type { AuditDimension } from '@/types/primitive';

/**
 * The synthesized output of a full audit.
 * Produced by the synthesis engine from all primitive outputs.
 */
export interface SynthesisResult {
  /** Unique audit identifier */
  auditId: string;
  /** URL that was audited */
  url: string;
  /** All findings, de-duplicated and sorted by fix order */
  findings: Finding[];
  /** What's working well — positive observations */
  celebration: CelebrationSection;
  /** Overall satisfaction score (0-100) with confidence interval */
  satisfactionScore: Score;
  /** Human-native composite score */
  humanNativeScore: Score;
  /** Agent-nativeness composite score */
  agentNativenessScore: Score;
  /** Per-dimension scores */
  dimensionScores: Record<AuditDimension, Score | null>;
  /** Causal chains linking related findings */
  causalChains: CausalChain[];
  /** Verbatim narrative from simulated user perspective */
  verbatimNarrative: string;
  /** Metadata about the audit */
  meta: AuditMeta;
  /** Delta comparison (if re-audit) */
  delta?: DeltaComparison;
}

export interface Score {
  value: number;
  confidenceLow: number;
  confidenceHigh: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  guidance: string;
}

export interface CelebrationSection {
  /** Total pages crawled */
  pageCount: number;
  /** Number of working user flows identified */
  workingFlows: number;
  /** Dimensions where no issues were found */
  cleanDimensions: AuditDimension[];
  /** Specific positive observations */
  positiveObservations: string[];
}

export interface CausalChain {
  /** IDs of findings in this chain */
  findingIds: string[];
  /** Description of how these findings interact */
  description: string;
  /** Which finding to fix first */
  rootCauseId: string;
}

export interface AuditMeta {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Total audit duration in milliseconds */
  durationMs: number;
  /** Total LLM cost in USD */
  totalCostUsd: number;
  /** Cost breakdown by primitive */
  costByPrimitive: Record<string, number>;
  /** Methodology version used */
  methodologyVersion: string;
  /** Pages crawled vs pages discovered */
  pagesCrawled: number;
  pagesDiscovered: number;
  /** Detected technology stack */
  detectedStack?: string[];
  /** Whether ownership was verified */
  ownershipVerified: boolean;
  /** Audit tier */
  tier: 'quick_check' | 'full_audit';
}

export interface DeltaComparison {
  /** Previous audit ID */
  previousAuditId: string;
  /** Previous audit timestamp */
  previousTimestamp: string;
  /** Findings that were fixed since last audit */
  fixed: Finding[];
  /** Findings that are new (not in previous audit) */
  new: Finding[];
  /** Findings that regressed (were fixed, now broken again) */
  regressed: Finding[];
  /** Findings unchanged from previous audit */
  unchanged: Finding[];
  /** Score change */
  scoreChange: {
    satisfaction: number;
    humanNative: number;
    agentNativeness: number;
  };
}
