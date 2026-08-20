import { History } from 'lucide-react';
import type { AuditEvent } from '@app-types/api';

interface RequestAuditHistoryProps {
  events: AuditEvent[];
}

export default function RequestAuditHistory({ events }: RequestAuditHistoryProps) {
  return (
    <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
      <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
        <History className="h-5 w-5" /> Riwayat Audit
      </h2>
      <div className="ml-3 space-y-6 border-l border-surface-alt pb-2">
        {events.map((event) => (
          <div key={event.id} className="pl-6">
            <p className="text-label-md font-bold">{event.action}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {new Date(event.occurred_at).toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
