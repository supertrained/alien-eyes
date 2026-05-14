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

interface EnvelopeOptions {
  confidence?: number;
  confidenceFactors?: string[];
  reasoning?: string;
  model?: string;
  tokensUsed?: number;
  costUsd?: number;
}

export function createEnvelope<T>(
  primitive: string,
  startTime: number,
  data: T,
  opts: EnvelopeOptions = {}
): Envelope<T> {
  return {
    primitive,
    status: "success",
    data,
    confidence: opts.confidence ?? 0.5,
    confidenceFactors: opts.confidenceFactors ?? [],
    reasoning: opts.reasoning,
    metadata: {
      model: opts.model,
      tokensUsed: opts.tokensUsed,
      costUsd: opts.costUsd,
      durationMs: Date.now() - startTime,
    },
  };
}

export function createErrorEnvelope(
  primitive: string,
  startTime: number,
  error: unknown
): Envelope<null> {
  const message =
    error instanceof Error ? error.message : String(error);
  return {
    primitive,
    status: "error",
    data: null,
    confidence: 0,
    confidenceFactors: [`error: ${message}`],
    reasoning: message,
    metadata: {
      durationMs: Date.now() - startTime,
    },
  };
}

export function createTimeoutEnvelope(
  primitive: string,
  startTime: number,
  partialData?: unknown
): Envelope<unknown> {
  return {
    primitive,
    status: "timeout",
    data: partialData ?? null,
    confidence: 0.1,
    confidenceFactors: ["timed out before completion"],
    metadata: {
      durationMs: Date.now() - startTime,
    },
  };
}
