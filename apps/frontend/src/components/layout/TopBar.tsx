import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link to="/" className="flex items-center gap-3">
          <img src="/assets/logo.webp" alt="Logo Si Ketuk Pintu" className="h-10 w-10 rounded-full object-contain" />
          <span className="hidden font-headline-md text-headline-md font-bold md:block">Si Ketuk Pintu</span>
        </Link>
        <button type="button" aria-label="Buka navigasi" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <div className={`${open ? 'absolute left-0 top-20 flex w-full flex-col border-b border-outline-variant bg-surface p-4' : 'hidden'} gap-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>
          <a href="/#process" className="font-label text-label-md text-on-surface-variant transition-colors hover:text-emerald-600">Cara Kerja</a>
          <a href="/#status" className="font-label text-label-md text-on-surface-variant transition-colors hover:text-emerald-600">Cek Status</a>
          <Link to="/admin/login" className="rounded-lg bg-emerald-600 px-5 py-2 font-label text-label-md font-medium text-white transition-all hover:bg-emerald-700 hover:shadow-md">Masuk Admin</Link>
        </div>
      </nav>
    </header>
  );
}
