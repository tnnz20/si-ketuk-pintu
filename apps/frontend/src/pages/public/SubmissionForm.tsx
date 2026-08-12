import { Calendar, CheckCircle2, Send, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVisitRequest } from '../../lib/api/requests';

interface Guest {
  name: string;
  position: string;
}

export default function SubmissionForm() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([{ name: '', position: '' }]);
  const [files, setFiles] = useState<{ surat_kunjungan?: File; surat_tugas?: File }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addGuest = () => {
    setGuests([...guests, { name: '', position: '' }]);
  };

  const removeGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const updateGuest = (index: number, field: keyof Guest, value: string) => {
    setGuests(guests.map((guest, i) => i === index ? { ...guest, [field]: value } : guest));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!files.surat_kunjungan || !files.surat_tugas) {
      setError('Surat Kunjungan and Surat Tugas are required.');
      return;
    }
    if ([files.surat_kunjungan, files.surat_tugas].some((file) => file.size > 5 * 1024 * 1024)) {
      setError('Each PDF must be 5MB or smaller.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const result = await createVisitRequest({
        email: String(form.get('email')),
        nama_instansi: String(form.get('nama_instansi')),
        alamat_instansi: String(form.get('alamat_instansi')),
        tanggal_kunjungan: String(form.get('tanggal_kunjungan')),
        jam_kunjungan: String(form.get('jam_kunjungan')),
        tema_kunjungan: String(form.get('tema_kunjungan')),
        pimpinan_rombongan: String(form.get('pimpinan_rombongan')),
        jumlah_tamu: guests.length,
        kontak_dihubungi: String(form.get('kontak_dihubungi')),
        guests: guests.map(({ name, position }) => ({ nama: name, jabatan: position })),
        surat_kunjungan: files.surat_kunjungan,
        surat_tugas: files.surat_tugas,
      });
      navigate(`/success?token=${encodeURIComponent(result.token)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-16">
      <div className="mb-12">
        <h1 className="font-display text-display text-primary mb-2">Formulir Pengajuan Kunjungan</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Lengkapi detail di bawah ini untuk memulai proses pengajuan.</p>
      </div>
      <div className="flex flex-col gap-gutter lg:flex-row">
        <aside className="w-full lg:w-1/3">
          <div className="sticky top-28 rounded border border-surface-alt bg-surface-container-lowest p-8">
            <h2 className="font-headline-md text-headline-md mb-4 text-primary">Persyaratan Kunjungan</h2>
            <p className="mb-6 text-on-surface-variant">Silakan lengkapi form berikut untuk mengajukan permohonan kunjungan. Pastikan seluruh data yang dimasukkan akurat dan dokumen pendukung diunggah dalam format PDF.</p>
            <ul className="flex flex-col gap-4">
              {requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <strong className="block font-label-md text-label-md text-on-surface">{req.title}</strong>
                    <span className="text-sm text-on-surface-variant">{req.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="w-full lg:w-2/3">
          {error && <div className="mb-6 rounded bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
          <form onSubmit={submit} className="flex flex-col gap-8">
            {sections.map((section, idx) => (
              <section key={idx} className="rounded border border-surface-alt bg-surface-container-lowest p-8">
                <h3 className="mb-6 flex items-center gap-2 border-b border-outline-variant pb-2 font-headline-lg-mobile text-headline-lg-mobile">
                  {section.icon}
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.id} className={field.full ? 'md:col-span-2' : ''}>
                      <label htmlFor={field.id} className="mb-2 block font-label-md text-label-md text-on-surface">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea name={field.id} id={field.id} required className="w-full rounded border border-surface-alt bg-surface-container-lowest p-3 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" rows={3} />
                      ) : (
                        <input name={field.id} id={field.id} type={field.type} required className="w-full rounded border border-surface-alt bg-surface-container-lowest p-3 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <section className="rounded border border-surface-alt bg-surface-container-lowest p-8">
              <h3 className="mb-6 flex items-center gap-2 border-b border-outline-variant pb-2 font-headline-lg-mobile text-headline-lg-mobile">
                <CheckCircle2 className="h-5 w-5 text-primary-container" />
                Informasi Rombongan
              </h3>
              <div className="rounded border border-surface-alt bg-surface-container-low p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-label-md text-label-md">Daftar Nama Tamu</h4>
                  <button type="button" onClick={addGuest} className="rounded border border-outline px-3 py-2 font-label-md text-label-md hover:bg-surface-container">Tambah Tamu</button>
                </div>
                <div className="space-y-4">
                  {guests.map((guest, index) => (
                    <div key={index} className="grid gap-4 border-b border-outline-variant pb-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <label className="text-xs text-on-surface-variant">Nama Lengkap
                        <input value={guest.name} onChange={(event) => updateGuest(index, 'name', event.target.value)} className="mt-1 w-full rounded border border-surface-alt bg-white p-2 text-sm" />
                      </label>
                      <label className="text-xs text-on-surface-variant">Jabatan
                        <input value={guest.position} onChange={(event) => updateGuest(index, 'position', event.target.value)} className="mt-1 w-full rounded border border-surface-alt bg-white p-2 text-sm" />
                      </label>
                      <button type="button" onClick={() => removeGuest(index)} disabled={guests.length === 1} className="rounded px-3 py-2 text-error hover:bg-error-container disabled:opacity-40">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="rounded border border-surface-alt bg-surface-container-lowest p-8">
              <h3 className="mb-6 flex items-center gap-2 border-b border-outline-variant pb-2 font-headline-lg-mobile text-headline-lg-mobile">
                <Upload className="h-5 w-5 text-primary-container" />
                Unggah Dokumen
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {docs.map((doc, idx) => (
                    <div key={idx} className="group cursor-pointer rounded border-2 border-dashed border-outline-variant bg-surface p-6 text-center transition-colors hover:bg-surface-container-low">
                    <Upload className="mx-auto mb-2 h-12 w-12 text-outline group-hover:text-primary" />
                    <span className="block font-label-md text-label-md text-on-surface mb-1">{doc.title} (PDF)</span>
                    <span className="mb-4 block text-xs text-on-surface-variant">Maks 5MB</span>
                    <label className="rounded border border-outline px-4 py-1.5 text-sm transition-colors group-hover:border-primary group-hover:text-primary cursor-pointer">
                      Pilih File
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFiles({ ...files, [doc.key]: e.target.files?.[0] })}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
            <div className="mt-4 flex justify-end gap-4">
              <button type="button" onClick={() => {}} className="rounded border border-outline px-6 py-3 font-label-md text-label-md transition-colors hover:bg-surface-variant">Simpan Draft</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded bg-secondary px-8 py-3 font-label-md text-label-md font-bold text-primary transition-opacity hover:opacity-90 disabled:opacity-40">
                {isSubmitting ? 'Submitting...' : 'Ajukan Permohonan'} <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const requirements = [
  { title: 'Data Instansi', desc: 'Informasi lengkap terkait instansi pemohon.' },
  { title: 'Jadwal & Tujuan', desc: 'Tanggal, waktu, dan tema kunjungan.' },
  { title: 'Daftar Tamu', desc: 'Nama dan jabatan seluruh peserta rombongan.' },
  { title: 'Dokumen Resmi', desc: 'Surat Kunjungan dan Surat Tugas (Format PDF, Maks 5MB).' },
];

const sections = [
  {
    icon: <Upload className="h-5 w-5 text-primary-container" />,
    title: 'Informasi Instansi',
    fields: [
      { id: 'email', label: 'Email Aktif', type: 'email', full: false },
      { id: 'nama_instansi', label: 'Nama Instansi', type: 'text', full: false },
      { id: 'alamat_instansi', label: 'Alamat Instansi', type: 'textarea', full: true },
    ],
  },
  {
    icon: <Calendar className="h-5 w-5 text-primary-container" />,
    title: 'Detail Kunjungan',
    fields: [
      { id: 'tanggal_kunjungan', label: 'Tanggal Kunjungan', type: 'date', full: false },
      { id: 'jam_kunjungan', label: 'Jam Kunjungan', type: 'time', full: false },
      { id: 'tema_kunjungan', label: 'Tema / Tujuan Kunjungan', type: 'text', full: true },
      { id: 'pimpinan_rombongan', label: 'Pimpinan Rombongan', type: 'text', full: false },
      { id: 'kontak_dihubungi', label: 'Kontak (WhatsApp)', type: 'tel', full: false },
    ],
  },
];

const docs = [
  { title: 'Surat Kunjungan', key: 'surat_kunjungan' },
  { title: 'Surat Tugas', key: 'surat_tugas' },
];
