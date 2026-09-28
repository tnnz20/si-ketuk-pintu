import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-xs font-bold leading-none select-none text-civic-dark peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
);

function Label({
  className,
  ...props
}: React.ComponentProps<'label'> & VariantProps<typeof labelVariants>) {
  return <label data-slot="label" className={cn(labelVariants(), className)} {...props} />;
}

export { Label };
