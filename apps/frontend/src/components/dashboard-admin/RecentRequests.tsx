import { ArrowRight, Eye, FileText, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@components/shared/Empty';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/Tooltip';
import type { PaginatedRequestsResponse } from '@app-types/api';
import { DateTime } from 'luxon';

type RequestItem = PaginatedRequestsResponse['data'][number];

interface RecentRequestsProps {
  requests: RequestItem[];
  loading: boolean;
}

export default function RecentRequests({ requests, loading }: RecentRequestsProps) {
  const navigate = useNavigate();

  function renderBody() {
    if (loading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={6} className="px-4 py-3.5">
            <Skeleton className="h-6 w-full rounded-xl" />
          </td>
        </tr>
      ));
    }

    if (requests.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Belum ada permohonan</EmptyTitle>
                <EmptyDescription>Belum ada permohonan yang masuk.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </td>
        </tr>
      );
    }

    return [...requests]
      .sort(
        (a, b) =>
          DateTime.fromISO(b.created_at).toMillis() - DateTime.fromISO(a.created_at).toMillis(),
      )
      .slice(0, 5)
      .map((request) => (
        <tr key={request.id} className="hover:bg-civic-cardFill transition-colors">
          {/* No. Ref / Token */}
          <td className="px-4 py-3.5 font-bold whitespace-nowrap text-civic-dark">
            <span className="bg-civic-cardFill rounded-lg border border-civic-border/70 px-2.5 py-1 font-mono text-label-sm">
              {request.token}
            </span>
          </td>
          <td className="px-4 py-3.5">
            <p className="max-w-50 truncate font-bold text-civic-dark">{request.nama_instansi}</p>
          </td>
          <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
            {request.tanggal_kunjungan}
          </td>
          <td className="max-w-40 truncate px-4 py-3.5 text-civic-muted">
            {request.pimpinan_rombongan}
          </td>
          <td className="px-4 py-3.5 whitespace-nowrap">
            <StatusBadge status={request.status} />
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  aria-label={`Lihat Detail ${request.nama_instansi}`}
                  onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                  className="cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-civic-neutral-fill hover:text-civic-dark"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Lihat Detail</TooltipContent>
            </Tooltip>
          </td>
        </tr>
      ));
  }

  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-civic-dark">
            <FileText className="h-4 w-4 text-civic-muted" />
            <span>Permohonan Terbaru</span>
          </h3>
          <p className="mt-0.5 text-xs text-civic-muted">Daftar permohonan yang baru saja masuk</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/requests')}
          className="bg-civic-cardFill inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-civic-border px-3 py-1.5 text-xs font-bold text-civic-dark transition-all hover:opacity-80"
        >
          <span>Semua Data</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table View */}
      <div className="scrollbar-none max-w-full min-w-0 overflow-x-auto">
        <table className="w-full max-w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-civic-border text-2xs font-bold tracking-wider text-civic-muted uppercase">
              <th className="px-4 py-3">No. Ref</th>
              <th className="px-4 py-3">Pengirim / Instansi</th>
              <th className="px-4 py-3">Tanggal Kunjungan</th>
              <th className="px-4 py-3">Pimpinan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-civic-border font-medium text-civic-dark">
            {renderBody()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
