import { ArrowLeft, Calendar, Eye, FileText, Gavel, History, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
import { downloadAttachment, getRequestById, updateStatus } from '../../lib/api/requests';
import type { RequestDetailResponse } from '@app-types/api';

export default function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<'approved' | 'rejected'>();

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getRequestById(id)
      .then(setData)
      .catch(() => toast.error('Permohonan tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function handleStatus() {
    if (!id || !confirm) return;
    try {
      await updateStatus(id, confirm);
      toast.success('Permohonan berhasil diperbarui');
      setConfirm(undefined);
      load();
    } catch {
      toast.error('Gagal memperbarui permohonan.');
    }
  }

  async function preview(type: 'surat_kunjungan' | 'surat_tugas') {
    if (!id) return;
    try {
      const blob = await downloadAttachment(id, type);
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Gagal membuka dokumen.');
    }
  }

  if (loading)
    return (
      <div className="p-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (!data)
    return (
      <div className="flex min-h-screen items-center justify-center text-error">
        Permohonan tidak ditemukan.
      </div>
    );

  const { request } = data;

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/dashboard/requests')}
        className="mb-6 flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" /> Kembali ke Permohonan
      </button>
      <div className="flex flex-col gap-gutter lg:flex-row">
        <div className="flex-grow space-y-6 lg:w-2/3">
          <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
            <span className="mb-2 inline-flex rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
              {request.token}
            </span>
            <h1 className="mb-1 font-display text-3xl font-bold text-primary">
              {request.tema_kunjungan}
            </h1>
            <p className="text-on-surface-variant">{request.nama_instansi}</p>
            <div className="mt-6 grid gap-4 border-t border-surface-alt pt-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-label-sm text-on-surface-variant">Tanggal Kunjungan</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-outline" /> {request.tanggal_kunjungan}{' '}
                  {request.jam_kunjungan}
                </p>
              </div>
              <div>
                <p className="mb-1 text-label-sm text-on-surface-variant">Status</p>
                <StatusBadge status={request.status} />
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
            <h2 className="mb-3 flex items-center gap-2 text-label-md font-bold">
              <FileText className="h-5 w-5" /> Detail Permohonan
            </h2>
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-label-sm text-on-surface-variant">Email</dt>
                <dd>{request.email}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Kontak Dihubungi</dt>
                <dd>{request.kontak_dihubungi}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Alamat Instansi</dt>
                <dd>{request.alamat_instansi}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Pimpinan Rombongan</dt>
                <dd>{request.pimpinan_rombongan}</dd>
              </div>
            </dl>
            <p className="mt-4 leading-relaxed text-on-surface-variant">{request.tema_kunjungan}</p>
          </section>
          <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
            <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
              <Users className="h-5 w-5" /> Daftar Tamu ({request.guests.length})
            </h2>
            <div className="space-y-3">
              {request.guests.map((guest) => (
                <div
                  key={`${guest.guest_order}-${guest.nama}`}
                  className="flex items-center gap-4 rounded-lg border border-surface-alt bg-surface p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container text-label-md text-on-surface-variant">
                    {guest.guest_order}
                  </div>
                  <div>
                    <p className="text-label-md font-bold">{guest.nama}</p>
                    <p className="text-sm text-on-surface-variant">{guest.jabatan}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
            <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
              <History className="h-5 w-5" /> Riwayat Audit
            </h2>
            <div className="ml-3 space-y-6 border-l border-surface-alt pb-2">
              {data.audit_events.map((event) => (
                <div key={event.id} className="pl-6">
                  <p className="text-label-md font-bold">{event.action}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {new Date(event.occurred_at).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-6 lg:w-1/3">
          <section className="sticky top-8 rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
            <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
              <Gavel className="h-5 w-5" /> Aksi Admin
            </h2>
            <div className="mb-6 flex items-center justify-between rounded border border-surface-alt bg-surface-container p-4">
              <span className="text-on-surface-variant">Status Saat Ini</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setConfirm('approved')}
                className="w-full rounded border border-primary bg-primary py-3 text-label-md text-on-primary"
              >
                Setujui Permohonan
              </button>
              <button
                type="button"
                onClick={() => setConfirm('rejected')}
                className="w-full rounded border border-surface-alt bg-surface-container-lowest py-3 text-label-md text-error"
              >
                Tolak Permohonan
              </button>
            </div>
          </section>
          <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
            <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
              <FileText className="h-5 w-5" /> Dokumen Terlampir
            </h2>
            {request.attachments.map((doc) => (
              <button
                key={doc.attachment_type}
                type="button"
                onClick={() => preview(doc.attachment_type)}
                title="Klik untuk pratinjau di tab baru"
                className="mb-3 flex w-full items-center justify-between gap-2 rounded border border-surface-alt p-3 text-left hover:bg-surface-container"
              >
                <span className="truncate">{doc.original_name}</span>
                <Eye className="h-5 w-5 shrink-0" />
              </button>
            ))}
          </section>
        </aside>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Apakah Anda yakin?"
          description="Status permohonan akan diperbarui."
          action={confirm === 'approved' ? 'Setujui' : 'Tolak'}
          onCancel={() => setConfirm(undefined)}
          onConfirm={handleStatus}
        />
      )}
    </>
  );
}
