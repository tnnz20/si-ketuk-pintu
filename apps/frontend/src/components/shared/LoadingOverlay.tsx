import { LoaderCircle } from 'lucide-react';

type LoadingOverlayProps = {
  label?: string;
};

export default function LoadingOverlay({ label = 'Membuat dokumen PDF...' }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest px-5 py-4 text-on-surface shadow-lg">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
