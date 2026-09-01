import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import RequestActionMenu from '@components/requests/RequestActionMenu';
import RequestFilters from '@components/requests/RequestFilters';
import RequestPagination from '@components/requests/RequestPagination';
import RequestTableContent from '@components/requests/RequestTableContent';
import { deleteRequest, getRequests, getStats } from '../../lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '@app-types/api';

type RequestRow = PaginatedRequestsResponse['data'][number];

export default function RequestList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState<PaginatedRequestsResponse['data']>([]);
  const [stats, setStats] = useState<StatsResponse>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const initialSearch = searchParams.get('search') ?? '';
  const initialStatus = searchParams.get('status') ?? '';

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<{ row: RequestRow; left: number; top: number }>();
  const [confirmDelete, setConfirmDelete] = useState<RequestRow>();

  // Fetch Stats for accurate counts on filter pills
  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    getRequests(page, pageSize, { search, status, date })
      .then((result) => {
        setRequests(result.data);
        setTotalPages(result.total_pages);
        setTotalCount(result.total);
      })
      .catch(() => toast.error('Gagal memuat daftar permohonan.'))
      .finally(() => setLoading(false));
  }, [page, pageSize, search, status, date]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function runDelete() {
    if (!confirmDelete) return;
    try {
      await deleteRequest(confirmDelete.id);
      toast.success('Permohonan berhasil dihapus.');
      setConfirmDelete(undefined);
      if (requests.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        load();
      }
    } catch {
      toast.error('Aksi gagal diproses.');
    }
  }

  function openMenu(event: React.MouseEvent, row: RequestRow) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({ row, left: Math.min(rect.right, window.innerWidth - 190), top: rect.bottom + 8 });
  }

  async function copyToken(row: RequestRow) {
    setMenu(undefined);
    try {
      await navigator.clipboard.writeText(row.token);
      toast.success('Token disalin ke clipboard.');
    } catch {
      toast.error('Gagal menyalin token.');
    }
  }

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('status', val);
    else newParams.delete('status');
    setSearchParams(newParams);
  };

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
      {/* Table Container Card */}
      <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
        {/* Card Header & Title */}
        <div className="flex flex-col justify-between gap-3 border-b border-civic-border pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-extrabold text-civic-dark sm:text-lg">
              Manajemen Permohonan
            </h3>
            <p className="mt-0.5 text-xs font-medium text-civic-muted">
              Daftar permohonan masuk yang terdaftar di Si Ketuk Pintu
            </p>
          </div>

          <div className="text-xs font-bold text-civic-muted">
            Total Data: <span className="font-extrabold text-civic-dark">{totalCount}</span>
          </div>
        </div>

        {/* Filters */}
        <RequestFilters
          search={search}
          status={status}
          date={date}
          counts={
            stats
              ? {
                  total: stats.total_requests,
                  pending: stats.pending_approval,
                }
              : undefined
          }
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onDateChange={(val: string) => {
            setDate(val);
            setPage(1);
          }}
        />

        {/* Table Content */}
        <RequestTableContent requests={requests} loading={loading} onOpenMenu={openMenu} />

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

      {/* Floating Action Menu */}
      {menu && (
        <RequestActionMenu
          menu={menu}
          onClose={() => setMenu(undefined)}
          onViewDetail={(id: string) => navigate(`/dashboard/requests/${id}`)}
          onCopyToken={copyToken}
          onDelete={(row: RequestRow) => {
            setConfirmDelete(row);
            setMenu(undefined);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title="Hapus permohonan ini?"
          description={`Aksi ini tidak dapat dibatalkan. Permohonan ${confirmDelete.token} akan dihapus secara permanen.`}
          action="Hapus"
          onCancel={() => setConfirmDelete(undefined)}
          onConfirm={runDelete}
        />
      )}
    </div>
  );
}
