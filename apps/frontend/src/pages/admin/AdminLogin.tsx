import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  QrCode,
  ShieldCheck,
  User,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../../lib/api/auth';
import { loginSchema } from '../../schemas/login';

const features = [
  {
    icon: ClipboardList,
    title: 'Kelola Permohonan',
    description: 'Tinjau dan proses permohonan kunjungan tamu dalam satu dasbor terpadu.',
  },
  {
    icon: QrCode,
    title: 'Verifikasi QR',
    description: 'Pindai kode QR tamu untuk verifikasi kunjungan yang cepat dan akurat.',
  },
  {
    icon: ShieldCheck,
    title: 'Aman & Terpantau',
    description: 'Setiap akses tercatat dan terlindungi untuk menjaga integritas data.',
  },
];

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const clearError = (field: string) => {
    setError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const next: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(next);
      toast.error('Periksa kembali isian Anda.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch {
      setError('Email, username, atau password salah.');
      toast.error('Gagal masuk. Periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Grain texture */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]">
        <div className="bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')] absolute inset-0" />
      </div>

      {/* ── Left branding panel (desktop only) ─────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-primary-container lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
            animate={reduce ? undefined : { y: [0, 24, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-16 -bottom-32 h-96 w-96 rounded-full bg-emerald-400/8 blur-3xl"
            animate={reduce ? undefined : { y: [0, -28, 0], scale: [1, 0.94, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/4 right-1/4 h-24 w-24 rotate-45 border border-emerald-500/15"
            animate={reduce ? undefined : { rotate: [45, 135, 45] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Brand */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative flex items-center gap-3"
        >
          <img
            src="/assets/logo.webp"
            alt="Si Ketuk Pintu Logo"
            className="h-12 w-12 rounded-full bg-white/90 object-contain p-1"
          />
          <div>
            <span className="block font-display text-lg leading-tight font-bold text-white">
              Si Ketuk Pintu
            </span>
            <span className="block font-label text-label-sm text-white/50">Admin Console</span>
          </div>
        </motion.div>

        {/* Headline + features */}
        <div className="relative">
          <motion.h2
            initial={reduce ? undefined : { opacity: 0, y: 24 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="font-display text-4xl leading-[1.15] font-bold tracking-tight text-white xl:text-5xl"
          >
            Kelola kunjungan tamu
            <br />
            <span className="text-emerald-400">dalam satu pintu.</span>
          </motion.h2>

          <div className="mt-10 flex flex-col gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={reduce ? undefined : { opacity: 0, x: -24 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 + i * 0.12 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                  <feature.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-label text-label-md font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="mt-1 max-w-sm font-body text-sm leading-relaxed text-white/55">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={reduce ? undefined : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="relative font-label text-label-sm text-white/40"
        >
          Portal Resmi Pemerintah — Akses terbatas untuk petugas berwenang.
        </motion.p>
      </aside>

      {/* ── Right form panel ───────────────────────────────────────── */}
      <main className="relative flex min-h-dvh items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
        {/* Ambient shapes (mobile + desktop right panel) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/5"
            animate={reduce ? undefined : { y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-emerald-500/4"
            animate={reduce ? undefined : { y: [0, 24, 0], scale: [1, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-20 w-full max-w-md"
        >
          {/* Back link */}
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 font-label text-label-sm text-on-surface-variant transition-colors hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 shadow-[0_24px_60px_-24px_rgba(26,28,22,0.18)] md:p-10">
            {/* Header */}
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
              <motion.div
                initial={reduce ? undefined : { scale: 0.8, opacity: 0 }}
                animate={reduce ? undefined : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-emerald-500/15 blur-xl" />
                <img
                  src="/assets/logo.webp"
                  alt="Si Ketuk Pintu Logo"
                  className="relative h-20 w-20 rounded-full border border-surface-alt object-contain p-1.5"
                />
              </motion.div>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-label text-[11px] text-emerald-700">Portal Admin</span>
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface">
                  Selamat Datang Kembali
                </h1>
                <p className="font-body-md mt-2 text-body-md text-on-surface-variant">
                  Masuk untuk mengelola permohonan kunjungan.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    role="alert"
                    initial={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                    animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="rounded-lg border border-error/20 bg-error-container px-4 py-3 font-body text-sm text-on-error-container"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-label-md text-label-md text-on-surface">
                  Email atau Username
                </label>
                <div className="group relative">
                  <User className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-emerald-600" />
                  <input
                    id="email"
                    className="font-body-md w-full rounded-lg border border-surface-alt bg-surface-container-low py-2.5 pr-3 pl-11 text-body-md transition-all placeholder:text-outline/70 focus:border-emerald-600 focus:bg-surface-container-lowest focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                    placeholder="admin@domain.gov"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      clearError('identifier');
                    }}
                    required
                    type="text"
                    autoComplete="username"
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="font-label text-label-sm text-error">{fieldErrors.identifier}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="font-label-md text-label-md text-on-surface">
                    Password
                  </label>
                  <a
                    className="font-label-sm text-label-sm text-emerald-700 transition-colors hover:text-emerald-800 hover:underline"
                    href="#"
                  >
                    Lupa Password?
                  </a>
                </div>
                <div className="group relative">
                  <Lock className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-emerald-600" />
                  <input
                    id="password"
                    className="font-body-md w-full rounded-lg border border-surface-alt bg-surface-container-low py-2.5 pr-11 pl-11 text-body-md transition-all placeholder:text-outline/70 focus:border-emerald-600 focus:bg-surface-container-lowest focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-outline transition-colors hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="font-label text-label-sm text-error">{fieldErrors.password}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="group font-label-md mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-label-md font-semibold text-on-primary shadow-[0_8px_20px_-8px_rgba(26,28,22,0.5)] transition-all hover:shadow-[0_12px_28px_-8px_rgba(26,28,22,0.55)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <p className="mt-6 text-center font-label text-label-sm text-on-surface-variant/70">
            &copy; 2026 Si Ketuk Pintu &mdash; Sistem Permohonan Kunjungan Tamu
          </p>
        </motion.div>
      </main>
    </div>
  );
}
