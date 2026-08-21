import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import ApprovalLetterDialog from '@components/requests/ApprovalLetterDialog';
import LoadingOverlay from '@components/shared/LoadingOverlay';
import Skeleton from '@components/shared/Skeleton';
import RequestActionsDocuments from '@components/requests/RequestDetailActionsDocuments';
import RequestAuditHistory from '@components/requests/RequestDetailAuditHistory';
import RequestDetails from '@components/requests/RequestDetailDetails';
import RequestGuests from '@components/requests/RequestDetailGuests';
import RequestSummary from '@components/requests/RequestDetailSummary';
import { deleteApprovalLetter, downloadAttachment, getRequestById, updateStatus, uploadApprovalLetter } from '../../lib/api/requests';
import { generateApprovalLetterPdf } from '../../lib/pdf/approvalLetterPdf';
import { generateVisitRequestPdf } from '../../lib/pdf/visitRequestPdf';
import type { RequestDetailResponse } from '@app-types/api';

export default function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<'approved' | 'rejected'>();
  const [generating, setGenerating] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [deleteApprovalConfirm, setDeleteApprovalConfirm] = useState(false);

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

  async function preview(type: 'surat_kunjungan' | 'surat_tugas' | 'surat_persetujuan') {
    if (type === 'surat_persetujuan') return downloadApproval();
    if (!id) return;
    try {
      const blob = await downloadAttachment(id, type);
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Gagal membuka dokumen.');
    }
  }

  async function generateApproval(input: { nomor: string; sifat: string }) {
    if (!id || !data) return;
    setApprovalBusy(true);
    try {
      const blob = await generateApprovalLetterPdf(data.request, input);
      await uploadApprovalLetter(id, blob);
      setApprovalDialog(false);
      toast.success('Surat persetujuan berhasil dibuat.');
      load();
    } catch {
      toast.error('Gagal membuat surat persetujuan.');
    } finally {
      setApprovalBusy(false);
    }
  }

  async function downloadApproval() {
    if (!id) return;
    setApprovalBusy(true);
    try {
      const blob = await downloadAttachment(id, 'surat_persetujuan');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'surat_persetujuan.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh surat persetujuan.');
    } finally {
      setApprovalBusy(false);
    }
  }

  async function removeApproval() {
    if (!id) return;
    setDeleteApprovalConfirm(false);
    setApprovalBusy(true);
    try {
      await deleteApprovalLetter(id);
      toast.success('Surat persetujuan dihapus.');
      load();
    } catch {
      toast.error('Gagal menghapus surat persetujuan.');
    } finally {
      setApprovalBusy(false);
    }
  }

  function generatePdf() {
    if (generating || !data) return;
    setGenerating(true);
    try {
      generateVisitRequestPdf(data.request);
      toast.success('Surat permohonan berhasil diunduh.');
    } catch {
      toast.error('Gagal membuat surat permohonan.');
    } finally {
      setGenerating(false);
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
            onGeneratePdf={generatePdf}
            onApprovalGenerate={() => setApprovalDialog(true)}
            onApprovalDownload={downloadApproval}
            onApprovalDelete={() => setDeleteApprovalConfirm(true)}
            generating={generating}
            approvalBusy={approvalBusy}
          />
      </div>
      {(generating || approvalBusy) && <LoadingOverlay />}
      {approvalDialog && <ApprovalLetterDialog open loading={approvalBusy} onSubmit={generateApproval} onCancel={() => setApprovalDialog(false)} />}
      {deleteApprovalConfirm && (
        <ConfirmDialog
          title="Hapus surat persetujuan?"
          description="File surat persetujuan akan dihapus dari penyimpanan."
          action="Hapus"
          loading={approvalBusy}
          onCancel={() => setDeleteApprovalConfirm(false)}
          onConfirm={removeApproval}
        />
      )}
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
