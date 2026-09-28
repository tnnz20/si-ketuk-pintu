import { Copy, Eye, MoreHorizontal, SearchX, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import type { PaginatedRequestsResponse } from '@/types/api';
import { formatDate } from '@/lib/dateTime';

type RequestRow = PaginatedRequestsResponse['data'][number];

interface RequestTableContentProps {
  requests: PaginatedRequestsResponse['data'];
  loading: boolean;
  onViewDetail: (id: string) => void;
  onCopyToken: (row: RequestRow) => void;
  onDelete?: (row: RequestRow) => void;
}

export default function RequestTableContent({
  requests,
  loading,
  onViewDetail,
  onCopyToken,
  onDelete,
}: RequestTableContentProps) {
  function renderBody() {
    if (loading) {
      return Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
        <TableRow key={key}>
          <TableCell colSpan={7} className="px-4 py-4">
            <Skeleton className="h-6 w-full rounded-xl" />
          </TableCell>
        </TableRow>
      ));
    }

    if (requests.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="px-4 py-12 text-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>Tidak ada permohonan</EmptyTitle>
                <EmptyDescription>Tidak ada permohonan yang sesuai filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      );
    }

    return requests.map((request) => (
      <TableRow key={request.id} className="hover:bg-civic-cardFill group transition-colors">
        {/* No. Ref / Token */}
        <TableCell className="font-bold text-civic-dark">
          <span className="bg-civic-cardFill inline-block rounded-lg border border-civic-border/70 px-2.5 py-1 font-mono text-label-sm transition-colors group-hover:bg-white">
            {request.token}
          </span>
        </TableCell>

        {/* Pengirim / Instansi */}
        <TableCell>
          <p className="max-w-55 truncate font-bold text-civic-dark">{request.nama_instansi}</p>
          <p className="max-w-55 truncate text-2xs text-civic-muted">
            Dibuat: {formatDate(request.created_at)}
          </p>
        </TableCell>

        {/* Tanggal Kunjungan */}
        <TableCell className="font-semibold">{formatDate(request.tanggal_kunjungan)}</TableCell>

        {/* Pimpinan Rombongan */}
        <TableCell className="max-w-45 truncate text-civic-muted">
          {request.pimpinan_rombongan || '-'}
        </TableCell>

        {/* Jumlah Tamu */}
        <TableCell className="font-bold">
          <span className="bg-civic-neutralFill rounded-md px-2 py-0.5 text-2xs text-civic-dark">
            {request.jumlah_tamu} Org
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          <StatusBadge status={request.status} />
        </TableCell>

        {/* Actions Dropdown */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="hover:bg-civic-neutralFill cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:text-civic-dark"
                aria-label={`Aksi untuk ${request.nama_instansi}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onViewDetail(request.id)}>
                  <Eye className="h-3.5 w-3.5 text-civic-muted" />
                  <span>Lihat Detail</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyToken(request)}>
                  <Copy className="h-3.5 w-3.5 text-civic-muted" />
                  <span>Salin Token</span>
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(request)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Ref</TableHead>
          <TableHead>Pengirim / Instansi</TableHead>
          <TableHead>Tanggal Kunjungan</TableHead>
          <TableHead>Pimpinan Rombongan</TableHead>
          <TableHead>Tamu</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{renderBody()}</TableBody>
    </Table>
  );
}
