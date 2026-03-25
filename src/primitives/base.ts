import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { AuditConfig, AuditPrimitive, EvidenceBundle, Finding, FindingLifecycle, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { runPrimitive, type Envelope } from '@/types';
import { InputSanitizer } from '@/lib/security/input-sanitizer';
import type { ModelRouter } from '@/lib/llm/model-router';
import { buildStructuredPrompt } from '@/lib/llm/prompt-templates';

export const findingSchema = z.object({
  id: z.string(),
  what: z.string().min(1),
  where: z.string().min(1),
  expected: z.string().min(1),
  why: z.string().min(1),
  verify: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  dimension: z.string().min(1),
  causalChain: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  requiresHumanJudgment: z.boolean().optional(),
  humanJudgmentReason: z.string().optional(),
  evidence: z.object({
    url: z.string().url(),
    timestamp: z.string(),
    domSnapshotHash: z.string(),
    screenshotPath: z.string().optional(),
    relevantHeaders: z.record(z.string(), z.string()).optional(),
    model: z.string().optional(),
    tokensUsed: z.number().optional(),
    reasoning: z.string().optional(),
    completeness: z.number().min(0).max(1)
  }),
  lifecycle: z.object({
    state: z.enum(['detected', 'delivered', 'accepted', 'disputed', 'fixed', 'false_positive', 'fixable', 'mitigable', 'platform_limited', 'accepted_risk', 'third_party']),
    updatedAt: z.string(),
    updatedBy: z.string().optional(),
    reason: z.string().optional(),
    platform: z.string().optional(),
    thirdPartyService: z.string().optional()
  })
});

export abstract class BasePrimitive implements AuditPrimitive {
  abstract readonly name: string;
  abstract readonly dimension: AuditPrimitive['dimension'];
  abstract readonly requiresOwnershipVerification: boolean;
  abstract readonly usesLLM: boolean;

  protected readonly sanitizer: InputSanitizer;
  protected readonly router?: ModelRouter;

  constructor(options: { sanitizer?: InputSanitizer; router?: ModelRouter } = {}) {
    this.sanitizer = options.sanitizer ?? new InputSanitizer();
    this.router = options.router;
  }

  abstract run(crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig): Promise<Envelope<Finding[]>>;

  protected createFinding(params: {
    page: PageSummary;
    id: string;
    what: string;
    expected: string;
    why: string;
    verify: string;
    severity: Finding['severity'];
    confidence: number;
    reasoning?: string;
    model?: string;
    tokensUsed?: number;
    requiresHumanJudgment?: boolean;
    humanJudgmentReason?: string;
  }): Finding {
    return findingSchema.parse({
      id: params.id,
      what: params.what,
      where: params.page.url,
      expected: params.expected,
      why: params.why,
      verify: params.verify,
      severity: params.severity,
      dimension: this.dimension,
      confidence: params.confidence,
      requiresHumanJudgment: params.requiresHumanJudgment,
      humanJudgmentReason: params.humanJudgmentReason,
      evidence: createEvidence(params.page, params.reasoning, params.model, params.tokensUsed),
      lifecycle: createLifecycle()
    }) as Finding;
  }

  validateFindings(findings: Finding[]): Finding[] {
    return findings.map((finding) => findingSchema.parse(finding) as Finding);
  }

  protected async maybeGenerateLlmFindings(options: {
    primitive: string;
    tier: 'opus' | 'sonnet' | 'haiku' | 'openai-mini';
    task: string;
    summaries: PageSummary[];
    schema: z.ZodSchema<Array<z.infer<typeof llmFindingSchema>>>;
  }): Promise<Array<z.infer<typeof llmFindingSchema>>> {
    if (!this.router) {
      return [];
    }

    const payload = options.summaries.map((summary) => ({
      url: summary.url,
      title: summary.title,
      headings: summary.headings,
      structuredData: summary.structuredData,
      sanitizedTextContent: this.sanitizer.extractVisibleText(summary.sanitizedTextContent),
      metaTags: summary.metaTags,
      images: summary.images,
      ariaLandmarks: summary.ariaLandmarks,
      securityHeaders: summary.securityHeaders,
      performanceMetrics: summary.performanceMetrics
    }));

    const prompt = buildStructuredPrompt({
      task: options.task,
      outputSchema: '[{ pageUrl, what, expected, why, verify, severity, confidence }]',
      data: JSON.stringify(payload)
    });

    const result = await this.router.completeJson({
      tier: options.tier,
      schema: options.schema,
      system: prompt.system,
      prompt: prompt.user,
      primitive: options.primitive,
      temperature: 0
    });

    return result.data;
  }
}

export const llmFindingSchema = z.object({
  pageUrl: z.string().url(),
  what: z.string().min(1),
  expected: z.string().min(1),
  why: z.string().min(1),
  verify: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  confidence: z.number().min(0).max(1)
});

export function withPrimitiveEnvelope<TPrimitive extends BasePrimitive>(
  primitive: TPrimitive,
  methodologyVersion: string,
  fn: () => Promise<Finding[]>
): Promise<Envelope<Finding[]>> {
  return runPrimitive(primitive.name, methodologyVersion, async () => {
    const findings = primitive.validateFindings(await fn());
    return {
      data: findings,
      confidence: findings.length > 0 ? average(findings.map((finding) => finding.confidence)) : 1,
      confidenceFactors: findings.length > 0 ? ['deterministic rules evaluated'] : ['no violations detected'],
      reasoning: `${primitive.name} evaluated ${findings.length} finding(s)`
    };
  });
}

export function createFindingId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function average(values: number[]): number {
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function createLifecycle(): FindingLifecycle {
  return {
    state: 'detected',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  };
}

function createEvidence(page: PageSummary, reasoning?: string, model?: string, tokensUsed?: number): EvidenceBundle {
  return {
    url: page.url,
    timestamp: new Date().toISOString(),
    domSnapshotHash: createHash('sha256').update(`${page.url}:${page.sanitizedTextContent}`).digest('hex'),
    screenshotPath: undefined,
    relevantHeaders: toHeaderMap(page.securityHeaders),
    model,
    tokensUsed,
    reasoning,
    completeness: 0.75
  };
}

function toHeaderMap(headers: PageSummary['securityHeaders']): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => typeof value === 'string' && value)
      .map(([key, value]) => [key, value as string])
  );
}
