import { ArrowLeft, SearchX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DaftarAbsenCard from '@components/archives/DaftarAbsenCard';
import AttachedDocumentsCard from '@components/archives/AttachedDocumentsCard';
import DocumentationCard from '@components/archives/DocumentationCard';
import RequestAuditHistory from '@components/requests/RequestDetailAuditHistory';
import RequestDetails from '@components/requests/RequestDetailDetails';
import RequestGuests from '@components/requests/RequestDetailGuests';
import RequestSummary from '@components/requests/RequestDetailSummary';
import Skeleton from '@components/shared/Skeleton';
import { getArchiveById } from '@lib/api/archives';
import type { Attachment, RequestDetailResponse } from '@app-types/api';

export default function ArchiveDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getArchiveById(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
          <div className="space-y-5 lg:col-span-4">
            <Skeleton className="h-60 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Archives only render approved requests; anything else is treated as not found.
  const isApprovedArchive = data?.request.status === 'approved';

  if (!data || !isApprovedArchive) {
    return (
      <div className="soft-shadow flex flex-col items-center justify-center space-y-3 rounded-3xl border border-civic-border bg-civic-surface p-12 text-center">
        <SearchX className="h-8 w-8 text-civic-muted" />
        <p className="text-sm font-bold text-rose-600">
          Arsip tidak ditemukan atau belum disetujui.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/archives')}
          className="cursor-pointer rounded-xl bg-civic-dark px-4 py-2 text-xs font-bold text-white"
        >
          Kembali ke Arsip
        </button>
      </div>
    );
  }

  const { request } = data;
  const documentationImages: Attachment[] = request.attachments.filter(
    (attachment) => attachment.attachment_type === 'images',
  );
  const daftarAbsen = request.attachments.find(
    (attachment) => attachment.attachment_type === 'daftar_absen',
  );

  return (
    <div className="animate-fade-in space-y-5">
      {/* Navigation Breadcrumb & Back Link */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => navigate('/dashboard/archives')}
          className="soft-shadow inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-civic-border bg-civic-surface px-3.5 py-2 text-xs font-bold text-civic-dark transition-all hover:opacity-80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Arsip</span>
        </button>

        <span className="bg-civic-neutralFill w-fit rounded-full border border-civic-border/70 px-3 py-1 font-mono text-xs font-extrabold text-civic-dark">
          ID Ref: {request.token}
        </span>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN (Span 8): Primary Data & History */}
        <div className="space-y-5 lg:col-span-8">
          <RequestSummary request={request} />
          <RequestDetails request={request} />
          <RequestGuests guests={request.guests || []} />
          <RequestAuditHistory events={data.audit_events || []} />
        </div>

        {/* RIGHT COLUMN (Span 4): Archive Documents */}
        <div className="space-y-5 lg:col-span-4">
          <DocumentationCard requestId={request.id} images={documentationImages} onChanged={load} />
          <DaftarAbsenCard requestId={request.id} attachment={daftarAbsen} onChanged={load} />
          <AttachedDocumentsCard requestId={request.id} attachments={request.attachments} />
        </div>
      </div>
    </div>
  );
}
