import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import RequestActionMenu from '@components/requests/RequestActionMenu';
import RequestPagination from '@components/requests/RequestPagination';
import ArchiveTableContent from '@components/archives/ArchiveTableContent';
import { getArchives } from '@lib/api/archives';
import type { PaginatedRequestsResponse } from '@app-types/api';

export default function Archives() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [archives, setArchives] = useState<PaginatedRequestsResponse['data']>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const initialSearch = searchParams.get('search') ?? '';

  const [search, setSearch] = useState(initialSearch);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<{
    row: PaginatedRequestsResponse['data'][number];
    left: number;
    top: number;
  }>();

  const load = useCallback(() => {
    setLoading(true);
    getArchives(page, pageSize, { search, date })
      .then((result) => {
        setArchives(result.data);
        setTotalPages(result.total_pages);
        setTotalCount(result.total);
      })
      .catch(() => {
        setArchives([]);
        setTotalPages(1);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, date]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function openMenu(event: React.MouseEvent, row: PaginatedRequestsResponse['data'][number]) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({ row, left: Math.min(rect.right, window.innerWidth - 190), top: rect.bottom + 8 });
  }

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('search', val);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
        {/* Card Header & Title */}
        <div className="flex flex-col justify-between gap-3 border-b border-civic-border pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-extrabold text-civic-dark sm:text-lg">
              Arsip Permohonan
            </h3>
            <p className="mt-0.5 text-xs font-medium text-civic-muted">
              Daftar permohonan kunjungan yang telah disetujui beserta dokumennya
            </p>
          </div>

          <div className="text-xs font-bold text-civic-muted">
            Total Data: <span className="font-extrabold text-civic-dark">{totalCount}</span>
          </div>
        </div>

        {/* Search & Date Filters */}
        <div className="flex flex-col justify-between gap-3.5 pb-1 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari token atau instansi..."
              aria-label="Cari arsip"
              className="soft-shadow w-full rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
            />
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            aria-label="Filter tanggal kunjungan"
            className="soft-shadow w-full cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none md:w-auto"
          />
        </div>

        {/* Table Content */}
        <ArchiveTableContent archives={archives} loading={loading} onOpenMenu={openMenu} />

        {/* Pagination */}
        <RequestPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(value: number) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </div>
      {menu && (
        <RequestActionMenu
          menu={menu}
          onClose={() => setMenu(undefined)}
          onViewDetail={(id) => navigate(`/dashboard/archives/${id}`)}
          onCopyToken={async (row) => {
            setMenu(undefined);
            try {
              await navigator.clipboard.writeText(row.token);
              toast.success('Token disalin ke clipboard.');
            } catch {
              toast.error('Gagal menyalin token.');
            }
          }}
          showDelete={false}
        />
      )}
    </div>
  );
}
