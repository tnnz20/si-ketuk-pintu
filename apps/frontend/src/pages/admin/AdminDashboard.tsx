import { ArrowRight, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestTable from '../../components/shared/RequestTable';
import Sidebar from '../../components/shared/Sidebar';
import Skeleton from '../../components/shared/Skeleton';
import { getRequestByToken, getRequests, getStats } from '../../lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '../../lib/types/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse>();
  const [requests, setRequests] = useState<PaginatedRequestsResponse['data']>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('Gagal memuat statistik.'));
    getRequests(1, 10)
      .then((result) => setRequests(result.data))
      .catch(() => setError('Gagal memuat permohonan.'));
  }, []);

  async function findToken() {
    try {
      const request = await getRequestByToken(token.trim());
      navigate(`/dashboard/requests/${request.id}`);
    } catch {
      setError('Kode QR tidak valid');
    }
  }

  const cards = [
    ['Permohonan Hari Ini', stats?.today_requests],
    ['Menunggu Persetujuan', stats?.pending_approval],
    ['Total Permohonan', stats?.total_requests],
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-container-max p-8 lg:p-10">
          <header className="mb-10">
            <h1 className="font-display text-3xl font-bold text-primary">
              Selamat datang kembali, Admin
            </h1>
            <p className="mt-2 text-on-surface-variant">Ringkasan permohonan kunjungan hari ini.</p>
          </header>
          {error && <p className="mb-4 text-error">{error}</p>}
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
          <section className="mb-8 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5" />
              <div>
                <h2 className="font-display text-xl font-bold text-primary">Pindai Kode QR</h2>
                <p className="text-label-md text-on-surface-variant">
                  Masukkan token bila kamera tidak tersedia.
                </p>
              </div>
            </div>
            <form
              className="mt-4 flex gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                findToken();
              }}
            >
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="SKP-YYYYMMDD-XXXXX"
                className="min-w-0 flex-1 rounded border border-outline-variant bg-white px-3 py-2"
              />
              <button className="rounded bg-primary px-4 py-2 text-label-md text-on-primary">
                Cari
              </button>
            </form>
          </section>
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
              onRowClick={(id) => navigate(`/dashboard/requests/${id}`)}
            />
            <div className="flex justify-center p-4">
              <button
                onClick={() => navigate('/dashboard/requests')}
                className="flex items-center gap-2 text-label-md font-bold text-primary"
              >
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
