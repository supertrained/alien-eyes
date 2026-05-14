import { performance } from 'node:perf_hooks';

/**
 * Universal output envelope for all primitives.
 * Every primitive returns Envelope<Finding[]>.
 */
export interface Envelope<T = unknown> {
  /** Name of the primitive that produced this result */
  primitive: string;
  /** Did the primitive succeed, fail, or timeout? */
  status: 'success' | 'error' | 'timeout';
  /** The typed output data */
  data: T;
  /** Overall confidence in this primitive's output (0-1) */
  confidence: number;
  /** Factors that contributed to the confidence score */
  confidenceFactors: string[];
  /** Optional reasoning explaining the output */
  reasoning?: string;
  /** Execution metadata */
  metadata: EnvelopeMetadata;
}

export interface EnvelopeMetadata {
  /** LLM model used (if any) */
  model?: string;
  /** Total tokens consumed */
  tokensUsed?: number;
  /** Total cost in USD */
  costUsd?: number;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Which methodology version this was scored against */
  methodologyVersion: string;
  /** Raw structured data from the primitive (marketing gather primitives preserve their full typed output here) */
  rawData?: Record<string, unknown>;
}

/**
 * Helper function to create a successful envelope.
 * Automatically tracks duration via performance.now().
 */
export async function runPrimitive<T>(
  name: string,
  methodologyVersion: string,
  fn: () => Promise<{
    data: T;
    confidence: number;
    confidenceFactors: string[];
    reasoning?: string;
    model?: string;
    tokensUsed?: number;
    costUsd?: number;
  }>
): Promise<Envelope<T>> {
  const startedAt = performance.now();

  try {
    const result = await fn();

    return {
      primitive: name,
      status: 'success',
      data: result.data,
      confidence: result.confidence,
      confidenceFactors: result.confidenceFactors,
      reasoning: result.reasoning,
      metadata: {
        model: result.model,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        durationMs: Math.round(performance.now() - startedAt),
        methodologyVersion
      }
    };
  } catch (error) {
    return {
      primitive: name,
      status: 'error',
      data: [] as unknown as T,
      confidence: 0,
      confidenceFactors: ['primitive threw before producing output'],
      reasoning: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        durationMs: Math.round(performance.now() - startedAt),
        methodologyVersion
      }
    };
  }
}
