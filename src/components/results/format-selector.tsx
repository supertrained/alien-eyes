'use client';

import type { RendererRegistry } from '@/types';
import { Button } from '@/components/ui/button';

export function FormatSelector({
  active,
  onSelect
}: {
  active: keyof RendererRegistry;
  onSelect: (format: keyof RendererRegistry) => void;
}) {
  const formats: Array<keyof RendererRegistry> = ['format-b', 'format-a', 'format-c', 'format-json'];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {formats.map((format) => (
        <Button
          key={format}
          type="button"
          className={active === format ? 'button-primary' : 'button-secondary'}
          onClick={() => onSelect(format)}
        >
          {format.replace('format-', '').toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
