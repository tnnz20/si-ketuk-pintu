import { motion, useReducedMotion, useInView } from 'motion/react';
import { Building2, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fadeInUp, staggerContainer } from './animations';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

const stats = [
  { icon: Users, value: 2400, suffix: '+', label: 'Kunjungan Diproses' },
  { icon: CheckCircle2, value: 98, suffix: '%', label: 'Tingkat Persetujuan' },
  { icon: Clock, value: 24, suffix: ' jam', label: 'Rata-rata Respons' },
];

const institutions = [
  'Dinas Komunikasi dan Informatika',
  'Badan Perencanaan Pembangunan',
  'Dinas Kesehatan',
  'Dinas Pendidikan',
  'Badan Kepegawaian',
  'Dinas Sosial',
];

export default function TrustSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-background px-margin-mobile py-16 md:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <motion.div
          variants={reduce ? undefined : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid items-center gap-12 md:grid-cols-[1fr_1.2fr]"
        >
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={reduce ? undefined : fadeInUp}
                custom={idx}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <stat.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="font-display text-3xl font-bold text-on-surface md:text-4xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-1 font-label text-label-sm text-on-surface-variant">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Institutions marquee */}
          <motion.div variants={reduce ? undefined : fadeInUp} custom={2} className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-linear-to-l from-background to-transparent" />

            <div className="flex gap-8 overflow-hidden">
              <motion.div
                animate={reduce ? undefined : { x: ['0%', '-50%'] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="flex shrink-0 gap-8"
              >
                {[...institutions, ...institutions].map((name, idx) => (
                  <div
                    key={`${name}-${idx}`}
                    className="flex shrink-0 items-center gap-3 rounded-xl border border-surface-alt bg-surface-container-lowest px-6 py-4"
                  >
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    <span className="whitespace-nowrap font-label text-label-sm font-medium text-on-surface">{name}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
