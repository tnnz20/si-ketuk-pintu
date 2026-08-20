import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select } from '@components/shared/Select';

const PAGE_SIZES = [10, 20, 30, 40, 50];

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
    <div className="flex flex-col gap-4 border-t border-outline-variant px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <span>Baris per halaman</span>
        <Select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded border border-outline-variant bg-white px-2 py-1.5"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center justify-between gap-4 lg:justify-end">
        <span className="text-label-md text-on-surface-variant">
          Halaman {page} dari {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Halaman pertama"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="hidden h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Halaman berikutnya"
            onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Halaman terakhir"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="hidden h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
