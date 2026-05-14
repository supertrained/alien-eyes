import { createHash, randomBytes } from 'node:crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

let browserClient: SupabaseClient | null = null;

export class RequestAuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'RequestAuthError';
    this.status = status;
  }
}

export interface RequestUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface DashboardAuditSummary {
  id: string;
  url: string;
  normalizedUrl: string;
  createdAt: string;
  satisfactionScore: number | null;
  status: string;
  findingCount: number;
}

export interface DashboardTrendPoint {
  auditId: string;
  createdAt: string;
  score: number | null;
}

export interface DashboardTrendSeries {
  normalizedUrl: string;
  latestScore: number | null;
  runCount: number;
  points: DashboardTrendPoint[];
}

export interface StoredApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  isActive: boolean;
  createdAt?: string;
  lastUsedAt?: string | null;
  rateLimitPerHour?: number;
  expiresAt?: string | null;
}

export interface CreatedApiKeySummary extends StoredApiKeySummary {
  rawKey: string;
}

export function parseAuthCallbackTokens(href: string): { accessToken: string; refreshToken: string } | undefined {
  const url = new URL(href);
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (!hash) {
    return undefined;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return undefined;
  }

  return {
    accessToken,
    refreshToken
  };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase browser auth is not configured');
  }

  browserClient = createClient(url, key);
  return browserClient;
}

export function deriveApiKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, 8);
}

export function maskApiKey(rawKey: string): string {
  return `${deriveApiKeyPrefix(rawKey)}…${rawKey.slice(-4)}`;
}

export async function hashApiKey(rawKey: string): Promise<string> {
  return createHash('sha256').update(rawKey).digest('hex');
}

export async function getOptionalRequestUser(request: Request): Promise<RequestUser | undefined> {
  const token = extractBearerToken(request);
  if (!token) {
    return undefined;
  }

  if (token.startsWith('ae_live_')) {
    return verifyApiKey(token);
  }

  return verifyAccessToken(token);
}

export async function getRequiredRequestUser(request: Request): Promise<RequestUser> {
  const user = await getOptionalRequestUser(request);
  if (!user) {
    throw new RequestAuthError('Unauthorized', 401);
  }
  return user;
}

export async function verifyAccessToken(token: string): Promise<RequestUser> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new RequestAuthError('Supabase auth is not configured', 503);
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email) {
    throw new RequestAuthError('Unauthorized', 401);
  }

  return toRequestUser(data.user);
}

export async function upsertAppUserFromAuthUser(user: RequestUser): Promise<RequestUser> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error('Supabase admin is not configured');
  }

  const payload = {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    auth_provider: 'supabase',
    updated_at: new Date().toISOString()
  };

  const { error } = await client.from('aeb_users').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Failed to sync user profile: ${error.message}`);
  }

  return user;
}

export async function listAuditsForUser(userId: string): Promise<DashboardAuditSummary[]> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await client
    .from('aeb_audits')
    .select('id, url, normalized_url, created_at, satisfaction_score, status, finding_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load audits: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    url: row.url,
    normalizedUrl: row.normalized_url,
    createdAt: row.created_at,
    satisfactionScore: row.satisfaction_score,
    status: row.status,
    findingCount: row.finding_count ?? 0
  }));
}

export function buildDashboardTrendSeries(audits: DashboardAuditSummary[]): DashboardTrendSeries[] {
  const grouped = new Map<string, DashboardTrendPoint[]>();

  for (const audit of audits) {
    const points = grouped.get(audit.normalizedUrl) ?? [];
    points.push({
      auditId: audit.id,
      createdAt: audit.createdAt,
      score: audit.satisfactionScore
    });
    grouped.set(audit.normalizedUrl, points);
  }

  return Array.from(grouped.entries())
    .map(([normalizedUrl, points]) => {
      const sortedPoints = points.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      const latest = sortedPoints.at(-1);

      return {
        normalizedUrl,
        latestScore: latest?.score ?? null,
        runCount: sortedPoints.length,
        points: sortedPoints
      };
    })
    .sort((left, right) => {
      const rightTimestamp = right.points.at(-1)?.createdAt ?? '';
      const leftTimestamp = left.points.at(-1)?.createdAt ?? '';
      return rightTimestamp.localeCompare(leftTimestamp);
    });
}

export async function listApiKeysForUser(userId: string): Promise<StoredApiKeySummary[]> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error('Supabase admin is not configured');
  }

  const { data, error } = await client
    .from('aeb_api_keys')
    .select('id, name, key_prefix, is_active, created_at, last_used_at, rate_limit_per_hour, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load API keys: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    maskedKey: `${row.key_prefix}…hidden`,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    rateLimitPerHour: row.rate_limit_per_hour,
    expiresAt: row.expires_at
  }));
}

export async function createApiKeyForUser(userId: string, name: string): Promise<CreatedApiKeySummary> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error('Supabase admin is not configured');
  }

  const rawKey = `ae_live_${randomBytes(18).toString('hex')}`;
  const keyPrefix = deriveApiKeyPrefix(rawKey);
  const keyHash = await hashApiKey(rawKey);

  const { data, error } = await client
    .from('aeb_api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix
    })
    .select('id, name, is_active, created_at, last_used_at, rate_limit_per_hour, expires_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create API key: ${error?.message ?? 'unknown error'}`);
  }

  return {
    id: data.id,
    name: data.name,
    rawKey,
    keyPrefix,
    maskedKey: maskApiKey(rawKey),
    isActive: data.is_active,
    createdAt: data.created_at,
    lastUsedAt: data.last_used_at,
    rateLimitPerHour: data.rate_limit_per_hour,
    expiresAt: data.expires_at
  };
}

export async function verifyApiKey(rawKey: string): Promise<RequestUser> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new RequestAuthError('Supabase auth is not configured', 503);
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const { data: keyRow, error: keyError } = await client
    .from('aeb_api_keys')
    .select('id, user_id, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !keyRow) {
    throw new RequestAuthError('Invalid API key', 401);
  }

  if (!keyRow.is_active) {
    throw new RequestAuthError('API key is deactivated', 403);
  }

  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    throw new RequestAuthError('API key has expired', 403);
  }

  const { data: userRow, error: userError } = await client
    .from('aeb_users')
    .select('id, email, display_name, avatar_url')
    .eq('id', keyRow.user_id)
    .single();

  if (userError || !userRow) {
    throw new RequestAuthError('API key owner not found', 401);
  }

  client
    .from('aeb_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(() => undefined);

  return {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.display_name,
    avatarUrl: userRow.avatar_url,
  };
}

function extractBearerToken(request: Request): string | undefined {
  const header = request.headers.get('authorization');
  if (!header) {
    return undefined;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function toRequestUser(user: User): RequestUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null
  };
}
