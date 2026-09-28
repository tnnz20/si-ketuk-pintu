import { ArrowRight, Eye, FileText, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { PaginatedRequestsResponse } from '@/types/api';
import { formatDate } from '@/lib/dateTime';

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
        <TableRow key={i}>
          <TableCell colSpan={6} className="px-4 py-3.5">
            <Skeleton className="h-6 w-full rounded-xl" />
          </TableCell>
        </TableRow>
      ));
    }

    if (requests.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="px-4 py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Belum ada permohonan</EmptyTitle>
                <EmptyDescription>Belum ada permohonan yang masuk.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      );
    }

    return [...requests]
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 5)
      .map((request) => (
        <TableRow key={request.id}>
          {/* No. Ref / Token */}
          <TableCell className="font-bold whitespace-nowrap text-civic-dark">
            <span className="bg-civic-cardFill rounded-lg border border-civic-border/70 px-2.5 py-1 font-mono text-label-sm">
              {request.token}
            </span>
          </TableCell>
          <TableCell>
            <p className="max-w-50 truncate font-bold text-civic-dark">{request.nama_instansi}</p>
          </TableCell>
          <TableCell className="font-semibold whitespace-nowrap">
            {formatDate(request.tanggal_kunjungan)}
          </TableCell>
          <TableCell className="max-w-40 truncate text-civic-muted">
            {request.pimpinan_rombongan}
          </TableCell>
          <TableCell className="whitespace-nowrap">
            <StatusBadge status={request.status} />
          </TableCell>
          <TableCell className="text-right whitespace-nowrap">
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
          </TableCell>
        </TableRow>
      ));
  }

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-civic-border p-5 pb-4 sm:p-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-extrabold text-civic-dark">
            <FileText className="h-4 w-4 text-civic-muted" />
            <span>Permohonan Terbaru</span>
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs text-civic-muted">
            Daftar permohonan yang baru saja masuk
          </CardDescription>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/requests')}
          className="bg-civic-cardFill inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-civic-border px-3 py-1.5 text-xs font-bold text-civic-dark transition-all hover:opacity-80"
        >
          <span>Semua Data</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Ref</TableHead>
              <TableHead>Pengirim / Instansi</TableHead>
              <TableHead>Tanggal Kunjungan</TableHead>
              <TableHead>Pimpinan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
