import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export default function Dialog({ open, title, description, children, footer, onClose }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-civic-dark/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="soft-shadow animate-fade-in relative w-full max-w-md space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
        <div className="flex items-center justify-between border-b border-civic-border pb-3">
          <div>
            <h2 id="dialog-title" className="text-base font-extrabold text-civic-dark">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs font-medium text-civic-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="hover:bg-civic-cardFill cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:text-civic-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-civic-dark">{children}</div>
        {footer && (
          <div className="mt-5 flex justify-end gap-2.5 border-t border-civic-border pt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
