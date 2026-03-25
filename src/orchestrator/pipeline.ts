import type { Envelope, Finding, PageSummary, RendererRegistry, SynthesisResult } from '@/types';
import type { AuditConfig } from '@/types';
import { CrawlEngine } from '@/lib/crawler/crawl-engine';
import { PageSummarizer } from '@/lib/extraction/page-summarizer';
import { ModelRouter } from '@/lib/llm/model-router';
import { createPrimitiveRegistry } from '@/primitives';
import { renderers } from '@/renderers';
import { ProgressEmitter } from '@/orchestrator/progress';
import { AuditStateMachine } from '@/orchestrator/state-machine';
import { URLValidator } from '@/lib/security/url-validator';
import { Synthesizer } from '@/lib/synthesis/synthesizer';
import type { CrawlResult } from '@/types';
import { FieldNoteCollector, type FieldNote } from '@/orchestrator/field-notes';
import * as commentary from '@/orchestrator/commentary';

export interface AuditPipelineResult {
  synthesis: SynthesisResult;
  rendered: Record<keyof RendererRegistry, string>;
  crawl: CrawlResult;
  summaries: PageSummary[];
  primitiveResults: Array<Envelope<Finding[]>>;
  fieldNotes: FieldNote[];
  state: 'complete' | 'error' | 'timeout';
}

export interface PipelineDependencies {
  validator?: URLValidator;
  crawlEngine?: CrawlEngine;
  pageSummarizer?: PageSummarizer;
  router?: ModelRouter;
  synthesizer?: Synthesizer;
  rendererRegistry?: RendererRegistry;
  progressEmitter?: ProgressEmitter;
  stateMachine?: AuditStateMachine;
  timeoutMs?: number;
}

