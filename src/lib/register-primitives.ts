import registry, { type PrimitiveContext, type PrimitiveDefinition } from '@/lib/primitive-registry';
import type { Envelope } from '@/types/envelope';
import type { Finding } from '@/types/finding';
import { SeoPrimitive } from '@/primitives/seo';
import { AccessibilityPrimitive } from '@/primitives/accessibility';
import { SecurityPrimitive } from '@/primitives/security';
import { PerformancePrimitive } from '@/primitives/performance';
import { AgentNativenessPrimitive } from '@/primitives/agent-nativeness';
import { CopyUxPrimitive } from '@/primitives/copy-ux';

function wrapCrawlPrimitive(
  PrimitiveClass: new (opts: { router?: any }) => any,
  meta: Omit<PrimitiveDefinition, 'run' | 'type'>
): PrimitiveDefinition {
  return {
    ...meta,
    type: 'crawl',
    run: async (ctx: PrimitiveContext): Promise<Envelope<Finding[]>> => {
      if (!ctx.crawl || !ctx.summaries) {
        return {
          primitive: meta.name,
          status: 'error',
          data: [],
          confidence: 0,
          confidenceFactors: ['no crawl data provided for crawl-type primitive'],
          metadata: { durationMs: 0, methodologyVersion: ctx.config.methodologyVersion },
        };
      }
      const instance = new PrimitiveClass({ router: ctx.router });
      return instance.run(ctx.crawl, ctx.summaries, ctx.config);
    },
  };
}

// --- Quality primitives (crawl-based) ---

const qualityPrimitives: PrimitiveDefinition[] = [
  wrapCrawlPrimitive(SeoPrimitive, {
    name: 'seo',
    dimension: 'seo',
    category: 'quality',
    usesLLM: true,
    costEstimate: { min: 0.01, max: 0.20 },
  }),
  wrapCrawlPrimitive(AccessibilityPrimitive, {
    name: 'accessibility',
    dimension: 'accessibility',
    category: 'quality',
    usesLLM: true,
    costEstimate: { min: 0.01, max: 0.15 },
  }),
  wrapCrawlPrimitive(SecurityPrimitive, {
    name: 'security',
    dimension: 'security',
    category: 'quality',
    usesLLM: false,
    costEstimate: { min: 0, max: 0 },
  }),
  wrapCrawlPrimitive(PerformancePrimitive, {
    name: 'performance',
    dimension: 'performance',
    category: 'quality',
    usesLLM: false,
    costEstimate: { min: 0, max: 0 },
  }),
  wrapCrawlPrimitive(AgentNativenessPrimitive, {
    name: 'agent-nativeness',
    dimension: 'agent-nativeness',
    category: 'quality',
    usesLLM: true,
    costEstimate: { min: 0.01, max: 0.30 },
  }),
  wrapCrawlPrimitive(CopyUxPrimitive, {
    name: 'copy-ux',
    dimension: 'copy',
    category: 'quality',
    usesLLM: true,
    costEstimate: { min: 0.01, max: 0.25 },
  }),
];

// --- Marketing primitives (gather-based) ---
// These will be adapted to output Finding[] in a future step.
// For now, register them as stubs that delegate to the GMPF runner functions.

function url(domain: string): string {
  return `https://${domain}`;
}

