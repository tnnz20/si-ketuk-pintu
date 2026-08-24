import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  title: string;
  description: string;
  action: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  action,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel]);

  const isDestructive =
    action.toLowerCase().includes('hapus') ||
    action.toLowerCase().includes('tolak') ||
    action.toLowerCase().includes('keluar') ||
    action.toLowerCase().includes('delete') ||
    action.toLowerCase().includes('reject');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-civic-dark/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-civic-border bg-civic-surface p-6 soft-shadow space-y-4 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                isDestructive
                  ? 'bg-civic-rejectedBg text-civic-rejectedText'
                  : 'bg-civic-cardFill text-civic-dark'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-civic-dark">{title}</h2>
              <p className="mt-0.5 text-xs text-civic-muted font-medium">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup dialog"
            className="rounded-xl p-1 text-civic-muted transition-colors hover:bg-civic-cardFill hover:text-civic-dark cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-civic-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all hover:bg-civic-neutralFill cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-sm ${
              isDestructive
                ? 'bg-civic-rejectedBg text-civic-rejectedText border border-rose-200 hover:bg-rose-100'
                : 'bg-civic-dark text-white hover:bg-civic-darkHover'
            }`}
          >
            {loading ? 'Memproses...' : action}
          </button>
        </div>
      </div>
    </div>
  );
}
