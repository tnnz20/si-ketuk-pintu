import { useState } from 'react';
import { z } from 'zod';
import type { FormEvent } from 'react';
import Dialog from '@components/shared/Dialog';
import { Select } from '@components/shared/Select';

const schema = z.object({
  nomor: z.string().trim().min(1, 'Nomor wajib diisi.'),
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
    <Dialog open={open} title="Data Surat Persetujuan" description="Isi data sebelum membuat surat persetujuan." onClose={loading ? () => undefined : onCancel}>
      <form onSubmit={submit}>
        <label className="block text-label-md">Nomor
          <input value={nomor} onChange={(event) => setNomor(event.target.value)} className="mt-2 w-full rounded border border-outline px-3 py-2" disabled={loading} />
          {errors.nomor && <span className="mt-1 block text-sm text-error">{errors.nomor}</span>}
        </label>
        <label className="mt-4 block text-label-md">Sifat
          <Select value={sifat} onChange={(event) => setSifat(event.target.value)} className="mt-2 rounded border border-outline px-3 py-2" disabled={loading}><option value="">Pilih sifat</option><option>Biasa</option><option>Penting</option><option>Sangat Penting</option></Select>
          {errors.sifat && <span className="mt-1 block text-sm text-error">{errors.sifat}</span>}
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded border border-outline px-4 py-2 cursor-pointer disabled:cursor-not-allowed">Batal</button>
          <button type="submit" disabled={loading} className="rounded bg-primary px-4 py-2 text-on-primary cursor-pointer disabled:cursor-not-allowed">{loading ? 'Memproses...' : 'Buat Surat'}</button>
        </div>
      </form>
    </Dialog>
  );
}