const marketingPrimitives: PrimitiveDefinition[] = [
  {
    name: 'traffic-analysis',
    type: 'gather',
    dimension: 'traffic',
    category: 'marketing',
    usesLLM: false,
    costEstimate: { min: 0.05, max: 0.50 },
    requiresKeys: ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD'],
    run: async (ctx) => gatherStub(ctx, 'traffic-analysis', () =>
      import('@/primitives/marketing/traffic-analysis').then(m => m.runTrafficAnalysis(ctx.domain))),
  },
  {
    name: 'website-cro',
    type: 'gather',
    dimension: 'cro',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 1.00 },
    run: async (ctx) => gatherStub(ctx, 'website-cro', () =>
      import('@/primitives/marketing/website-cro').then(m => m.runWebsiteCro(url(ctx.domain), 'ae-registry'))),
  },
  {
    name: 'tracking-analytics',
    type: 'gather',
    dimension: 'analytics',
    category: 'marketing',
    usesLLM: false,
    costEstimate: { min: 0.01, max: 0.10 },
    run: async (ctx) => gatherStub(ctx, 'tracking-analytics', () =>
      import('@/primitives/marketing/tracking-analytics').then(m => m.runTrackingAnalytics(url(ctx.domain), ctx.domain))),
  },
  {
    name: 'meta-ads',
    type: 'gather',
    dimension: 'ads',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 0.80 },
    dependencies: ['company-enrichment'],
    run: async (ctx) => {
      const company = getUpstreamRawData(ctx, 'company-enrichment');
      const companyName = (company?.company as any)?.name ?? ctx.domain;
      const alternateNames = (company?.company as any)?.alternateNames as string[] | undefined;
      const facebookPageName = ((company?.company as any)?.facebookUrl as string | undefined)
        ?.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')?.replace(/\/$/, '') || undefined;
      return gatherStub(ctx, 'meta-ads', () =>
        import('@/primitives/marketing/meta-ads').then(m =>
          m.runMetaAds(companyName, ctx.domain, 'ae-registry', alternateNames, facebookPageName)));
    },
  },
  {
    name: 'google-ads',
    type: 'gather',
    dimension: 'ads',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 0.80 },
    dependencies: ['company-enrichment'],
    run: async (ctx) => {
      const company = getUpstreamRawData(ctx, 'company-enrichment');
      const companyName = (company?.company as any)?.name as string | undefined;
      const alternateNames = (company?.company as any)?.alternateNames as string[] | undefined;
      return gatherStub(ctx, 'google-ads', () =>
        import('@/primitives/marketing/google-ads').then(m =>
          m.runGoogleAds(ctx.domain, 'ae-registry', companyName, alternateNames)));
    },
  },
  {
    name: 'email-analysis',
    type: 'gather',
    dimension: 'email',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.05, max: 0.50 },
    requiresKeys: ['AGENTMAIL_API_KEY'],
    run: async (ctx) => gatherStub(ctx, 'email-analysis', () =>
      import('@/primitives/marketing/email-analysis').then(m => m.runEmailAnalysis(url(ctx.domain), 'ae-registry'))),
  },
  {
    name: 'competitor-context',
    type: 'gather',
    dimension: 'competitors',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 0.80 },
    dependencies: ['traffic-analysis', 'company-enrichment'],
    requiresKeys: ['EXA_API_KEY'],
    run: async (ctx) => {
      const trafficRaw = getUpstreamRawData(ctx, 'traffic-analysis');
      const targetTraffic = (trafficRaw?.traffic as any)?.organicTraffic as number | null | undefined;
      return gatherStub(ctx, 'competitor-context', () =>
        import('@/primitives/marketing/competitor-context').then(m =>
          m.runCompetitorContext(ctx.domain, undefined, targetTraffic)));
    },
  },
  {
    name: 'company-enrichment',
    type: 'gather',
    dimension: 'company',
    category: 'marketing',
    usesLLM: false,
    costEstimate: { min: 0.02, max: 0.20 },
    run: async (ctx) => gatherStub(ctx, 'company-enrichment', () =>
      import('@/primitives/marketing/company-enrichment').then(m => m.runCompanyEnrichment(ctx.domain))),
  },
  {
    name: 'meo-analysis',
    type: 'gather',
    dimension: 'meo',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.20, max: 1.50 },
    requiresKeys: ['ANTHROPIC_API_KEY'],
    run: async (ctx) => gatherStub(ctx, 'meo-analysis', () =>
      import('@/primitives/marketing/meo-analysis').then(m => m.runMeoAnalysis(url(ctx.domain), ctx.domain))),
  },
  {
    name: 'agent-native-analysis',
    type: 'gather',
    dimension: 'agent-nativeness',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 0.80 },
    run: async (ctx) => gatherStub(ctx, 'agent-native-analysis', () =>
      import('@/primitives/marketing/agent-native-analysis').then(m => m.runAgentNativeAnalysis(url(ctx.domain), ctx.domain))),
  },
  {
    name: 'brand-reputation',
    type: 'gather',
    dimension: 'brand',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 0.60 },
    requiresKeys: ['EXA_API_KEY'],
    run: async (ctx) => gatherStub(ctx, 'brand-reputation', () =>
      import('@/primitives/marketing/brand-reputation').then(m => m.runBrandReputation(ctx.domain, ctx.domain))),
  },
  {
    name: 'social-organic',
    type: 'gather',
    dimension: 'social',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.05, max: 0.40 },
    run: async (ctx) => gatherStub(ctx, 'social-organic', () =>
      import('@/primitives/marketing/social-organic').then(m => m.runSocialOrganic(url(ctx.domain), ctx.domain))),
  },
  {
    name: 'pricing-monetization',
    type: 'gather',
    dimension: 'pricing',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.05, max: 0.40 },
    run: async (ctx) => gatherStub(ctx, 'pricing-monetization', () =>
      import('@/primitives/marketing/pricing-monetization').then(m => m.runPricingMonetization(url(ctx.domain)))),
  },
  {
    name: 'content-presence',
    type: 'gather',
    dimension: 'content',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.05, max: 0.30 },
    run: async (ctx) => gatherStub(ctx, 'content-presence', () =>
      import('@/primitives/marketing/content-presence').then(m => m.runContentPresence(url(ctx.domain), ctx.domain))),
  },
  {
    name: 'website-messaging',
    type: 'gather',
    dimension: 'messaging',
    category: 'marketing',
    usesLLM: true,
    costEstimate: { min: 0.10, max: 0.60 },
    run: async (ctx) => gatherStub(ctx, 'website-messaging', () =>
      import('@/primitives/marketing/website-messaging').then(m => m.runWebsiteMessaging(url(ctx.domain), ''))),
  },
  {
    name: 'website-technical',
    type: 'gather',
    dimension: 'technical',
    category: 'marketing',
    usesLLM: false,
    costEstimate: { min: 0.01, max: 0.10 },
    run: async (ctx) => gatherStub(ctx, 'website-technical', () =>
      import('@/primitives/marketing/website-technical').then(m => m.runWebsiteTechnical(url(ctx.domain), 'ae-registry'))),
  },
];

