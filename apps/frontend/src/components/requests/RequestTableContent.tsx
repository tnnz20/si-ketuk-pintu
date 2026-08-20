import { MoreHorizontal } from 'lucide-react';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
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
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="bg-surface-container-low text-label-md text-on-surface-variant">
            <th className="p-4">Token</th>
            <th>Nama Instansi</th>
            <th>Tanggal Kunjungan</th>
            <th>Pimpinan Rombongan</th>
            <th>Jumlah Tamu</th>
            <th>Status</th>
            <th>Dibuat Pada</th>
            <th className="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="p-4">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            : requests.map((request) => (
                <tr key={request.id} className="text-body-md text-on-surface">
                  <td className="p-4 font-medium">{request.token}</td>
                  <td className="max-w-40 truncate">{request.nama_instansi}</td>
                  <td>{request.tanggal_kunjungan}</td>
                  <td className="max-w-48 truncate">{request.pimpinan_rombongan}</td>
                  <td>{request.jumlah_tamu}</td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td>{new Date(request.created_at).toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      aria-label="Aksi permohonan"
                      onClick={(event) => onOpenMenu(event, request)}
                      className="inline-flex cursor-pointer rounded-full p-2 hover:bg-surface-container"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
