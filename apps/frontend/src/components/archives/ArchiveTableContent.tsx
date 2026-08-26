import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@components/shared/Empty';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
import type { PaginatedRequestsResponse } from '@app-types/api';
import { formatDate } from '@lib/dateTime';

interface ArchiveTableContentProps {
  archives: PaginatedRequestsResponse['data'];
  loading: boolean;
  onOpenMenu: (event: React.MouseEvent, row: PaginatedRequestsResponse['data'][number]) => void;
}

export default function ArchiveTableContent({
  archives,
  loading,
  onOpenMenu,
}: ArchiveTableContentProps) {
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

    if (archives.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MoreHorizontal />
                </EmptyMedia>
                <EmptyTitle>Tidak ada arsip</EmptyTitle>
                <EmptyDescription>
                  Tidak ada permohonan disetujui yang sesuai filter.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </td>
        </tr>
      );
    }

    return archives.map((request) => (
      <tr key={request.id} className="hover:bg-civic-cardFill group transition-colors">
        {/* No. Ref / Token */}
        <td className="px-4 py-3.5 font-bold text-civic-dark">
          <Link
            to={`/dashboard/archives/${request.id}`}
            className="bg-civic-cardFill inline-block rounded-lg border border-civic-border/70 px-2.5 py-1 font-mono text-label-sm transition-colors group-hover:bg-white hover:text-civic-dark"
          >
            {request.token}
          </Link>
        </td>

        {/* Pengirim / Instansi */}
        <td className="px-4 py-3.5">
          <p className="max-w-55 truncate font-bold text-civic-dark">{request.nama_instansi}</p>
          <p className="max-w-55 truncate text-2xs text-civic-muted">
            Dibuat: {formatDate(request.created_at)}
          </p>
        </td>

        {/* Tanggal Kunjungan */}
        <td className="px-4 py-3.5 font-semibold">{request.tanggal_kunjungan}</td>

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
          <button
            type="button"
            aria-label={`Aksi untuk ${request.nama_instansi}`}
            onClick={(event) => onOpenMenu(event, request)}
            className="hover:bg-civic-neutralFill cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:text-civic-dark"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
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
            <th className="px-4 py-3.5 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-civic-border font-medium text-civic-dark">
          {renderBody()}
        </tbody>
      </table>
    </div>
  );
}
