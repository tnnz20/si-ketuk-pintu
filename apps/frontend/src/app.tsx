import { Toaster } from 'sonner';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import RequestDetail from './pages/admin/RequestDetail';
import RequestList from './pages/admin/RequestList';
import LandingPage from './pages/public/LandingPage';
import RequestStatus from './pages/public/RequestStatus';
import SubmissionForm from './pages/public/SubmissionForm';
import SubmissionSuccess from './pages/public/SubmissionSuccess';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<SubmissionForm />} />
          <Route path="/status/:token" element={<RequestStatus />} />
          <Route path="/success" element={<SubmissionSuccess />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/dashboard/requests" element={<RequestList />} />
          <Route path="/dashboard/requests/:id" element={<RequestDetail />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </Layout>
    </BrowserRouter>
  );
}

export default App;
