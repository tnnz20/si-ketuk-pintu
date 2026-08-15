import { motion, useReducedMotion } from 'motion/react';
import { FileText, LoaderCircle, Search, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequestByToken } from '../../lib/api/requests';
import { fadeInUp, staggerContainer } from './animations';

export default function StatusSection() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setToken(value);
    setCharCount(value.length);
  };

  const trackVisit = async () => {
    const value = token.trim();
    if (!value) return;

    setIsTracking(true);
    try {
      await getRequestByToken(value);
      navigate(`/status/${encodeURIComponent(value)}`);
    } catch {
      navigate(`/status/${encodeURIComponent(value)}`);
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <section
      id="status"
      className="relative overflow-hidden bg-surface px-margin-mobile py-24 md:px-margin-desktop"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 -left-40 h-80 w-80 -translate-y-1/2 rounded-full bg-emerald-500/3 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-80 w-80 -translate-y-1/2 rounded-full bg-emerald-500/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-container-max">
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr]"
        >
          {/* Left: Context */}
          <div className="flex flex-col justify-center">
            <motion.div
              variants={reduce ? undefined : fadeInUp}
              custom={0}
              className="mb-4 flex items-center gap-2"
            >
              <div className="h-px w-8 bg-emerald-500" />
              <span className="font-label text-label-sm font-semibold tracking-wider text-emerald-600 uppercase">
                Lacak Permohonan
              </span>
            </motion.div>

            <motion.h2
              variants={reduce ? undefined : fadeInUp}
              custom={1}
              className="text-headline-lg-mobile mb-4 font-display leading-tight text-on-surface md:text-headline-lg"
            >
              Pantau Status Kunjungan Anda
            </motion.h2>

            <motion.p
              variants={reduce ? undefined : fadeInUp}
              custom={2}
              className="font-body-md mb-8 max-w-md text-body-md leading-relaxed text-on-surface-variant"
            >
              Masukkan token 16 digit yang Anda terima setelah mengajukan permohonan. Sistem kami
              akan menampilkan status terkini secara real-time.
            </motion.p>

            <motion.div
              variants={reduce ? undefined : fadeInUp}
              custom={3}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-label text-label-sm font-medium text-on-surface">
                    Data Terenkripsi
                  </p>
                  <p className="font-label text-label-sm text-on-surface-variant">
                    Informasi Anda aman dan terlindungi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-label text-label-sm font-medium text-on-surface">
                    Update Real-Time
                  </p>
                  <p className="font-label text-label-sm text-on-surface-variant">
                    Status diperbarui secara langsung
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Status Card */}
          <motion.div variants={reduce ? undefined : fadeInUp} custom={2} className="relative">
            {/* Glassmorphism card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-8 shadow-[0_8px_32px_rgba(13,148,136,0.08)] backdrop-blur-xl">
              {/* Inner highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Search className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      Cek Status
                    </h3>
                    <p className="font-label text-label-sm text-on-surface-variant">
                      Masukkan token kunjungan Anda
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="token-search"
                      className="mb-2 block font-label text-label-sm font-medium text-on-surface"
                    >
                      Token Kunjungan
                    </label>
                    <div className="relative">
                      <FileText className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        id="token-search"
                        type="text"
                        placeholder="SKP-2026-XXXX-XXXX"
                        value={token}
                        onChange={handleTokenChange}
                        maxLength={18}
                        className="w-full rounded-xl border border-outline-variant bg-surface py-4 pr-20 pl-12 font-mono text-body-md tracking-wider transition-all placeholder:text-on-surface-variant/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      />
                      <div className="absolute top-1/2 right-4 -translate-y-1/2">
                        <span
                          className={`font-mono text-label-sm ${charCount >= 18 ? 'text-emerald-600' : 'text-on-surface-variant/50'}`}
                        >
                          {charCount}/18
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 font-label text-label-sm text-on-surface-variant">
                      Format: SKP-YYYY-XXXX-XXXX (18 digit)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={trackVisit}
                    disabled={!token.trim() || isTracking}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 px-8 py-4 font-label text-label-md font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isTracking ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Lacak Kunjungan</span>
                        <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
                      </>
                    )}
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </button>
                </div>

                {/* Example token hint */}
                <div className="mt-6 rounded-xl bg-emerald-500/5 p-4">
                  <p className="mb-2 font-label text-label-sm font-medium text-emerald-700">
                    Contoh Token:
                  </p>
                  <button
                    type="button"
                    onClick={() => setToken('SKP-2026-0812-XY7K')}
                    className="font-mono text-body-md text-emerald-600 underline decoration-emerald-600/30 underline-offset-2 transition-colors hover:decoration-emerald-600"
                  >
                    SKP-2026-0812-XY7K
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
