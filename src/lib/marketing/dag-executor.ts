// workers/lib/dag-executor.ts
// DAG-based primitive orchestration with dependency resolution.
// Replaces hardcoded Phase 1/Phase 2 with a declarative dependency graph.

import type { Envelope } from "./envelope";

export interface PrimitiveDef {
  deps: string[];
  playwright: boolean;
  timeoutMs: number;
}

export type PrimitiveRunner = (
  resolvedDeps: Map<string, Envelope>
) => Promise<Envelope>;

/** Default registry — each primitive declares its dependencies and resource needs.
 *  NOTE: website_technical, website_messaging, content_presence are defined here for
 *  future use but NOT yet wired into the orchestrator. The orchestrator still runs
 *  website_cro which delegates to these three internally. */
export const PRIMITIVE_REGISTRY: Record<string, PrimitiveDef> = {
  traffic_analysis:     { deps: [],                              playwright: false, timeoutMs: 30_000 },
  website_technical:    { deps: [],                              playwright: true,  timeoutMs: 60_000 },  // future: replace website_cro
  website_messaging:    { deps: ["website_technical"],           playwright: false, timeoutMs: 45_000 },  // future: replace website_cro
  content_presence:     { deps: [],                              playwright: false, timeoutMs: 30_000 },  // future: replace website_cro
  tracking_analytics:   { deps: [],                              playwright: true,  timeoutMs: 45_000 },
  company_enrichment:   { deps: [],                              playwright: false, timeoutMs: 20_000 },
  meta_ads:             { deps: ["company_enrichment"],          playwright: true,  timeoutMs: 60_000 },
  google_ads:           { deps: ["company_enrichment"],          playwright: true,  timeoutMs: 60_000 },
  competitor_context:   { deps: ["traffic_analysis", "company_enrichment"], playwright: false, timeoutMs: 45_000 },
  brand_reputation:     { deps: ["company_enrichment"],          playwright: false, timeoutMs: 30_000 },
  social_organic:       { deps: [],                              playwright: false, timeoutMs: 20_000 },
  pricing_monetization: { deps: ["website_technical"],           playwright: true,  timeoutMs: 45_000 },
  email_analysis:       { deps: [],                              playwright: true,  timeoutMs: 45_000 },
  meo_analysis:         { deps: [],                              playwright: false, timeoutMs: 30_000 },
  agent_native:         { deps: [],                              playwright: false, timeoutMs: 30_000 },

  // Legacy alias — maps to the same runner but allows old scans to continue
  website_cro:          { deps: [],                              playwright: true,  timeoutMs: 60_000 },
};

/** Simple counting semaphore for bounding concurrent Playwright instances */
class Semaphore {
  private current = 0;
  private waiting: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.current--;
    }
  }
}

export interface DagExecutorOptions {
  /** Max concurrent Playwright primitives (default: 2, matching browser pool MAX_CONCURRENT) */
  playwrightConcurrency?: number;
  /** Called after each primitive completes with (completed, total) */
  onProgress?: (completed: number, total: number, primitive: string) => void;
  /** Called before each primitive starts */
  onStart?: (primitive: string) => void;
  /** If this returns true, no new primitives will be launched (e.g. cost cap exceeded) */
  shouldAbort?: () => boolean;
}

export interface DagResult {
  results: Map<string, Envelope>;
  order: string[]; // completion order
  durationMs: number;
}

/**
 * Execute a set of primitives respecting their dependency graph.
 * Launches all primitives whose deps are satisfied, subject to Playwright semaphore.
 */
export async function executeDag(
  enabledPrimitives: string[],
  runners: Map<string, PrimitiveRunner>,
  opts: DagExecutorOptions = {}
): Promise<DagResult> {
  const startTime = Date.now();
  // Default matches browser pool MAX_CONCURRENT (2) to prevent queueing at the pool layer
  const playwrightSemaphore = new Semaphore(opts.playwrightConcurrency ?? 2);

  const results = new Map<string, Envelope>();
  const completionOrder: string[] = [];
  const pending = new Set(enabledPrimitives);

  // Validate: all deps exist in enabled set or are already available
  for (const name of enabledPrimitives) {
    const def = PRIMITIVE_REGISTRY[name];
    if (!def) {
      console.warn(`[dag] Unknown primitive "${name}" — skipping`);
      pending.delete(name);
      continue;
    }
    if (!runners.has(name)) {
      console.warn(`[dag] No runner for "${name}" — skipping`);
      pending.delete(name);
    }
  }

  // Track in-flight promises
  const inFlight = new Map<string, Promise<void>>();

  function depsResolved(name: string): boolean {
    const def = PRIMITIVE_REGISTRY[name];
    if (!def) return false;
    return def.deps.every(
      (dep) => results.has(dep) || !enabledPrimitives.includes(dep)
    );
  }

  function launchReady(): void {
    for (const name of pending) {
      if (opts.shouldAbort?.()) return; // Stop launching if abort requested (e.g. cost cap)
      if (inFlight.has(name)) continue;
      if (!depsResolved(name)) continue;

      const def = PRIMITIVE_REGISTRY[name]!;
      const runner = runners.get(name)!;

      const run = async () => {
        // Acquire Playwright semaphore if needed
        if (def.playwright) {
          await playwrightSemaphore.acquire();
        }

        try {
          opts.onStart?.(name);

          // Run with timeout (clear timer on completion to avoid leaked handles)
          let timer: ReturnType<typeof setTimeout> | undefined;
          const result = await Promise.race([
            runner(results),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => reject(new Error(`Timeout: ${name} exceeded ${def.timeoutMs}ms`)), def.timeoutMs);
            }),
          ]);
          clearTimeout(timer);

          results.set(name, result);
          completionOrder.push(name);
          opts.onProgress?.(results.size, enabledPrimitives.length, name);
        } catch (error) {
          // Store error envelope so dependents can check
          results.set(name, {
            primitive: name,
            status: "error",
            data: null,
            confidence: 0,
            confidenceFactors: [`error: ${error instanceof Error ? error.message : String(error)}`],
            metadata: { durationMs: Date.now() - startTime },
          });
          completionOrder.push(name);
          opts.onProgress?.(results.size, enabledPrimitives.length, name);
        } finally {
          if (def.playwright) {
            playwrightSemaphore.release();
          }
          pending.delete(name);
          inFlight.delete(name);

          // After each completion, try to launch newly-unblocked primitives
          launchReady();
        }
      };

      inFlight.set(name, run());
    }
  }

  // Initial launch
  launchReady();

  // Wait for all primitives to complete
  while (pending.size > 0) {
    if (inFlight.size === 0 && pending.size > 0) {
      // Either deadlock or abort — remaining primitives won't run
      const reason = opts.shouldAbort?.()
        ? "Aborted (cost cap exceeded)"
        : "Dependency deadlock — could not run";
      console.error(`[dag] Stopping: ${[...pending].join(", ")} — ${reason}`);
      for (const name of pending) {
        results.set(name, {
          primitive: name,
          status: "error",
          data: null,
          confidence: 0,
          confidenceFactors: [reason],
          metadata: { durationMs: Date.now() - startTime },
        });
        completionOrder.push(name);
      }
      break;
    }
    // Wait for at least one in-flight to complete
    await Promise.race([...inFlight.values()]);
  }

  return {
    results,
    order: completionOrder,
    durationMs: Date.now() - startTime,
  };
}
