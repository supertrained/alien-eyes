'use client';

import { useMemo } from 'react';
import type { AuditDimension, Finding } from '@/types';
import { Badge } from '@/components/ui/badge';
import { FalsePositiveButton } from '@/components/results/false-positive-button';
import { dimensionLabel } from '@/components/results/dimension-labels';

interface FindingsListProps {
  findings: Finding[];
  filterDimension?: AuditDimension | null;
  onSelectDimension?: (dimension: AuditDimension | null) => void;
}

export function FindingsList({ findings, filterDimension, onSelectDimension }: FindingsListProps) {
  const visible = useMemo(
    () => filterDimension ? findings.filter((f) => f.dimension === filterDimension) : findings,
    [findings, filterDimension]
  );

  return (
    <div className="finding-list">
      {filterDimension && (
        <div className="dimension-filter-banner">
          <span>
            Showing {visible.length} finding{visible.length === 1 ? '' : 's'} for{' '}
            <strong>{dimensionLabel(filterDimension)}</strong>
          </span>
          <button
            className="button-ghost"
            onClick={() => onSelectDimension?.(null)}
            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
          >
            Clear filter
          </button>
        </div>
      )}
      {visible.map((finding) => (
        <article key={finding.id} className={`finding ${finding.severity}`.trim()}>
          <div className="finding-header">
            <Badge tone={finding.severity}>{finding.severity}</Badge>
            <button
              className="badge-button"
              onClick={() => onSelectDimension?.(finding.dimension as AuditDimension)}
              title={`Filter to ${dimensionLabel(finding.dimension as AuditDimension)}`}
            >
              <Badge tone="neutral">{dimensionLabel(finding.dimension as AuditDimension)}</Badge>
            </button>
            <span className="muted">{finding.id}</span>
          </div>
          <h3>{finding.what}</h3>
          <p className="muted"><strong>Where:</strong> {finding.where}</p>
          <p>{finding.why}</p>
          <p className="muted"><strong>Expected:</strong> {finding.expected}</p>
          <p className="muted"><strong>Verify:</strong> {finding.verify}</p>
          {finding.causalChain?.length ? (
            <p className="muted"><strong>Connected to:</strong> {finding.causalChain.join(', ')}</p>
          ) : null}
          <FalsePositiveButton />
        </article>
      ))}
    </div>
  );
}
