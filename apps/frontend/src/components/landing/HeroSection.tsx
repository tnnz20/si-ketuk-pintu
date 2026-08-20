import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2, Copy, QrCode, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { wordReveal, fadeInUp } from '@constants/animations';
import { useMouseTilt } from '../../hooks/useMousePosition';

const headlineWords = ['Sistem', 'Permohonan', 'Kunjungan', 'Tamu'];

export default function HeroSection() {
  const reduce = useReducedMotion();
  const { rotateX, rotateY, handleMouseMove, handleMouseLeave } = useMouseTilt();
  const [copied, setCopied] = useState(false);

  const sampleToken = 'SKP-2026-0812-XY7K';
  const copyToken = () => {
    navigator.clipboard.writeText(sampleToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-[calc(100dvh-80px)] overflow-hidden border-b border-surface-alt bg-background">
      {/* Animated grain texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')] absolute inset-0" />
      </div>

      {/* Floating geometric shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
        <motion.div
          className="absolute right-1/4 bottom-20 h-32 w-32 rotate-45 border border-emerald-500/10"
          animate={reduce ? undefined : { rotate: [45, 90, 45], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-container-max items-center gap-12 px-margin-mobile py-16 md:grid-cols-[1.2fr_1fr] md:px-margin-desktop md:py-0">
        {/* Content */}
        <div className="flex flex-col justify-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-label text-label-sm text-emerald-700">
              Portal Resmi Pemerintah
            </span>
          </motion.div>

          {/* Headline with word stagger */}
          <h1 className="text-headline-lg-mobile font-display leading-[1.1] tracking-tight text-on-surface md:text-[56px] md:leading-[1.05]">
            {headlineWords.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                variants={reduce ? undefined : wordReveal}
                initial="hidden"
                animate="visible"
                className="inline-block"
              >
                {word}
                {i < headlineWords.length - 1 && '\u00A0'}
              </motion.span>
            ))}
            <br />
            <motion.span
              custom={headlineWords.length}
              variants={reduce ? undefined : wordReveal}
              initial="hidden"
              animate="visible"
              className="inline-block text-emerald-600"
            >
              (Si Ketuk Pintu)
            </motion.span>
          </h1>

          {/* Subtext */}
          <motion.p
            variants={reduce ? undefined : fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="font-body-lg mt-6 max-w-lg text-body-lg leading-relaxed text-on-surface-variant"
          >
            Proses kunjungan resmi yang transparan, aman, dan efisien. Ajukan permohonan, pantau
            status, dan kunjungi instansi pemerintah dengan mudah.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={reduce ? undefined : fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Link
              to="/submit"
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-8 py-4 font-label text-label-md text-white transition-all hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98]"
            >
              <span className="relative z-10">Ajukan Kunjungan</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Link>
            <a
              href="#status"
              className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-8 py-4 font-label text-label-md text-on-surface transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 active:scale-[0.98]"
            >
              <QrCode className="h-4 w-4" />
              Cek Status
            </a>
          </motion.div>
        </div>

        {/* Interactive Token Card */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 40, rotateY: -10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="hidden items-center justify-center md:flex"
        >
          <motion.div
            style={{ rotateX, rotateY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-full max-w-sm cursor-pointer select-none"
          >
            {/* Card glow */}
            <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-2xl" />

            {/* Card */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-surface-container-lowest to-surface-container p-8 shadow-[0_8px_32px_rgba(13,148,136,0.12)]">
              {/* Shine effect */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />

              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span className="font-label text-label-sm font-semibold text-emerald-700">
                    Token Kunjungan
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-label text-label-sm text-emerald-700">
                  Aktif
                </span>
              </div>

              {/* Token display */}
              <div className="mb-6 rounded-xl bg-surface-container p-4">
                <p className="mb-1 font-label text-label-sm text-on-surface-variant">Nomor Token</p>
                <div className="flex items-center justify-between">
                  <code className="font-mono text-lg font-semibold tracking-wider text-on-surface">
                    {sampleToken}
                  </code>
                  <button
                    type="button"
                    onClick={copyToken}
                    className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 cursor-pointer"
                    aria-label="Salin token"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between border-b border-surface-alt pb-2">
                  <span className="font-label text-label-sm text-on-surface-variant">Instansi</span>
                  <span className="font-label text-label-sm font-medium text-on-surface">
                    Dinas Komunikasi
                  </span>
                </div>
                <div className="flex justify-between border-b border-surface-alt pb-2">
                  <span className="font-label text-label-sm text-on-surface-variant">Tanggal</span>
                  <span className="font-label text-label-sm font-medium text-on-surface">
                    15 Agustus 2026
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label text-label-sm text-on-surface-variant">Waktu</span>
                  <span className="font-label text-label-sm font-medium text-on-surface">
                    09:00 - 11:00 WIB
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-500/5 p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="font-label text-label-sm text-emerald-700">
                  Tunjukkan token ini di resepsionis
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-on-surface-variant"
        >
          <span className="font-label text-label-sm">Gulir ke bawah</span>
          <div className="h-8 w-px bg-on-surface-variant/30" />
        </motion.div>
      </motion.div>
    </section>
  );
}
