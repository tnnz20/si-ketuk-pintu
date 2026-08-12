import { z } from 'zod';

const MAX_PDF = 5 * 1024 * 1024;

const pdfFile = z.instanceof(File).refine(
  (file) => file.type === 'application/pdf',
  'File must be a PDF'
).refine(
  (file) => file.size <= MAX_PDF,
  'File must be 5MB or smaller'
);

export const visitRequestSchema = z.object({
  email: z.string().email('Email tidak valid'),
  nama_instansi: z.string().min(1, 'Nama instansi wajib diisi'),
  alamat_instansi: z.string().min(1, 'Alamat instansi wajib diisi'),
  tanggal_kunjungan: z.string().min(1, 'Tanggal kunjungan wajib diisi').refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(val) > today;
  }, 'Tanggal kunjungan harus di masa depan'),
  jam_kunjungan: z.string().min(1, 'Jam kunjungan wajib diisi').regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  tema_kunjungan: z.string().min(1, 'Tema kunjungan wajib diisi'),
  pimpinan_rombongan: z.string().min(1, 'Pimpinan rombongan wajib diisi'),
  jumlah_tamu: z.number().int().min(1, 'Jumlah tamu minimal 1'),
  kontak_dihubungi: z.string().min(1, 'Kontak wajib diisi'),
  guests: z.array(z.object({
    nama: z.string().min(1, 'Nama tamu wajib diisi'),
    jabatan: z.string().min(1, 'Jabatan tamu wajib diisi'),
  })).min(1, 'Minimal 1 tamu'),
  surat_kunjungan: pdfFile,
  surat_tugas: pdfFile,
});

export type VisitRequestInput = z.input<typeof visitRequestSchema>;
