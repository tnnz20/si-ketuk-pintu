import { Calendar as CalendarIcon, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PaginatedRequestsResponse } from '@app-types/api';

type RequestItem = PaginatedRequestsResponse['data'][number];

interface TodayScheduleProps {
  requests: RequestItem[];
}

export default function TodaySchedule({ requests }: TodayScheduleProps) {
  const navigate = useNavigate();

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySchedule = requests.filter((r) => r.tanggal_kunjungan === todayDateStr);
  const displaySchedule = todaySchedule.length > 0 ? todaySchedule : requests.slice(0, 3);

  return (
    <div className="lg:col-span-4 bg-civic-surface p-5 rounded-3xl border border-civic-border soft-shadow space-y-3.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-civic-border pb-3 mb-3">
          <h3 className="font-extrabold text-base text-civic-dark flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-civic-muted" />
            <span>Jadwal Terdekat</span>
          </h3>
          <span className="text-2xs font-extrabold bg-civic-neutral-fill px-2.5 py-0.5 rounded-full text-civic-dark">
            {displaySchedule.length} Agenda
          </span>
        </div>

        <div className="space-y-2.5">
          {displaySchedule.length === 0 ? (
            <div className="p-6 text-center text-xs text-civic-muted rounded-2xl bg-civic-cardFill border border-civic-border">
              Belum ada agenda kunjungan hari ini.
            </div>
          ) : (
            displaySchedule.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/dashboard/requests/${item.id}`)}
                className="p-3 bg-civic-cardFill hover:bg-civic-neutral-fill/60 rounded-2xl border border-civic-border flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-civic-dark text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-extrabold text-civic-dark truncate">
                      {item.nama_instansi}
                    </h4>
                    <p className="text-2xs text-civic-muted truncate">
                      {item.tanggal_kunjungan} • {item.jumlah_tamu} Tamu
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-civic-muted group-hover:text-civic-dark group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard/requests')}
        className="w-full mt-3 bg-civic-cardFill hover:bg-civic-neutral-fill border border-civic-border text-civic-dark font-extrabold text-xs py-2.5 rounded-2xl transition-colors text-center cursor-pointer"
      >
        Lihat Semua Jadwal
      </button>
    </div>
  );
}
