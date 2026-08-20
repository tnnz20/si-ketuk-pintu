import { Calendar } from 'lucide-react';
import StatusBadge from '@components/shared/StatusBadge';
import type { VisitRequest } from '@app-types/api';

interface RequestSummaryProps {
  request: VisitRequest;
}

export default function RequestSummary({ request }: RequestSummaryProps) {
  return (
    <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
      <span className="mb-2 inline-flex rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
        {request.token}
      </span>
      <h1 className="mb-1 font-display text-3xl font-bold text-primary">
        {request.tema_kunjungan}
      </h1>
      <p className="text-on-surface-variant">{request.nama_instansi}</p>
      <div className="mt-6 grid gap-4 border-t border-surface-alt pt-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-label-sm text-on-surface-variant">Tanggal Kunjungan</p>
          <p className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-outline" /> {request.tanggal_kunjungan}{' '}
            {request.jam_kunjungan}
          </p>
        </div>
        <div>
          <p className="mb-1 text-label-sm text-on-surface-variant">Status</p>
          <StatusBadge status={request.status} />
        </div>
      </div>
    </section>
  );
}
