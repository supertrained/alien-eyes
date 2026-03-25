'use client';

import type { DashboardTrendSeries } from '@/lib/auth';

export function TrendChart({ series }: { series: DashboardTrendSeries[] }) {
  if (series.length === 0) {
    return (
      <div className="card">
        <h3>No score history yet</h3>
        <p className="muted">Repeated audits of the same URL will draw a trend line here.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-trends">
      {series.map((item) => {
        const maxPoints = Math.max(item.points.length - 1, 1);

        return (
          <article key={item.normalizedUrl} className="card trend-card">
            <div className="trend-header">
              <div>
                <h3>{new URL(item.normalizedUrl).hostname}</h3>
                <div className="muted">{item.runCount} runs</div>
              </div>
              <div className="trend-latest">{item.latestScore ?? '—'}</div>
            </div>
            <svg className="trend-svg" viewBox="0 0 100 36" preserveAspectRatio="none" role="img" aria-label={`Trend for ${item.normalizedUrl}`}>
              <polyline
                fill="none"
                stroke="var(--scan)"
                strokeWidth="2.5"
                points={item.points.map((point, index) => {
                  const x = item.points.length === 1 ? 50 : (index / maxPoints) * 100;
                  const score = point.score ?? 0;
                  const y = 32 - Math.max(0, Math.min(100, score)) * 0.28;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            <div className="trend-points">
              {item.points.map((point) => (
                <span key={point.auditId} className="muted">
                  {new Date(point.createdAt).toLocaleDateString()} · {point.score ?? '—'}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
