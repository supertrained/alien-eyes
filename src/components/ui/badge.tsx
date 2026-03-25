import type { PropsWithChildren } from 'react';

export function Badge({
  tone = 'neutral',
  children
}: PropsWithChildren<{ tone?: 'critical' | 'high' | 'medium' | 'low' | 'neutral' }>) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
