'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Button className="button-primary" type="button" onClick={onCopy}>
      {copied ? 'Copied for your coding agent' : 'Copy for your coding agent'}
    </Button>
  );
}
