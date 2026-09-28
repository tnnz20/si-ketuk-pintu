import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZES = [10, 20, 30, 50];

interface RequestPaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number | ((page: number) => number)) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function RequestPagination({
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: RequestPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-civic-border pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 font-medium text-civic-muted">
        <span>Baris per halaman:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger size="sm" className="h-8 w-20 rounded-xl px-2.5 py-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-20">
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3 font-medium text-civic-muted sm:justify-end">
        <span>
          Halaman <strong className="text-civic-dark">{page}</strong> dari{' '}
          <strong className="text-civic-dark">{totalPages || 1}</strong>
        </span>

        <Pagination>
          <PaginationContent>
            <PaginationItem className="hidden sm:inline-block">
              <PaginationLink
                size="sm"
                aria-label="Halaman pertama"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              />
            </PaginationItem>
            <PaginationItem className="hidden sm:inline-block">
              <PaginationLink
                size="sm"
                aria-label="Halaman terakhir"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
