export type AuditState =
  | 'pending'
  | 'validating'
  | 'crawling'
  | 'extracting'
  | 'auditing'
  | 'synthesizing'
  | 'rendering'
  | 'complete'
  | 'error'
  | 'timeout';

const ALLOWED_TRANSITIONS: Record<AuditState, AuditState[]> = {
  pending: ['validating', 'error', 'timeout'],
  validating: ['crawling', 'error', 'timeout'],
  crawling: ['extracting', 'error', 'timeout'],
  extracting: ['auditing', 'error', 'timeout'],
  auditing: ['synthesizing', 'error', 'timeout'],
  synthesizing: ['rendering', 'error', 'timeout'],
  rendering: ['complete', 'error', 'timeout'],
  complete: [],
  error: [],
  timeout: []
};

export class AuditStateMachine {
  private state: AuditState = 'pending';

  get current(): AuditState {
    return this.state;
  }

  transition(next: AuditState): AuditState {
    if (!ALLOWED_TRANSITIONS[this.state].includes(next)) {
      throw new Error(`Invalid state transition: ${this.state} -> ${next}`);
    }

    this.state = next;
    return this.state;
  }
}
