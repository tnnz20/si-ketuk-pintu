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
      className={`invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-label-sm text-on-primary opacity-0 shadow-lg transition-opacity group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
