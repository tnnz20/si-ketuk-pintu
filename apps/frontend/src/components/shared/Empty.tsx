import type { ReactNode } from 'react';

interface EmptyProps {
  className?: string;
  children?: ReactNode;
}

function Empty({ className = '', children }: EmptyProps) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-civic-border p-6 text-center md:p-12 ${className}`}
    >
      {children}
    </div>
  );
}

function EmptyHeader({ className = '', children }: EmptyProps) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className}`}>{children}</div>
  );
}

interface EmptyMediaProps extends EmptyProps {
  variant?: 'default' | 'icon';
}

function EmptyMedia({ className = '', variant = 'default', children }: EmptyMediaProps) {
  const base =
    'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0';
  const iconVariant =
    variant === 'icon'
      ? 'size-10 rounded-lg bg-civic-neutral-fill text-civic-muted [&_svg]:size-5'
      : 'bg-transparent';
  return (
    <div data-variant={variant} className={`${base} ${iconVariant} ${className}`}>
      {children}
    </div>
  );
}

function EmptyTitle({ className = '', children }: EmptyProps) {
  return (
    <div className={`text-base font-bold tracking-tight text-civic-dark ${className}`}>{children}</div>
  );
}

function EmptyDescription({ className = '', children }: EmptyProps) {
  return <p className={`text-xs font-medium text-civic-muted ${className}`}>{children}</p>;
}

function EmptyContent({ className = '', children }: EmptyProps) {
  return (
    <div className={`flex w-full max-w-sm flex-col items-center gap-4 ${className}`}>{children}</div>
  );
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent };