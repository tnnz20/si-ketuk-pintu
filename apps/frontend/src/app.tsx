import { lazy, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { BrowserRouter, Route, Routes } from 'react-router';
import { RedirectIfAuthenticated, RequireAuth } from '@/components/shared/auth-guard';
import { SessionProvider } from '@/components/shared/session-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import AuthLayout from '@/layouts/auth-layout';
import DashboardLayout from '@/layouts/dashboard-layout';
import MainLayout from '@/layouts/main-layout';

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
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-civic-bg"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="page-fallback-loader h-12 w-12 animate-spin text-civic-dark"
        aria-hidden="true"
      />
      <span className="text-sm font-semibold text-civic-dark">Sedang Memuat...</span>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <TooltipProvider delay={100}>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/form" element={<SubmissionForm />} />
                <Route path="/status/:token" element={<RequestStatus />} />
                <Route path="/success" element={<SubmissionSuccess />} />
              </Route>
              <Route element={<AuthLayout />}>
                <Route
                  path="/login"
                  element={
                    <RedirectIfAuthenticated>
                      <Login />
                    </RedirectIfAuthenticated>
                  }
                />
              </Route>
              <Route
                element={
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
                }
              >
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/dashboard/requests" element={<RequestList />} />
                <Route path="/dashboard/requests/:id" element={<RequestDetail />} />
                <Route path="/dashboard/archives" element={<Archives />} />
                <Route path="/dashboard/archives/:id" element={<ArchiveDetail />} />
                <Route path="/dashboard/scanner" element={<QRScanner />} />
              </Route>
              <Route path="*" element={<RequestNotFound />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  );
}

export default App;
