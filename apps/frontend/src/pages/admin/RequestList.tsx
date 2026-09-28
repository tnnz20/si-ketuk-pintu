import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RequestFilters from '@/components/requests/RequestFilters';
import RequestPagination from '@/components/requests/RequestPagination';
import RequestTableContent from '@/components/requests/RequestTableContent';
import { useRequests, type RequestRow } from '@/hooks/use-requests';

export default function RequestList() {
  const navigate = useNavigate();
  const {
    requests,
    stats,
    page,
    pageSize,
    totalPages,
    totalCount,
    search,
    status,
    date,
    loading,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setDate,
    remove,
  } = useRequests();

  const [confirmDelete, setConfirmDelete] = useState<RequestRow>();

  async function copyToken(row: RequestRow) {
    try {
      await navigator.clipboard.writeText(row.token);
      toast.success('Token disalin ke clipboard.');
    } catch {
      toast.error('Gagal menyalin token.');
    }
  }

  async function runDelete() {
    if (!confirmDelete) return;
    const ok = await remove(confirmDelete);
    if (ok) setConfirmDelete(undefined);
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
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
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onDateChange={setDate}
        />

        <RequestTableContent
          requests={requests}
          loading={loading}
          onViewDetail={(id) => navigate(`/dashboard/requests/${id}`)}
          onCopyToken={copyToken}
          onDelete={(row) => setConfirmDelete(row)}
        />

        <RequestPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

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
