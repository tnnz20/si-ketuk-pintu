import { useState } from 'react';
import { ClipboardList, Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import Dialog from '@components/shared/Dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@components/shared/Empty';
import type { Attachment } from '@app-types/api';
import { formatBytes } from '@lib/formatBytes';
import { deleteDaftarAbsen, downloadArchiveAttachment, uploadDaftarAbsen } from '@lib/api/archives';

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

interface DaftarAbsenCardProps {
  requestId: string;
  attachment?: Attachment;
  onChanged: () => void;
}

export default function DaftarAbsenCard({
  requestId,
  attachment,
  onChanged,
}: DaftarAbsenCardProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleUpload(file: File) {
    setBusy(true);
    try {
      await uploadDaftarAbsen(requestId, file);
      toast.success('Daftar absen berhasil diunggah.');
      setUploadOpen(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah daftar absen.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    try {
      const blob = await downloadArchiveAttachment(
        requestId,
        'daftar_absen',
        (attachment as Attachment).id,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment?.original_name || 'daftar_absen.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh daftar absen.');
    }
  }

  async function handleDelete() {
    setBusy(true);
    setConfirmDelete(false);
    try {
      await deleteDaftarAbsen(requestId);
      toast.success('Daftar absen dihapus.');
      onChanged();
    } catch {
      toast.error('Gagal menghapus daftar absen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <ClipboardList className="h-4 w-4" />
          Daftar Absen
        </h3>
        {!attachment && (
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            disabled={busy}
            className="hover:bg-civic-darkHover inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-civic-dark px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Unggah
          </button>
        )}
      </div>

      {attachment ? (
        <div className="space-y-3">
          <div className="bg-civic-cardFill flex items-center gap-3 rounded-2xl border border-civic-border p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-civic-dark">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-civic-dark">
                {attachment.original_name}
              </p>
              <p className="text-2xs text-civic-muted">
                PDF &middot; {formatBytes(attachment.size_bytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="hover:bg-civic-neutralFill inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Hapus daftar absen"
              className="hover:bg-civic-neutralFill inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>Belum ada daftar absen</EmptyTitle>
            <EmptyDescription>Unggah satu file PDF daftar absen (maksimal 5 MB).</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {uploadOpen && (
        <DaftarAbsenUploadDialog
          busy={busy}
          onClose={() => setUploadOpen(false)}
          onSubmit={handleUpload}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus daftar absen?"
          description="File daftar absen akan dihapus permanen dari penyimpanan."
          action="Hapus"
          loading={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

interface DaftarAbsenUploadDialogProps {
  busy: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

function DaftarAbsenUploadDialog({ busy, onClose, onSubmit }: DaftarAbsenUploadDialogProps) {
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const extension = selected.name.slice(selected.name.lastIndexOf('.')).toLowerCase();
    const invalidType = selected.type !== '' && selected.type !== 'application/pdf';
    if (extension !== '.pdf' || invalidType) {
      setError('File harus berformat PDF.');
      setFile(undefined);
      return;
    }
    if (selected.size > MAX_PDF_BYTES) {
      setError('Ukuran file melebihi 5 MB.');
      setFile(undefined);
      return;
    }

    setError('');
    setFile(selected);
  }

  return (
    <Dialog
      open
      title="Unggah Daftar Absen"
      description="Satu file PDF saja, ukuran maksimal 5 MB."
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
            onClick={() => file && onSubmit(file)}
            disabled={busy || !file || Boolean(error)}
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
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleSelect}
          aria-label="Pilih file daftar absen"
          className="file:bg-civic-cardFill w-full cursor-pointer rounded-xl border border-civic-border bg-civic-surface p-2.5 text-xs text-civic-dark file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-civic-dark"
        />

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-2.5 text-2xs font-bold text-rose-700">
            {error}
          </p>
        )}

        {file && !error && (
          <p className="bg-civic-cardFill rounded-xl border border-civic-border px-3 py-2 text-2xs font-bold text-civic-dark">
            {file.name} &middot; {formatBytes(file.size)}
          </p>
        )}
      </div>
    </Dialog>
  );
}
