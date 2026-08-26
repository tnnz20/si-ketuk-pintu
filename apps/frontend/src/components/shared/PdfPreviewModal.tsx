import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useEffect } from 'react';

interface PdfPreviewModalProps {
  open: boolean;
  filename: string;
  blobUrl?: string;
  onClose: () => void;
  onDownload?: () => void;
}

export default function PdfPreviewModal({
  open,
  filename,
  blobUrl,
  onClose,
  onDownload,
}: PdfPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-civic-dark/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="soft-shadow relative w-full max-w-lg space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-civic-border pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-civic-cardFill flex h-7 w-7 items-center justify-center rounded-lg text-civic-dark">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-extrabold text-civic-dark">Pratinjau Dokumen</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="hover:bg-civic-cardFill cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:text-civic-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="bg-civic-cardFill space-y-3 rounded-2xl border border-civic-border p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-civic-border bg-civic-surface text-civic-dark shadow-sm">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h5 className="text-sm font-bold break-all text-civic-dark">{filename}</h5>
            <p className="mt-1 text-xs text-civic-muted">Dokumen Lampiran Permohonan Kunjungan</p>
          </div>

          {blobUrl && (
            <div className="pt-2">
              <iframe
                src={blobUrl}
                title={filename}
                className="h-64 w-full rounded-xl border border-civic-border bg-white"
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-center gap-2.5 pt-3">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-civic-neutralFill inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Tab Baru</span>
              </a>
            )}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="hover:bg-civic-darkHover inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-civic-dark px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="hover:bg-civic-neutralFill cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
