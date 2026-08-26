import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ScanLine,
  Search,
  X,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '../../lib/api/auth';
import ConfirmDialog from '@components/shared/ConfirmDialog';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Manajemen Permohonan', path: '/dashboard/requests' },
  { icon: Archive, label: 'Arsip Permohonan', path: '/dashboard/archives' },
  { icon: QrCode, label: 'Scanner Tiket Tamu', path: '/dashboard/scanner' },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    toast.success('Berhasil keluar dari sesi admin.');
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/requests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex h-screen gap-4 overflow-hidden bg-civic-bg p-3 text-civic-dark antialiased md:p-5">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="border-civic-sidebarBorder soft-shadow hidden w-64 shrink-0 flex-col justify-between rounded-3xl border bg-civic-sidebar p-5 text-civic-dark lg:flex">
        <div className="space-y-6">
          {/* Brand Logo Header */}
          <Link to="/dashboard" className="group flex items-center gap-3 px-2 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-civic-dark font-extrabold text-white shadow-sm transition-transform group-hover:scale-105">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base leading-none font-bold tracking-tight text-civic-dark">
                Portal Admin
              </h1>
              <p className="mt-1 text-label-sm font-medium text-civic-muted">Si Ketuk Pintu</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-3">
            {navItems.map((item) => {
              const active =
                item.path === '/dashboard'
                  ? pathname === item.path
                  : pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-civic-dark text-white shadow-sm'
                      : 'hover:bg-civic-neutralFill/60 text-civic-muted hover:text-civic-dark'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          {/* User Profile Footer */}
          <div className="flex items-center justify-between border-t border-civic-border pt-2">
            <div className="flex items-center gap-2.5">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                className="h-8 w-8 rounded-full border border-civic-border object-cover"
                alt="Admin Avatar"
              />
              <div className="truncate">
                <p className="truncate text-xs font-bold text-civic-dark">Khairol M.</p>
                <p className="truncate text-2xs text-civic-muted">Super Admin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="hover:bg-civic-neutralFill cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:text-rose-600"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE DRAWER SIDEBAR ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-civic-dark/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
              className="border-civic-sidebarBorder fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r bg-civic-sidebar p-5 shadow-2xl lg:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-civic-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-civic-dark font-extrabold text-white shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-base leading-none font-bold tracking-tight text-civic-dark">
                        Portal Admin
                      </h1>
                      <p className="mt-1 text-label-sm font-medium text-civic-muted">
                        Si Ketuk Pintu
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="cursor-pointer rounded-lg p-1 text-civic-muted hover:text-civic-dark"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const active =
                      item.path === '/dashboard'
                        ? pathname === item.path
                        : pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                          active
                            ? 'bg-civic-dark text-white shadow-sm'
                            : 'hover:bg-civic-neutralFill/60 text-civic-muted hover:text-civic-dark'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-3 border-t border-civic-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="hover:bg-civic-darkHover flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-civic-dark px-4 py-2.5 text-xs font-extrabold text-white transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pr-1">
        {/* Top Navbar Header */}
        <header className="mb-5 flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-civic-dark sm:text-2xl">
              <span>Selamat Datang, Admin</span>
            </h2>
            <p className="mt-0.5 text-xs font-medium text-civic-muted">
              Sistem Informasi Manajemen Permohonan Kunjungan Instansi
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-civic-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari permohonan, nama, kode..."
                className="soft-shadow w-full rounded-2xl border border-civic-border bg-civic-surface py-2.5 pr-4 pl-10 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
              />
            </form>

            {/* Quick Scanner Shortcut */}
            <button
              type="button"
              onClick={() => navigate('/dashboard/scanner')}
              className="soft-shadow flex cursor-pointer items-center gap-2 rounded-2xl border border-civic-border bg-civic-surface px-3.5 py-2.5 text-xs font-bold text-civic-dark transition-all hover:border-civic-dark"
            >
              <ScanLine className="h-4 w-4 text-civic-dark" />
              <span className="hidden md:inline">Scanner</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="cursor-pointer rounded-2xl bg-civic-dark p-2.5 text-white lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Views Container */}
        <div className="min-w-0 flex-1 pb-6">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      {confirmLogout && (
        <ConfirmDialog
          title="Keluar dari Portal Admin?"
          description="Anda akan kembali ke halaman login. Sesi autentikasi Anda akan berakhir."
          action="Keluar"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
