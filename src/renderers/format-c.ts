import type { SynthesisResult } from '@/types';
import { renderScopeHeader } from './scope-header';

export function renderFormatC(result: SynthesisResult): string {
  const lines = [
    ...renderScopeHeader(result),
    `Fix these ${result.findings.length} issues:`,
    ''
  ];

  result.findings.forEach((finding, index) => {
    lines.push(`${index + 1}. ${finding.severity.toUpperCase()}: ${finding.what}`);
    lines.push(`   Where: ${finding.where}`);
    lines.push(`   Fix: ${finding.expected}`);
    lines.push(`   Verify: ${finding.verify}`);
    lines.push('');
  });

  return lines.join('\n').trim();
}
