import type { SynthesisResult } from '@/types/synthesis';

/**
 * A renderer transforms SynthesisResult into a specific format.
 */
export type PayloadRenderer = (result: SynthesisResult) => string;

/**
 * Renderer registry — maps format names to renderer functions.
 */
export interface RendererRegistry {
  'format-a': PayloadRenderer;
  'format-b': PayloadRenderer;
  'format-c': PayloadRenderer;
  'format-json': PayloadRenderer;
}
