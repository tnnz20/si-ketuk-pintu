import { Users } from 'lucide-react';
import type { Guest } from '@app-types/api';

interface RequestGuestsProps {
  guests: Guest[];
}

export default function RequestGuests({ guests }: RequestGuestsProps) {
  return (
    <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
      <h2 className="mb-4 flex items-center gap-2 text-label-md font-bold">
        <Users className="h-5 w-5" /> Daftar Tamu ({guests.length})
      </h2>
      <div className="space-y-3">
        {guests.map((guest) => (
          <div
            key={`${guest.guest_order}-${guest.nama}`}
            className="flex items-center gap-4 rounded-lg border border-surface-alt bg-surface p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container text-label-md text-on-surface-variant">
              {guest.guest_order}
            </div>
            <div>
              <p className="text-label-md font-bold">{guest.nama}</p>
              <p className="text-sm text-on-surface-variant">{guest.jabatan}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
