import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/hooks/use-session';
import { LoaderCircle } from 'lucide-react';

function SessionFallback() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-civic-bg"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="page-fallback-loader h-12 w-12 animate-spin text-civic-dark"
        aria-hidden="true"
      />
      <span className="text-sm font-semibold text-civic-dark">Sedang Memuat Sesi...</span>
    </div>
  );
}

interface AuthGuardProps {
  children?: ReactNode;
}

export function RequireAuth({ children }: AuthGuardProps) {
  const { status } = useSession();

  if (status === 'loading') {
    return <SessionFallback />;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RedirectIfAuthenticated({ children }: AuthGuardProps) {
  const { status } = useSession();

  if (status === 'loading') {
    return <SessionFallback />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default RequireAuth;
