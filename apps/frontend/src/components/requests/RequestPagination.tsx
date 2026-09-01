import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="hover:bg-civic-cardFill cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-2.5 py-1 text-xs font-bold text-civic-dark outline-none"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 font-medium text-civic-muted sm:justify-end">
        <span>
          Halaman <strong className="text-civic-dark">{page}</strong> dari{' '}
          <strong className="text-civic-dark">{totalPages || 1}</strong>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Halaman pertama"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="hover:bg-civic-cardFill hidden h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-civic-border bg-civic-surface text-civic-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="hover:bg-civic-cardFill flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-civic-border bg-civic-surface text-civic-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Halaman berikutnya"
            onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="hover:bg-civic-cardFill flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-civic-border bg-civic-surface text-civic-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Halaman terakhir"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="hover:bg-civic-cardFill hidden h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-civic-border bg-civic-surface text-civic-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
