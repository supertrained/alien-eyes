'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient, parseAuthCallbackTokens } from '@/lib/auth';

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void completeAuth();
  }, []);

  async function completeAuth() {
    try {
      const code = searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          throw exchangeError;
        }
      } else {
        const tokenSet = parseAuthCallbackTokens(window.location.href);
        if (tokenSet) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokenSet.accessToken,
            refresh_token: tokenSet.refreshToken
          });
          if (sessionError) {
            throw sessionError;
          }
          window.history.replaceState({}, document.title, '/auth/callback');
        }
      }

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('No session was created.');
      }

      const response = await fetch('/api/account/sync', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed to sync account' }));
        throw new Error(payload.error ?? 'Failed to sync account');
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (callbackError) {
      setError(callbackError instanceof Error ? callbackError.message : 'Authentication failed');
    }
  }

  return (
    <div className="panel auth-panel">
      <span className="eyebrow">Auth callback</span>
      <h1 className="section-title">{error ? 'Authentication failed' : 'Finishing sign-in…'}</h1>
      <p className="muted">
        {error ? error : 'Exchanging your session and syncing your Alien Eyes account.'}
      </p>
      {error ? <a className="button button-primary" href="/auth/login">Back to sign in</a> : null}
    </div>
  );
}
