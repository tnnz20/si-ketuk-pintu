import { ArrowRight, FileText, Inbox } from 'lucide-react';
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
import type { PaginatedRequestsResponse } from '@app-types/api';

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
          <td colSpan={6} className="py-3.5 px-4">
            <Skeleton className="h-6 w-full rounded-xl" />
          </td>
        </tr>
      ));
    }

    if (requests.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="py-12 px-4">
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

    return requests.slice(0, 5).map((request) => (
      <tr
        key={request.id}
        className="hover:bg-civic-cardFill transition-colors group cursor-pointer"
        onClick={() => navigate(`/dashboard/requests/${request.id}`)}
      >
        {/* No. Ref / Token */}
        <td className="py-3.5 px-4 font-bold text-civic-dark whitespace-nowrap">
          <span className="bg-civic-cardFill px-2.5 py-1 rounded-lg border border-civic-border/70 font-mono text-label-sm">
            {request.token}
          </span>
        </td>
        <td className="py-3.5 px-4">
          <p className="font-bold text-civic-dark truncate max-w-50">{request.nama_instansi}</p>
        </td>
        <td className="py-3.5 px-4 font-semibold whitespace-nowrap">{request.tanggal_kunjungan}</td>
        <td className="py-3.5 px-4 text-civic-muted truncate max-w-40">
          {request.pimpinan_rombongan}
        </td>
        <td className="py-3.5 px-4 whitespace-nowrap">
          <StatusBadge status={request.status} />
        </td>
        <td className="py-3.5 px-4 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/requests/${request.id}`);
            }}
            className="bg-civic-dark hover:bg-civic-darkHover text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs"
          >
            Detail
          </button>
        </td>
      </tr>
    ));
  }

  return (
    <div className="bg-civic-surface p-5 sm:p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <div>
          <h3 className="font-extrabold text-base text-civic-dark flex items-center gap-2">
            <FileText className="w-4 h-4 text-civic-muted" />
            <span>Permohonan Terbaru</span>
          </h3>
          <p className="text-xs text-civic-muted mt-0.5">Daftar permohonan yang baru saja masuk</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/requests')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-dark hover:opacity-80 bg-civic-cardFill px-3 py-1.5 rounded-xl border border-civic-border transition-all cursor-pointer"
        >
          <span>Semua Data</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-civic-border text-civic-muted font-bold uppercase tracking-wider text-2xs">
              <th className="py-3 px-4">No. Ref</th>
              <th className="py-3 px-4">Pengirim / Instansi</th>
              <th className="py-3 px-4">Tanggal Kunjungan</th>
              <th className="py-3 px-4">Pimpinan</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-civic-border text-civic-dark font-medium">
            {renderBody()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
