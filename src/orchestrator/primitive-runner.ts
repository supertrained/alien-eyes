import registry, { type PrimitiveContext, type PrimitiveDefinition } from '@/lib/primitive-registry';
import { registerAllPrimitives } from '@/lib/register-primitives';
import type { AuditConfig } from '@/types/primitive';
import type { Envelope } from '@/types/envelope';
import type { Finding } from '@/types/finding';
import type { CrawlResult } from '@/types/crawl';
import type { PageSummary } from '@/types/page-summary';
import { CrawlEngine } from '@/lib/crawler/crawl-engine';
import { PageSummarizer } from '@/lib/extraction/page-summarizer';
import { ModelRouter } from '@/lib/llm/model-router';
import { URLValidator } from '@/lib/security/url-validator';

registerAllPrimitives();

export interface PrimitiveRunRequest {
  domain: string;
  primitives?: string[];
  config?: Partial<AuditConfig>;
}

export interface PrimitiveRunResult {
  domain: string;
  results: Map<string, Envelope<Finding[]>>;
  executionOrder: string[];
  durationMs: number;
  crawl?: CrawlResult;
}

const DEFAULT_CONFIG: AuditConfig = {
  tier: 'quick_check',
  ownershipVerified: false,
  pageLimit: 10,
  costBudget: 5,
  methodologyVersion: 'v0.1',
  isReAudit: false,
};

const PRIMITIVE_TIMEOUT_MS = 60_000;

export async function runPrimitives(request: PrimitiveRunRequest): Promise<PrimitiveRunResult> {
  const start = performance.now();
  const config: AuditConfig = { ...DEFAULT_CONFIG, ...request.config };

  const primitiveNames = request.primitives?.length
    ? registry.resolveDependencies(request.primitives)
    : registry.names();

  const definitions = primitiveNames
    .map(n => registry.get(n))
    .filter((d): d is PrimitiveDefinition => d !== undefined);

  const needsCrawl = definitions.some(d => d.type === 'crawl');
  const router = config.tier === 'full_audit' ? new ModelRouter() : undefined;

  let crawl: CrawlResult | undefined;
  let summaries: PageSummary[] | undefined;

  if (needsCrawl) {
    const validator = new URLValidator();
    const url = request.domain.startsWith('http') ? request.domain : `https://${request.domain}`;
    let validation = await validator.validate(url);
    if (!validation.valid && validation.blockReason?.startsWith('DNS resolution failed')) {
      const parsed = new URL(url);
      if (!parsed.hostname.startsWith('www.')) {
        parsed.hostname = `www.${parsed.hostname}`;
        validation = await validator.validate(parsed.toString());
      }
    }
    if (!validation.valid) {
      throw new Error(validation.blockReason ?? 'URL validation failed');
    }
    const engine = new CrawlEngine({ validator });
    try {
      crawl = await engine.crawl(validation.url, { pageLimit: config.pageLimit });
      summaries = new PageSummarizer().summarize(crawl);
    } finally {
      await engine.close().catch(() => undefined);
    }
  }

  const results = new Map<string, Envelope<Finding[]>>();
  const executionOrder: string[] = [];

  const crawlDefs = definitions.filter(d => d.type === 'crawl');
  const gatherDefs = definitions.filter(d => d.type === 'gather');

  if (crawlDefs.length > 0) {
    const ctx: PrimitiveContext = {
      domain: request.domain,
      crawl,
      summaries,
      config,
      router,
      previousResults: results,
    };
    await Promise.all(
      crawlDefs.map(async (def) => {
        const result = await runWithTimeout(def, ctx);
        results.set(def.name, result);
        executionOrder.push(def.name);
      })
    );
  }

  if (gatherDefs.length > 0) {
    const dagResult = await executeGatherDag(gatherDefs, {
      domain: request.domain,
      crawl,
      summaries,
      config,
      router,
    }, results);
    for (const [name, envelope] of dagResult.results) {
      results.set(name, envelope);
    }
    executionOrder.push(...dagResult.order);

    import('@/lib/marketing/browser-pool')
      .then(m => m.closeAll())
      .catch(() => undefined);
  }

  return {
    domain: request.domain,
    results,
    executionOrder,
    durationMs: Math.round(performance.now() - start),
    crawl,
  };
}

interface DagGatherResult {
  results: Map<string, Envelope<Finding[]>>;
  order: string[];
}

async function executeGatherDag(
  defs: PrimitiveDefinition[],
  baseCtx: Omit<PrimitiveContext, 'previousResults'>,
  existingResults: Map<string, Envelope<Finding[]>>,
): Promise<DagGatherResult> {
  const results = new Map<string, Envelope<Finding[]>>();
  const completionOrder: string[] = [];
  const defMap = new Map(defs.map(d => [d.name, d]));
  const pending = new Set(defs.map(d => d.name));
  const inFlight = new Map<string, Promise<void>>();

  function allResults(): Map<string, Envelope<Finding[]>> {
    const merged = new Map(existingResults);
    for (const [k, v] of results) merged.set(k, v);
    return merged;
  }

  function depsResolved(name: string): boolean {
    const def = defMap.get(name);
    if (!def?.dependencies?.length) return true;
    return def.dependencies.every(
      dep => results.has(dep) || existingResults.has(dep) || !pending.has(dep)
    );
  }

  function launchReady(): void {
    for (const name of pending) {
      if (inFlight.has(name)) continue;
      if (!depsResolved(name)) continue;

      const def = defMap.get(name)!;

      const run = async () => {
        try {
          const ctx: PrimitiveContext = {
            ...baseCtx,
            previousResults: allResults(),
          };
          const result = await runWithTimeout(def, ctx);
          results.set(name, result);
          completionOrder.push(name);
        } catch (error) {
          results.set(name, {
            primitive: name,
            status: 'error',
            data: [],
            confidence: 0,
            confidenceFactors: [`error: ${error instanceof Error ? error.message : String(error)}`],
            metadata: {
              durationMs: 0,
              methodologyVersion: baseCtx.config.methodologyVersion,
            },
          });
          completionOrder.push(name);
        } finally {
          pending.delete(name);
          inFlight.delete(name);
          launchReady();
        }
      };

      inFlight.set(name, run());
    }
  }

  launchReady();

  while (pending.size > 0) {
    if (inFlight.size === 0 && pending.size > 0) {
      for (const name of pending) {
        results.set(name, {
          primitive: name,
          status: 'error',
          data: [],
          confidence: 0,
          confidenceFactors: ['dependency deadlock'],
          metadata: { durationMs: 0, methodologyVersion: baseCtx.config.methodologyVersion },
        });
        completionOrder.push(name);
      }
      break;
    }
    await Promise.race([...inFlight.values()]);
  }

  return { results, order: completionOrder };
}

async function runWithTimeout(
  def: PrimitiveDefinition,
  ctx: PrimitiveContext,
): Promise<Envelope<Finding[]>> {
  const timeout = def.timeoutMs ?? PRIMITIVE_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      def.run(ctx),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout: ${def.name} exceeded ${timeout}ms`)),
          timeout,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function listPrimitives(): PrimitiveDefinition[] {
  return registry.list();
}
