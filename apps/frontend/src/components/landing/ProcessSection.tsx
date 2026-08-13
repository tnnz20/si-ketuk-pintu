import { motion, useReducedMotion } from 'motion/react';
import { Calendar, FileText, HelpCircle, ArrowRight, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeInUp, staggerContainer, scaleIn } from './animations';

const steps = [
  {
    icon: FileText,
    title: 'Ajukan Permohonan',
    desc: 'Isi formulir digital dengan data diri, tujuan kunjungan, dan jadwal yang diinginkan. Lampirkan dokumen pendukung jika diperlukan.',
    detail: 'Formulir online 24/7',
    color: 'emerald',
    size: 'large',
  },
  {
    icon: Calendar,
    title: 'Verifikasi & Persetujuan',
    desc: 'Tim administrasi memverifikasi permohonan Anda. Notifikasi dan token unik dikirim setelah disetujui.',
    detail: 'Proses 1-2 hari kerja',
    color: 'emerald',
    size: 'small',
  },
  {
    icon: HelpCircle,
    title: 'Kunjungan',
    desc: 'Tunjukkan token di resepsionis pada jadwal yang telah ditentukan untuk masuk tanpa antre.',
    detail: 'Check-in cepat',
    color: 'emerald',
    size: 'small',
  },
];

export default function ProcessSection() {
  const reduce = useReducedMotion();

  return (
    <section id="process" className="relative overflow-hidden border-y border-surface-alt bg-surface-container-low px-margin-mobile py-24 md:px-margin-desktop">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1a1c16_1px,transparent_0)] bg-size-[32px_32px]" />
      </div>

      <div className="relative mx-auto max-w-container-max">
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-16"
        >
          <motion.div variants={reduce ? undefined : fadeInUp} custom={0} className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-emerald-500" />
            <span className="font-label text-label-sm font-semibold uppercase tracking-wider text-emerald-600">Cara Kerja</span>
          </motion.div>
          <motion.h2 variants={reduce ? undefined : fadeInUp} custom={1} className="mb-4 max-w-2xl font-display text-headline-lg-mobile leading-tight text-on-surface md:text-headline-lg">
            Tiga Langkah Mudah Menuju Kunjungan yang Lancar
          </motion.h2>
          <motion.p variants={reduce ? undefined : fadeInUp} custom={2} className="max-w-xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Proses yang dirancang untuk kejelasan dan efisiensi, dari pengajuan hingga kunjungan selesai.
          </motion.p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Large cell - Submit */}
          <motion.div
            variants={reduce ? undefined : scaleIn}
            className="group relative overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 transition-all hover:shadow-[0_8px_32px_rgba(13,148,136,0.12)] md:row-span-2"
          >
            {/* Number watermark */}
            <div className="absolute -right-4 -top-4 select-none text-[120px] font-bold leading-none text-emerald-500/5 transition-transform duration-500 group-hover:scale-110 group-hover:text-emerald-500/8">
              01
            </div>

            <div className="relative">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15">
                <FileText className="h-7 w-7 text-emerald-600" />
              </div>

              <h3 className="mb-3 font-headline-md text-headline-md text-on-surface">{steps[0].title}</h3>
              <p className="mb-6 font-body-md text-body-md leading-relaxed text-on-surface-variant">{steps[0].desc}</p>

              {/* Mini form preview */}
              <div className="space-y-3 rounded-xl border border-surface-alt bg-surface p-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-label text-label-sm">Nama Lengkap</span>
                </div>
                <div className="h-10 rounded-lg bg-surface-container" />
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-label text-label-sm">Tujuan Kunjungan</span>
                </div>
                <div className="h-10 rounded-lg bg-surface-container" />
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-label text-label-sm">Tanggal & Waktu</span>
                </div>
                <div className="h-10 rounded-lg bg-surface-container" />
              </div>

              <div className="mt-6 flex items-center gap-2 text-emerald-600">
                <Clock className="h-4 w-4" />
                <span className="font-label text-label-sm font-medium">{steps[0].detail}</span>
              </div>
            </div>
          </motion.div>

          {/* Small cell - Review */}
          <motion.div
            variants={reduce ? undefined : scaleIn}
            className="group relative overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 transition-all hover:shadow-[0_8px_32px_rgba(13,148,136,0.12)]"
          >
            <div className="absolute -right-4 -top-4 select-none text-[100px] font-bold leading-none text-emerald-500/5 transition-transform duration-500 group-hover:scale-110 group-hover:text-emerald-500/8">
              02
            </div>

            <div className="relative">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15">
                <Calendar className="h-7 w-7 text-emerald-600" />
              </div>

              <h3 className="mb-3 font-headline-md text-headline-md text-on-surface">{steps[1].title}</h3>
              <p className="mb-6 font-body-md text-body-md leading-relaxed text-on-surface-variant">{steps[1].desc}</p>

              {/* Timeline visual */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="h-px flex-1 bg-surface-alt" />
                  <span className="font-label text-label-sm text-on-surface-variant">Verifikasi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="h-px flex-1 bg-surface-alt" />
                  <span className="font-label text-label-sm text-on-surface-variant">Persetujuan</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="h-px flex-1 bg-emerald-500/30" />
                  <span className="font-label text-label-sm font-medium text-emerald-600">Token Terbit</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-600">
                <Clock className="h-4 w-4" />
                <span className="font-label text-label-sm font-medium">{steps[1].detail}</span>
              </div>
            </div>
          </motion.div>

          {/* Small cell - Visit */}
          <motion.div
            variants={reduce ? undefined : scaleIn}
            className="group relative overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 transition-all hover:shadow-[0_8px_32px_rgba(13,148,136,0.12)]"
          >
            <div className="absolute -right-4 -top-4 select-none text-[100px] font-bold leading-none text-emerald-500/5 transition-transform duration-500 group-hover:scale-110 group-hover:text-emerald-500/8">
              03
            </div>

            <div className="relative">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15">
                <HelpCircle className="h-7 w-7 text-emerald-600" />
              </div>

              <h3 className="mb-3 font-headline-md text-headline-md text-on-surface">{steps[2].title}</h3>
              <p className="mb-6 font-body-md text-body-md leading-relaxed text-on-surface-variant">{steps[2].desc}</p>

              {/* Location visual */}
              <div className="mb-6 flex items-center gap-4 rounded-xl border border-surface-alt bg-surface p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <MapPin className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-label text-label-sm font-medium text-on-surface">Gedung Utama</p>
                  <p className="font-label text-label-sm text-on-surface-variant">Lantai 1, Resepsionis</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-label text-label-sm font-medium">{steps[2].detail}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA below grid */}
        <motion.div
          variants={reduce ? undefined : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={4}
          className="mt-12 flex justify-center"
        >
          <Link
            to="/submit"
            className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 font-label text-label-md font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98]"
          >
            Mulai Sekarang
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
