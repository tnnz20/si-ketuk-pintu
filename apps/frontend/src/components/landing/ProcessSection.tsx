import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronDown, Clock, FileText, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeInUp, staggerContainer, scaleIn } from '@constants/animations';

const steps = [
  {
    icon: FileText,
    title: 'Ajukan Permohonan',
    desc: 'Isi formulir digital dengan data instansi, detail kunjungan, dan unggah dokumen pendukung yang diperlukan.',
    detail: 'Formulir online 24/7',
    detailIcon: Clock,
  },
  {
    icon: ShieldCheck,
    title: 'Verifikasi & Persetujuan',
    desc: 'Tim administrasi memverifikasi permohonan Anda. Token kunjungan dan kode QR dikirim setelah disetujui.',
    detail: 'Proses 1–2 hari kerja',
    detailIcon: Clock,
  },
  {
    icon: QrCode,
    title: 'Kunjungan',
    desc: 'Tunjukkan kode QR Anda di resepsionis pada jadwal yang telah ditentukan untuk masuk tanpa antre.',
    detail: 'Check-in cepat',
    detailIcon: Zap,
  },
];

export default function ProcessSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="process"
      className="relative overflow-hidden border-y border-surface-alt bg-surface-container-low px-margin-mobile py-24 md:px-margin-desktop"
    >
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1a1c16_1px,transparent_0)] bg-size-[32px_32px]" />
      </div>

      <div className="relative mx-auto max-w-container-max">
        {/* Header */}
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-16"
        >
          <motion.div
            variants={reduce ? undefined : fadeInUp}
            custom={0}
            className="mb-4 flex items-center gap-2"
          >
            <div className="h-px w-8 bg-emerald-500" />
            <span className="font-label text-label-sm font-semibold tracking-wider text-emerald-600 uppercase">
              Cara Kerja
            </span>
          </motion.div>
          <motion.h2
            variants={reduce ? undefined : fadeInUp}
            custom={1}
            className="text-headline-lg-mobile mb-4 max-w-2xl font-display leading-tight text-on-surface md:text-headline-lg"
          >
            Tiga Langkah Mudah Menuju Kunjungan yang Lancar
          </motion.h2>
          <motion.p
            variants={reduce ? undefined : fadeInUp}
            custom={2}
            className="font-body-md max-w-xl text-body-md leading-relaxed text-on-surface-variant"
          >
            Proses yang dirancang untuk kejelasan dan efisiensi, dari pengajuan hingga kunjungan
            selesai.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col">
              <motion.article
                variants={reduce ? undefined : scaleIn}
                className="group relative flex flex-1 flex-col rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_16px_40px_-16px_rgba(13,148,136,0.25)]"
              >
                {/* Icon + number */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-colors duration-300 group-hover:bg-emerald-500/15">
                    <step.icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <span className="font-display text-5xl leading-none font-bold text-surface-alt transition-colors duration-300 select-none group-hover:text-emerald-500/30">
                    0{i + 1}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mb-3 font-headline-md text-headline-md text-on-surface">
                  {step.title}
                </h3>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                  {step.desc}
                </p>

                {/* Detail */}
                <div className="mt-6 flex items-center gap-2 border-t border-surface-alt pt-5 text-emerald-600">
                  <step.detailIcon className="h-4 w-4" />
                  <span className="font-label text-label-sm font-medium">{step.detail}</span>
                </div>

                {/* Connector arrow — desktop */}
                {i < steps.length - 1 && (
                  <div aria-hidden className="absolute top-11 -right-7 z-10 hidden md:block">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/25 bg-surface-container-lowest shadow-sm">
                      <ArrowRight className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                )}
              </motion.article>

              {/* Connector arrow — mobile */}
              {i < steps.length - 1 && (
                <div aria-hidden className="flex justify-center pt-6 md:hidden">
                  <ChevronDown className="h-5 w-5 text-emerald-500/60" />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
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
