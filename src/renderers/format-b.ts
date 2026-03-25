import type { SynthesisResult } from '@/types';
import { renderScopeHeader } from './scope-header';

export function renderFormatB(result: SynthesisResult): string {
  const lines = [
    ...renderScopeHeader(result),
    `Fix these ${result.findings.length} issues:`,
    ''
  ];

  result.findings.forEach((finding, index) => {
    const location = formatLocation(finding.where);
    const connection = finding.causalChain?.length === 1 ? ` Connected to ${finding.causalChain[0]}.` : '';
    const conf = finding.confidence != null ? ` (${finding.confidence.toFixed(2)})` : '';
    lines.push(
      `${index + 1}. ${finding.severity.toUpperCase()}${conf}: ${finding.what} ${location}${finding.expected} ${finding.why}${connection}`
        .replace(/\s+/g, ' ')
        .trim()
    );
    if (finding.verify) {
      lines.push(`   Verify: ${finding.verify}`);
    }
  });

  return lines.join('\n');
}

function formatLocation(where: string): string {
  if (!where) {
    return '';
  }
  return `On ${where}, `;
}
