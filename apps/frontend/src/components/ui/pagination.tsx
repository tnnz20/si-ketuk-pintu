import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('m-0 flex list-none items-center gap-1 p-0', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'button'>;

function PaginationLink({ className, isActive, size = 'icon-sm', ...props }: PaginationLinkProps) {
  return (
    <Button
      type="button"
      variant={isActive ? 'default' : 'outline'}
      size={size}
      className={cn(
        'rounded-xl text-xs font-bold transition-all',
        isActive ? 'bg-civic-dark text-white' : 'hover:bg-civic-neutralFill/60',
        className,
      )}
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  text = 'Sebelumnya',
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Halaman sebelumnya"
      size="sm"
      disabled={disabled}
      className={cn('gap-1 px-3', className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = 'Berikutnya',
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Halaman berikutnya"
      size="sm"
      disabled={disabled}
      className={cn('gap-1 px-3', className)}
      {...props}
    >
      <span className="hidden sm:inline">{text}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
