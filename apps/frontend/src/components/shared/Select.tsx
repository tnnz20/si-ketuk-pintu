import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export function Select({ className, wrapperClassName, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        {...props}
        className={cn(
          'w-full appearance-none rounded-2xl border border-civic-border bg-civic-surface px-3.5 py-2.5 pr-10 text-xs font-semibold text-civic-dark transition-colors focus-visible:border-civic-dark focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-civic-muted" />
    </div>
  );
}
