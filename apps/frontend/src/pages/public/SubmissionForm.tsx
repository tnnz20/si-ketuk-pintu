import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Landmark,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { fadeInUp, staggerContainer } from '../../components/landing/animations';
import { Select } from '../../components/shared/Select';
import { createVisitRequest } from '../../lib/api/requests';
import { guestSchema, visitRequestSchema } from '../../schemas/visitRequest';

interface Guest {
  name: string;
  position: string;
}

type FormData = {
  email: string;
  nama_instansi: string;
  alamat_instansi: string;
  tanggal_kunjungan: string;
  jam_kunjungan: string;
  tema_kunjungan: string;
  pimpinan_rombongan: string;
  kontak_dihubungi: string;
};

const initialFormData: FormData = {
  email: '',
  nama_instansi: '',
  alamat_instansi: '',
  tanggal_kunjungan: '',
  jam_kunjungan: '',
  tema_kunjungan: '',
  pimpinan_rombongan: '',
  kontak_dihubungi: '',
};

const STEPS = [
  { id: 1, title: 'Instansi', icon: Building2 },
  { id: 2, title: 'Kunjungan', icon: Calendar },
  { id: 3, title: 'Tamu', icon: Users },
  { id: 4, title: 'Dokumen', icon: FileText },
];

export default function SubmissionForm() {
  const navigate = useNavigate();
  const reduce = useReducedMotion() ?? false;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [guests, setGuests] = useState<Guest[]>([{ name: '', position: '' }]);
  const [files, setFiles] = useState<{ surat_kunjungan?: File; surat_tugas?: File }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    instansi: true,
    kunjungan: true,
  });

  const updateField = (field: keyof FormData, value: string) => {
    setError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const addGuest = () => {
    setGuests([...guests, { name: '', position: '' }]);
  };

  const removeGuest = (index: number) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  const updateGuest = (index: number, field: keyof Guest, value: string) => {
    setError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`guests.${index}.${field === 'name' ? 'nama' : 'jabatan'}`];
      return next;
    });
    setGuests(guests.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest)));
  };

  const handleFileChange = (key: 'surat_kunjungan' | 'surat_tugas', file: File | undefined) => {
    setError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const validateStep = (step: number): boolean => {
    let schema: z.ZodType | null;
    let payload: unknown;
    switch (step) {
      case 1:
        schema = visitRequestSchema.pick({
          email: true,
          nama_instansi: true,
          alamat_instansi: true,
        });
        payload = formData;
        break;
      case 2:
        schema = visitRequestSchema.pick({
          tanggal_kunjungan: true,
          jam_kunjungan: true,
          tema_kunjungan: true,
          pimpinan_rombongan: true,
          kontak_dihubungi: true,
        });
        payload = formData;
        break;
      case 3:
        schema = z.object({
          guests: z.array(guestSchema).min(1, 'Minimal 1 tamu'),
        });
        payload = { guests: guests.map((g) => ({ nama: g.name, jabatan: g.position })) };
        break;
      case 4:
        schema = null;
        payload = null;
        break;
      default:
        schema = null;
        payload = null;
    }

    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        const next: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.map((p) => String(p)).join('.');
          if (!next[path]) next[path] = issue.message;
        });
        setFieldErrors(next);
        toast.error('Periksa kembali isian Anda sebelum melanjutkan.');
        return false;
      }
    }

    if (step === 4) {
      const fileErrors: Record<string, string> = {};
      if (!files.surat_kunjungan) fileErrors.surat_kunjungan = 'Surat Kunjungan wajib diunggah.';
      else if (files.surat_kunjungan.size > 5 * 1024 * 1024)
        fileErrors.surat_kunjungan = 'File maksimal 5MB.';
      if (!files.surat_tugas) fileErrors.surat_tugas = 'Surat Tugas wajib diunggah.';
      else if (files.surat_tugas.size > 5 * 1024 * 1024)
        fileErrors.surat_tugas = 'File maksimal 5MB.';
      if (Object.keys(fileErrors).length > 0) {
        setFieldErrors(fileErrors);
        toast.error('Periksa kembali isian Anda sebelum melanjutkan.');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    setError('');
    if (validateStep(currentStep)) {
      setFieldErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const submit = async () => {
    if (!validateStep(4)) {
      setError('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const result = await createVisitRequest({
        email: formData.email,
        nama_instansi: formData.nama_instansi,
        alamat_instansi: formData.alamat_instansi,
        tanggal_kunjungan: formData.tanggal_kunjungan,
        jam_kunjungan: formData.jam_kunjungan,
        tema_kunjungan: formData.tema_kunjungan,
        pimpinan_rombongan: formData.pimpinan_rombongan,
        jumlah_tamu: guests.length,
        kontak_dihubungi: formData.kontak_dihubungi,
        guests: guests.map(({ name, position }) => ({ nama: name, jabatan: position })),
        surat_kunjungan: files.surat_kunjungan!,
        surat_tugas: files.surat_tugas!,
      });
      navigate(`/success?token=${encodeURIComponent(result.token)}`);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : 'Pengajuan gagal. Silakan coba lagi.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-surface-alt bg-surface">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/5"
            animate={reduce ? undefined : { y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-emerald-500/3"
            animate={reduce ? undefined : { y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
          <motion.div
            variants={reduce ? undefined : fadeInUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-8"
          >
            <Link
              to="/"
              className="group mb-6 inline-flex items-center gap-2 font-label text-label-sm text-on-surface-variant transition-colors hover:text-emerald-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Kembali ke Beranda
            </Link>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span className="font-label text-label-sm text-emerald-700">
                    Formulir Pengajuan Online
                  </span>
                </div>
                <h1 className="text-headline-lg-mobile font-display leading-tight text-on-surface md:text-[40px] md:leading-[1.15]">
                  Ajukan Permohonan
                  <br />
                  <span className="text-emerald-600">Kunjungan Resmi</span>
                </h1>
                <p className="font-body-lg mt-4 max-w-lg text-body-lg text-on-surface-variant">
                  Lengkapi formulir berikut untuk mengajukan permohonan kunjungan. Proses hanya
                  membutuhkan 5 menit.
                </p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-label text-label-sm text-on-surface-variant">Langkah</p>
                  <p className="font-display text-2xl font-bold text-on-surface">
                    {currentStep} <span className="text-lg text-on-surface-variant">/ 4</span>
                  </p>
                </div>
                <div className="relative h-16 w-16">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-surface-alt"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progress}, 100`}
                      className="text-emerald-600 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-label text-label-sm font-bold text-emerald-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step indicators */}
          <motion.div
            variants={reduce ? undefined : fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="flex items-center gap-2 overflow-x-auto pb-2 md:gap-4"
          >
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                    disabled={currentStep <= step.id}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                        : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                          : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                    <span className="font-label text-label-sm font-medium whitespace-nowrap">
                      {step.title}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-px w-8 md:w-12 ${isCompleted ? 'bg-emerald-500' : 'bg-surface-alt'}`}
                    />
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Form Content */}
      <section className="px-margin-mobile py-12 md:px-margin-desktop">
        <div className="mx-auto max-w-4xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error-container px-4 py-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error/10">
                <span className="text-sm font-bold text-error">!</span>
              </div>
              <p className="font-body-md text-body-md text-on-error-container">{error}</p>
            </motion.div>
          )}

          <motion.div
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Step 1: Informasi Instansi */}
            {currentStep === 1 && (
              <motion.div variants={reduce ? undefined : fadeInUp} custom={0} className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => toggleSection('instansi')}
                    className="flex w-full items-center justify-between border-b border-surface-alt bg-surface-container-low px-6 py-4 transition-colors hover:bg-surface-container"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          Informasi Instansi
                        </h3>
                        <p className="font-label text-label-sm text-on-surface-variant">
                          Data resmi instansi pemohon
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-on-surface-variant transition-transform ${expandedSections.instansi ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedSections.instansi && (
                    <div className="grid gap-6 p-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <Mail className="h-4 w-4 text-emerald-600" />
                          Email Aktif
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="email@instansi.go.id"
                          className="font-body-md w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.email && (
                          <p className="font-label text-label-sm text-error">{fieldErrors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="nama_instansi"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <Landmark className="h-4 w-4 text-emerald-600" />
                          Nama Instansi
                        </label>
                        <input
                          id="nama_instansi"
                          type="text"
                          value={formData.nama_instansi}
                          onChange={(e) => updateField('nama_instansi', e.target.value)}
                          placeholder="Nama lengkap instansi"
                          className="font-body-md w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.nama_instansi && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.nama_instansi}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label
                          htmlFor="alamat_instansi"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          Alamat Instansi
                        </label>
                        <textarea
                          id="alamat_instansi"
                          value={formData.alamat_instansi}
                          onChange={(e) => updateField('alamat_instansi', e.target.value)}
                          placeholder="Alamat lengkap instansi"
                          rows={3}
                          className="font-body-md w-full resize-none rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.alamat_instansi && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.alamat_instansi}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Detail Kunjungan */}
            {currentStep === 2 && (
              <motion.div variants={reduce ? undefined : fadeInUp} custom={0} className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => toggleSection('kunjungan')}
                    className="flex w-full items-center justify-between border-b border-surface-alt bg-surface-container-low px-6 py-4 transition-colors hover:bg-surface-container"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          Detail Kunjungan
                        </h3>
                        <p className="font-label text-label-sm text-on-surface-variant">
                          Jadwal dan tujuan kunjungan
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-on-surface-variant transition-transform ${expandedSections.kunjungan ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedSections.kunjungan && (
                    <div className="grid gap-6 p-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor="tanggal_kunjungan"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          Tanggal Kunjungan
                        </label>
                        <input
                          id="tanggal_kunjungan"
                          type="date"
                          value={formData.tanggal_kunjungan}
                          onChange={(e) => updateField('tanggal_kunjungan', e.target.value)}
                          className="font-body-md w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.tanggal_kunjungan && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.tanggal_kunjungan}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="jam_kunjungan"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <Clock className="h-4 w-4 text-emerald-600" />
                          Jam Kunjungan
                        </label>
                        <TimePicker
                          value={formData.jam_kunjungan}
                          onChange={(value) => updateField('jam_kunjungan', value)}
                        />
                        {fieldErrors.jam_kunjungan && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.jam_kunjungan}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label
                          htmlFor="tema_kunjungan"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <FileText className="h-4 w-4 text-emerald-600" />
                          Tema / Tujuan Kunjungan
                        </label>
                        <input
                          id="tema_kunjungan"
                          type="text"
                          value={formData.tema_kunjungan}
                          onChange={(e) => updateField('tema_kunjungan', e.target.value)}
                          placeholder="Contoh: Studi banding pengelolaan data"
                          className="font-body-md w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.tema_kunjungan && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.tema_kunjungan}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="pimpinan_rombongan"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <User className="h-4 w-4 text-emerald-600" />
                          Pimpinan Rombongan
                        </label>
                        <input
                          id="pimpinan_rombongan"
                          type="text"
                          value={formData.pimpinan_rombongan}
                          onChange={(e) => updateField('pimpinan_rombongan', e.target.value)}
                          placeholder="Nama pimpinan rombongan"
                          className="font-body-md w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.pimpinan_rombongan && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.pimpinan_rombongan}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="kontak_dihubungi"
                          className="flex items-center gap-2 font-label text-label-sm font-medium text-on-surface"
                        >
                          <Phone className="h-4 w-4 text-emerald-600" />
                          Kontak (WhatsApp)
                        </label>
                        <input
                          id="kontak_dihubungi"
                          type="tel"
                          value={formData.kontak_dihubungi}
                          onChange={(e) => updateField('kontak_dihubungi', e.target.value)}
                          placeholder="08xx-xxxx-xxxx"
                          className="font-body-md w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        {fieldErrors.kontak_dihubungi && (
                          <p className="font-label text-label-sm text-error">
                            {fieldErrors.kontak_dihubungi}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Daftar Tamu */}
            {currentStep === 3 && (
              <motion.div variants={reduce ? undefined : fadeInUp} custom={0} className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest">
                  <div className="flex items-center justify-between border-b border-surface-alt bg-surface-container-low px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          Daftar Tamu
                        </h3>
                        <p className="font-label text-label-sm text-on-surface-variant">
                          {guests.length} tamu terdaftar
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addGuest}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-label text-label-sm font-medium text-white transition-all hover:bg-emerald-700 hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Tamu
                    </button>
                  </div>

                  <div className="space-y-4 p-6">
                    {guests.map((guest, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-xl border border-surface-alt bg-surface p-4 transition-all hover:border-emerald-500/30 hover:shadow-md"
                      >
                        <div className="absolute -top-4 -right-4 text-[60px] leading-none font-bold text-emerald-500/5 transition-transform duration-500 select-none group-hover:scale-110 group-hover:text-emerald-500/10">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="relative grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <div className="space-y-2">
                            <label className="font-label text-label-sm font-medium text-on-surface-variant">
                              Nama Lengkap
                            </label>
                            <input
                              value={guest.name}
                              onChange={(e) => updateGuest(index, 'name', e.target.value)}
                              placeholder="Nama lengkap tamu"
                              className="font-body-md w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            />
                            {fieldErrors[`guests.${index}.nama`] && (
                              <p className="font-label text-label-sm text-error">
                                {fieldErrors[`guests.${index}.nama`]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="font-label text-label-sm font-medium text-on-surface-variant">
                              Jabatan
                            </label>
                            <input
                              value={guest.position}
                              onChange={(e) => updateGuest(index, 'position', e.target.value)}
                              placeholder="Jabatan dalam instansi"
                              className="font-body-md w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-body-md transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            />
                            {fieldErrors[`guests.${index}.jabatan`] && (
                              <p className="font-label text-label-sm text-error">
                                {fieldErrors[`guests.${index}.jabatan`]}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGuest(index)}
                            disabled={guests.length === 1}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-error/20 text-error transition-all hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {guests.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low py-12">
                        <Users className="mb-4 h-12 w-12 text-on-surface-variant/50" />
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          Belum ada tamu terdaftar
                        </p>
                        <button
                          type="button"
                          onClick={addGuest}
                          className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-label text-label-sm font-medium text-white transition-all hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4" />
                          Tambah Tamu Pertama
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Unggah Dokumen */}
            {currentStep === 4 && (
              <motion.div variants={reduce ? undefined : fadeInUp} custom={0} className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest">
                  <div className="border-b border-surface-alt bg-surface-container-low px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                        <Upload className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          Unggah Dokumen
                        </h3>
                        <p className="font-label text-label-sm text-on-surface-variant">
                          Surat Kunjungan dan Surat Tugas (PDF, Maks 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 md:grid-cols-2">
                    {/* Surat Kunjungan */}
                    <FileUploadCard
                      title="Surat Kunjungan"
                      description="Surat resmi dari instansi pemohon"
                      file={files.surat_kunjungan}
                      error={fieldErrors.surat_kunjungan}
                      onFileChange={(file) => handleFileChange('surat_kunjungan', file)}
                      reduce={reduce}
                    />

                    {/* Surat Tugas */}
                    <FileUploadCard
                      title="Surat Tugas"
                      description="Surat tugas untuk pimpinan rombongan"
                      file={files.surat_tugas}
                      error={fieldErrors.surat_tugas}
                      onFileChange={(file) => handleFileChange('surat_tugas', file)}
                      reduce={reduce}
                    />
                  </div>

                  {/* Info box */}
                  <div className="border-t border-surface-alt bg-emerald-500/5 px-6 py-4">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-label text-label-sm font-medium text-emerald-700">
                          Dokumen Anda aman dan terenkripsi
                        </p>
                        <p className="font-body-md mt-1 text-body-md text-emerald-700/80">
                          File yang diunggah hanya akan digunakan untuk keperluan verifikasi
                          kunjungan dan tidak akan dibagikan ke pihak ketiga.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <motion.div
              variants={reduce ? undefined : fadeInUp}
              custom={1}
              className="flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:justify-between"
            >
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center justify-center gap-2 rounded-xl border border-outline px-6 py-3.5 font-label text-label-md font-medium text-on-surface transition-all hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 font-label text-label-md font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98]"
                >
                  Selanjutnya
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={isSubmitting}
                  className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-8 py-3.5 font-label text-label-md font-semibold text-white transition-all hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <span>Ajukan Permohonan</span>
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Side info panel - only visible on desktop */}
      <aside className="fixed right-8 bottom-8 hidden max-w-xs rounded-2xl border border-surface-alt bg-surface-container-lowest p-4 shadow-lg xl:block">
        <h4 className="mb-3 font-headline-md text-headline-md text-on-surface">Butuh Bantuan?</h4>
        <p className="font-body-md mb-4 text-body-md text-on-surface-variant">
          Jika Anda mengalami kesulitan dalam mengisi formulir, silakan hubungi tim dukungan kami.
        </p>
        <a
          href="mailto:support@siketukpintu.go.id"
          className="flex items-center gap-2 font-label text-label-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          <Mail className="h-4 w-4" />
          support@siketukpintu.go.id
        </a>
      </aside>
    </div>
  );
}

// File Upload Card Component
function FileUploadCard({
  title,
  description,
  file,
  error,
  onFileChange,
  reduce,
}: {
  title: string;
  description: string;
  file?: File;
  error?: string;
  onFileChange: (file: File | undefined) => void;
  reduce: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileChange(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0]);
  };

  return (
    <motion.div
      animate={reduce ? undefined : { scale: isDragging ? 1.02 : 1 }}
      className={`group relative overflow-hidden rounded-xl border-2 border-dashed transition-all ${
        isDragging
          ? 'border-emerald-500 bg-emerald-500/10'
          : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-outline-variant bg-surface hover:border-emerald-500/30 hover:bg-surface-container-low'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center p-6 text-center">
        {file ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <button
              type="button"
              onClick={() =>
                window.open(URL.createObjectURL(file), '_blank', 'noopener,noreferrer')
              }
              title="Klik untuk pratinjau di tab baru"
              className="mb-1 max-w-full truncate font-label text-label-md font-medium text-emerald-700 underline decoration-emerald-500/30 underline-offset-2 transition-colors hover:decoration-emerald-700"
            >
              {file.name}
            </button>
            <p className="mb-4 font-label text-label-sm text-on-surface-variant">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={() => onFileChange(undefined)}
              className="font-label text-label-sm text-error underline decoration-error/30 underline-offset-2 transition-colors hover:decoration-error"
            >
              Hapus file
            </button>
          </>
        ) : (
          <>
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                isDragging
                  ? 'bg-emerald-500/20'
                  : 'bg-surface-container group-hover:bg-emerald-500/10'
              }`}
            >
              <Upload
                className={`h-8 w-8 transition-colors ${isDragging ? 'text-emerald-600' : 'text-on-surface-variant group-hover:text-emerald-600'}`}
              />
            </div>
            <p className="mb-1 font-label text-label-md font-medium text-on-surface">{title}</p>
            <p className="mb-2 font-label text-label-sm text-on-surface-variant">{description}</p>
            <p className="mb-4 font-label text-label-sm text-on-surface-variant/70">
              PDF, maksimal 5MB
            </p>
            <label className="cursor-pointer rounded-lg border border-outline bg-surface px-4 py-2 font-label text-label-sm font-medium text-on-surface transition-all hover:border-emerald-500 hover:text-emerald-600">
              Pilih File
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            {error && <p className="mt-3 font-label text-label-sm text-error">{error}</p>}
          </>
        )}
        {error && file && <p className="mt-3 font-label text-label-sm text-error">{error}</p>}
      </div>
    </motion.div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function TimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hour, minute] = value.split(':');

  return (
    <div className="flex items-center gap-2">
      <Select
        value={hour || ''}
        onChange={(e) => onChange(`${e.target.value}:${minute ?? '00'}`)}
        aria-label="Jam"
        wrapperClassName="flex-1"
        className="font-body-md rounded-xl border border-outline-variant bg-surface pl-4 py-3 text-body-md transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      >
        <option value="" disabled>
          Jam
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
      <span className="font-body-md text-on-surface-variant">:</span>
      <Select
        value={minute || ''}
        onChange={(e) => onChange(`${hour ?? '00'}:${e.target.value}`)}
        aria-label="Menit"
        wrapperClassName="flex-1"
        className="font-body-md rounded-xl border border-outline-variant bg-surface pl-4 py-3 text-body-md transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      >
        <option value="" disabled>
          Menit
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
