import { useEffect, useState } from 'react';
import { ImagePlus, Images, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@components/shared/Empty';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import Dialog from '@components/shared/Dialog';
import DocumentationUploadDialog from '@components/archives/DocumentationUploadDialog';
import type { Attachment } from '@app-types/api';
import { deleteDocumentationImage, downloadArchiveAttachment } from '@lib/api/archives';

interface DocumentationCardProps {
  requestId: string;
  images: Attachment[];
  onChanged: () => void;
}

export default function DocumentationCard({
  requestId,
  images,
  onChanged,
}: DocumentationCardProps) {
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<Attachment>();
  const [confirmDelete, setConfirmDelete] = useState<Attachment>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const created: Record<number, string> = {};

    void Promise.all(
      images.map(async (image) => {
        try {
          const blob = await downloadArchiveAttachment(requestId, 'images', image.id);
          created[image.id] = URL.createObjectURL(blob);
        } catch {
          /* thumbnail unavailable; preview retries on click */
        }
      }),
    ).then(() => {
      if (cancelled) {
        Object.values(created).forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setUrls(created);
    });

    return () => {
      cancelled = true;
      Object.values(created).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images, requestId]);

  async function handleDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    setConfirmDelete(undefined);
    try {
      await deleteDocumentationImage(requestId, confirmDelete.id);
      toast.success('Foto dokumentasi dihapus.');
      onChanged();
    } catch {
      toast.error('Gagal menghapus foto dokumentasi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Images className="h-4 w-4" />
          Dokumentasi
        </h3>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="hover:bg-civic-darkHover inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-civic-dark px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Unggah
        </button>
      </div>

      {images.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Images />
            </EmptyMedia>
            <EmptyTitle>Belum ada dokumentasi</EmptyTitle>
            <EmptyDescription>
              Unggah foto dokumentasi kunjungan (PNG/JPG, total maksimal 10 MB).
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid grid-cols-3 gap-3" aria-label="Daftar foto dokumentasi">
          {images.map((image) => (
            <li key={image.id} className="group relative">
              <button
                type="button"
                onClick={() => setPreview(image)}
                className="bg-civic-cardFill block aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-civic-border focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-dark"
                aria-label={`Pratinjau ${image.original_name}`}
              >
                {urls[image.id] ? (
                  <img
                    src={urls[image.id]}
                    alt={image.original_name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xs text-civic-muted">
                    Memuat...
                  </span>
                )}
              </button>
              <p className="mt-1 truncate text-2xs text-civic-muted" title={image.original_name}>
                {image.original_name}
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(image)}
                aria-label={`Hapus ${image.original_name}`}
                className="absolute top-1 right-1 hidden cursor-pointer rounded-lg bg-white/90 p-1 text-rose-600 shadow transition-colors group-hover:block hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploadOpen && (
        <DocumentationUploadDialog
          requestId={requestId}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false);
            onChanged();
          }}
        />
      )}

      {preview && urls[preview.id] && (
        <Dialog
          open
          title="Pratinjau Dokumentasi"
          description={preview.original_name}
          onClose={() => setPreview(undefined)}
          footer={
            <a
              href={urls[preview.id]}
              download={preview.original_name}
              className="hover:bg-civic-darkHover cursor-pointer rounded-xl bg-civic-dark px-4 py-2 text-xs font-extrabold text-white transition-all"
            >
              Unduh
            </a>
          }
        >
          <img
            src={urls[preview.id]}
            alt={`Pratinjau ${preview.original_name}`}
            className="max-h-96 w-full rounded-xl border border-civic-border object-contain"
          />
        </Dialog>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus foto dokumentasi ini?"
          description={`File ${confirmDelete.original_name} akan dihapus permanen dari penyimpanan.`}
          action="Hapus"
          loading={busy}
          onCancel={() => setConfirmDelete(undefined)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
