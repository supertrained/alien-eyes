import type { StoredAuditResult } from '@/lib/audit-repository';
import type { FieldNote } from '@/orchestrator/field-notes';

export interface AuditStatusPayload {
  id: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  phase: string;
  message: string;
  error?: string;
  result?: StoredAuditResult;
  fieldNotes?: FieldNote[];
}

export function normalizeAuditApiPayload(id: string, payload: unknown, responseOk: boolean): AuditStatusPayload {
  if (!responseOk || !isAuditStatusPayload(payload)) {
    const message = extractErrorMessage(payload, 'Audit request failed.');
    return {
      id,
      status: 'error',
      progress: 100,
      phase: 'error',
      message,
      error: message
    };
  }

  return payload;
}

export function shouldContinuePolling(payload: AuditStatusPayload): boolean {
  return payload.status === 'pending' || payload.status === 'running';
}

export function shouldRedirectToResults(payload: AuditStatusPayload): boolean {
  return payload.status === 'complete';
}

export function getAuditEta(progress: number): string {
  if (progress <= 0 || progress >= 100) {
    return 'Estimating…';
  }
  const remaining = Math.max(3, Math.round((100 - progress) / 8));
  return `About ${remaining}s remaining`;
}

export function deriveAuditResultsState(id: string, payload: AuditStatusPayload | null):
  | { kind: 'loading' }
  | { kind: 'running'; message: string; href: string }
  | { kind: 'error'; message: string; href: string }
  | { kind: 'ready'; result: StoredAuditResult } {
  if (!payload) {
    return { kind: 'loading' };
  }

  if (payload.status === 'pending' || payload.status === 'running') {
    return {
      kind: 'running',
      message: payload.message,
      href: `/audit/${id}`
    };
  }

  if (payload.status === 'error' || !payload.result) {
    return {
      kind: 'error',
      message: payload.error ?? payload.message,
      href: '/'
    };
  }

  return {
    kind: 'ready',
    result: payload.result
  };
}

function isAuditStatusPayload(value: unknown): value is AuditStatusPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.progress === 'number' &&
    typeof candidate.phase === 'string' &&
    typeof candidate.message === 'string'
  );
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).error === 'string') {
    return (payload as Record<string, string>).error;
  }
  return fallback;
}
