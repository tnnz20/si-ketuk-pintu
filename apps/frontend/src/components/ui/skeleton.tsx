import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-civic-neutralFill animate-pulse rounded-2xl', className)}
      {...props}
    />
  );
}

export { Skeleton };
