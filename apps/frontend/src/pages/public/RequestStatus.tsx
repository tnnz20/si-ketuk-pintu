import { Clock, FileText, HelpCircle, Info, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRequestByToken } from '../../lib/api/requests';
import type { VisitRequest } from '../../lib/types/api';

export default function RequestStatus() {
  const { token } = useParams();
  const [request, setRequest] = useState<VisitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getRequestByToken(token)
      .then(setRequest)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Request not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const statusColor = {
    pending: 'bg-surface-dim text-on-surface border border-outline-variant',
    approved: 'bg-secondary-container text-on-secondary-container',
    rejected: 'bg-error-container text-on-error-container',
  };

  const attachmentLabels: Record<string, string> = {
    surat_kunjungan: 'Visit Letter',
    surat_tugas: 'Assignment Letter',
  };

  if (loading) return <div className="py-16 text-center text-on-surface-variant">Loading request...</div>;
  if (error || !request) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-margin-mobile py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error-container text-error">
          <Search className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Request Not Found</h1>
        <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
          No visitor request matches token <strong className="text-on-surface">{token}</strong>.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="/#status" className="flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 font-label-md text-label-md text-on-primary">
            <Search className="h-4 w-4" aria-hidden="true" /> Try another token
          </a>
          <Link to="/" className="flex items-center justify-center gap-2 rounded border border-outline px-6 py-3 font-label-md text-label-md text-on-surface">
            <HelpCircle className="h-4 w-4" aria-hidden="true" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-16">
      <div className="mb-12 flex flex-col justify-between gap-6 border-b border-surface-alt pb-8 md:flex-row md:items-end">
        <div>
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Request Token</p>
          <h1 className="font-headline-lg-mobile mb-4 text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">{request.token}</h1>
          <div className="inline-flex items-center rounded-full border border-outline-variant bg-surface-variant px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
            <Clock className="mr-1 h-4 w-4" /> Submitted on {new Date(request.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="inline-flex flex-col items-start md:items-end">
          <p className="mb-2 font-label-sm text-label-sm text-on-surface-variant">Current Status</p>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${statusColor[request.status]}`}>
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider">{request.status}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="space-y-gutter lg:col-span-2">
          <section className="rounded-xl border border-surface-alt bg-surface-container-lowest p-6 md:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-surface-alt pb-4 font-headline-md text-headline-md text-on-surface">
              <Info className="h-5 w-5" /> Visit Details
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Date of Visit</p>
                <p className="font-body-lg text-body-lg text-on-surface">{request.tanggal_kunjungan}</p>
              </div>
              <div>
                <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Time</p>
                <p className="font-body-lg text-body-lg text-on-surface">{request.jam_kunjungan}</p>
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Organization / Company</p>
                <p className="font-body-lg text-body-lg text-on-surface">{request.nama_instansi}</p>
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Purpose of Visit</p>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">{request.tema_kunjungan}</p>
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 font-label-sm text-label-sm text-on-surface-variant">Contact Person</p>
                <p className="font-body-md text-body-md text-on-surface">{request.kontak_dihubungi}</p>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-surface-alt bg-surface-container-lowest p-6 md:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-surface-alt pb-4 font-headline-md text-headline-md text-on-surface">
              <Users className="h-5 w-5" /> Registered Guests
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-alt">
                    <th className="py-4 font-label-md text-label-md font-medium text-on-surface-variant">Name</th>
                    <th className="py-4 font-label-md text-label-md font-medium text-on-surface-variant">Position/Title</th>
                  </tr>
                </thead>
                <tbody>
                  {request.guests.map((guest, idx) => (
                    <tr key={idx} className="border-b border-surface-alt/50 hover:bg-surface-container last:border-0">
                      <td className="py-4 font-body-md text-body-md text-on-surface">{guest.nama}</td>
                      <td className="py-4 font-body-md text-body-md text-on-surface-variant">{guest.jabatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div className="space-y-gutter">
          <section className="rounded-xl border border-surface-alt bg-surface-container-lowest p-6">
            <h3 className="mb-4 flex items-center gap-2 border-b border-surface-alt pb-2 text-base font-headline-md text-headline-md text-on-surface">
              <FileText className="h-5 w-5" /> Submitted Documents
            </h3>
            <ul className="mt-4 space-y-4">
              {request.attachments.map((doc, idx) => (
                <li key={idx} className="group rounded-lg border border-surface-alt p-3 transition-colors hover:bg-surface-container">
                  <span className="mb-1 block text-xs font-label-md font-medium text-on-surface-variant uppercase tracking-wider">
                    {attachmentLabels[doc.attachment_type] || doc.attachment_type}
                  </span>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                    <span className="truncate font-body-md text-body-md text-on-surface">{doc.original_name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
            <HelpCircle className="mx-auto mb-2 h-8 w-8 text-on-surface-variant" />
            <h4 className="mb-2 font-label-md text-label-md text-on-surface">Need to make changes?</h4>
            <p className="mb-4 font-body-md text-body-md text-sm text-on-surface-variant">
              Modifications are not possible while the request is pending. If you need urgent changes, please contact support.
            </p>
            <button className="w-full rounded border border-outline py-2 px-4 font-label-md text-label-md text-on-surface hover:bg-surface-container">
              Contact Support
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
