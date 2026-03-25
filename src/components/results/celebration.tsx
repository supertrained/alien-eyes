import type { AuditDimension, CelebrationSection } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { dimensionLabel } from '@/components/results/dimension-labels';

export function Celebration({ celebration }: { celebration: CelebrationSection }) {
  return (
    <Card className="stack" style={{ padding: '1.5rem' }}>
      <div>
        <Badge tone="low">What&apos;s Working</Badge>
      </div>
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="card">
          <strong>{celebration.pageCount}</strong>
          <div className="muted">pages crawled</div>
        </div>
        <div className="card">
          <strong>{celebration.workingFlows}</strong>
          <div className="muted">working flows</div>
        </div>
        <div className="card">
          <strong>{celebration.cleanDimensions.length}</strong>
          <div className="muted">clean dimensions</div>
        </div>
      </div>
      {celebration.cleanDimensions.length > 0 && (
        <p className="muted">
          Clean: {celebration.cleanDimensions.map((d) => dimensionLabel(d as AuditDimension)).join(', ')}
        </p>
      )}
      <div className="stack">
        {celebration.positiveObservations.map((item) => (
          <div key={item} className="muted">• {item}</div>
        ))}
      </div>
    </Card>
  );
}
