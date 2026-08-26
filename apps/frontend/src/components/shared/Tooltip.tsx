import type { HTMLAttributes, PropsWithChildren } from 'react';

type TooltipProps = PropsWithChildren<{ className?: string }>;

export function Tooltip({ children, className }: TooltipProps) {
  return <span className={`group/tooltip relative inline-flex ${className ?? ''}`}>{children}</span>;
}

export function TooltipTrigger({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={`inline-flex ${className ?? ''}`}>
      {children}
    </span>
  );
}

export function TooltipContent({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      role="tooltip"
      className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 origin-bottom whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-label-sm text-on-primary opacity-0 scale-95 shadow-lg transition-[opacity,scale] duration-150 ease-out group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:scale-100 motion-reduce:transition-none ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
