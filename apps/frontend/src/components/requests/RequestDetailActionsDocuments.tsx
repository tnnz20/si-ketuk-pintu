import { Download, Eye, FileText, Gavel } from 'lucide-react';
import StatusBadge from '@components/shared/StatusBadge';
import type { Attachment, VisitRequest } from '@app-types/api';

interface RequestActionsDocumentsProps {
  request: VisitRequest;
  onStatusChange: (status: 'approved' | 'rejected') => void;
  onPreview: (type: Attachment['attachment_type']) => void;
  onGeneratePdf: () => void;
  generating: boolean;
}

export default function RequestActionsDocuments({
  request,
  onStatusChange,
  onPreview,
  onGeneratePdf,
  generating,
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
        <button
          type="button"
          onClick={onGeneratePdf}
          disabled={generating}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-primary py-3 text-label-md text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-5 w-5" /> Unduh Surat Permohonan
        </button>
      </section>
      <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
        <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
          <FileText className="h-5 w-5" /> Dokumen Terlampir
        </h2>
        {request.attachments.map((doc) => (
          <button
            key={doc.attachment_type}
            type="button"
            onClick={() => onPreview(doc.attachment_type)}
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
