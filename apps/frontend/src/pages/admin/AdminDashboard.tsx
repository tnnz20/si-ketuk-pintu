import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestTable from '../../components/shared/RequestTable';
import Sidebar from '../../components/shared/Sidebar';

const requests = [
  { date: '2023-10-24', id: 'REQ-001', user: 'John Doe', status: 'pending' as const },
  { date: '2023-10-24', id: 'REQ-002', user: 'Jane Smith', status: 'approved' as const },
  { date: '2023-10-23', id: 'REQ-003', user: 'Mike Ross', status: 'rejected' as const },
  { date: '2023-10-23', id: 'REQ-004', user: 'Harvey Specter', status: 'pending' as const },
  { date: '2023-10-22', id: 'REQ-005', user: 'Louis Litt', status: 'approved' as const },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-container-max p-8 lg:p-10">
          <header className="mb-10">
            <h1 className="mb-2 font-display text-3xl font-bold text-primary">Welcome back, Admin</h1>
            <p className="text-on-surface-variant">Here is a summary of your operations for today.</p>
          </header>
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['Total Requests', '1,284', '+12%', 'text-secondary bg-secondary-container'],
              ['Pending Approval', '42', '+5%', 'text-secondary bg-secondary-container'],
              ['Active QR Codes', '856', '-2%', 'text-error bg-error-container'],
            ].map(([label, value, trend, cls]) => (
              <div key={label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <p className="text-label-md font-medium text-on-surface-variant">{label}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-3xl font-bold tracking-tight text-primary">{value}</p>
                  <span className={`rounded-full px-2 py-0.5 text-label-md font-bold ${cls}`}>{trend}</span>
                </div>
              </div>
            ))}
          </div>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
              <h2 className="font-display text-xl font-bold text-primary">Recent Requests</h2>
              <span className="text-label-sm font-medium text-on-surface-variant">Last updated 5m ago</span>
            </div>
            <RequestTable requests={requests} onRowClick={(id) => navigate(`/admin/requests/${id}`)} />
            <div className="flex justify-center bg-surface-bright px-6 py-4">
              <button onClick={() => navigate('/admin/requests')} className="group flex items-center gap-2 font-label-md text-label-md font-bold text-primary hover:underline">
                <span>View All Requests</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
