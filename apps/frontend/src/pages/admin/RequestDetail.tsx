import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import Skeleton from '@components/shared/Skeleton';
import RequestActionsDocuments from '@components/requests/RequestDetailActionsDocuments';
import RequestAuditHistory from '@components/requests/RequestDetailAuditHistory';
import RequestDetails from '@components/requests/RequestDetailDetails';
import RequestGuests from '@components/requests/RequestDetailGuests';
import RequestSummary from '@components/requests/RequestDetailSummary';
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
        className="mb-6 flex items-center gap-2 text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
      >
        <ArrowLeft className="h-5 w-5" /> Kembali ke Permohonan
      </button>
      <div className="flex flex-col gap-gutter lg:flex-row">
        <div className="grow space-y-6 lg:w-2/3">
          <RequestSummary request={request} />
          <RequestDetails request={request} />
          <RequestGuests guests={request.guests} />
          <RequestAuditHistory events={data.audit_events} />
        </div>
        <RequestActionsDocuments
          request={request}
          onStatusChange={setConfirm}
          onPreview={preview}
        />
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
