import { lazy, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { BrowserRouter, Route, Routes } from 'react-router';
import AuthGuard from '@components/layout/AuthGuard';
import DashboardLayout from '@components/layout/DashboardLayout';
import LandingLayout from '@components/layout/LandingLayout';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Archives = lazy(() => import('./pages/admin/Archives'));
const ArchiveDetail = lazy(() => import('./pages/admin/ArchiveDetail'));
const Login = lazy(() => import('./pages/auth/Login'));
const QRScanner = lazy(() => import('./pages/admin/QRScanner'));
const RequestDetail = lazy(() => import('./pages/admin/RequestDetail'));
const RequestList = lazy(() => import('./pages/admin/RequestList'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const RequestStatus = lazy(() => import('./pages/public/RequestStatus'));
const RequestNotFound = lazy(() => import('./pages/public/RequestNotFound'));
const SubmissionForm = lazy(() => import('./pages/public/SubmissionForm'));
const SubmissionSuccess = lazy(() => import('./pages/public/SubmissionSuccess'));

function PageFallback() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="page-fallback-loader h-12 w-12 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm text-on-surface">Sedang Memuat...</span>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/form" element={<SubmissionForm />} />
          <Route path="/status/:token" element={<RequestStatus />} />
            <Route path="/success" element={<SubmissionSuccess />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGuard />}>
            <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard/requests" element={<RequestList />} />
            <Route path="/dashboard/requests/:id" element={<RequestDetail />} />
            <Route path="/dashboard/archives" element={<Archives />} />
            <Route path="/dashboard/archives/:id" element={<ArchiveDetail />} />
              <Route path="/dashboard/scanner" element={<QRScanner />} />
            </Route>
          </Route>
          <Route path="*" element={<RequestNotFound />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
