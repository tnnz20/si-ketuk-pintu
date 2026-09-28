import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Guest } from '@/types/api';

interface RequestGuestsProps {
  guests: Guest[];
}

export default function RequestDetailGuests({ guests }: RequestGuestsProps) {
  return (
    <Card className="space-y-4 p-6">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-civic-border p-0 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-civic-muted" />
          <CardTitle className="text-base font-extrabold text-civic-dark">
            Daftar Tamu ({guests.length})
          </CardTitle>
        </div>
        <span className="bg-civic-neutralFill rounded-full border border-civic-border px-3 py-1 text-xs font-extrabold text-civic-dark">
          Terdaftar
        </span>
      </CardHeader>

      {/* Guest List */}
      <CardContent className="space-y-2.5 p-0">
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
      </CardContent>
    </Card>
  );
}
