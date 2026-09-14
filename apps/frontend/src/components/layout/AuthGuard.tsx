import { Navigate, Outlet } from 'react-router';
import { isAuthenticated } from '@lib/api/auth';

export default function AuthGuard() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
