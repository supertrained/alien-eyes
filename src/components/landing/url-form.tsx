'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/auth';

export function UrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState('https://example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function normalizeUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError('Please enter a URL');
      setIsSubmitting(false);
      return;
    }

    try {
      let authorization: string | undefined;
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          authorization = `Bearer ${data.session.access_token}`;
        }
      } catch {
        authorization = undefined;
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(authorization ? { authorization } : {})
        },
        body: JSON.stringify({ url: normalized, quick: true, pageLimit: 30 })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to start audit');
      }

      router.push(`/audit/${payload.id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to start audit');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <div className="input-shell">
        <input
          aria-label="URL to audit"
          name="url"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="your-site.com"
          required
        />
        <Button className="button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Starting…' : 'Run Quick Check'}
        </Button>
      </div>
      <div className="muted">
        Free quick check. Deterministic only. No account required. Sign in if you want the run attached to your dashboard.
      </div>
      {error ? <div className="badge badge-critical">{error}</div> : null}
    </form>
  );
}
