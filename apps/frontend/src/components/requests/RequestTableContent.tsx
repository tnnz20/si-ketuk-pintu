import { MoreHorizontal, SearchX } from 'lucide-react';
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
import { formatDate } from '@lib/dateTime';

type RequestRow = PaginatedRequestsResponse['data'][number];

interface RequestTableContentProps {
  requests: PaginatedRequestsResponse['data'];
  loading: boolean;
  onOpenMenu: (event: React.MouseEvent, row: RequestRow) => void;
}

export default function RequestTableContent({
  requests,
  loading,
  onOpenMenu,
}: RequestTableContentProps) {
  function renderBody() {
    if (loading) {
      return Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
        <tr key={key}>
          <td colSpan={7} className="px-4 py-4">
            <Skeleton className="h-6 w-full rounded-xl" />
          </td>
        </tr>
      ));
    }

    if (requests.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>Tidak ada permohonan</EmptyTitle>
                <EmptyDescription>Tidak ada permohonan yang sesuai filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </td>
        </tr>
      );
    }

    return requests.map((request) => (
      <tr key={request.id} className="hover:bg-civic-cardFill group transition-colors">
        {/* No. Ref / Token */}
        <td className="px-4 py-3.5 font-bold text-civic-dark">
          <span className="bg-civic-cardFill inline-block rounded-lg border border-civic-border/70 px-2.5 py-1 font-mono text-label-sm transition-colors group-hover:bg-white">
            {request.token}
          </span>
        </td>

        {/* Pengirim / Instansi */}
        <td className="px-4 py-3.5">
          <p className="max-w-55 truncate font-bold text-civic-dark">{request.nama_instansi}</p>
          <p className="max-w-55 truncate text-2xs text-civic-muted">
            Dibuat: {formatDate(request.created_at)}
          </p>
        </td>

        {/* Tanggal Kunjungan */}
        <td className="px-4 py-3.5 font-semibold">{formatDate(request.tanggal_kunjungan)}</td>

        {/* Pimpinan Rombongan */}
        <td className="max-w-45 truncate px-4 py-3.5 text-civic-muted">
          {request.pimpinan_rombongan || '-'}
        </td>

        {/* Jumlah Tamu */}
        <td className="px-4 py-3.5 font-bold">
          <span className="bg-civic-neutralFill rounded-md px-2 py-0.5 text-2xs text-civic-dark">
            {request.jumlah_tamu} Org
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          <StatusBadge status={request.status} />
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end">
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  aria-label={`Aksi untuk ${request.nama_instansi}`}
                  onClick={(e) => onOpenMenu(e, request)}
                  className="hover:bg-civic-neutralFill cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:text-civic-dark"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Aksi lainnya</TooltipContent>
            </Tooltip>
          </div>
        </td>
      </tr>
    ));
  }

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-civic-border text-2xs font-bold tracking-wider text-civic-muted uppercase">
            <th className="px-4 py-3.5">No. Ref</th>
            <th className="px-4 py-3.5">Pengirim / Instansi</th>
            <th className="px-4 py-3.5">Tanggal Kunjungan</th>
            <th className="px-4 py-3.5">Pimpinan Rombongan</th>
            <th className="px-4 py-3.5">Tamu</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-civic-border font-medium text-civic-dark">
          {renderBody()}
        </tbody>
      </table>
    </div>
  );
}
