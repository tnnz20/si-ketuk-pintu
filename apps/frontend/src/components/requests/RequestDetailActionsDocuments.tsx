import { Download, Eye, FileText, Gavel, Trash2 } from 'lucide-react';
import StatusBadge from '@components/shared/StatusBadge';
import type { Attachment, VisitRequest } from '@app-types/api';

type OriginalAttachmentType = Extract<Attachment['attachment_type'], 'surat_kunjungan' | 'surat_tugas'>;

interface RequestActionsDocumentsProps {
  request: VisitRequest;
  onStatusChange: (status: 'approved' | 'rejected') => void;
  onPreview: (type: OriginalAttachmentType) => void;
  onGeneratePdf: () => void;
  onApprovalGenerate: () => void;
  onApprovalDownload: () => void;
  onApprovalDelete: () => void;
  generating: boolean;
  approvalBusy: boolean;
}

export default function RequestActionsDocuments({
  request,
  onStatusChange,
  onPreview,
  onGeneratePdf,
  onApprovalGenerate,
  onApprovalDownload,
  onApprovalDelete,
  generating,
  approvalBusy,
}: RequestActionsDocumentsProps) {
  return (
    <aside className="space-y-6 lg:w-1/3">
      <section className="sticky top-8 rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
        <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
          <Gavel className="h-5 w-5" /> Aksi Admin
        </h2>
        <div className="mb-6 flex items-center justify-between rounded border border-surface-alt bg-surface-container p-4">
          <span className="text-on-surface-variant">Status Saat Ini</span>
          <StatusBadge status={request.status} />
        </div>
        {request.status === 'pending' && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onStatusChange('approved')}
              className="w-full rounded border border-primary bg-primary py-3 text-label-md text-on-primary cursor-pointer"
            >
              Setujui Permohonan
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('rejected')}
              className="w-full rounded border border-surface-alt bg-surface-container-lowest py-3 text-label-md text-error cursor-pointer"
            >
              Tolak Permohonan
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onGeneratePdf}
          disabled={generating}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-primary py-3 text-label-md text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-5 w-5" /> Unduh Surat Permohonan
        </button>
       </section>
       {request.status === 'approved' && (
         <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
           <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold"><FileText className="h-5 w-5" /> Surat Persetujuan</h2>
           {request.attachments.some((attachment) => attachment.attachment_type === 'surat_persetujuan') ? (
             <div className="flex gap-2">
               <button type="button" onClick={onApprovalDownload} disabled={approvalBusy} className="flex flex-1 items-center justify-center gap-2 rounded border border-primary py-3 text-primary cursor-pointer disabled:opacity-50"><Download className="h-5 w-5" /> Unduh</button>
               <button type="button" onClick={onApprovalDelete} disabled={approvalBusy} className="rounded border border-error px-3 text-error cursor-pointer disabled:opacity-50" title="Hapus surat persetujuan"><Trash2 className="h-5 w-5" /></button>
             </div>
           ) : (
             <button type="button" onClick={onApprovalGenerate} disabled={approvalBusy} className="w-full rounded border border-primary py-3 text-primary cursor-pointer disabled:opacity-50">Buat Surat Persetujuan</button>
           )}
         </section>
       )}
       <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
        <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
          <FileText className="h-5 w-5" /> Dokumen Terlampir
        </h2>
        {request.attachments.filter((doc) => doc.attachment_type !== 'surat_persetujuan').map((doc) => (
          <button
            key={doc.attachment_type}
            type="button"
            onClick={() => {
              if (doc.attachment_type !== 'surat_persetujuan') onPreview(doc.attachment_type);
            }}
            title="Klik untuk pratinjau di tab baru"
            className="mb-3 flex w-full items-center justify-between gap-2 rounded border border-surface-alt p-3 text-left hover:bg-surface-container cursor-pointer"
          >
            <span className="truncate">{doc.original_name}</span>
            <Eye className="h-5 w-5 shrink-0" />
          </button>
        ))}
      </section>
    </aside>
  );
}
