import { Download, FileText, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import type { Attachment } from '@app-types/api';
import { downloadAttachment } from '@lib/api/requests';

type DocumentAttachmentType = Exclude<Attachment['attachment_type'], 'images' | 'daftar_absen'>;

interface AttachedDocumentsCardProps {
  requestId: string;
  attachments: Attachment[];
}

export default function AttachedDocumentsCard({
  requestId,
  attachments,
}: AttachedDocumentsCardProps) {
  const documents = attachments.filter(
    (attachment): attachment is Attachment & { attachment_type: DocumentAttachmentType } =>
      attachment.attachment_type !== 'images' && attachment.attachment_type !== 'daftar_absen',
  );

  async function download(document: Attachment) {
    try {
      const blob = await downloadAttachment(
        requestId,
        document.attachment_type as DocumentAttachmentType,
      );
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh dokumen.');
    }
  }

  return (
    <div className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Paperclip className="h-4 w-4 text-civic-muted" />
          <span>Dokumen Terlampir</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">{documents.length} File</span>
      </div>
      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="py-3 text-center text-xs text-civic-muted">Tidak ada file terlampir.</p>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3"
            >
              <div className="mr-2 flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0 text-civic-muted" />
                <span className="truncate text-xs font-bold text-civic-dark">
                  {document.original_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void download(document)}
                aria-label={`Unduh ${document.original_name}`}
                className="cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
