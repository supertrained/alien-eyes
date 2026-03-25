import type { CostBudget } from '@/types';

export class AuditCostTracker {
  private readonly warningThreshold: number;
  private readonly logger: Pick<Console, 'warn'>;
  private readonly budget: CostBudget;

  constructor(options: { warningThreshold?: number; logger?: Pick<Console, 'warn'> } = {}) {
    this.warningThreshold = options.warningThreshold ?? 5;
    this.logger = options.logger ?? console;
    this.budget = {
      currentSpend: 0,
      isExceeded: false,
      primitiveSpend: {}
    };
  }

  record(primitive: string, costUsd: number): CostBudget {
    this.budget.currentSpend += costUsd;
    this.budget.primitiveSpend[primitive] = (this.budget.primitiveSpend[primitive] ?? 0) + costUsd;
    this.budget.isExceeded = this.budget.currentSpend >= this.warningThreshold;

    if (this.budget.isExceeded) {
      this.logger.warn(
        `[cost-budget] audit spend ${this.budget.currentSpend.toFixed(4)} exceeded soft threshold ${this.warningThreshold.toFixed(2)}`
      );
    }

    return this.snapshot();
  }

  snapshot(): CostBudget {
    return {
      currentSpend: Number(this.budget.currentSpend.toFixed(4)),
      isExceeded: this.budget.isExceeded,
      primitiveSpend: { ...this.budget.primitiveSpend }
    };
  }
}
