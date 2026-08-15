import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Skeleton from '../../components/shared/Skeleton';
import StatusBadge from '../../components/shared/StatusBadge';
import { deleteRequest, getRequests } from '../../lib/api/requests';
import type { PaginatedRequestsResponse } from '../../lib/types/api';

type RequestRow = PaginatedRequestsResponse['data'][number];
const PAGE_SIZES = [10, 20, 30, 40, 50];

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

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Manajemen Permohonan</h1>
        <p className="mt-2 text-on-surface-variant">Tinjau dan kelola permohonan kunjungan.</p>
      </header>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Cari permohonan berdasarkan token"
          className="rounded border border-surface-alt bg-white p-3"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded border border-surface-alt bg-white p-3"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setPage(1);
          }}
          type="date"
          className="rounded border border-surface-alt bg-white p-3"
        />
      </div>
      <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="bg-surface-container-low text-label-md text-on-surface-variant">
                <th className="p-4">Token</th>
                <th>Nama Instansi</th>
                <th>Tanggal Kunjungan</th>
                <th>Pimpinan Rombongan</th>
                <th>Jumlah Tamu</th>
                <th>Status</th>
                <th>Dibuat Pada</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="p-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : requests.map((request) => (
                    <tr key={request.id} className="text-body-md text-on-surface">
                      <td className="p-4 font-medium">{request.token}</td>
                      <td className="max-w-40 truncate">{request.nama_instansi}</td>
                      <td>{request.tanggal_kunjungan}</td>
                      <td className="max-w-48 truncate">{request.pimpinan_rombongan}</td>
                      <td>{request.jumlah_tamu}</td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                      <td>{new Date(request.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          aria-label="Aksi permohonan"
                          onClick={(event) => openMenu(event, request)}
                          className="inline-flex cursor-pointer rounded-full p-2 hover:bg-surface-container"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-outline-variant px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
            <span>Baris per halaman</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded border border-outline-variant bg-white px-2 py-1.5"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <span className="text-label-md text-on-surface-variant">
              Halaman {page} dari {totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Halaman pertama"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="hidden h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40 sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Halaman terakhir"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="hidden h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40 sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(undefined)} />
          <div
            className="fixed z-50 w-44 rounded border border-outline-variant bg-white p-1 text-left shadow-lg"
            style={{ left: menu.left, top: menu.top }}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface"
              onClick={() => {
                setMenu(undefined);
                navigate(`/dashboard/requests/${menu.row.id}`);
              }}
            >
              Lihat Detail
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface"
              onClick={() => void copyToken(menu.row)}
            >
              <Copy className="h-4 w-4" /> Copy Token
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-error hover:bg-surface"
              onClick={() => {
                setConfirmDelete(menu.row);
                setMenu(undefined);
              }}
            >
              <Trash2 className="h-4 w-4" /> Hapus
            </button>
          </div>
        </>
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
