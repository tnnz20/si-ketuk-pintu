import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import RequestTable from '@components/shared/RequestTable';
import Skeleton from '@components/shared/Skeleton';
import { getRequests, getStats } from '../../lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '@app-types/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse>();
  const [requests, setRequests] = useState<PaginatedRequestsResponse['data']>([]);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => toast.error('Gagal memuat statistik.'));
    getRequests(1, 5)
      .then((result) => setRequests(result.data))
      .catch(() => toast.error('Gagal memuat permohonan.'));
  }, []);

  const cards = [
    ['Permohonan Hari Ini', stats?.today_requests],
    ['Menunggu Persetujuan', stats?.pending_approval],
    ['Total Permohonan', stats?.total_requests],
  ];

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold text-primary">
          Selamat datang kembali, Admin
        </h1>
        <p className="mt-2 text-on-surface-variant">Ringkasan permohonan kunjungan hari ini.</p>
      </header>
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <section
            key={String(label)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6"
          >
            <p className="text-label-md text-on-surface-variant">{label}</p>
            {value === undefined ? (
              <Skeleton className="mt-3 h-9 w-20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
            )}
          </section>
        ))}
      </div>
      <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
          <h2 className="font-display text-xl font-bold text-primary">Permohonan Terbaru</h2>
        </div>
        <RequestTable
          requests={requests.map((request) => ({
            date: request.tanggal_kunjungan,
            id: request.id,
            user: request.nama_instansi,
            status: request.status,
          }))}
          onViewDetail={(id) => navigate(`/dashboard/requests/${id}`)}
        />
        <div className="flex justify-center p-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/requests')}
            className="flex items-center gap-2 text-label-md font-bold text-primary cursor-pointer"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  );
}
