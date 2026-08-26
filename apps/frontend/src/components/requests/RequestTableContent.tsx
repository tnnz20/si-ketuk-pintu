import { MoreHorizontal, SearchX } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/shared/Empty';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/Tooltip';
import type { PaginatedRequestsResponse } from '@app-types/api';

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
          <td colSpan={7} className="py-4 px-4">
            <Skeleton className="h-6 w-full rounded-xl" />
          </td>
        </tr>
      ));
    }

    if (requests.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="py-12 px-4">
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
      <tr
        key={request.id}
        className="hover:bg-civic-cardFill transition-colors group"
      >
        {/* No. Ref / Token */}
        <td className="py-3.5 px-4 font-bold text-civic-dark">
          <span className="inline-block bg-civic-cardFill px-2.5 py-1 rounded-lg border border-civic-border/70 font-mono text-label-sm group-hover:bg-white transition-colors">
            {request.token}
          </span>
        </td>

        {/* Pengirim / Instansi */}
        <td className="py-3.5 px-4">
          <p className="font-bold text-civic-dark truncate max-w-55">
            {request.nama_instansi}
          </p>
          <p className="text-2xs text-civic-muted truncate max-w-55">
            Dibuat: {new Date(request.created_at).toLocaleDateString('id-ID')}
          </p>
        </td>

        {/* Tanggal Kunjungan */}
        <td className="py-3.5 px-4 font-semibold">
          {request.tanggal_kunjungan}
        </td>

        {/* Pimpinan Rombongan */}
        <td className="py-3.5 px-4 text-civic-muted truncate max-w-45">
          {request.pimpinan_rombongan || '-'}
        </td>

        {/* Jumlah Tamu */}
        <td className="py-3.5 px-4 font-bold">
          <span className="bg-civic-neutralFill text-civic-dark px-2 py-0.5 rounded-md text-2xs">
            {request.jumlah_tamu} Org
          </span>
        </td>

        {/* Status */}
        <td className="py-3.5 px-4">
          <StatusBadge status={request.status} />
        </td>

        {/* Actions */}
        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end">
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  aria-label={`Aksi untuk ${request.nama_instansi}`}
                  onClick={(e) => onOpenMenu(e, request)}
                  className="p-1.5 rounded-xl text-civic-muted hover:text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
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
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-civic-border text-civic-muted font-bold uppercase tracking-wider text-2xs">
            <th className="py-3.5 px-4">No. Ref</th>
            <th className="py-3.5 px-4">Pengirim / Instansi</th>
            <th className="py-3.5 px-4">Tanggal Kunjungan</th>
            <th className="py-3.5 px-4">Pimpinan Rombongan</th>
            <th className="py-3.5 px-4">Tamu</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-civic-border text-civic-dark font-medium">
          {renderBody()}
        </tbody>
      </table>
    </div>
  );
}