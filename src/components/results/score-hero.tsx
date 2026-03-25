import type { AuditDimension, Finding, SynthesisResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DimensionScorecard } from '@/components/results/dimension-scorecard';

interface ScoreHeroProps {
  result: SynthesisResult;
  selectedDimension: AuditDimension | null;
  onSelectDimension: (dimension: AuditDimension | null) => void;
}

export function ScoreHero({ result, selectedDimension, onSelectDimension }: ScoreHeroProps) {
  return (
    <Card className="score-card">
      <div className="score-hero-top">
        <Badge tone="neutral">{result.satisfactionScore.label}</Badge>
        <p className="score-grade" style={{ color: gradeColorVar(result.satisfactionScore.grade) }}>
          {result.satisfactionScore.grade}
        </p>
        <p className="score-value">{result.satisfactionScore.value}%</p>
        <p className="muted score-guidance">{result.satisfactionScore.guidance}</p>
        <p className="muted" style={{ fontSize: '0.75rem' }}>
          Confidence band {result.satisfactionScore.confidenceLow}% to {result.satisfactionScore.confidenceHigh}%
        </p>
      </div>
      <div className="score-subgrid">
        <div className="card">
          <strong>Human-native</strong>
          <div>{result.humanNativeScore.value}%</div>
          <div className="muted" style={{ fontSize: '0.75rem' }}>{result.humanNativeScore.grade}</div>
        </div>
        <div className="card">
          <strong>Agent-native</strong>
          <div>{result.agentNativenessScore.value}%</div>
          <div className="muted" style={{ fontSize: '0.75rem' }}>{result.agentNativenessScore.grade}</div>
        </div>
      </div>
      <DimensionScorecard
        dimensionScores={result.dimensionScores}
        findings={result.findings}
        selectedDimension={selectedDimension}
        onSelectDimension={onSelectDimension}
      />
    </Card>
  );
}

function gradeColorVar(grade: string): string {
  switch (grade) {
    case 'A': return 'var(--pass)';
    case 'B': return 'var(--scan)';
    case 'C': return 'var(--warning)';
    case 'D':
    case 'F': return 'var(--critical)';
    default: return 'inherit';
  }
}
