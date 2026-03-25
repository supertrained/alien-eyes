import { EventEmitter } from 'node:events';
import type { AuditState } from '@/orchestrator/state-machine';
import type { FieldNote } from '@/orchestrator/field-notes';

export interface ProgressEvent {
  state: AuditState;
  message: string;
  progress: number;
  observation?: FieldNote;
}

export class ProgressEmitter extends EventEmitter {
  emitProgress(event: ProgressEvent): boolean {
    return this.emit('progress', event);
  }

  emitFieldNote(note: FieldNote, message: string, progress: number, state: AuditState): boolean {
    return this.emitProgress({ state, message, progress, observation: note });
  }

  onProgress(handler: (event: ProgressEvent) => void): this {
    return this.on('progress', handler);
  }
}
