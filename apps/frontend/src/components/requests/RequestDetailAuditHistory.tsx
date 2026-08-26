import { History } from 'lucide-react';
import type { AuditEvent } from '@app-types/api';
import { formatDateTime } from '@lib/dateTime';

interface RequestAuditHistoryProps {
  events: AuditEvent[];
}

export default function RequestDetailAuditHistory({ events }: RequestAuditHistoryProps) {
  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      {/* Header */}
      <h3 className="flex items-center gap-2 border-b border-civic-border pb-3 text-sm font-extrabold text-civic-dark">
        <History className="h-4 w-4 text-civic-muted" />
        <span>Riwayat Audit</span>
      </h3>

      {/* Timeline */}
      <div className="relative space-y-4 pl-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-2.5 before:w-0.5 before:bg-civic-border">
        {events.length === 0 ? (
          <p className="text-xs text-civic-muted">Belum ada riwayat tercatat.</p>
        ) : (
          events.map((event, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={event.id || idx} className="relative">
                {/* Node dot */}
                <div
                  className={`absolute top-1 -left-5.25 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                    isLatest ? 'bg-civic-dark' : 'bg-civic-muted'
                  }`}
                />
                <p className="text-xs font-extrabold text-civic-dark capitalize">
                  {event.action.replace('_', ' ')}
                </p>
                <p className="mt-0.5 text-2xs font-medium text-civic-muted">
                  {formatDateTime(event.occurred_at)} • oleh{' '}
                  <span className="font-bold text-civic-dark">{event.actor_type}</span>
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
