import { Calendar } from 'lucide-react';
import StatusBadge from '@components/shared/StatusBadge';
import type { VisitRequest } from '@app-types/api';
import { formatDate, formatTime } from '@lib/dateTime';

interface RequestSummaryProps {
  request: VisitRequest;
}

export default function RequestSummary({ request }: RequestSummaryProps) {
  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-civic-neutralFill rounded-lg border border-civic-border px-2.5 py-1 font-mono text-label-sm font-extrabold tracking-wider text-civic-dark">
              {request.token}
            </span>
            <StatusBadge status={request.status} />
          </div>

          <h2 className="text-2xl leading-snug font-extrabold tracking-tight text-civic-dark sm:text-3xl">
            {request.tema_kunjungan}
          </h2>

          <p className="text-xs font-medium text-civic-muted sm:text-sm">
            Pengirim: <strong className="text-civic-dark">{request.nama_instansi}</strong>
          </p>
        </div>

        {/* Tanggal Kunjungan Box */}
        <div className="bg-civic-cardFill flex shrink-0 items-center gap-3 rounded-2xl border border-civic-border p-3.5">
          <div className="bg-civic-neutralFill flex h-9 w-9 items-center justify-center rounded-xl font-bold text-civic-dark">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xs font-bold tracking-wider text-civic-muted uppercase">
              Tanggal Kunjungan
            </p>
            <p className="text-xs font-extrabold text-civic-dark">
              {formatDate(request.tanggal_kunjungan)} {formatTime(request.jam_kunjungan)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
