import { afterEach, describe, expect, it, vi } from 'vitest';

const getRequiredRequestUser = vi.fn();
const upsertAppUserFromAuthUser = vi.fn();
const createApiKeyForUser = vi.fn();
const listApiKeysForUser = vi.fn();
const listAuditsForUser = vi.fn();
const buildDashboardTrendSeries = vi.fn();

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    getRequiredRequestUser,
    upsertAppUserFromAuthUser,
    createApiKeyForUser,
    listApiKeysForUser,
    listAuditsForUser,
    buildDashboardTrendSeries
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/account/sync', () => {
  it('returns 401 when the request is unauthenticated', async () => {
    const { RequestAuthError } = await import('@/lib/auth');
    getRequiredRequestUser.mockRejectedValue(new RequestAuthError('Unauthorized', 401));

    const { POST } = await import('@/app/api/account/sync/route');
    const response = await POST(new Request('http://localhost/api/account/sync', {
      method: 'POST'
    }));

    expect(response.status).toBe(401);
  });

  it('upserts the authenticated user profile and returns it', async () => {
    const user = { id: 'user-1', email: 'owner@example.com', displayName: 'Owner', avatarUrl: null };
    getRequiredRequestUser.mockResolvedValue(user);
    upsertAppUserFromAuthUser.mockResolvedValue(user);

    const { POST } = await import('@/app/api/account/sync/route');
    const response = await POST(new Request('http://localhost/api/account/sync', {
      method: 'POST',
      headers: { authorization: 'Bearer token' }
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user });
  });
});

describe('GET/POST /api/account/api-keys', () => {
  it('lists stored API keys for the authenticated user', async () => {
    const user = { id: 'user-1', email: 'owner@example.com' };
    getRequiredRequestUser.mockResolvedValue(user);
    listApiKeysForUser.mockResolvedValue([
      {
        id: 'key-1',
        name: 'Default',
        keyPrefix: 'ae_live_',
        maskedKey: 'ae_live_...abcd',
        isActive: true
      }
    ]);

    const { GET } = await import('@/app/api/account/api-keys/route');
    const response = await GET(new Request('http://localhost/api/account/api-keys', {
      headers: { authorization: 'Bearer token' }
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      apiKeys: [
        expect.objectContaining({ id: 'key-1', name: 'Default' })
      ]
    });
  });

  it('creates a new API key and returns the raw secret once', async () => {
    const user = { id: 'user-1', email: 'owner@example.com' };
    getRequiredRequestUser.mockResolvedValue(user);
    createApiKeyForUser.mockResolvedValue({
      id: 'key-1',
      name: 'CI key',
      rawKey: 'ae_live_secret',
      keyPrefix: 'ae_live_',
      maskedKey: 'ae_live_...cret'
    });

    const { POST } = await import('@/app/api/account/api-keys/route');
    const response = await POST(new Request('http://localhost/api/account/api-keys', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ name: 'CI key' })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      apiKey: expect.objectContaining({
        id: 'key-1',
        name: 'CI key',
        rawKey: 'ae_live_secret'
      })
    });
  });
});

describe('GET /api/account/dashboard', () => {
  it('returns audit history and derived trend series for the authenticated user', async () => {
    const user = { id: 'user-1', email: 'owner@example.com' };
    const audits = [
      {
        id: 'audit-1',
        url: 'https://example.com',
        normalizedUrl: 'https://example.com/',
        createdAt: '2026-03-18T12:00:00.000Z',
        satisfactionScore: 72,
        status: 'complete',
        findingCount: 4
      }
    ];
    const trendSeries = [
      {
        normalizedUrl: 'https://example.com/',
        latestScore: 72,
        runCount: 1,
        points: [{ auditId: 'audit-1', createdAt: '2026-03-18T12:00:00.000Z', score: 72 }]
      }
    ];

    getRequiredRequestUser.mockResolvedValue(user);
    listAuditsForUser.mockResolvedValue(audits);
    buildDashboardTrendSeries.mockReturnValue(trendSeries);

    const { GET } = await import('@/app/api/account/dashboard/route');
    const response = await GET(new Request('http://localhost/api/account/dashboard', {
      headers: { authorization: 'Bearer token' }
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      audits,
      trendSeries
    });
  });
});
