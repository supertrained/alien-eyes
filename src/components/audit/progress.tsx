'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { FieldNote } from '@/orchestrator/field-notes';
import {
  getAuditEta,
  normalizeAuditApiPayload,
  shouldContinuePolling,
  shouldRedirectToResults,
  type AuditStatusPayload
} from '@/lib/audit-ui-state';

const phases = ['validating', 'crawling', 'extracting', 'auditing', 'synthesizing', 'rendering', 'complete'];

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function signalDotClass(signal: FieldNote['signal']): string {
  switch (signal) {
    case 'expected': return 'signal-expected';
    case 'notable': return 'signal-notable';
    case 'surprising': return 'signal-surprising';
  }
}

function FieldNotesFeed({ notes }: { notes: FieldNote[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const visible = notes.slice(-8);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visible.length]);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="field-notes-feed" ref={feedRef}>
      {visible.map((note) => (
        <div key={note.seq} className="field-note">
          <span className="field-note-time">{formatElapsed(note.elapsedMs)}</span>
          <span className={`signal-dot ${signalDotClass(note.signal)}`} />
          <span className="field-note-message">
            {note.context ? `${note.observed} ${note.context}` : note.observed}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuditProgress({ id }: { id: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<AuditStatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const response = await fetch(`/api/audit/${id}`, { cache: 'no-store' });
      const nextPayload = normalizeAuditApiPayload(id, await response.json(), response.ok);
      if (cancelled) {
        return;
      }
      setPayload(nextPayload);

      if (shouldRedirectToResults(nextPayload)) {
        router.replace(`/audit/${id}/results`);
        return;
      }

      if (shouldContinuePolling(nextPayload)) {
        setTimeout(poll, 900);
      }
    }

    poll().catch((error) => {
      if (!cancelled) {
        setPayload({
          id,
          status: 'error',
          progress: 100,
          phase: 'error',
          message: error instanceof Error ? error.message : 'Polling failed'
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const eta = useMemo(() => {
    return getAuditEta(payload?.progress ?? 0);
  }, [payload?.progress]);

  return (
    <Card className="progress-shell">
      <div className="shell">
        <span className="eyebrow">Audit in progress</span>
        <h1 className="section-title">Alien Eyes is scanning from the outside.</h1>
        <p className="muted">{payload?.message ?? 'Preparing the crawl and opening a clean browser profile.'}</p>
        <p className="muted">{eta}</p>

        <div className="progress-steps">
          {phases.map((phase) => {
            const active = phase === (payload?.phase ?? 'validating') || phases.indexOf(phase) < phases.indexOf(payload?.phase ?? 'validating');
            return (
              <div key={phase} className={`progress-step ${active ? 'active' : ''}`.trim()}>
                <strong>{phase}</strong>
                <span className="muted">
                  {phase === payload?.phase ? `${payload.progress}%` : active ? 'done' : 'queued'}
                </span>
              </div>
            );
          })}
        </div>

        <FieldNotesFeed notes={payload?.fieldNotes ?? []} />

        {payload?.status === 'error' ? (
          <div className="badge badge-critical" style={{ marginTop: '1rem' }}>
            {payload.error ?? payload.message}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
