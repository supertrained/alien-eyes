// workers/lib/logger.ts
// Structured JSON-line logger for Railway log parsing.
// No external dependencies — just JSON.stringify to stdout/stderr.

export interface LogContext {
  scanId?: string;
  primitive?: string;
  [key: string]: unknown;
}

type LogLevel = "info" | "warn" | "error";

function emit(
  level: LogLevel,
  message: string,
  ctx: LogContext,
  extra?: unknown
): void {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  };
  if (ctx.scanId) entry.scanId = ctx.scanId;
  if (ctx.primitive) entry.primitive = ctx.primitive;

  // Spread any additional context fields (skip scanId/primitive already handled)
  for (const [k, v] of Object.entries(ctx)) {
    if (k !== "scanId" && k !== "primitive" && v !== undefined) {
      entry[k] = v;
    }
  }

  if (extra !== undefined) {
    if (extra instanceof Error) {
      entry.error = { message: extra.message, stack: extra.stack };
    } else if (typeof extra === "string") {
      entry.error = extra;
    } else {
      entry.error = extra;
    }
  }

  const line = JSON.stringify(entry);
  if (level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

/**
 * Create a logger bound to a scan context.
 * Usage:
 *   const logger = createLogger({ scanId });
 *   logger.info("Starting", { primitive: "traffic_analysis" });
 *   logger.error("Failed", { primitive: "meta_ads" }, err);
 */
export function createLogger(baseCtx: LogContext = {}) {
  return {
    info(message: string, ctx?: LogContext, extra?: unknown): void {
      emit("info", message, { ...baseCtx, ...ctx }, extra);
    },
    warn(message: string, ctx?: LogContext, extra?: unknown): void {
      emit("warn", message, { ...baseCtx, ...ctx }, extra);
    },
    error(message: string, ctx?: LogContext, extra?: unknown): void {
      emit("error", message, { ...baseCtx, ...ctx }, extra);
    },
  };
}

/**
 * Standalone log functions for contexts where creating a logger instance
 * is overkill (e.g., one-off startup messages).
 */
export function logInfo(message: string, ctx: LogContext = {}): void {
  emit("info", message, ctx);
}

export function logWarn(message: string, ctx: LogContext = {}): void {
  emit("warn", message, ctx);
}

export function logError(message: string, ctx: LogContext = {}, extra?: unknown): void {
  emit("error", message, ctx, extra);
}
