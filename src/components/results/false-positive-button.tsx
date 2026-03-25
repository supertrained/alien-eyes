'use client';

import { Button } from '@/components/ui/button';

export function FalsePositiveButton() {
  return (
    <Button className="button-ghost" type="button" disabled title="False-positive workflow lands after hosted storage is wired.">
      False positive later
    </Button>
  );
}
