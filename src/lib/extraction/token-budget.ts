import type { AuditDimension, PageSummary } from '@/types';

const TOKEN_BUDGETS: Partial<Record<AuditDimension, number>> = {
  seo: 2_000,
  accessibility: 3_000,
  security: 500,
  performance: 200,
  'agent-nativeness': 5_000,
  copy: 4_000,
  ux: 4_000,
  aeo: 2_000,
  geo: 2_000,
  meo: 2_000
};

export function getTokenBudget(dimension: AuditDimension): number {
  return TOKEN_BUDGETS[dimension] ?? 2_000;
}

export function estimateTokens(value: string): number {
  if (!value.trim()) {
    return 0;
  }

  return Math.ceil(value.trim().length / 4);
}

export function clampTextToBudget(text: string, budget: number): string {
  const maxChars = Math.max(0, budget * 4);
  const clamped = text.trim().slice(0, maxChars);
  return clamped.replace(/\s+/g, ' ').trim();
}

export function buildPrimitivePayload(summary: PageSummary, dimension: AuditDimension): Record<string, unknown> {
  const budget = getTokenBudget(dimension);

  switch (dimension) {
    case 'security':
      return {
        url: summary.url,
        securityHeaders: summary.securityHeaders,
        networkSummary: summary.networkSummary,
        tokenEstimate: estimateTokens(JSON.stringify({
          securityHeaders: summary.securityHeaders,
          networkSummary: summary.networkSummary
        }))
      };
    case 'performance':
      return {
        url: summary.url,
        performanceMetrics: summary.performanceMetrics,
        networkSummary: {
          totalRequests: summary.networkSummary.totalRequests,
          totalSizeBytes: summary.networkSummary.totalSizeBytes
        },
        tokenEstimate: estimateTokens(JSON.stringify(summary.performanceMetrics))
      };
    case 'accessibility':
      return {
        url: summary.url,
        headings: summary.headings,
        images: summary.images,
        ariaLandmarks: summary.ariaLandmarks,
        links: summary.links,
        sanitizedTextContent: clampTextToBudget(summary.sanitizedTextContent, budget),
        tokenEstimate: Math.min(summary.tokenEstimate, budget)
      };
    case 'agent-nativeness':
    case 'copy':
    case 'ux':
      return {
        url: summary.url,
        title: summary.title,
        headings: summary.headings,
        structuredData: summary.structuredData,
        sanitizedTextContent: clampTextToBudget(summary.sanitizedTextContent, budget),
        tokenEstimate: Math.min(summary.tokenEstimate, budget)
      };
    default:
      return {
        url: summary.url,
        title: summary.title,
        metaTags: summary.metaTags,
        headings: summary.headings,
        structuredData: summary.structuredData,
        sanitizedTextContent: clampTextToBudget(summary.sanitizedTextContent, budget),
        tokenEstimate: Math.min(summary.tokenEstimate, budget)
      };
  }
}
