'use client';

import { Badge } from '@/components/ui/badge';
import type { DashboardAuditSummary } from '@/lib/auth';

export function AuditList({ audits }: { audits: DashboardAuditSummary[] }) {
  if (audits.length === 0) {
    return (
      <div className="card">
        <h3>No owned audits yet</h3>
        <p className="muted">
          Sign in, run a new audit from the homepage, and it will start appearing here with score history.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-list">
      {audits.map((audit) => (
        <article key={audit.id} className="card dashboard-row">
          <div className="stack-tight">
            <div className="dashboard-row-title">
              <strong>{new URL(audit.url).hostname}</strong>
              <Badge tone={audit.status === 'complete' ? 'low' : audit.status === 'error' ? 'critical' : 'medium'}>
                {audit.status}
              </Badge>
            </div>
            <div className="muted dashboard-url">{audit.url}</div>
          </div>
          <div className="dashboard-metrics">
            <div>
              <div className="metric-label">Score</div>
              <div className="metric-value">{audit.satisfactionScore ?? '—'}</div>
            </div>
            <div>
              <div className="metric-label">Findings</div>
              <div className="metric-value">{audit.findingCount}</div>
            </div>
            <div>
              <div className="metric-label">Run</div>
              <div className="metric-value">{new Date(audit.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
