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

interface Props { open: boolean; loading: boolean; onSubmit: (input: z.infer<typeof schema>) => Promise<void>; onCancel: () => void }
export default function RescheduleDialog({ open, loading, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({ nomor: '', sifat: '', tanggal_kunjungan: '', jam_kunjungan: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent) { event.preventDefault(); const result = schema.safeParse(form); if (!result.success) { const next: Record<string, string> = {}; for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message; setErrors(next); return; } setErrors({}); await onSubmit(result.data); }
  return <Dialog open={open} title="Penjadwalan Ulang" description="Isi data surat dan jadwal baru." onClose={loading ? () => undefined : onCancel}>
    <form onSubmit={submit} className="space-y-4">
      {([['nomor', 'Nomor', 'text'], ['tanggal_kunjungan', 'Tanggal Baru', 'date']] as const).map(([key, label, type]) => <label key={key} className="block text-label-md">{label}<input type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} disabled={loading} className="mt-2 w-full rounded border border-outline px-3 py-2" />{errors[key] && <span className="text-sm text-error">{errors[key]}</span>}</label>)}
      <label className="block text-label-md">Jam Baru<TimePicker value={form.jam_kunjungan} onChange={(value) => update('jam_kunjungan', value)} />{errors.jam_kunjungan && <span className="text-sm text-error">{errors.jam_kunjungan}</span>}</label>
      <label className="block text-label-md">Sifat<Select value={form.sifat} onChange={(event) => update('sifat', event.target.value)} disabled={loading} className="mt-2 rounded border border-outline px-3 py-2"><option value="">Pilih sifat</option><option>Biasa</option><option>Penting</option><option>Sangat Penting</option></Select>{errors.sifat && <span className="text-sm text-error">{errors.sifat}</span>}</label>
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} disabled={loading} className="rounded border border-outline px-4 py-2">Batal</button><button type="submit" disabled={loading} className="rounded bg-primary px-4 py-2 text-on-primary">{loading ? 'Memproses...' : 'Buat Surat'}</button></div>
    </form>
  </Dialog>;
}
