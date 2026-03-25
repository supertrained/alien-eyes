import type { SynthesisResult } from '@/types';

export function renderFormatJson(result: SynthesisResult): string {
  return JSON.stringify(result, null, 2);
}
