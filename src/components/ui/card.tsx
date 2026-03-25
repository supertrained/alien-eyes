import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({
  children,
  className = '',
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`panel ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
