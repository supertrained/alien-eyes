/**
 * Universal output envelope for all primitives.
 * Every primitive returns data wrapped in this structure for consistent
 * composition, logging, and cost tracking.
 */
export interface Envelope<T = unknown> {
  primitive: string;
  status: "success" | "error" | "timeout";
  data: T;
  confidence: number;
  confidenceFactors: string[];
  reasoning?: string;
  metadata: {
    model?: string;
    tokensUsed?: number;
    costUsd?: number;
    durationMs: number;
  };
}

/**
 * Create an envelope with timing and error wrapping.
 */
export async function runPrimitive<T>(
  name: string,
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
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    return {
      primitive: name,
      status: "success",
      data: result.data,
      confidence: result.confidence,
      confidenceFactors: result.confidenceFactors,
      reasoning: result.reasoning,
      metadata: {
        model: result.model,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        durationMs,
      },
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    return {
      primitive: name,
      status: "error",
      data: {} as T,
      confidence: 0,
      confidenceFactors: ["Error during execution"],
      reasoning:
        error instanceof Error ? error.message : "Unknown error occurred",
      metadata: { durationMs },
    };
  }
}
