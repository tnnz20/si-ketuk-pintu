import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestTable from '../../components/shared/RequestTable';
import Sidebar from '../../components/shared/Sidebar';
import { getRequests } from '../../lib/api/requests';
import type { Status } from '../../components/shared/StatusBadge';

export default function RequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<{ date: string; id: string; user: string; status: Status }[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getRequests(1, 20, { search, status, date })
      .then((result) => setRequests(result.data.map((request) => ({
        date: request.tanggal_kunjungan,
        id: request.id,
        user: request.nama_instansi,
        status: request.status,
      }))))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load requests.'));
  }, [search, status, date]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 lg:p-10">
        <div className="mx-auto max-w-container-max">
          <header className="mb-8">
            <h1 className="font-display text-3xl font-bold text-primary">Request Management</h1>
            <p className="mt-2 text-on-surface-variant">Review and manage visitor requests.</p>
          </header>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests" className="rounded border border-surface-alt bg-white p-3" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded border border-surface-alt bg-white p-3">
              <option value="">Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="rounded border border-surface-alt bg-white p-3" />
          </div>
          {error && <p className="mb-4 text-error">{error}</p>}
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <RequestTable requests={requests} onRowClick={(id) => navigate(`/admin/requests/${id}`)} />
          </section>
        </div>
      </main>
    </div>
  );
}
