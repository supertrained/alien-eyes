import { describe, expect, it } from 'vitest';
import {
  deriveAuditResultsState,
  getAuditEta,
  normalizeAuditApiPayload,
  shouldContinuePolling,
  shouldRedirectToResults
} from '@/lib/audit-ui-state';

describe('audit UI state', () => {
  it('normalizes failed API responses into terminal error payloads', () => {
    const payload = normalizeAuditApiPayload('audit-1', { error: 'Audit not found' }, false);

    expect(payload).toEqual({
      id: 'audit-1',
      status: 'error',
      progress: 100,
      phase: 'error',
      message: 'Audit not found',
      error: 'Audit not found'
    });
  });

  it('derives results states for running, unavailable, and complete audits', () => {
    expect(deriveAuditResultsState('audit-1', null).kind).toBe('loading');
    expect(deriveAuditResultsState('audit-1', {
      id: 'audit-1',
      status: 'running',
      progress: 50,
      phase: 'auditing',
      message: 'Running.'
    }).kind).toBe('running');
    expect(deriveAuditResultsState('audit-1', {
      id: 'audit-1',
      status: 'error',
      progress: 100,
      phase: 'error',
      message: 'Failed.'
    }).kind).toBe('error');
    expect(deriveAuditResultsState('audit-1', {
      id: 'audit-1',
      status: 'complete',
      progress: 100,
      phase: 'complete',
      message: 'Done.',
      result: {
        synthesis: {} as any,
        rendered: {
          'format-a': 'A',
          'format-b': 'B',
          'format-c': 'C',
          'format-json': '{}'
        }
      }
    }).kind).toBe('ready');
  });

  it('computes polling and redirect decisions deterministically', () => {
    const running = {
      id: 'audit-1',
      status: 'running',
      progress: 60,
      phase: 'auditing',
      message: 'Running.'
    } as const;
    const done = {
      ...running,
      status: 'complete',
      progress: 100,
      phase: 'complete'
    } as const;

    expect(shouldContinuePolling(running)).toBe(true);
    expect(shouldContinuePolling(done)).toBe(false);
    expect(shouldRedirectToResults(running)).toBe(false);
    expect(shouldRedirectToResults(done)).toBe(true);
  });

  it('keeps eta output stable around boundary values', () => {
    expect(getAuditEta(0)).toBe('Estimating…');
    expect(getAuditEta(100)).toBe('Estimating…');
    expect(getAuditEta(60)).toBe('About 5s remaining');
  });
});
