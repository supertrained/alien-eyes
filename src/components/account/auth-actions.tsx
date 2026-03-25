'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/auth';

export function AuthActions({ mode }: { mode: 'login' | 'signup' }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const redirectTo = new URL('/auth/callback', window.location.origin).toString();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage(`Magic link sent to ${email}.`);
    }

    setSubmitting(false);
  }

  async function continueWithGithub() {
    setSubmitting(true);
    setError(null);

    const redirectTo = new URL('/auth/callback', window.location.origin).toString();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo }
    });

    if (oauthError) {
      setError(oauthError.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="panel auth-panel">
      <span className="eyebrow">{mode === 'login' ? 'Sign in' : 'Create account'}</span>
      <h1 className="section-title">
        {mode === 'login' ? 'Keep your audit history.' : 'Start keeping audit history.'}
      </h1>
      <p className="muted">
        Quick checks stay anonymous by default. Sign in when you want dashboards, repeated-run trend lines, and API keys.
      </p>

      <form className="stack" onSubmit={sendMagicLink}>
        <label className="stack-tight">
          <span className="muted">Work email</span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>
        <div className="button-row">
          <Button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Email magic link'}
          </Button>
          <Button className="button-secondary" type="button" disabled={submitting} onClick={() => void continueWithGithub()}>
            Continue with GitHub
          </Button>
        </div>
      </form>

      {message ? <div className="badge badge-low">{message}</div> : null}
      {error ? <div className="badge badge-critical">{error}</div> : null}
    </div>
  );
}
