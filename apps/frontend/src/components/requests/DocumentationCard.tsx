import { Eye, Images } from 'lucide-react';
import type { Attachment } from '@app-types/api';
import EmptyAttachmentState from '@components/requests/EmptyAttachmentState';

interface DocumentationCardProps {
  images: Attachment[];
  onPreview: (attachment: Attachment) => void;
}

export default function DocumentationCard({ images, onPreview }: DocumentationCardProps) {
  return (
    <section className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Images className="h-4 w-4 text-civic-muted" />
          <span>Dokumentasi</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">{images.length} berkas</span>
      </div>

      {images.length === 0 ? (
        <EmptyAttachmentState
          icon="images"
          title="Belum ada dokumentasi"
          description="Dokumentasi kunjungan belum tersedia."
        />
      ) : (
        <div className="space-y-2">
          {images.map((image) => (
            <div
              key={`${image.id}-${image.attachment_type}`}
              className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3"
            >
              <div className="mr-2 flex min-w-0 items-center gap-2">
                <Images className="h-4 w-4 shrink-0 text-civic-muted" />
                <span className="truncate text-xs font-bold text-civic-dark">
                  {image.original_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onPreview(image)}
                aria-label={`Lihat ${image.original_name}`}
                title="Lihat Berkas"
                className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
