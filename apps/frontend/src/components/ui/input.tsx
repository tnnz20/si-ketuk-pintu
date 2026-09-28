import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-2xl border border-civic-border bg-civic-surface px-3.5 py-2 text-xs text-civic-dark transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-civic-muted focus-visible:border-civic-dark focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
