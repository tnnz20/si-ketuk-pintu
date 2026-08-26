import { Users } from 'lucide-react';
import type { Guest } from '@app-types/api';

interface RequestGuestsProps {
  guests: Guest[];
}

export default function RequestDetailGuests({ guests }: RequestGuestsProps) {
  return (
    <div className="bg-civic-surface p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-civic-muted" />
          <h3 className="font-extrabold text-base text-civic-dark">
            Daftar Tamu ({guests.length})
          </h3>
        </div>
        <span className="bg-civic-neutralFill text-civic-dark text-xs font-extrabold px-3 py-1 rounded-full border border-civic-border">
          Terdaftar
        </span>
      </div>

      {/* Guest List */}
      <div className="space-y-2.5">
        {guests.length === 0 ? (
          <p className="text-xs text-civic-muted text-center py-4">
            Tidak ada data daftar tamu terlampir.
          </p>
        ) : (
          guests.map((guest, index) => (
            <div
              key={`${guest.guest_order || index}-${guest.nama}`}
              className="flex items-center justify-between p-3.5 bg-civic-cardFill rounded-2xl border border-civic-border hover:border-civic-dark/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-civic-neutralFill text-civic-dark flex items-center justify-center text-xs font-extrabold border border-civic-border/60 shrink-0">
                  {guest.guest_order || index + 1}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-civic-dark">{guest.nama}</h4>
                  <p className="text-label-sm text-civic-muted font-medium">{guest.jabatan}</p>
                </div>
              </div>

              <span className="bg-civic-approvedBg text-civic-approvedText text-2xs font-extrabold px-2.5 py-1 rounded-lg">
                Aktif
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
