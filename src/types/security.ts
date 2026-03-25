export interface URLValidationResult {
  valid: boolean;
  url: string;
  resolvedIPs: string[];
  blocked: boolean;
  blockReason?: string;
}

export interface CostBudget {
  /** Optional cap in USD. Not enforced in Phase 0 (measurement mode). */
  maxPerAudit?: number;
  /** Running total — always tracked */
  currentSpend: number;
  /** Informational in Phase 0; does not trigger kill */
  isExceeded: boolean;
  /** Per-primitive cost tracking — always recorded */
  primitiveSpend: Record<string, number>;
}
