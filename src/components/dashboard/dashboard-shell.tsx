'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuditList } from '@/components/dashboard/audit-list';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { Button } from '@/components/ui/button';
import {
  getSupabaseBrowserClient,
  type CreatedApiKeySummary,
  type DashboardAuditSummary,
  type DashboardTrendSeries,
  type StoredApiKeySummary
} from '@/lib/auth';

interface DashboardPayload {
  audits: DashboardAuditSummary[];
  trendSeries: DashboardTrendSeries[];
}

export function DashboardShell() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [audits, setAudits] = useState<DashboardAuditSummary[]>([]);
  const [trendSeries, setTrendSeries] = useState<DashboardTrendSeries[]>([]);
  const [apiKeys, setApiKeys] = useState<StoredApiKeySummary[]>([]);
  const [generatedKey, setGeneratedKey] = useState<CreatedApiKeySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setLoading(false);
      return;
    }

    setEmail(session.user.email ?? null);

    try {
      await authenticatedFetch('/api/account/sync', session.access_token, { method: 'POST' });
      const [dashboardResponse, apiKeysResponse] = await Promise.all([
        authenticatedFetch('/api/account/dashboard', session.access_token),
        authenticatedFetch('/api/account/api-keys', session.access_token)
      ]);

      const dashboard = await dashboardResponse.json() as DashboardPayload;
      const apiKeysPayload = await apiKeysResponse.json() as { apiKeys: StoredApiKeySummary[] };

      setAudits(dashboard.audits);
      setTrendSeries(dashboard.trendSeries);
      setApiKeys(apiKeysPayload.apiKeys);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function generateApiKey() {
    setIsGenerating(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('Sign in again to generate an API key.');
      }

      const response = await authenticatedFetch('/api/account/api-keys', accessToken, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: `Dashboard key ${new Date().toLocaleDateString()}` })
      });
      const payload = await response.json() as { apiKey: CreatedApiKeySummary };

      setGeneratedKey(payload.apiKey);
      setApiKeys((existing) => [payload.apiKey, ...existing]);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <main id="main-content" className="shell section">
        <div className="panel auth-panel">
          <h1 className="section-title">Loading dashboard…</h1>
          <p className="muted">Checking your session and fetching your audit history.</p>
        </div>
      </main>
    );
  }

  if (!email) {
    return (
      <main id="main-content" className="shell section">
        <div className="panel auth-panel">
          <span className="eyebrow">Account required</span>
          <h1 className="section-title">Sign in to keep audit history.</h1>
          <p className="muted">
            Anonymous quick checks still work. Sign in when you want owned history, trend lines, and API keys.
          </p>
          <div className="button-row">
            <a className="button button-primary" href="/auth/login">Sign in</a>
            <a className="button button-secondary" href="/auth/signup">Create account</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="shell section">
      <section className="dashboard-hero panel">
        <div>
          <span className="eyebrow">Account dashboard</span>
          <h1 className="section-title">Owned audits, score trends, and API access.</h1>
          <p className="muted">
            Signed in as {email}. New audits started from the homepage will attach to this account automatically.
          </p>
        </div>
        <div className="button-row">
          <Button className="button-secondary" onClick={() => void signOut()}>Sign out</Button>
          <a className="button button-primary" href="/">Run another audit</a>
        </div>
      </section>

      {error ? <div className="badge badge-critical">{error}</div> : null}

      <section className="dashboard-grid">
        <div className="stack">
          <div className="panel section-panel">
            <div className="section-heading">
              <h2 className="section-title">Audit history</h2>
            </div>
            <AuditList audits={audits} />
          </div>
          <div className="panel section-panel">
            <div className="section-heading">
              <h2 className="section-title">Trend lines</h2>
            </div>
            <TrendChart series={trendSeries} />
          </div>
        </div>

        <aside className="stack">
          <div className="panel section-panel">
            <div className="section-heading">
              <h2 className="section-title">API keys</h2>
            </div>
            <p className="muted">
              Generate one key for CLI cloud mode and future agent surfaces. The raw secret appears once.
            </p>
            <Button className="button-primary" onClick={() => void generateApiKey()} disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'Generate API key'}
            </Button>
            {generatedKey ? (
              <div className="generated-key">
                <strong>Copy this now</strong>
                <code>{generatedKey.rawKey}</code>
              </div>
            ) : null}
            <div className="stack-tight">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="card key-row">
                  <div>
                    <strong>{apiKey.name}</strong>
                    <div className="muted">{apiKey.maskedKey}</div>
                  </div>
                  <div className="muted">{apiKey.isActive ? 'active' : 'inactive'}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

async function authenticatedFetch(input: RequestInfo | URL, accessToken: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(payload.error ?? 'Request failed');
  }

  return response;
}
