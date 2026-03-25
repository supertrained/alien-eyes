/**
 * Immutable evidence that a finding is real.
 * Required by Principle 14: Every finding must carry evidence.
 */
export interface EvidenceBundle {
  /** URL where the finding was observed */
  url: string;
  /** ISO 8601 timestamp when the finding was observed */
  timestamp: string;
  /** SHA-256 hash of the DOM at the time of observation */
  domSnapshotHash: string;
  /** Storage path to screenshot (Supabase Storage or local file) */
  screenshotPath?: string;
  /** Relevant request/response data (headers, status codes — NOT bodies) */
  relevantHeaders?: Record<string, string>;
  /** Which model produced this finding (if LLM-generated) */
  model?: string;
  /** Token count used to generate this finding */
  tokensUsed?: number;
  /** The reasoning chain that led to this finding */
  reasoning?: string;
  /** Evidence completeness score 0-1. */
  completeness: number;
}

/**
 * Resolution state of a finding.
 * Required by Principle 15: Findings have lifecycle states.
 */
export interface FindingLifecycle {
  /** Current state */
  state: FindingLifecycleState;
  /** When the state was last updated */
  updatedAt: string;
  /** Who/what updated the state (user ID, agent ID, or "system") */
  updatedBy?: string;
  /** Reason for the current state */
  reason?: string;
  /** For platform-limited findings: which platform */
  platform?: string;
  /** For third-party findings: which service */
  thirdPartyService?: string;
}

export type FindingLifecycleState =
  | 'detected'
  | 'delivered'
  | 'accepted'
  | 'disputed'
  | 'fixed'
  | 'false_positive'
  | 'fixable'
  | 'mitigable'
  | 'platform_limited'
  | 'accepted_risk'
  | 'third_party';
