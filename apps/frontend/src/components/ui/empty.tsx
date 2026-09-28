import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-civic-border p-8 text-center text-balance',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-sm flex-col items-center gap-1.5', className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'mb-1 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: 'bg-civic-neutralFill/60 text-civic-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl [&_svg]:h-5 [&_svg]:w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-sm font-extrabold tracking-tight text-civic-dark', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn('text-xs leading-relaxed text-civic-muted', className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn('flex w-full max-w-sm flex-col items-center gap-2 pt-2', className)}
      {...props}
    />
  );
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
