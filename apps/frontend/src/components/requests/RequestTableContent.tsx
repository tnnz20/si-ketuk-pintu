import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
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
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={7} className="py-4 px-4">
                  <Skeleton className="h-6 w-full rounded-xl" />
                </td>
              </tr>
            ))
          ) : requests.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 px-4 text-center text-civic-muted">
                <p className="text-xs font-semibold">Tidak ada permohonan yang sesuai filter.</p>
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr
                key={request.id}
                onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                className="hover:bg-civic-cardFill transition-colors cursor-pointer group"
              >
                {/* No. Ref / Token */}
                <td className="py-3.5 px-4 font-bold text-civic-dark whitespace-nowrap">
                  <span className="bg-civic-cardFill px-2.5 py-1 rounded-lg border border-civic-border/70 font-mono text-label-sm group-hover:bg-white transition-colors">
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
                <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  {request.tanggal_kunjungan}
                </td>

                {/* Pimpinan Rombongan */}
                <td className="py-3.5 px-4 text-civic-muted truncate max-w-45">
                  {request.pimpinan_rombongan || '-'}
                </td>

                {/* Jumlah Tamu */}
                <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                  <span className="bg-civic-neutralFill text-civic-dark px-2 py-0.5 rounded-md text-2xs">
                    {request.jumlah_tamu} Org
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={request.status} />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                      className="bg-civic-dark hover:bg-civic-darkHover text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs"
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      aria-label="Aksi lainnya"
                      onClick={(e) => onOpenMenu(e, request)}
                      className="p-1.5 rounded-xl text-civic-muted hover:text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
