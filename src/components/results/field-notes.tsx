'use client';

import { useState } from 'react';
import type { FieldNote } from '@/orchestrator/field-notes';
import { Button } from '@/components/ui/button';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function signalClass(signal: FieldNote['signal']): string {
  switch (signal) {
    case 'expected': return 'signal-expected';
    case 'notable': return 'signal-notable';
    case 'surprising': return 'signal-surprising';
  }
}

function formatNoteText(note: FieldNote): string {
  return note.context ? `${note.observed} ${note.context}` : note.observed;
}

function formatForCopy(notes: FieldNote[]): string {
  const lines = [
    'Have your agent retrace these steps to verify the findings independently.',
    '',
    ...notes.map((note) => `[${formatElapsed(note.elapsedMs)}] ${formatNoteText(note)}`),
  ];
  return lines.join('\n');
}

export function FieldNotes({ notes }: { notes: FieldNote[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!notes || notes.length === 0) {
    return null;
  }

  async function onCopy() {
    await navigator.clipboard.writeText(formatForCopy(notes));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="field-notes-collapsible">
      <button
        type="button"
        className="field-notes-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={`field-notes-chevron ${open ? 'open' : ''}`}>&#9654;</span>
        <span>Field Notes</span>
        <span className="muted" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
          ({notes.length})
        </span>
      </button>

      {open && (
        <div className="field-notes-feed" style={{ marginTop: '0.75rem' }}>
          {notes.map((note) => (
            <div key={note.seq} className="field-note">
              <span className="field-note-time">{formatElapsed(note.elapsedMs)}</span>
              <span className={`signal-dot ${signalClass(note.signal)}`} />
              <span className="field-note-message">{formatNoteText(note)}</span>
            </div>
          ))}
          <div style={{ marginTop: '0.75rem' }}>
            <Button className="button-secondary" type="button" onClick={onCopy}>
              {copied ? 'Copied field notes' : 'Copy field notes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
