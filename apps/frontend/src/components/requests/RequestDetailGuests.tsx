import { Users } from 'lucide-react';
import type { Guest } from '@app-types/api';

interface RequestGuestsProps {
  guests: Guest[];
}

export default function RequestDetailGuests({ guests }: RequestGuestsProps) {
  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-civic-muted" />
          <h3 className="text-base font-extrabold text-civic-dark">
            Daftar Tamu ({guests.length})
          </h3>
        </div>
        <span className="bg-civic-neutralFill rounded-full border border-civic-border px-3 py-1 text-xs font-extrabold text-civic-dark">
          Terdaftar
        </span>
      </div>

      {/* Guest List */}
      <div className="space-y-2.5">
        {guests.length === 0 ? (
          <p className="py-4 text-center text-xs text-civic-muted">
            Tidak ada data daftar tamu terlampir.
          </p>
        ) : (
          guests.map((guest, index) => (
            <div
              key={`${guest.guest_order || index}-${guest.nama}`}
              className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3.5 transition-colors hover:border-civic-dark/40"
            >
              <div className="flex items-center gap-3">
                <div className="bg-civic-neutralFill flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-civic-border/60 text-xs font-extrabold text-civic-dark">
                  {guest.guest_order || index + 1}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-civic-dark">{guest.nama}</h4>
                  <p className="text-label-sm font-medium text-civic-muted">{guest.jabatan}</p>
                </div>
              </div>

              <span className="bg-civic-approvedBg text-civic-approvedText rounded-lg px-2.5 py-1 text-2xs font-extrabold">
                Aktif
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
