import type { AuditDimension } from '@/types';
import type { Grade } from '@/lib/synthesis/scoring';

export interface DimensionMeta {
  label: string;
  subtitle: string;
}

export const DIMENSION_META: Partial<Record<AuditDimension, DimensionMeta>> = {
  seo: { label: 'Search Visibility', subtitle: 'Meta tags, structured data, canonicals' },
  accessibility: { label: 'Accessibility', subtitle: 'WCAG 2.1 AA compliance' },
  security: { label: 'Security Surface', subtitle: 'Headers, CSP, HSTS, exposed paths' },
  performance: { label: 'Performance', subtitle: 'Core Web Vitals, load speed' },
  'agent-nativeness': { label: 'AI Agent Readiness', subtitle: 'API parity, structured outputs' },
  ux: { label: 'Copy & UX', subtitle: 'CTAs, trust signals, user flows' }
};

export const IMPLEMENTED_DIMENSIONS: AuditDimension[] = [
  'seo', 'accessibility', 'security', 'performance', 'agent-nativeness', 'ux'
];

export function dimensionLabel(dimension: AuditDimension): string {
  return DIMENSION_META[dimension]?.label ?? dimension;
}

const GRADE_COLORS: Record<Grade, string> = {
  A: 'var(--pass)',
  B: 'var(--scan)',
  C: 'var(--warning)',
  D: 'var(--critical)',
  F: 'var(--critical)'
};

export function gradeColor(grade: Grade): string {
  return GRADE_COLORS[grade];
}
