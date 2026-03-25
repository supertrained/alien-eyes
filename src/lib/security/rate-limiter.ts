export const RATE_LIMITS = {
  quickCheckPerIpPer24h: 3,
  fullAuditPerIpPer24h: 10,
  quickCheckPerEmailPer30d: 1,
  globalLlmSpendMode: 'monitoring_only'
} as const;

export type RateLimits = typeof RATE_LIMITS;
