import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-extrabold tracking-wide uppercase transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-civic-dark text-white',
        pending: 'bg-civic-pendingBg text-civic-pendingText border border-[#e5e0cf]',
        approved: 'bg-civic-approvedBg text-civic-approvedText border border-[#c6e7cf]',
        rejected: 'bg-civic-rejectedBg text-civic-rejectedText border border-[#f7c5c2]',
        outline: 'border border-civic-border text-civic-muted bg-civic-surface',
        secondary: 'bg-civic-neutralFill text-civic-dark',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