export async function runAuditPipeline(
  url: string,
  config: AuditConfig,
  dependencies: PipelineDependencies = {}
): Promise<AuditPipelineResult> {
  const startedAt = Date.now();
  const progressEmitter = dependencies.progressEmitter ?? new ProgressEmitter();
  const stateMachine = dependencies.stateMachine ?? new AuditStateMachine();
  const validator = dependencies.validator ?? new URLValidator();
  const router = dependencies.router ?? (config.tier === 'full_audit' ? new ModelRouter() : undefined);
  const crawlEngine = dependencies.crawlEngine ?? new CrawlEngine({ validator });
  const pageSummarizer = dependencies.pageSummarizer ?? new PageSummarizer();
  const synthesizer = dependencies.synthesizer ?? new Synthesizer(router);
  const rendererRegistry = dependencies.rendererRegistry ?? renderers;
  const timeoutMs = dependencies.timeoutMs ?? 300_000;

  const collector = new FieldNoteCollector(startedAt);

  function emitNotes(notes: Omit<FieldNote, 'seq' | 'elapsedMs'>[], progress: number, state: Parameters<AuditStateMachine['transition']>[0]) {
    for (const input of notes) {
      const note = collector.add(input);
      progressEmitter.emitFieldNote(note, collector.formatMessage(note), progress, state);
    }
  }

  const execution = (async () => {
    transition(stateMachine, progressEmitter, 'validating', 'Validating audit target.', 5);
    const validationStart = Date.now();
    const validation = await validator.validate(url);
    if (!validation.valid) {
      throw new Error(validation.blockReason ?? 'URL validation failed');
    }
    const resolveMs = Date.now() - validationStart;
    const hostname = new URL(validation.url).hostname;
    const isHttps = new URL(validation.url).protocol === 'https:';
    emitNotes(commentary.commentOnValidation(hostname, isHttps, resolveMs), 10, 'validating');

    transition(stateMachine, progressEmitter, 'crawling', 'Crawling pages with a clean browser profile.', 20);
    emitNotes(commentary.commentOnCrawlStart(), 20, 'crawling');

    // Wire per-page callback into the crawl engine if supported
    if (typeof crawlEngine.setOnPageCrawled === 'function') {
      crawlEngine.setOnPageCrawled((event) => {
        const notes = commentary.commentOnPageCrawled(event);
        emitNotes(notes, 25, 'crawling');
      });
    }

    const crawl = await crawlEngine.crawl(validation.url, { pageLimit: config.pageLimit });
    emitNotes(commentary.commentOnCrawlComplete({
      pageCount: crawl.pages.length,
      pagesSkipped: crawl.pagesSkipped,
      robotsTxtStatus: crawl.robotsTxtStatus,
      detectedStack: crawl.detectedStack ?? [],
      totalDurationMs: crawl.totalDurationMs,
    }), 35, 'crawling');

    transition(stateMachine, progressEmitter, 'extracting', 'Extracting structured page summaries.', 40);
    const summaries = pageSummarizer.summarize(crawl);
    emitNotes(commentary.commentOnExtraction({
      summaryCount: summaries.length,
    }), 50, 'extracting');

    transition(stateMachine, progressEmitter, 'auditing', 'Running audit primitives in parallel.', 60);
    emitNotes(commentary.commentOnAuditStart(), 60, 'auditing');
    const primitives = createPrimitiveRegistry(router);
    const primitiveResults = await Promise.all(
      primitives.map(async (primitive) => {
        try {
          return await primitive.run(crawl, summaries, config);
        } catch (error) {
          return {
            primitive: primitive.name,
            status: 'error' as const,
            data: [],
            confidence: 0,
            confidenceFactors: ['primitive failed'],
            reasoning: error instanceof Error ? error.message : 'Unknown primitive error',
            metadata: {
              durationMs: 0,
              methodologyVersion: config.methodologyVersion
            }
          };
        }
      })
    );
    const totalFindings = primitiveResults.reduce((sum, e) => sum + e.data.length, 0);
    const dimensionsClean = primitiveResults.filter((e) => e.data.length === 0).length;
    emitNotes(commentary.commentOnAuditComplete({ totalFindings, dimensionsClean }), 75, 'auditing');

    transition(stateMachine, progressEmitter, 'synthesizing', 'Synthesizing findings, scores, and narrative.', 80);
    const synthesis = await synthesizer.synthesize({
      auditId: crypto.randomUUID(),
      crawl,
      envelopes: primitiveResults,
      config,
      startedAt
    });
    const duplicatesRemoved = totalFindings - synthesis.findings.length;
    const causalChains = synthesis.findings.filter((f) => f.causalChain && f.causalChain.length > 0).length;
    emitNotes(commentary.commentOnSynthesis({
      duplicatesRemoved: Math.max(0, duplicatesRemoved),
      uniqueFindings: synthesis.findings.length,
      causalChains,
    }), 88, 'synthesizing');

    transition(stateMachine, progressEmitter, 'rendering', 'Rendering payload formats.', 90);
    const rendered = {
      'format-a': rendererRegistry['format-a'](synthesis),
      'format-b': rendererRegistry['format-b'](synthesis),
      'format-c': rendererRegistry['format-c'](synthesis),
      'format-json': rendererRegistry['format-json'](synthesis)
    };
    emitNotes(commentary.commentOnComplete(synthesis.findings.length), 98, 'rendering');

    transition(stateMachine, progressEmitter, 'complete', 'Audit complete.', 100);
    return {
      synthesis,
      rendered,
      crawl,
      summaries,
      primitiveResults,
      fieldNotes: collector.getAll(),
      state: 'complete' as const
    };
  })();

  try {
    return await promiseWithTimeout(execution, timeoutMs, () => {
      transition(stateMachine, progressEmitter, 'timeout', 'Audit timed out.', 100);
    });
  } catch (error) {
    if (stateMachine.current !== 'timeout') {
      transition(stateMachine, progressEmitter, 'error', error instanceof Error ? error.message : 'Audit failed.', 100);
    }
    throw error;
  } finally {
    if (!dependencies.crawlEngine) {
      await crawlEngine.close().catch(() => undefined);
    }
  }
}

function transition(
  stateMachine: AuditStateMachine,
  emitter: ProgressEmitter,
  state: Parameters<AuditStateMachine['transition']>[0],
  message: string,
  progress: number
): void {
  stateMachine.transition(state);
  emitter.emitProgress({ state, message, progress });
}

async function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout: () => void): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          onTimeout();
          reject(new Error(`Pipeline timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
