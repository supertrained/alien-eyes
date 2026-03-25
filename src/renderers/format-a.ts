import type { SynthesisResult } from '@/types';
import { renderDimensionTable } from './scope-header';

export function renderFormatA(result: SynthesisResult): string {
  const findings = result.findings
    .map((finding) => `### [${finding.severity.toUpperCase()}] ${finding.what}\n- Where: ${finding.where}\n- Expected: ${finding.expected}\n- Why: ${finding.why}\n- Verify: ${finding.verify}`)
    .join('\n\n');

  return [
    `# Alien Eyes Findings - ${result.url}`,
    `Tested: ${result.meta.timestamp}`,
    `Satisfaction: ${result.satisfactionScore.value}% (Grade ${result.satisfactionScore.grade} — ${result.satisfactionScore.label})`,
    '',
    '## What\'s Working',
    ...result.celebration.positiveObservations.map((observation) => `- ${observation}`),
    '',
    ...renderDimensionTable(result),
    '## Narrative',
    result.verbatimNarrative,
    '',
    '## Findings',
    findings
  ].join('\n');
}
