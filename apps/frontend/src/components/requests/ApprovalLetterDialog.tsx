import { useState } from 'react';
import { z } from 'zod';
import type { FormEvent } from 'react';
import Dialog from '@/components/shared/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  nomor: z.string().trim().min(1, 'Nomor surat wajib diisi.'),
  sifat: z.enum(['Biasa', 'Penting', 'Sangat Penting'], 'Sifat surat wajib dipilih.'),
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
        <div className="space-y-1.5">
          <Label htmlFor="nomor-surat" className="text-xs font-bold text-civic-dark">
            Nomor Surat
          </Label>
          <Input
            id="nomor-surat"
            value={nomor}
            onChange={(event) => setNomor(event.target.value)}
            placeholder="Misal: 005/123/DISP-SETDA/2026"
            className="bg-civic-cardFill"
            disabled={loading}
          />
          {errors.nomor && (
            <span className="mt-1 block text-label-sm font-semibold text-rose-600">
              {errors.nomor}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-civic-dark">Sifat Surat</Label>
          <Select
            value={sifat || null}
            onValueChange={(val) => setSifat(val ?? '')}
            disabled={loading}
          >
            <SelectTrigger className="bg-civic-cardFill">
              <SelectValue placeholder="Pilih sifat surat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Biasa">Biasa</SelectItem>
              <SelectItem value="Penting">Penting</SelectItem>
              <SelectItem value="Sangat Penting">Sangat Penting</SelectItem>
            </SelectContent>
          </Select>
          {errors.sifat && (
            <span className="mt-1 block text-label-sm font-semibold text-rose-600">
              {errors.sifat}
            </span>
          )}
        </div>

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
