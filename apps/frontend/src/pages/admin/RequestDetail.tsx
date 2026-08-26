import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import ApprovalLetterDialog from '@components/requests/ApprovalLetterDialog';
import RescheduleDialog from '@components/requests/RescheduleDialog';
import LoadingOverlay from '@components/shared/LoadingOverlay';
import PdfPreviewModal from '@components/shared/PdfPreviewModal';
import Skeleton from '@components/shared/Skeleton';
import RequestActionsDocuments from '@components/requests/RequestDetailActionsDocuments';
import RequestAuditHistory from '@components/requests/RequestDetailAuditHistory';
import RequestDetails from '@components/requests/RequestDetailDetails';
import RequestGuests from '@components/requests/RequestDetailGuests';
import RequestSummary from '@components/requests/RequestDetailSummary';
import {
  deleteApprovalLetter,
  deleteRescheduleLetter,
  downloadAttachment,
  getRequestById,
  rescheduleRequest,
  updateStatus,
  uploadApprovalLetter,
  uploadRescheduleLetter,
} from '../../lib/api/requests';
import { generateApprovalLetterPdf } from '../../lib/pdf/approvalLetterPdf';
import { generateRescheduleLetterPdf } from '../../lib/pdf/rescheduleLetterPdf';
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
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [deleteRescheduleConfirm, setDeleteRescheduleConfirm] = useState(false);

  // PDF Preview State
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    filename: string;
    blobUrl?: string;
  }>({ open: false, filename: '' });

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
      toast.success(
        confirm === 'approved'
          ? 'Permohonan berhasil DISETUJUI!'
          : 'Permohonan telah DITOLAK.',
      );
      setConfirm(undefined);
      load();
    } catch {
      toast.error('Gagal memperbarui status permohonan.');
    }
  }

  async function previewAttachment(
    type: 'surat_kunjungan' | 'surat_tugas' | 'surat_persetujuan' | 'surat_reschedule',
    filename: string,
  ) {
    if (!id) return;
    try {
      const blob = await downloadAttachment(id, type);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewModal({
        open: true,
        filename,
        blobUrl,
      });
    } catch {
      toast.error('Gagal membuka dokumen.');
    }
  }

  function closePreviewModal() {
    if (previewModal.blobUrl) {
      URL.revokeObjectURL(previewModal.blobUrl);
    }
    setPreviewModal({ open: false, filename: '' });
  }

  async function downloadCurrentPreview() {
    if (!previewModal.blobUrl) return;
    const link = document.createElement('a');
    link.href = previewModal.blobUrl;
    link.download = previewModal.filename || 'dokumen.pdf';
    link.click();
    toast.success('Mengunduh dokumen...');
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

  async function generateReschedule(input: {
    nomor: string;
    sifat: string;
    tanggal_kunjungan: string;
    jam_kunjungan: string;
  }) {
    if (!id || !data) return;
    setApprovalBusy(true);
    const oldSchedule = {
      tanggal_kunjungan: data.request.tanggal_kunjungan,
      jam_kunjungan: data.request.jam_kunjungan,
    };
    try {
      const blob = await generateRescheduleLetterPdf(data.request, oldSchedule, input, {
        nomor: input.nomor,
        sifat: input.sifat,
      });
      await rescheduleRequest(id, {
        tanggal_kunjungan: input.tanggal_kunjungan,
        jam_kunjungan: input.jam_kunjungan,
      });
      await uploadRescheduleLetter(id, blob);
      setRescheduleDialog(false);
      toast.success('Surat reschedule berhasil dibuat & jadwal diperbarui.');
      load();
    } catch {
      toast.error('Gagal membuat surat reschedule.');
    } finally {
      setApprovalBusy(false);
    }
  }

  async function downloadReschedule() {
    if (!id) return;
    setApprovalBusy(true);
    try {
      const blob = await downloadAttachment(id, 'surat_reschedule');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'surat_reschedule.pdf';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Surat reschedule berhasil diunduh.');
    } catch {
      toast.error('Gagal mengunduh surat reschedule.');
    } finally {
      setApprovalBusy(false);
    }
  }

  async function removeReschedule() {
    if (!id) return;
    setDeleteRescheduleConfirm(false);
    setApprovalBusy(true);
    try {
      await deleteRescheduleLetter(id);
      toast.success('Surat reschedule dihapus.');
      load();
    } catch {
      toast.error('Gagal menghapus surat reschedule.');
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
      toast.success('Surat persetujuan berhasil diunduh.');
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
      toast.success('Surat permohonan berhasil dibuat & diunduh.');
    } catch {
      toast.error('Gagal membuat surat permohonan.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-4 space-y-5">
            <Skeleton className="h-60 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-civic-surface rounded-3xl border border-civic-border soft-shadow text-center space-y-3">
        <p className="text-sm font-bold text-rose-600">Permohonan tidak ditemukan atau telah dihapus.</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/requests')}
          className="bg-civic-dark text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Kembali ke Permohonan
        </button>
      </div>
    );
  }

  const { request } = data;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Navigation Breadcrumb & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/requests')}
          className="inline-flex items-center gap-2 text-xs font-bold text-civic-dark hover:opacity-80 bg-civic-surface px-3.5 py-2 rounded-xl border border-civic-border soft-shadow transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Permohonan</span>
        </button>

        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-civic-neutralFill text-civic-dark border border-civic-border/70 font-mono w-fit">
          ID Ref: {request.token}
        </span>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (Span 8): Primary Data & Documents */}
        <div className="lg:col-span-8 space-y-5">
          <RequestSummary request={request} />
          <RequestDetails request={request} />
          <RequestGuests guests={request.guests || []} />
          <RequestAuditHistory events={data.audit_events || []} />
        </div>

        {/* RIGHT COLUMN (Span 4): Admin Actions, Attached Docs & Mini Calendar */}
        <div className="lg:col-span-4 space-y-5">
          <RequestActionsDocuments
            request={request}
            onStatusChange={setConfirm}
            onPreview={previewAttachment}
            onGeneratePdf={generatePdf}
            onApprovalGenerate={() => setApprovalDialog(true)}
            onApprovalDownload={downloadApproval}
            onApprovalDelete={() => setDeleteApprovalConfirm(true)}
            onRescheduleGenerate={() => setRescheduleDialog(true)}
            onRescheduleDownload={downloadReschedule}
            onRescheduleDelete={() => setDeleteRescheduleConfirm(true)}
            generating={generating}
            approvalBusy={approvalBusy}
          />
        </div>
      </div>

      {/* Overlays & Modals */}
      {(generating || approvalBusy) && <LoadingOverlay />}

      {/* PDF Document Preview Modal */}
      <PdfPreviewModal
        open={previewModal.open}
        filename={previewModal.filename}
        blobUrl={previewModal.blobUrl}
        onClose={closePreviewModal}
        onDownload={downloadCurrentPreview}
      />

      {/* Approval Letter Dialog */}
      {approvalDialog && (
        <ApprovalLetterDialog
          open
          loading={approvalBusy}
          onSubmit={generateApproval}
          onCancel={() => setApprovalDialog(false)}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog && (
        <RescheduleDialog
          open
          loading={approvalBusy}
          onSubmit={generateReschedule}
          onCancel={() => setRescheduleDialog(false)}
        />
      )}

      {/* Delete Reschedule Confirm */}
      {deleteRescheduleConfirm && (
        <ConfirmDialog
          title="Hapus surat reschedule?"
          description="File surat reschedule akan dihapus permanen dari penyimpanan."
          action="Hapus"
          loading={approvalBusy}
          onCancel={() => setDeleteRescheduleConfirm(false)}
          onConfirm={removeReschedule}
        />
      )}

      {/* Delete Approval Letter Confirm */}
      {deleteApprovalConfirm && (
        <ConfirmDialog
          title="Hapus surat persetujuan?"
          description="File surat persetujuan akan dihapus permanen dari penyimpanan."
          action="Hapus"
          loading={approvalBusy}
          onCancel={() => setDeleteApprovalConfirm(false)}
          onConfirm={removeApproval}
        />
      )}

      {/* Status Update Confirm */}
      {confirm && (
        <ConfirmDialog
          title={
            confirm === 'approved'
              ? 'Setujui permohonan kunjungan ini?'
              : 'Tolak permohonan kunjungan ini?'
          }
          description={`Status permohonan ${request.token} (${request.nama_instansi}) akan diubah menjadi ${
            confirm === 'approved' ? 'Disetujui' : 'Ditolak'
          }.`}
          action={confirm === 'approved' ? 'Setujui' : 'Tolak'}
          onCancel={() => setConfirm(undefined)}
          onConfirm={handleStatus}
        />
      )}
    </div>
  );
}
