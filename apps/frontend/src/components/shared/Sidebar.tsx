import { LayoutDashboard, LogOut, QrCode, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const active = '/admin';
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-outline-variant bg-surface">
      <div className="flex items-center gap-3 border-b border-outline-variant p-6">
        <div className="h-10 w-10 rounded-full bg-cover bg-center" style={{ backgroundImage: "url('/assets/logo.webp')" }} />
        <div>
          <span className="font-display font-bold text-lg leading-tight text-primary">Admin Panel</span>
          <span className="block text-label-sm text-on-surface-variant">Enterprise Edition</span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {[
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: LayoutDashboard, label: 'Request Management', path: '/admin/requests' },
          { icon: QrCode, label: 'QR Scanner', path: '/admin/qr' },
          { icon: Settings, label: 'Settings', path: '/admin/settings' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${active === item.path ? 'bg-surface-container font-medium text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className={active === item.path ? 'fill-primary' : ''}>{<item.icon className="h-5 w-5" />}</span>
            <span className="text-label-md">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-outline-variant p-4">
        <button onClick={() => navigate('/')} className="flex w-full items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-on-primary text-label-md font-bold">
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
