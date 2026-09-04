import type { ReactNode } from 'react';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
import { formatDate } from '@lib/dateTime';
import type { PaginatedRequestsResponse, StatsResponse } from '@app-types/api';

type RequestItem = PaginatedRequestsResponse['data'][number];

interface SummaryCardsProps {
  stats?: StatsResponse;
  requests: RequestItem[];
  loading: boolean;
}

interface SummaryCardProps {
  onClick: () => void;
  iconClassName: string;
  icon: ReactNode;
  badge: ReactNode;
  title: string;
  subtitle: string;
  footerLeft: ReactNode;
  footerRight: ReactNode;
}

function SummaryCard({
  onClick,
  iconClassName,
  icon,
  badge,
  title,
  subtitle,
  footerLeft,
  footerRight,
}: SummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className="soft-shadow card-hover cursor-pointer space-y-3 rounded-3xl border border-civic-border bg-civic-surface p-4"
    >
      <div className="flex items-center justify-between">
        <div
          className={`h-9 w-9 rounded-xl ${iconClassName} flex items-center justify-center font-bold`}
        >
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <h4 className="truncate text-xs font-extrabold text-civic-dark">{title}</h4>
        <p className="mt-0.5 truncate text-label-sm text-civic-muted">{subtitle}</p>
      </div>
      <div className="flex items-center justify-between border-t border-civic-border pt-2 text-label-sm">
        {footerLeft}
        {footerRight}
      </div>
    </div>
  );
}

export default function SummaryCards({ stats, requests, loading }: SummaryCardsProps) {
  const navigate = useNavigate();

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const latestPending = pendingRequests[0];
  const latestApproved = approvedRequests[0];
  const latestRejected = rejectedRequests[0];

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-civic-dark">Ringkasan Permohonan</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Pending */}
        <SummaryCard
          onClick={() => navigate('/dashboard/requests?status=pending')}
          iconClassName="bg-civic-pendingBg text-civic-pendingText"
          icon={<Clock className="h-4 w-4" />}
          badge={
            loading ? (
              <Skeleton className="h-5 w-20 rounded-full" />
            ) : (
              <span className="text-civic-pendingText bg-civic-pendingBg rounded-full border border-civic-border/70 px-2.5 py-0.5 text-xs font-extrabold">
                {stats?.pending_approval ?? pendingRequests.length} Pending
              </span>
            )
          }
          title={latestPending ? latestPending.nama_instansi : 'Menunggu Verifikasi'}
          subtitle={
            latestPending
              ? `Pimpinan: ${latestPending.pimpinan_rombongan}`
              : 'Tidak ada permohonan pending'
          }
          footerLeft={
            <span className="max-w-35 truncate font-medium text-civic-muted">
              {latestPending ? latestPending.token : 'Si Ketuk Pintu'}
            </span>
          }
          footerRight={<StatusBadge status="pending" />}
        />

        {/* Card 2: Disetujui */}
        <SummaryCard
          onClick={() => navigate('/dashboard/requests?status=approved')}
          iconClassName="bg-civic-approvedBg text-civic-approvedText"
          icon={<CheckCircle2 className="h-4 w-4" />}
          badge={
            loading ? (
              <Skeleton className="h-5 w-20 rounded-full" />
            ) : (
              <span className="text-civic-approvedText bg-civic-approvedBg rounded-full border border-emerald-200/80 px-2.5 py-0.5 text-xs font-extrabold">
                {approvedRequests.length} Disetujui
              </span>
            )
          }
          title={latestApproved ? latestApproved.nama_instansi : 'Kunjungan Terjadwal'}
          subtitle={
            latestApproved
              ? `Tgl: ${formatDate(latestApproved.tanggal_kunjungan)}`
              : 'Belum ada kunjungan disetujui'
          }
          footerLeft={
            <span className="max-w-35 truncate font-medium text-civic-muted">
              {latestApproved ? latestApproved.token : 'Si Ketuk Pintu'}
            </span>
          }
          footerRight={<StatusBadge status="approved" />}
        />

        {/* Card 3: Ditolak / Total */}
        <SummaryCard
          onClick={() => navigate('/dashboard/requests')}
          iconClassName="bg-civic-neutral-fill text-civic-dark"
          icon={<Users className="h-4 w-4" />}
          badge={
            loading ? (
              <Skeleton className="h-5 w-20 rounded-full" />
            ) : (
              <span className="rounded-full border border-civic-border/70 bg-civic-neutral-fill px-2.5 py-0.5 text-xs font-extrabold text-civic-dark">
                {stats?.total_requests ?? requests.length} Total
              </span>
            )
          }
          title={latestRejected ? latestRejected.nama_instansi : 'Total Permohonan Masuk'}
          subtitle={
            rejectedRequests.length > 0
              ? `${rejectedRequests.length} permohonan ditolak`
              : 'Semua berkas termonitor'
          }
          footerLeft={
            <span className="font-medium text-civic-muted">
              Hari Ini: {stats?.today_requests ?? 0}
            </span>
          }
          footerRight={<span className="font-extrabold text-civic-dark">Si Ketuk Pintu</span>}
        />
      </div>
    </div>
  );
}
