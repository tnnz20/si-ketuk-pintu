import { ArrowLeft, Calendar, FileText, Gavel, History, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import StatusBadge from '../../components/shared/StatusBadge';
import { getRequestById, updateStatus } from '../../lib/api/requests';
import type { RequestDetailResponse } from '../../lib/types/api';

export default function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    if (!id) return;
    getRequestById(id)
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Request not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status: 'approved' | 'rejected') => {
    if (!id) return;
    setAction(status);
    try {
      await updateStatus(id, status);
      setData((prev) => prev ? { ...prev, request: { ...prev.request, status } } : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to update');
    } finally {
      setAction('');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error || !data) return <div className="flex items-center justify-center min-h-screen text-error">{error || 'Not found'}</div>;

  const { request } = data;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="mx-auto max-w-container-max">
          <button onClick={() => navigate('/admin/requests')} className="mb-6 flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary">
            <ArrowLeft className="h-5 w-5" /> Back to Requests
          </button>
          <div className="flex flex-col gap-gutter lg:flex-row">
            <div className="flex-grow space-y-6 lg:w-2/3">
              <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
                <span className="mb-2 inline-flex rounded bg-surface-container px-2 py-1 font-label-sm text-label-sm text-on-surface-variant">{request.token}</span>
                <h1 className="mb-1 font-headline-lg text-headline-lg">{request.tema_kunjungan}</h1>
                <p className="text-on-surface-variant">{request.nama_instansi}</p>
                <div className="mt-6 grid gap-4 border-t border-surface-alt pt-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Visit Date</p>
                    <p className="flex items-center gap-2"><Calendar className="h-5 w-5 text-outline" /> {request.tanggal_kunjungan} {request.jam_kunjungan}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Current Status</p>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              </section>
              <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
                <h2 className="mb-3 flex items-center gap-2 font-label-md text-label-md"><FileText className="h-5 w-5" /> Purpose of Visit</h2>
                <p className="leading-relaxed text-on-surface-variant">{request.tema_kunjungan}</p>
              </section>
              <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
                <h2 className="mb-4 flex items-center gap-2 font-label-md text-label-md"><Users className="h-5 w-5" /> Guest List ({request.guests.length})</h2>
                <div className="space-y-3">
                  {request.guests.map((guest, idx) => (
                    <div key={idx} className="flex items-center gap-4 rounded-lg border border-surface-alt bg-surface p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container font-label-md text-label-md text-on-surface-variant">{guest.nama[0]}</div>
                      <div>
                        <p className="font-label-md text-label-md">{guest.nama}</p>
                        <p className="text-sm text-on-surface-variant">{guest.jabatan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
                <h2 className="mb-4 flex items-center gap-2 font-label-md text-label-md"><History className="h-5 w-5" /> Audit History</h2>
                <div className="relative ml-3 mt-4 space-y-6 border-l border-surface-alt pb-2">
                  {data.audit_events.map((event, i) => (
                    <div key={i} className="relative pl-6">
                      <div className={`absolute -left-[6.5px] top-1.5 h-3 w-3 rounded-full border-2 border-surface-container-lowest ${i === 0 ? 'bg-primary' : 'bg-surface-alt'}`} />
                      <p className="font-label-md text-label-md">{event.action}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{new Date(event.occurred_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="space-y-6 lg:w-1/3">
              <section className="sticky top-8 rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
                <h2 className="mb-4 flex items-center gap-2 font-label-md text-label-md"><Gavel className="h-5 w-5" /> Administrative Action</h2>
                <div className="mb-6 flex items-center justify-between rounded border border-surface-alt bg-surface-container p-4">
                  <span className="text-on-surface-variant">Current Status:</span>
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleStatus('approved')} disabled={action !== ''} className="w-full rounded border border-primary bg-primary py-3 font-label-md text-label-md text-secondary-fixed hover:bg-surface-tint disabled:opacity-40">
                    {action === 'approved' ? 'Processing...' : 'Approve Request'}
                  </button>
                  <button onClick={() => handleStatus('rejected')} disabled={action !== ''} className="w-full rounded border border-surface-alt bg-surface-container-lowest py-3 font-label-md text-label-md text-error hover:bg-error-container disabled:opacity-40">
                    {action === 'rejected' ? 'Processing...' : 'Reject Request'}
                  </button>
                </div>
              </section>
              <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
                <h2 className="mb-4 flex items-center gap-2 font-label-md text-label-md"><FileText className="h-5 w-5" /> Attached Documents</h2>
                {request.attachments.map((doc, idx) => (
                  <div key={idx} className="mb-3 flex items-center justify-between rounded border border-surface-alt p-3 hover:bg-surface-container">
                    <span className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /> {doc.original_name}</span>
                  </div>
                ))}
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
