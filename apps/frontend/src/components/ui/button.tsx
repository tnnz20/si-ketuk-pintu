import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-civic-dark text-white hover:bg-civic-darkHover shadow-sm',
        outline:
          'border-civic-border bg-civic-surface text-civic-dark hover:bg-civic-neutralFill/60 hover:text-civic-dark',
        secondary: 'bg-civic-neutralFill text-civic-dark hover:bg-civic-sidebarBorder',
        ghost: 'hover:bg-civic-neutralFill/60 text-civic-dark hover:text-civic-dark',
        destructive:
          'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 focus-visible:ring-rose-400',
        link: 'text-civic-dark underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 gap-2 px-3.5 py-2 text-xs',
        xs: 'h-6 gap-1 rounded-lg px-2 text-3xs',
        sm: 'h-8 gap-1.5 rounded-lg px-3 text-2xs',
        lg: 'h-10 gap-2 rounded-2xl px-5 text-sm',
        icon: 'size-9 rounded-xl',
        'icon-xs': 'size-6 rounded-lg',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
