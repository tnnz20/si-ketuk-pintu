import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../lib/api/auth';

export default function AuthGuard() {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
