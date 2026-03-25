'use client';

import { useMemo, useState } from 'react';
import type { AuditDimension, RendererRegistry } from '@/types';
import type { StoredAuditResult } from '@/lib/audit-repository';
import type { FieldNote } from '@/orchestrator/field-notes';
import { Celebration } from '@/components/results/celebration';
import { CopyButton } from '@/components/results/copy-button';
import { FieldNotes } from '@/components/results/field-notes';
import { FindingsList } from '@/components/results/findings-list';
import { FormatSelector } from '@/components/results/format-selector';
import { Narrative } from '@/components/results/narrative';
import { ScoreHero } from '@/components/results/score-hero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function AuditResultView({ result, fieldNotes }: { result: StoredAuditResult; fieldNotes?: FieldNote[] }) {
  const [format, setFormat] = useState<keyof RendererRegistry>('format-b');
  const [selectedDimension, setSelectedDimension] = useState<AuditDimension | null>(null);
  const rendered = useMemo(() => result.rendered[format], [format, result.rendered]);

  return (
    <div className="results-grid">
      <div className="stack results-left">
        <Celebration celebration={result.synthesis.celebration} />
        <FindingsList
          findings={result.synthesis.findings}
          filterDimension={selectedDimension}
          onSelectDimension={setSelectedDimension}
        />
      </div>
      <div className="stack results-right">
        <ScoreHero
          result={result.synthesis}
          selectedDimension={selectedDimension}
          onSelectDimension={setSelectedDimension}
        />
        <Narrative text={result.synthesis.verbatimNarrative} />
        <Card className="copy-panel" style={{ padding: '1.5rem' }}>
          <div className="stack">
            <h2 className="section-title">Ship the fix loop</h2>
            <p className="muted">Format B is the default because it is the payload your coding agent can act on fastest.</p>
            <FormatSelector active={format} onSelect={setFormat} />
            <CopyButton value={rendered} />
            <textarea value={rendered} readOnly aria-label="Rendered audit output" />
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button className="button-secondary" type="button" disabled>
                Re-audit after fixes
              </Button>
              <Button className="button-ghost" type="button" disabled>
                PDF export later
              </Button>
            </div>
          </div>
        </Card>
        <FieldNotes notes={fieldNotes ?? []} />
      </div>
    </div>
  );
}
