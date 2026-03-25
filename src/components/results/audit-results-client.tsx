'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuditResultView } from '@/components/results/audit-result-view';
import { Card } from '@/components/ui/card';
import {
  deriveAuditResultsState,
  normalizeAuditApiPayload,
  type AuditStatusPayload
} from '@/lib/audit-ui-state';

export function AuditResultsClient({ id }: { id: string }) {
  const [payload, setPayload] = useState<AuditStatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/audit/${id}`, { cache: 'no-store' });
      const nextPayload = normalizeAuditApiPayload(id, await response.json(), response.ok);
      if (!cancelled) {
        setPayload(nextPayload);
      }
    }

    load().catch((error) => {
      if (!cancelled) {
        setPayload({
          id,
          status: 'error',
          progress: 100,
          phase: 'error',
          message: 'Failed to load audit results.',
          error: error instanceof Error ? error.message : 'Unknown results load failure'
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!payload) {
    return (
      <Card style={{ padding: '1.5rem' }}>
        <h1 className="section-title">Loading results</h1>
        <p className="muted">Fetching the latest audit state from the local preview API.</p>
      </Card>
    );
  }

  const state = deriveAuditResultsState(id, payload);

  if (state.kind === 'loading') {
    return (
      <Card style={{ padding: '1.5rem' }}>
        <h1 className="section-title">Loading results</h1>
        <p className="muted">Fetching the latest audit state from the local preview API.</p>
      </Card>
    );
  }

  if (state.kind === 'running') {
    return (
      <Card style={{ padding: '1.5rem' }}>
        <h1 className="section-title">Audit still running</h1>
        <p className="muted">{state.message}</p>
        <Link href={state.href} className="button button-primary">
          Return to progress
        </Link>
      </Card>
    );
  }

  if (state.kind === 'error') {
    return (
      <Card style={{ padding: '1.5rem' }}>
        <h1 className="section-title">Audit unavailable</h1>
        <p className="muted">{state.message}</p>
        <Link href={state.href} className="button button-primary">
          Start another audit
        </Link>
      </Card>
    );
  }

  return <AuditResultView result={state.result} fieldNotes={payload.fieldNotes} />;
}
