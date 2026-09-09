import { ClipboardList, Eye, FileText } from 'lucide-react';
import type { Attachment } from '@app-types/api';
import EmptyAttachmentState from '@components/requests/EmptyAttachmentState';

interface AttendanceCardProps {
  attachment?: Attachment;
  onPreview: (attachment: Attachment) => void;
}

export default function AttendanceCard({ attachment, onPreview }: AttendanceCardProps) {
  return (
    <section className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <ClipboardList className="h-4 w-4 text-civic-muted" />
          <span>Daftar Absen</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">
          {attachment ? '1 berkas' : '0 berkas'}
        </span>
      </div>

      {attachment ? (
        <div className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3.5">
          <div className="mr-2 flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-civic-dark">
              <FileText className="h-5 w-5" />
            </div>
            <span className="truncate text-xs font-bold text-civic-dark">
              {attachment.original_name}
            </span>
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
      ) : (
        <EmptyAttachmentState
          icon="clipboard"
          title="Belum ada daftar absen"
          description="Daftar absen kunjungan belum tersedia."
        />
      )}
    </section>
  );
}
