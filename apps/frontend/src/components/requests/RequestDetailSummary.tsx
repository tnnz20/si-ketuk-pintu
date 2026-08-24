import { Calendar } from 'lucide-react';
import StatusBadge from '@components/shared/StatusBadge';
import type { VisitRequest } from '@app-types/api';

interface RequestSummaryProps {
  request: VisitRequest;
}

export default function RequestSummary({ request }: RequestSummaryProps) {
  return (
    <div className="bg-civic-surface p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-civic-neutralFill text-civic-dark text-label-sm font-extrabold tracking-wider px-2.5 py-1 rounded-lg border border-civic-border font-mono">
              {request.token}
            </span>
            <StatusBadge status={request.status} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-civic-dark tracking-tight leading-snug">
            {request.tema_kunjungan}
          </h2>

          <p className="text-xs sm:text-sm text-civic-muted font-medium">
            Pengirim: <strong className="text-civic-dark">{request.nama_instansi}</strong>
          </p>
        </div>

        {/* Tanggal Kunjungan Box */}
        <div className="bg-civic-cardFill p-3.5 rounded-2xl border border-civic-border flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-civic-neutralFill text-civic-dark flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xs text-civic-muted font-bold uppercase tracking-wider">
              Tanggal Kunjungan
            </p>
            <p className="text-xs font-extrabold text-civic-dark">
              {request.tanggal_kunjungan} {request.jam_kunjungan}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
