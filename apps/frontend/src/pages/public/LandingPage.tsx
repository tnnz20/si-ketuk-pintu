import { ArrowRight, Calendar, CheckCircle2, FileText, HelpCircle, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRequestByToken } from '../../lib/api/requests';

export default function LandingPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (hash === '#status') {
      requestAnimationFrame(() => document.getElementById('status')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }, [hash]);
  const [isTracking, setIsTracking] = useState(false);

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
    <div>
      <section className="min-h-[calc(100vh-80px)] items-center overflow-hidden border-b border-surface-alt bg-background bg-[radial-gradient(#d2d2c8_1px,transparent_1px)] bg-[size:24px_24px] px-margin-mobile md:flex md:px-margin-desktop">
        <div className="max-w-container-max mx-auto grid w-full gap-gutter md:grid-cols-2">
          <div className="md:pr-12">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-surface-alt bg-surface-container px-4 py-2">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span className="font-label text-label-sm text-on-surface-variant">Official Government Visitor Portal</span>
            </div>
            <h1 className="font-display text-headline-lg-mobile leading-tight text-on-surface md:text-display">
              Sistem Permohonan Kunjungan Tamu <br />
              <span className="opacity-80">(Si Ketuk Pintu)</span>
            </h1>
            <p className="mt-6 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
              Experience a seamless, secure, and transparent process for arranging your official government visits. Radical clarity meets effortless accessibility.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/submit" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-label text-label-md text-on-primary transition-all hover:shadow-lg hover:-translate-y-0.5">
                Ajukan Kunjungan <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#status" className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-8 py-4 font-label text-label-md text-on-surface transition-colors hover:bg-surface-container">
                Check Status
              </a>
            </div>
          </div>
          <div className="hidden h-[500px] overflow-hidden rounded-2xl border border-surface-alt bg-surface-container shadow-sm md:block">
            <img src="/assets/logo.webp" alt="Government building lobby" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
      <section className="bg-surface px-margin-mobile py-16 md:px-margin-desktop">
        <div id="status" className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 shadow-[0_4px_12px_rgba(20,20,15,0.02)]">
            <div className="flex flex-col items-end gap-6 md:flex-row">
               <div className="w-full flex-1">
                <label htmlFor="token-search" className="mb-2 block font-label-md text-label-md text-on-surface">
                  Check Status by Token
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    id="token-search"
                    type="text"
                    placeholder="Enter your 12-digit visit token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface py-4 pl-12 pr-4 font-body-md text-body-md focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={trackVisit}
                disabled={!token.trim() || isTracking}
                className="w-full whitespace-nowrap rounded-xl bg-primary px-8 py-4 font-label-md text-label-md text-on-primary transition-colors hover:bg-opacity-90 disabled:opacity-40 md:w-auto"
              >
                {isTracking ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Track Visit'}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-surface-alt bg-surface-container-low px-margin-mobile py-24 md:px-margin-desktop" id="process">
        <div className="mx-auto max-w-container-max">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-headline-lg text-headline-lg text-on-surface">How It Works</h2>
            <p className="mx-auto max-w-2xl font-body-md text-body-md text-on-surface-variant">A streamlined 3-step process designed for clarity and efficiency.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ icon, title, desc }, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-2xl border border-surface-alt bg-surface-container-lowest p-8 transition-shadow hover:shadow-[0_4px_12px_rgba(20,20,15,0.05)]">
                <div className="absolute right-0 top-0 -z-10 p-8 text-9xl font-bold opacity-5 transition-transform group-hover:scale-110">{idx + 1}</div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-surface-alt bg-surface-container">{icon}</div>
                <h3 className="mb-3 font-headline-md text-headline-md text-on-surface">{title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const steps = [
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: 'Submit Request',
    desc: 'Fill out the digital form with your details, purpose of visit, and preferred schedule. Attach any necessary documents.',
  },
  {
    icon: <Calendar className="h-6 w-6 text-primary" />,
    title: 'Review & Approval',
    desc: 'Our administration team reviews your request. You will receive a notification and a unique token upon approval.',
  },
  {
    icon: <HelpCircle className="h-6 w-6 text-on-secondary" />,
    title: 'Visit',
    desc: 'Present your token at the reception desk on your scheduled date for immediate entry without the wait.',
  },
];
