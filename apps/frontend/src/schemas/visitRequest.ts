import { z } from 'zod';
import { isFutureDate } from '@lib/dateTime';
import { TUJUAN_BAGIAN_OPTIONS, TUJUAN_INSTANSI_OPTIONS } from '@constants/destinations';

export const guestSchema = z.object({
  nama: z.string().min(1, 'Nama tamu wajib diisi'),
  jabatan: z.string().min(1, 'Jabatan tamu wajib diisi'),
});

const MAX_PDF = 5 * 1024 * 1024;

const pdfFile = z
  .instanceof(File)
  .refine((file) => file.type === 'application/pdf', 'File harus berformat PDF')
  .refine((file) => file.size <= MAX_PDF, 'File maksimal 5MB');

export const visitRequestBaseSchema = z.object({
  email: z.string().email('Email tidak valid').min(1, 'Email wajib diisi'),
  nama_instansi: z.string().min(1, 'Nama instansi wajib diisi'),
  alamat_instansi: z.string().min(1, 'Alamat instansi wajib diisi'),
  tujuan_instansi: z.enum(TUJUAN_INSTANSI_OPTIONS, 'Tujuan instansi wajib dipilih'),
  tujuan_bagian: z.string().min(1, 'Tujuan bagian wajib dipilih'),
  tanggal_kunjungan: z
    .string()
    .min(1, 'Tanggal kunjungan wajib diisi')
    .refine((val) => isFutureDate(val), 'Tanggal kunjungan harus di masa depan'),
  jam_kunjungan: z
    .string()
    .min(1, 'Jam kunjungan wajib diisi')
    .regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM (format 24 jam)'),
  tema_kunjungan: z.string().min(1, 'Tema kunjungan wajib diisi'),
  pimpinan_rombongan: z.string().min(1, 'Pimpinan rombongan wajib diisi'),
  jumlah_tamu: z.number().int().min(1, 'Jumlah tamu minimal 1'),
  kontak_dihubungi: z.string().min(1, 'Kontak wajib diisi'),
  guests: z.array(guestSchema).min(1, 'Minimal 1 tamu'),
  surat_kunjungan: pdfFile,
  surat_tugas: pdfFile,
});

// .pick() cannot be used on object schemas containing refinements, so the pair
// check is exported separately and applied via .check() where needed.
export const tujuanPairCheck = z.superRefine(
  (data: { tujuan_instansi: string; tujuan_bagian: string }, ctx) => {
    const bagianOptions =
      TUJUAN_BAGIAN_OPTIONS[data.tujuan_instansi as keyof typeof TUJUAN_BAGIAN_OPTIONS];
    if (data.tujuan_bagian && bagianOptions && !bagianOptions.includes(data.tujuan_bagian)) {
      ctx.addIssue({
        code: 'custom',
        path: ['tujuan_bagian'],
        message: 'Tujuan bagian tidak valid untuk instansi terpilih',
      });
    }
  },
);

export const visitRequestSchema = visitRequestBaseSchema.check(tujuanPairCheck);

export type VisitRequestInput = z.input<typeof visitRequestSchema>;
