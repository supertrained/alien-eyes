import type { SynthesisResult } from '@/types';
import { IMPLEMENTED_DIMENSIONS, dimensionLabel } from '@/components/results/dimension-labels';

export function renderScopeHeader(result: SynthesisResult): string[] {
  const hostname = new URL(result.url).hostname;
  const { grade, value } = result.satisfactionScore;

  const dimSummaries = IMPLEMENTED_DIMENSIONS
    .map((dim) => {
      const s = result.dimensionScores[dim];
      if (!s) return null;
      const clean = s.value === 100 ? ' ✓' : '';
      return `${dimensionLabel(dim)} (${s.grade} ${s.value}%${clean})`;
    })
    .filter(Boolean);

  const cleanCount = result.celebration.cleanDimensions.length;
  const lines = [
    `Alien Eyes audit of ${hostname} — Grade ${grade} (${value}%)`,
    `Checked ${dimSummaries.length} dimensions: ${dimSummaries.join(', ')}`
  ];

  if (cleanCount > 0) {
    lines.push(`${cleanCount} clean dimension${cleanCount === 1 ? '' : 's'} passed with no issues.`);
  }

  lines.push('');
  return lines;
}

export function renderDimensionTable(result: SynthesisResult): string[] {
  const lines = [
    '## Dimension Scores',
    '| Dimension | Grade | Score | Findings |',
    '|-----------|-------|-------|----------|'
  ];

  for (const dim of IMPLEMENTED_DIMENSIONS) {
    const s = result.dimensionScores[dim];
    if (!s) continue;
    const findingCount = result.findings.filter((f) => f.dimension === dim).length;
    const clean = findingCount === 0 ? ' ✓' : '';
    lines.push(`| ${dimensionLabel(dim)} | ${s.grade} | ${s.value}% | ${findingCount}${clean} |`);
  }

  lines.push('');
  return lines;
}
