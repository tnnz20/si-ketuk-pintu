import { useState } from 'react';
import { z } from 'zod';
import type { FormEvent } from 'react';
import Dialog from '@components/shared/Dialog';
import { Select } from '@components/shared/Select';

const schema = z.object({
  nomor: z.string().trim().min(1, 'Nomor surat wajib diisi.'),
  sifat: z.enum(['Biasa', 'Penting', 'Sangat Penting']),
});

interface Props {
  open: boolean;
  loading: boolean;
  onSubmit: (input: { nomor: string; sifat: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ApprovalLetterDialog({ open, loading, onSubmit, onCancel }: Props) {
  const [nomor, setNomor] = useState('');
  const [sifat, setSifat] = useState('');
  const [errors, setErrors] = useState<{ nomor?: string; sifat?: string }>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = schema.safeParse({ nomor, sifat });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({ nomor: fieldErrors.nomor?.[0], sifat: fieldErrors.sifat?.[0] });
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  }

  return (
    <Dialog
      open={open}
      title="Buat Surat Persetujuan"
      description="Lengkapi nomor surat dan sifat berkas sebelum mengunduh PDF."
      onClose={loading ? () => undefined : onCancel}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-bold text-civic-dark">
          Nomor Surat
          <input
            value={nomor}
            onChange={(event) => setNomor(event.target.value)}
            placeholder="Misal: 005/123/DISP-SETDA/2026"
            className="mt-1.5 w-full rounded-2xl border border-civic-border bg-civic-cardFill px-3.5 py-2.5 text-xs text-civic-dark focus:outline-none focus:border-civic-dark transition-all"
            disabled={loading}
          />
          {errors.nomor && <span className="mt-1 block text-label-sm text-rose-600 font-semibold">{errors.nomor}</span>}
        </label>

        <label className="block text-xs font-bold text-civic-dark">
          Sifat Surat
          <Select
            value={sifat}
            onChange={(event) => setSifat(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-civic-border bg-civic-cardFill px-3.5 py-2.5 text-xs text-civic-dark focus:outline-none focus:border-civic-dark transition-all"
            disabled={loading}
          >
            <option value="">Pilih sifat surat</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Sangat Penting">Sangat Penting</option>
          </Select>
          {errors.sifat && <span className="mt-1 block text-label-sm text-rose-600 font-semibold">{errors.sifat}</span>}
        </label>

        <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-civic-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-civic-dark hover:bg-civic-darkHover px-4 py-2 text-xs font-extrabold text-white transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Buat Surat'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
