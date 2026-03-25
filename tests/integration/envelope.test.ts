import { describe, expect, it } from 'vitest';
import { runPrimitive } from '@/types';

describe('Envelope creation', () => {
  it('creates success and error envelopes with metadata', async () => {
    const success = await runPrimitive('seo', 'v0.1', async () => ({
      data: ['ok'],
      confidence: 0.9,
      confidenceFactors: ['rule matched'],
      reasoning: 'deterministic',
      costUsd: 0
    }));

    const failure = await runPrimitive('seo', 'v0.1', async () => {
      throw new Error('boom');
    });

    expect(success.status).toBe('success');
    expect(success.data).toEqual(['ok']);
    expect(success.metadata.methodologyVersion).toBe('v0.1');
    expect(success.metadata.durationMs).toBeGreaterThanOrEqual(0);

    expect(failure.status).toBe('error');
    expect(failure.confidence).toBe(0);
    expect(failure.reasoning).toBe('boom');
    expect(failure.metadata.methodologyVersion).toBe('v0.1');
  });
});
