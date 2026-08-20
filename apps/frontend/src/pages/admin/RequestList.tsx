import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import RequestActionMenu from '@components/requests/RequestActionMenu';
import RequestFilters from '@components/requests/RequestFilters';
import RequestPagination from '@components/requests/RequestPagination';
import RequestTableContent from '@components/requests/RequestTableContent';
import { deleteRequest, getRequests } from '../../lib/api/requests';
import type { PaginatedRequestsResponse } from '@app-types/api';

type RequestRow = PaginatedRequestsResponse['data'][number];

export default function RequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PaginatedRequestsResponse['data']>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<{ row: RequestRow; left: number; top: number }>();
  const [confirmDelete, setConfirmDelete] = useState<RequestRow>();

  const load = useCallback(() => {
    setLoading(true);
    getRequests(page, pageSize, { search, status, date })
      .then((result) => {
        setRequests(result.data);
        setTotalPages(result.total_pages);
      })
      .catch(() => toast.error('Gagal memuat permohonan.'))
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
    setMenu({ row, left: Math.min(rect.right, window.innerWidth - 176), top: rect.bottom + 8 });
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

  const resetPage = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Manajemen Permohonan</h1>
        <p className="mt-2 text-on-surface-variant">Tinjau dan kelola permohonan kunjungan.</p>
      </header>
      <RequestFilters
        search={search}
        status={status}
        date={date}
        onSearchChange={(value) => resetPage(setSearch, value)}
        onStatusChange={(value) => resetPage(setStatus, value)}
        onDateChange={(value) => resetPage(setDate, value)}
      />
      <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
        <RequestTableContent requests={requests} loading={loading} onOpenMenu={openMenu} />
        <RequestPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </section>
      {menu && (
        <RequestActionMenu
          menu={menu}
          onClose={() => setMenu(undefined)}
          onViewDetail={(id) => navigate(`/dashboard/requests/${id}`)}
          onCopyToken={copyToken}
          onDelete={(row) => {
            setConfirmDelete(row);
            setMenu(undefined);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Hapus permohonan ini?"
          description="Aksi ini tidak dapat dibatalkan. Permohonan akan dihapus permanen."
          action="Hapus"
          onCancel={() => setConfirmDelete(undefined)}
          onConfirm={runDelete}
        />
      )}
    </>
  );
}
