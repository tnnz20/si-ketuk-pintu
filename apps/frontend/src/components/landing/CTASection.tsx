import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeInUp, scaleIn } from '@constants/animations';

export default function CTASection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-surface px-margin-mobile py-24 md:px-margin-desktop">
      {/* Animated gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-1/4 -left-1/4 h-150 w-150 rounded-full bg-emerald-500/5 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.2, 1], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-1/4 -bottom-1/4 h-150 w-150 rounded-full bg-emerald-500/5 blur-3xl"
          animate={reduce ? undefined : { scale: [1.2, 1, 1.2], opacity: [0.08, 0.05, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          variants={reduce ? undefined : scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="font-label text-label-sm text-emerald-700">
            Layanan Resmi Terpercaya
          </span>
        </motion.div>

        <motion.h2
          variants={reduce ? undefined : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={1}
          className="text-headline-lg-mobile mb-6 font-display leading-tight text-on-surface md:text-[40px] md:leading-[1.15]"
        >
          Siap Mengajukan Kunjungan Anda?
        </motion.h2>

        <motion.p
          variants={reduce ? undefined : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={2}
          className="font-body-lg mx-auto mb-10 max-w-xl text-body-lg leading-relaxed text-on-surface-variant"
        >
          Proses pengajuan hanya membutuhkan waktu 5 menit. Dapatkan token kunjungan Anda hari ini.
        </motion.p>

        <motion.div
          variants={reduce ? undefined : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={3}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            to="/submit"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-10 py-5 font-label text-label-md font-semibold text-white transition-all hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98]"
          >
            <span className="relative z-10">Ajukan Sekarang</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            <motion.div
              className="absolute inset-0 rounded-xl bg-emerald-600"
              animate={reduce ? undefined : { scale: [1, 1.05, 1], opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </Link>
        </motion.div>

        <motion.p
          variants={reduce ? undefined : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={4}
          className="mt-8 font-label text-label-sm text-on-surface-variant"
        >
          Tanpa biaya pendaftaran &middot; Proses 100% online &middot; Data terenkripsi
        </motion.p>
      </div>
    </section>
  );
}
