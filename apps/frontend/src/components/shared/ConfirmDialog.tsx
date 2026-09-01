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
      <div className="soft-shadow animate-fade-in relative w-full max-w-md space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
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
              <p className="mt-0.5 text-xs font-medium text-civic-muted">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup dialog"
            className="hover:bg-civic-cardFill cursor-pointer rounded-xl p-1 text-civic-muted transition-colors hover:text-civic-dark disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-civic-border pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="hover:bg-civic-neutralFill cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-extrabold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isDestructive
                ? 'bg-civic-rejectedBg text-civic-rejectedText border border-rose-200 hover:bg-rose-100'
                : 'hover:bg-civic-darkHover bg-civic-dark text-white'
            }`}
          >
            {loading ? 'Memproses...' : action}
          </button>
        </div>
      </div>
    </div>
  );
}
