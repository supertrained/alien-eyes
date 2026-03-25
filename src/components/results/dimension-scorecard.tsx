'use client';

import type { AuditDimension, Finding, Score } from '@/types';
import { DIMENSION_META, IMPLEMENTED_DIMENSIONS, dimensionLabel, gradeColor } from './dimension-labels';

interface DimensionScorecardProps {
  dimensionScores: Record<AuditDimension, Score | null>;
  findings: Finding[];
  selectedDimension: AuditDimension | null;
  onSelectDimension: (dimension: AuditDimension | null) => void;
}

export function DimensionScorecard({
  dimensionScores,
  findings,
  selectedDimension,
  onSelectDimension
}: DimensionScorecardProps) {
  const rows = IMPLEMENTED_DIMENSIONS.map((dim) => {
    const score = dimensionScores[dim];
    const findingCount = findings.filter((f) => f.dimension === dim).length;
    return { dimension: dim, score, findingCount };
  });

  const scored = rows.filter((r) => r.score !== null && r.score.value < 100);
  const strongest = scored.length > 0
    ? scored.reduce((best, r) => (r.score!.value > best.score!.value ? r : best))
    : null;
  const weakest = scored.length > 0
    ? scored.reduce((worst, r) => (r.score!.value < worst.score!.value ? r : worst))
    : null;

  return (
    <div className="dimension-scorecard">
      {strongest && weakest && strongest.dimension !== weakest.dimension && (
        <p className="dimension-factors muted">
          Strongest: {dimensionLabel(strongest.dimension)} ({strongest.score!.value}%)
          {' · '}
          Weakest: {dimensionLabel(weakest.dimension)} ({weakest.score!.value}%)
        </p>
      )}
      <div className="dimension-rows">
        {rows.map(({ dimension, score, findingCount }) => (
          <DimensionRow
            key={dimension}
            dimension={dimension}
            score={score}
            findingCount={findingCount}
            isSelected={selectedDimension === dimension}
            onSelect={() =>
              onSelectDimension(selectedDimension === dimension ? null : dimension)
            }
          />
        ))}
      </div>
    </div>
  );
}

function DimensionRow({
  dimension,
  score,
  findingCount,
  isSelected,
  onSelect
}: {
  dimension: AuditDimension;
  score: Score | null;
  findingCount: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meta = DIMENSION_META[dimension];
  const label = meta?.label ?? dimension;
  const subtitle = meta?.subtitle ?? '';
  const isClean = score !== null && score.value === 100;
  const isNotEvaluated = score === null;

  if (isNotEvaluated) {
    return (
      <div className="dimension-row dimension-not-evaluated" aria-label={`${label}: Not evaluated`}>
        <div className="dimension-row-header">
          <span className="dimension-label">{label}</span>
          <span className="dimension-status muted">Not evaluated</span>
        </div>
      </div>
    );
  }

  return (
    <button
      className={`dimension-row ${isSelected ? 'dimension-selected' : ''} ${isClean ? 'dimension-clean' : ''}`}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${label}: ${isClean ? 'No issues found' : `${score.value}%, grade ${score.grade}, ${findingCount} findings`}`}
    >
      <div className="dimension-row-header">
        <span className="dimension-label">{label}</span>
        <span className="dimension-row-right">
          {isClean ? (
            <span className="dimension-clean-badge">✓ No issues</span>
          ) : (
            <>
              <span className="dimension-grade" style={{ color: gradeColor(score.grade) }}>
                {score.grade}
              </span>
              <span className="dimension-score-value">{score.value}%</span>
              <span className="dimension-finding-count muted">({findingCount})</span>
            </>
          )}
        </span>
      </div>
      <div className="dimension-bar-container">
        <div
          className="dimension-bar-fill"
          role="meter"
          aria-valuenow={score.value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} score`}
          style={{
            width: `${score.value}%`,
            backgroundColor: gradeColor(score.grade)
          }}
        />
        <div
          className="dimension-bar-confidence"
          style={{
            left: `${score.confidenceLow}%`,
            width: `${score.confidenceHigh - score.confidenceLow}%`,
            backgroundColor: gradeColor(score.grade)
          }}
        />
      </div>
      {subtitle && <span className="dimension-subtitle muted">{subtitle}</span>}
    </button>
  );
}
