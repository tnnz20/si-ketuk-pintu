import { useRef, useState } from 'react';
import { FileWarning, Images, Upload } from 'lucide-react';
import Dialog from '@components/shared/Dialog';
import { uploadDocumentationImages } from '@lib/api/archives';

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB

interface DocumentationUploadDialogProps {
  requestId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentationUploadDialog({
  requestId,
  onClose,
  onSuccess,
}: DocumentationUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  function validate(selected: File[]): string {
    const invalidExtension = selected.find(
      (file) =>
        !ALLOWED_EXTENSIONS.includes(file.name.slice(file.name.lastIndexOf('.')).toLowerCase()),
    );
    if (invalidExtension) return `File "${invalidExtension.name}" bukan PNG/JPG/JPEG.`;

    const invalidMime = selected.find((file) => {
      const type = file.type.toLowerCase();
      return type !== '' && type !== 'image/png' && type !== 'image/jpeg';
    });
    if (invalidMime) return `File "${invalidMime.name}" memiliki tipe konten tidak valid.`;

    if (selected.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      return 'Total ukuran semua foto melebihi 10 MB.';
    }

    return '';
  }

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setError(validate(selected));
    setFiles(selected);
  }

  async function handleSubmit() {
    if (files.length === 0 || error) return;
    setBusy(true);
    try {
      await uploadDocumentationImages(requestId, files);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah dokumentasi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      title="Unggah Dokumentasi"
      description="Pilih satu atau beberapa foto (PNG/JPG/JPEG, total maksimal 10 MB)."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="hover:bg-civic-neutralFill cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || files.length === 0 || Boolean(error)}
            className="hover:bg-civic-darkHover inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-civic-dark px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {busy ? 'Mengunggah...' : 'Unggah'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          onChange={handleSelect}
          aria-label="Pilih foto dokumentasi"
          className="file:bg-civic-cardFill w-full cursor-pointer rounded-xl border border-civic-border bg-civic-surface p-2.5 text-xs text-civic-dark file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-civic-dark"
        />

        {error && (
          <p
            role="alert"
            className="flex items-start gap-1.5 rounded-xl bg-rose-50 p-2.5 text-2xs font-bold text-rose-700"
          >
            <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {files.length > 0 && !error && (
          <ul className="space-y-1.5" aria-label="Foto terpilih">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.size}`}
                className="bg-civic-cardFill flex items-center justify-between rounded-xl border border-civic-border px-3 py-2 text-2xs"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Images className="h-3.5 w-3.5 shrink-0 text-civic-muted" />
                  <span className="truncate font-bold text-civic-dark">{file.name}</span>
                </span>
                <span className="shrink-0 pl-2 text-civic-muted">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </li>
            ))}
            <li className="pt-1 text-right text-2xs font-bold text-civic-muted">
              Total: {(totalBytes / (1024 * 1024)).toFixed(2)} MB / 10 MB
            </li>
          </ul>
        )}
      </div>
    </Dialog>
  );
}
