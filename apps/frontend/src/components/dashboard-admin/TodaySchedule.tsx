import { Calendar as CalendarIcon, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaginatedRequestsResponse } from '@/types/api';
import { formatDate, todayEpoch } from '@/lib/dateTime';

type RequestItem = PaginatedRequestsResponse['data'][number];

interface TodayScheduleProps {
  requests: RequestItem[];
}

export default function TodaySchedule({ requests }: TodayScheduleProps) {
  const navigate = useNavigate();

  const todayEpochValue = todayEpoch();
  const todaySchedule = requests.filter((r) => r.tanggal_kunjungan === todayEpochValue);
  const displaySchedule = todaySchedule.length > 0 ? todaySchedule : requests.slice(0, 3);

  return (
    <Card className="flex flex-col justify-between space-y-3.5 p-5 lg:col-span-4">
      <div>
        <CardHeader className="flex flex-row items-center justify-between border-b border-civic-border p-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-extrabold text-civic-dark">
            <CalendarIcon className="h-4 w-4 text-civic-muted" />
            <span>Jadwal Terdekat</span>
          </CardTitle>
          <span className="rounded-full bg-civic-neutral-fill px-2.5 py-0.5 text-2xs font-extrabold text-civic-dark">
            {displaySchedule.length} Agenda
          </span>
        </CardHeader>

        <CardContent className="space-y-2.5 p-0 pt-3">
          {displaySchedule.length === 0 ? (
            <div className="bg-civic-cardFill rounded-2xl border border-civic-border p-6 text-center text-xs text-civic-muted">
              Belum ada agenda kunjungan hari ini.
            </div>
          ) : (
            displaySchedule.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/dashboard/requests/${item.id}`)}
                className="bg-civic-cardFill group flex cursor-pointer items-center justify-between rounded-2xl border border-civic-border p-3 transition-colors hover:bg-civic-neutral-fill/60"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-civic-dark font-bold text-white shadow-sm">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <h4 className="truncate text-xs font-extrabold text-civic-dark">
                      {item.nama_instansi}
                    </h4>
                    <p className="truncate text-2xs text-civic-muted">
                      {formatDate(item.tanggal_kunjungan)} • {item.jumlah_tamu} Tamu
                    </p>
                  </div>
                </div>
                <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-civic-muted transition-all group-hover:translate-x-0.5 group-hover:text-civic-dark" />
              </div>
            ))
          )}
        </CardContent>
      </div>

      <CardFooter className="p-0 pt-3 border-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard/requests')}
          className="bg-civic-cardFill w-full cursor-pointer rounded-2xl border border-civic-border py-2.5 text-center text-xs font-extrabold text-civic-dark transition-colors hover:bg-civic-neutral-fill"
        >
          Lihat Semua Jadwal
        </button>
      </CardFooter>
    </Card>
  );
}
