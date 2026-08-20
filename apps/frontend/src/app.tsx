import { Toaster } from 'sonner';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthGuard from '@components/layout/AuthGuard';
import DashboardLayout from '@components/layout/DashboardLayout';
import LandingLayout from '@components/layout/LandingLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import QRScanner from './pages/admin/QRScanner';
import RequestDetail from './pages/admin/RequestDetail';
import RequestList from './pages/admin/RequestList';
import LandingPage from './pages/public/LandingPage';
import RequestStatus from './pages/public/RequestStatus';
import SubmissionForm from './pages/public/SubmissionForm';
import SubmissionSuccess from './pages/public/SubmissionSuccess';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<SubmissionForm />} />
          <Route path="/status/:token" element={<RequestStatus />} />
          <Route path="/success" element={<SubmissionSuccess />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard/requests" element={<RequestList />} />
            <Route path="/dashboard/requests/:id" element={<RequestDetail />} />
            <Route path="/dashboard/scanner" element={<QRScanner />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