async function gatherStub(
  ctx: PrimitiveContext,
  name: string,
  runner: () => Promise<any>
): Promise<Envelope<Finding[]>> {
  const start = performance.now();
  try {
    const result = await runner();
    const signals: string[] = result?.data?.signals ?? [];
    const findings = signals.map((signal: string, i: number) => ({
      id: `${name}-${String(i + 1).padStart(3, '0')}`,
      what: signal,
      where: ctx.domain,
      expected: 'No issue detected',
      why: signal,
      verify: 'Review the full marketing audit report for details',
      severity: inferSeverityFromSignal(signal),
      dimension: name as Finding['dimension'],
      confidence: result?.confidence ?? 0.7,
      evidence: {
        url: `https://${ctx.domain}`,
        timestamp: new Date().toISOString(),
        domSnapshotHash: '',
        completeness: 0.5,
      },
      lifecycle: {
        state: 'detected' as const,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      },
    }));

    const rawData = result?.data ? { ...result.data } : undefined;
    if (rawData) delete rawData.signals;

    return {
      primitive: name,
      status: result?.status ?? 'success',
      data: findings,
      confidence: result?.confidence ?? 0.7,
      confidenceFactors: result?.confidenceFactors ?? ['marketing gather primitive'],
      reasoning: result?.reasoning,
      metadata: {
        model: result?.metadata?.model,
        tokensUsed: result?.metadata?.tokensUsed,
        costUsd: result?.metadata?.costUsd,
        durationMs: Math.round(performance.now() - start),
        methodologyVersion: ctx.config.methodologyVersion,
        rawData,
      },
    };
  } catch (error) {
    return {
      primitive: name,
      status: 'error',
      data: [],
      confidence: 0,
      confidenceFactors: ['primitive threw before producing output'],
      reasoning: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        durationMs: Math.round(performance.now() - start),
        methodologyVersion: ctx.config.methodologyVersion,
      },
    };
  }
}

function getUpstreamRawData(ctx: PrimitiveContext, primitiveName: string): Record<string, unknown> | undefined {
  const envelope = ctx.previousResults?.get(primitiveName);
  return envelope?.metadata?.rawData;
}

function inferSeverityFromSignal(signal: string): 'critical' | 'high' | 'medium' | 'low' {
  const lower = signal.toLowerCase();
  if (lower.includes('very low') || lower.includes('no ') || lower.includes('missing') || lower.includes('critical')) return 'critical';
  if (lower.includes('low') || lower.includes('weak') || lower.includes('poor')) return 'high';
  if (lower.includes('moderate') || lower.includes('could') || lower.includes('limited')) return 'medium';
  return 'low';
}

let registered = false;

export function registerAllPrimitives(): void {
  if (registered) return;
  registered = true;
  for (const p of qualityPrimitives) {
    registry.register(p);
  }
  for (const p of marketingPrimitives) {
    registry.register(p);
  }
}
