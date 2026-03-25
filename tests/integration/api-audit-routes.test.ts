import { afterEach, describe, expect, it, vi } from 'vitest';

const startAuditJob = vi.fn();
const getAuditJob = vi.fn();
const getOptionalRequestUser = vi.fn();

vi.mock('@/lib/audit-jobs', () => ({
  startAuditJob,
  getAuditJob
}));

vi.mock('@/lib/auth', () => ({
  getOptionalRequestUser
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/audit', () => {
  it('returns the queued job payload for a valid request', async () => {
    startAuditJob.mockResolvedValue({
      id: 'audit-1',
      status: 'pending',
      phase: 'pending',
      progress: 0
    });

    const { POST } = await import('@/app/api/audit/route');
    const response = await POST(new Request('http://localhost/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', quick: true, pageLimit: 5 })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: 'audit-1',
      status: 'pending',
      phase: 'pending',
      progress: 0
    });
  });

  it('returns 400 for invalid request bodies', async () => {
    const { POST } = await import('@/app/api/audit/route');
    const response = await POST(new Request('http://localhost/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'not-a-url' })
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it('returns 500 when audit job creation fails internally', async () => {
    startAuditJob.mockRejectedValue(new Error('database unavailable'));

    const { POST } = await import('@/app/api/audit/route');
    const response = await POST(new Request('http://localhost/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' })
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'database unavailable' });
  });

  it('attaches the authenticated user id when a bearer token resolves to a user', async () => {
    startAuditJob.mockResolvedValue({
      id: 'audit-2',
      status: 'pending',
      phase: 'pending',
      progress: 0
    });
    getOptionalRequestUser.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com'
    });

    const { POST } = await import('@/app/api/audit/route');
    const response = await POST(new Request('http://localhost/api/audit', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token'
      },
      body: JSON.stringify({ url: 'https://example.com' })
    }));

    expect(response.status).toBe(200);
    expect(startAuditJob).toHaveBeenCalledWith({
      url: 'https://example.com',
      userId: 'user-1'
    });
  });
});

describe('GET /api/audit/[id]', () => {
  it('returns the audit job when found', async () => {
    getAuditJob.mockResolvedValue({
      id: 'audit-1',
      status: 'complete',
      phase: 'complete',
      progress: 100,
      message: 'Audit complete.',
      url: 'https://example.com',
      createdAt: '2026-03-14T00:00:00.000Z',
      updatedAt: '2026-03-14T00:00:01.000Z',
      config: {
        tier: 'quick_check',
        ownershipVerified: false,
        pageLimit: 10,
        costBudget: 5,
        methodologyVersion: 'v0.1',
        isReAudit: false
      }
    });

    const { GET } = await import('@/app/api/audit/[id]/route');
    const response = await GET(new Request('http://localhost/api/audit/audit-1'), {
      params: Promise.resolve({ id: 'audit-1' })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        id: 'audit-1',
        status: 'complete',
        progress: 100
      })
    );
  });

  it('returns 404 when the audit job does not exist', async () => {
    getAuditJob.mockResolvedValue(undefined);

    const { GET } = await import('@/app/api/audit/[id]/route');
    const response = await GET(new Request('http://localhost/api/audit/missing'), {
      params: Promise.resolve({ id: 'missing' })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Audit not found' });
  });
});
