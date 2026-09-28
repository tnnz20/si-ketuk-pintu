import { Eye, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Attachment } from '@/types/api';
import { attachmentLabels } from '@/constants/attachments';
import type { VisitLetterAttachment } from '@/types/api';

interface AttachedDocumentsCardProps {
  attachments: VisitLetterAttachment[];
  onPreview: (attachment: Attachment) => void;
}

export default function AttachedDocumentsCard({
  attachments,
  onPreview,
}: AttachedDocumentsCardProps) {
  return (
    <Card className="space-y-3.5 p-6">
      <CardHeader className="flex flex-row items-center justify-between border-b border-civic-border p-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Paperclip className="h-4 w-4 text-civic-muted" />
          <span>Dokumen Terlampir</span>
        </CardTitle>
        <span className="text-xs font-medium text-civic-muted">{attachments.length} berkas</span>
      </CardHeader>

      <CardContent className="space-y-2 p-0">
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
      </CardContent>
    </Card>
  );
}
