import { useState } from 'react';
import { z } from 'zod';
import type { FormEvent } from 'react';
import Dialog from '@components/shared/Dialog';
import { Select } from '@components/shared/Select';
import { TimePicker } from '@components/submission/TimePicker';

const schema = z.object({
  nomor: z.string().trim().min(1, 'Nomor wajib diisi.'),
  sifat: z.enum(['Biasa', 'Penting', 'Sangat Penting']),
  tanggal_kunjungan: z.string().min(1, 'Tanggal wajib diisi.'),
  jam_kunjungan: z.string().min(1, 'Jam wajib diisi.'),
});

interface Props {
  open: boolean;
  loading: boolean;
  onSubmit: (input: z.infer<typeof schema>) => Promise<void>;
  onCancel: () => void;
}

export default function RescheduleDialog({ open, loading, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    nomor: '',
    sifat: '',
    tanggal_kunjungan: '',
    jam_kunjungan: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  }

  return (
    <Dialog
      open={open}
      title="Penjadwalan Ulang (Reschedule)"
      description="Lengkapi tanggal & jam baru beserta data surat perubahan jadwal."
      onClose={loading ? () => undefined : onCancel}
    >
      <form onSubmit={submit} className="space-y-3.5">
        <label className="block text-xs font-bold text-civic-dark">
          Nomor Surat
          <input
            type="text"
            value={form.nomor}
            onChange={(e) => update('nomor', e.target.value)}
            disabled={loading}
            placeholder="Misal: 005/124/DISP-SETDA/2026"
            className="bg-civic-cardFill mt-1.5 w-full rounded-2xl border border-civic-border px-3.5 py-2.5 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
          />
          {errors.nomor && (
            <span className="mt-1 block text-label-sm font-semibold text-rose-600">
              {errors.nomor}
            </span>
          )}
        </label>

        <label className="block text-xs font-bold text-civic-dark">
          Tanggal Kunjungan Baru
          <input
            type="date"
            value={form.tanggal_kunjungan}
            onChange={(e) => update('tanggal_kunjungan', e.target.value)}
            disabled={loading}
            className="bg-civic-cardFill mt-1.5 w-full rounded-2xl border border-civic-border px-3.5 py-2.5 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
          />
          {errors.tanggal_kunjungan && (
            <span className="mt-1 block text-label-sm font-semibold text-rose-600">
              {errors.tanggal_kunjungan}
            </span>
          )}
        </label>

        <div className="block text-xs font-bold text-civic-dark">
          <span>Jam Kunjungan Baru</span>
          <div className="mt-1.5">
            <TimePicker
              value={form.jam_kunjungan}
              onChange={(value) => update('jam_kunjungan', value)}
            />
          </div>
          {errors.jam_kunjungan && (
            <span className="mt-1 block text-label-sm font-semibold text-rose-600">
              {errors.jam_kunjungan}
            </span>
          )}
        </div>

        <label className="block text-xs font-bold text-civic-dark">
          Sifat Surat
          <Select
            value={form.sifat}
            onChange={(e) => update('sifat', e.target.value)}
            disabled={loading}
            className="bg-civic-cardFill mt-1.5 w-full rounded-2xl border border-civic-border px-3.5 py-2.5 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
          >
            <option value="">Pilih sifat surat</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Sangat Penting">Sangat Penting</option>
          </Select>
          {errors.sifat && (
            <span className="mt-1 block text-label-sm font-semibold text-rose-600">
              {errors.sifat}
            </span>
          )}
        </label>

        <div className="mt-6 flex justify-end gap-2.5 border-t border-civic-border pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="hover:bg-civic-neutralFill cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="hover:bg-civic-darkHover cursor-pointer rounded-xl bg-civic-dark px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Buat Surat'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
