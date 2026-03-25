import type { RendererRegistry } from '@/types';
import { renderFormatA } from '@/renderers/format-a';
import { renderFormatB } from '@/renderers/format-b';
import { renderFormatC } from '@/renderers/format-c';
import { renderFormatJson } from '@/renderers/format-json';

export const renderers: RendererRegistry = {
  'format-a': renderFormatA,
  'format-b': renderFormatB,
  'format-c': renderFormatC,
  'format-json': renderFormatJson
};
