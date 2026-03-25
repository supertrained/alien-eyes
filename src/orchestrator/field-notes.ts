import type { AuditState } from '@/orchestrator/state-machine';

export interface FieldNote {
  phase: AuditState;
  subject: string;
  observed: string;
  signal: 'expected' | 'notable' | 'surprising';
  context?: string;
  seq: number;
  elapsedMs: number;
}

export class FieldNoteCollector {
  private notes: FieldNote[] = [];
  private seq = 0;
  private startTime: number;

  constructor(startTime?: number) {
    this.startTime = startTime ?? Date.now();
  }

  add(note: Omit<FieldNote, 'seq' | 'elapsedMs'>): FieldNote {
    const fieldNote: FieldNote = {
      ...note,
      seq: this.seq++,
      elapsedMs: Date.now() - this.startTime,
    };
    this.notes.push(fieldNote);
    return fieldNote;
  }

  getAll(): FieldNote[] { return [...this.notes]; }
  getLast(n: number): FieldNote[] { return this.notes.slice(-n); }

  formatMessage(note: FieldNote): string {
    return note.context ? `${note.observed} ${note.context}` : note.observed;
  }
}
