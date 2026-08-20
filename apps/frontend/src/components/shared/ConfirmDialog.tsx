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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded border border-outline px-4 py-2 text-label-md cursor-pointer disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded bg-primary px-4 py-2 text-label-md text-on-primary cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : action}
          </button>
        </div>
      </div>
    </div>
  );
}
