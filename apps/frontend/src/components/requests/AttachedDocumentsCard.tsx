import { Eye, Paperclip } from 'lucide-react';
import type { Attachment } from '@app-types/api';
import { attachmentLabels } from '@constants/attachments';
import type { VisitLetterAttachment } from '@app-types/api';

interface AttachedDocumentsCardProps {
  attachments: VisitLetterAttachment[];
  onPreview: (attachment: Attachment) => void;
}

export default function AttachedDocumentsCard({
  attachments,
  onPreview,
}: AttachedDocumentsCardProps) {
  return (
    <section className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Paperclip className="h-4 w-4 text-civic-muted" />
          <span>Dokumen Terlampir</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">{attachments.length} berkas</span>
      </div>

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="py-3 text-center text-xs text-civic-muted">Tidak ada berkas terlampir.</p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={`${attachment.id}-${attachment.attachment_type}`}
              className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3"
            >
              <div className="mr-2 min-w-0 truncate">
                <p className="text-2xs font-extrabold tracking-wider text-civic-muted uppercase">
                  {attachmentLabels[attachment.attachment_type]}
                </p>
                <p className="truncate text-xs font-bold text-civic-dark">
                  {attachment.original_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPreview(attachment)}
                aria-label={`Lihat ${attachment.original_name}`}
                title="Lihat Berkas"
                className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
