import { MoreHorizontal, QrCode } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Sidebar from '../../components/shared/Sidebar';
import Skeleton from '../../components/shared/Skeleton';
import StatusBadge from '../../components/shared/StatusBadge';
import { deleteRequest, getRequests, updateStatus } from '../../lib/api/requests';
import type { PaginatedRequestsResponse } from '../../lib/types/api';

export default function RequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PaginatedRequestsResponse['data']>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{
    id: string;
    type: 'delete' | 'approved' | 'rejected';
  }>();

  const load = useCallback(() => {
    setLoading(true);
    getRequests(1, 20, { search, status, date })
      .then((result) => setRequests(result.data))
      .catch(() => toast.error('Gagal memuat permohonan.'))
      .finally(() => setLoading(false));
  }, [search, status, date]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function runAction() {
    if (!confirm) return;
    try {
      if (confirm.type === 'delete') {
        await deleteRequest(confirm.id);
        toast.success('Permohonan berhasil dihapus');
      } else {
        await updateStatus(confirm.id, confirm.type);
        toast.success('Permohonan berhasil diperbarui');
      }
      setConfirm(undefined);
      load();
    } catch {
      toast.error('Aksi gagal diproses.');
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 lg:p-10">
        <div className="mx-auto max-w-container-max">
          <header className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-primary">Manajemen Permohonan</h1>
              <p className="mt-2 text-on-surface-variant">
                Tinjau dan kelola permohonan kunjungan.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-label-md text-on-primary"
            >
              <QrCode className="h-4 w-4" /> Scanner
            </button>
          </header>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari permohonan berdasarkan token"
              className="rounded border border-surface-alt bg-white p-3"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded border border-surface-alt bg-white p-3"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              value={date}
              onChange={(event) => setDate(event.target.value)}
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
                            <details className="relative">
                              <summary className="inline-flex cursor-pointer list-none rounded-full p-2 hover:bg-surface-container">
                                <MoreHorizontal className="h-5 w-5" />
                              </summary>
                              <div className="absolute right-0 z-10 mt-2 grid w-40 rounded border border-outline-variant bg-white p-1 text-left shadow-sm">
                                <button
                                  className="px-3 py-2 text-left hover:bg-surface"
                                  onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                                >
                                  Lihat Detail
                                </button>
                                <button
                                  className="px-3 py-2 text-left hover:bg-surface"
                                  onClick={() => setConfirm({ id: request.id, type: 'approved' })}
                                >
                                  Setujui
                                </button>
                                <button
                                  className="px-3 py-2 text-left hover:bg-surface"
                                  onClick={() => setConfirm({ id: request.id, type: 'rejected' })}
                                >
                                  Tolak
                                </button>
                                <button
                                  className="px-3 py-2 text-left text-error hover:bg-surface"
                                  onClick={() => setConfirm({ id: request.id, type: 'delete' })}
                                >
                                  Hapus
                                </button>
                              </div>
                            </details>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      {confirm && (
        <ConfirmDialog
          title="Apakah Anda yakin?"
          description="Aksi ini akan memproses permohonan terpilih."
          action={confirm.type === 'delete' ? 'Hapus' : 'Ubah Status'}
          onCancel={() => setConfirm(undefined)}
          onConfirm={runAction}
        />
      )}
    </div>
  );
}
