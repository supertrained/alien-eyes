import type { AuditDimension, Envelope, Finding, SynthesisResult } from '@/types';
import type { CrawlResult } from '@/types';
import type { AuditConfig } from '@/types';
import type { ModelRouter } from '@/lib/llm/model-router';
import { buildCausalChains } from '@/lib/synthesis/causal-chains';
import { buildCelebration } from '@/lib/synthesis/celebration';
import { deduplicateFindings } from '@/lib/synthesis/deduplicator';
import { generateNarrative } from '@/lib/synthesis/narrative-generator';
import {
  calculateAgentNativenessScore,
  calculateDimensionScores,
  calculateHumanNativeScore,
  calculateSatisfactionScore
} from '@/lib/synthesis/scoring';

/** Map primitive names to their audit dimension. */
const PRIMITIVE_TO_DIMENSION: Record<string, AuditDimension> = {
  seo: 'seo',
  accessibility: 'accessibility',
  security: 'security',
  performance: 'performance',
  'agent-nativeness': 'agent-nativeness',
  'copy-ux': 'ux'
};

export class Synthesizer {
  constructor(private readonly router?: ModelRouter) {}

  async synthesize(options: {
    auditId: string;
    crawl: CrawlResult;
    envelopes: Array<Envelope<Finding[]>>;
    config: AuditConfig;
    startedAt?: number;
  }): Promise<SynthesisResult> {
    const allFindings = options.envelopes.flatMap((envelope) => envelope.data ?? []);
    const deduplicated = deduplicateFindings(allFindings);
    const causalChains = buildCausalChains(deduplicated);
    const findings = applyCausalMetadata(sortFindings(deduplicated), causalChains);

    // Derive active dimensions from the envelopes that actually ran
    const activeDimensions = inferActiveDimensions(options.envelopes);

    // Step 1: dimension scores (active dimensions with 0 findings = 100, inactive = null)
    const dimensionScores = calculateDimensionScores(findings, activeDimensions);

    // Step 2: composite scores derived from dimension scores
    const satisfactionScore = calculateSatisfactionScore(dimensionScores);
    const humanNativeScore = calculateHumanNativeScore(dimensionScores);
    const agentNativenessScore = calculateAgentNativenessScore(dimensionScores);

    const celebration = buildCelebration(findings, options.crawl);
    const narrative = await generateNarrative({ findings, crawl: options.crawl, router: this.router });
    const costSnapshot = this.router?.getCostSnapshot();

    return {
      auditId: options.auditId,
      url: options.crawl.url,
      findings,
      celebration,
      satisfactionScore,
      humanNativeScore,
      agentNativenessScore,
      dimensionScores,
      causalChains,
      verbatimNarrative: narrative,
      meta: {
        timestamp: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - (options.startedAt ?? Date.now())),
        totalCostUsd: costSnapshot?.currentSpend ?? options.envelopes.reduce((sum, envelope) => sum + (envelope.metadata.costUsd ?? 0), 0),
        costByPrimitive: costSnapshot?.primitiveSpend ?? Object.fromEntries(options.envelopes.map((envelope) => [envelope.primitive, envelope.metadata.costUsd ?? 0])),
        methodologyVersion: options.config.methodologyVersion,
        pagesCrawled: options.crawl.pages.length,
        pagesDiscovered: options.crawl.pages.length + options.crawl.pagesSkipped,
        detectedStack: options.crawl.detectedStack,
        ownershipVerified: options.config.ownershipVerified,
        tier: options.config.tier
      }
    };
  }
}

function inferActiveDimensions(envelopes: Array<Envelope<Finding[]>>): AuditDimension[] {
  const dimensions = new Set<AuditDimension>();
  for (const envelope of envelopes) {
    const dimension = PRIMITIVE_TO_DIMENSION[envelope.primitive];
    if (dimension) {
      dimensions.add(dimension);
    }
  }
  return Array.from(dimensions);
}

function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((left, right) => {
    const severityDelta = severityRank(left.severity) - severityRank(right.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return right.confidence - left.confidence;
  });
}

function applyCausalMetadata(findings: Finding[], chains: SynthesisResult['causalChains']): Finding[] {
  return findings.map((finding) => ({
    ...finding,
    causalChain: chains
      .filter((chain) => chain.findingIds.includes(finding.id))
      .flatMap((chain) => chain.findingIds.filter((id) => id !== finding.id))
  }));
}

function severityRank(severity: Finding['severity']): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity];
}
