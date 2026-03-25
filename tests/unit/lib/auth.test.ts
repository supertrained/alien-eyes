import { describe, expect, it } from 'vitest';
import {
  buildDashboardTrendSeries,
  deriveApiKeyPrefix,
  hashApiKey,
  maskApiKey,
  parseAuthCallbackTokens
} from '@/lib/auth';

describe('auth helpers', () => {
  it('derives stable API key prefixes and hashes', async () => {
    const key = 'ae_live_1234567890abcdef';

    expect(deriveApiKeyPrefix(key)).toBe('ae_live_');
    expect(maskApiKey(key)).toBe('ae_live_…cdef');
    await expect(hashApiKey(key)).resolves.toMatch(/^[a-f0-9]{64}$/);
    await expect(hashApiKey(key)).resolves.toBe(await hashApiKey(key));
  });

  it('builds trend series grouped by normalized URL and sorted chronologically', () => {
    const series = buildDashboardTrendSeries([
      {
        id: 'a2',
        url: 'https://example.com',
        normalizedUrl: 'https://example.com/',
        createdAt: '2026-03-18T12:00:00.000Z',
        satisfactionScore: 72,
        status: 'complete',
        findingCount: 4
      },
      {
        id: 'a1',
        url: 'https://example.com',
        normalizedUrl: 'https://example.com/',
        createdAt: '2026-03-17T12:00:00.000Z',
        satisfactionScore: 61,
        status: 'complete',
        findingCount: 7
      },
      {
        id: 'b1',
        url: 'https://docs.example.com',
        normalizedUrl: 'https://docs.example.com/',
        createdAt: '2026-03-18T08:00:00.000Z',
        satisfactionScore: 88,
        status: 'complete',
        findingCount: 1
      }
    ]);

    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({
      normalizedUrl: 'https://example.com/',
      latestScore: 72,
      runCount: 2
    });
    expect(series[0]?.points.map((point) => point.auditId)).toEqual(['a1', 'a2']);
    expect(series[1]).toMatchObject({
      normalizedUrl: 'https://docs.example.com/',
      latestScore: 88,
      runCount: 1
    });
  });

  it('extracts access and refresh tokens from auth callback hash fragments', () => {
    expect(
      parseAuthCallbackTokens('https://tool-tester.vercel.app/auth/callback#access_token=abc&refresh_token=def&token_type=bearer')
    ).toEqual({
      accessToken: 'abc',
      refreshToken: 'def'
    });

    expect(parseAuthCallbackTokens('https://tool-tester.vercel.app/auth/callback?code=xyz')).toBeUndefined();
  });
});
