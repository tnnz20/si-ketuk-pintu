import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  X,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '../../lib/api/auth';
import ConfirmDialog from '@components/shared/ConfirmDialog';

const titles: [RegExp, string][] = [
  [/^\/dashboard$/, 'Dashboard'],
  [/^\/dashboard\/requests$/, 'Manajemen Permohonan'],
  [/^\/dashboard\/requests\/.+/, 'Detail Permohonan'],
  [/^\/dashboard\/scanner$/, 'Pindai Kode QR'],
];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Manajemen Permohonan', path: '/dashboard/requests' },
];

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex-1 space-y-2 px-4 py-6">
      {navItems.map((item) => {
        const active =
          item.path === '/dashboard' ? pathname === item.path : pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${collapsed ? 'justify-center' : ''} ${active ? 'bg-surface-container font-medium text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className={active ? 'fill-primary' : ''}>
              <item.icon className="h-5 w-5 shrink-0" />
            </span>
            {!collapsed && <span className="text-label-md whitespace-nowrap">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const title = titles.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Dashboard';

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    toast.success('Berhasil keluar.');
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ type: 'spring', bounce: 0.2 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-outline-variant bg-surface md:flex"
      >
        <div
          className={`flex h-16 shrink-0 items-center gap-3 border-b border-outline-variant px-4 ${collapsed ? 'justify-center' : ''}`}
        >
          <img
            src="/assets/logo.webp"
            alt="Portal Admin"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="block truncate font-display text-lg leading-tight font-bold text-primary">
                Portal Admin
              </span>
              <span className="block text-label-sm whitespace-nowrap text-on-surface-variant">
                Civic Gateway
              </span>
            </div>
          )}
        </div>
        <NavLinks collapsed={collapsed} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="fixed top-0 left-0 z-50 flex h-dvh w-64 flex-col border-r border-outline-variant bg-surface md:hidden"
            >
              <div className="flex items-center gap-3 border-b border-outline-variant p-4">
                <img
                  src="/assets/logo.webp"
                  alt="Portal Admin"
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg leading-tight font-bold text-primary">
                    Portal Admin
                  </span>
                  <span className="block text-label-sm text-on-surface-variant">Civic Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Tutup menu"
                  className="text-on-surface-variant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-outline-variant p-4">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-label-md font-bold text-on-primary"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface">
          <div className="flex h-16 items-center gap-4 px-4 md:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="text-on-surface-variant md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container md:flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            <div className="hidden h-4 w-px bg-outline-variant md:block" />
            <h1 className="font-display text-lg font-bold text-on-surface">{title}</h1>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => navigate('/dashboard/scanner')}
              className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <QrCode className="h-5 w-5" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-label-md font-bold text-on-primary"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
      {confirmLogout && (
        <ConfirmDialog
          title="Keluar dari Portal Admin?"
          description="Anda akan kembali ke halaman utama. Sesi Anda akan berakhir."
          action="Log Out"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
