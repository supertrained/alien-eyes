import type { CostBudget } from '@/types';

export class CostBudgetTracker {
  private readonly budget: CostBudget;
  private readonly warningThresholdUsd: number;
  private warningLogged = false;

  constructor(maxPerAudit = 5) {
    this.warningThresholdUsd = maxPerAudit;
    this.budget = {
      maxPerAudit,
      currentSpend: 0,
      isExceeded: false,
      primitiveSpend: {}
    };
  }

  recordSpend(primitive: string, amountUsd: number): { budget: CostBudget; warning?: string } {
    const nextPrimitiveSpend = (this.budget.primitiveSpend[primitive] ?? 0) + amountUsd;
    this.budget.primitiveSpend[primitive] = Number(nextPrimitiveSpend.toFixed(6));
    this.budget.currentSpend = Number((this.budget.currentSpend + amountUsd).toFixed(6));
    this.budget.isExceeded = this.budget.maxPerAudit !== undefined && this.budget.currentSpend > this.budget.maxPerAudit;

    if (!this.warningLogged && this.budget.currentSpend > this.warningThresholdUsd) {
      this.warningLogged = true;
      return {
        budget: this.snapshot(),
        warning: `Audit spend exceeded soft warning threshold of $${this.warningThresholdUsd.toFixed(2)}.`
      };
    }

    return { budget: this.snapshot() };
  }

  snapshot(): CostBudget {
    return {
      maxPerAudit: this.budget.maxPerAudit,
      currentSpend: this.budget.currentSpend,
      isExceeded: this.budget.isExceeded,
      primitiveSpend: { ...this.budget.primitiveSpend }
    };
  }
}
