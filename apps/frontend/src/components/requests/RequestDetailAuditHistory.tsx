import { History } from 'lucide-react';
import type { AuditEvent } from '@app-types/api';

interface RequestAuditHistoryProps {
  events: AuditEvent[];
}

export default function RequestDetailAuditHistory({ events }: RequestAuditHistoryProps) {
  return (
    <div className="bg-civic-surface p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
      {/* Header */}
      <h3 className="font-extrabold text-sm text-civic-dark flex items-center gap-2 border-b border-civic-border pb-3">
        <History className="w-4 h-4 text-civic-muted" />
        <span>Riwayat Audit</span>
      </h3>

      {/* Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-civic-border">
        {events.length === 0 ? (
          <p className="text-xs text-civic-muted">Belum ada riwayat tercatat.</p>
        ) : (
          events.map((event, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={event.id || idx} className="relative">
                {/* Node dot */}
                <div
                  className={`absolute -left-5.25 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                    isLatest ? 'bg-civic-dark' : 'bg-civic-muted'
                  }`}
                />
                <p className="text-xs font-extrabold text-civic-dark capitalize">
                  {event.action.replace('_', ' ')}
                </p>
                <p className="text-2xs text-civic-muted mt-0.5 font-medium">
                  {new Date(event.occurred_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  • oleh <span className="font-bold text-civic-dark">{event.actor_type}</span>
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
