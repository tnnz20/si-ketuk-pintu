import { ArrowLeft } from 'lucide-react';
import { Link, Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-civic-bg p-4 text-civic-dark antialiased sm:p-6 lg:p-8">
      <Link
        to="/"
        className="soft-shadow absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-civic-border bg-civic-surface px-4 py-2 text-xs font-bold text-civic-dark transition-all hover:scale-105 hover:bg-civic-surface/80 sm:top-6 sm:left-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Beranda
      </Link>
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}
