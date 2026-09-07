import { ClipboardList, Download, Eye, FileText, Images, Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/shared/Empty';
import LoadingOverlay from '../../components/shared/LoadingOverlay';
import RequestNotFoundState from '../../components/requests/RequestNotFoundState';
import RequestDetails from '../../components/requests/RequestDetailDetails';
import RequestGuests from '../../components/requests/RequestDetailGuests';
import RequestAuditHistory from '../../components/requests/RequestDetailAuditHistory';
import RequestSummary from '../../components/requests/RequestDetailSummary';
import Skeleton from '../../components/shared/Skeleton';
import { downloadAttachmentByToken, getRequestByToken } from '../../lib/api/requests';
import { generateVisitRequestPdf } from '../../lib/pdf/visitRequestPdf';
import type { Attachment, VisitRequest } from '@app-types/api';

const attachmentLabels: Record<
  Exclude<Attachment['attachment_type'], 'images' | 'daftar_absen'>,
  string
> = {
  surat_kunjungan: 'Surat Kunjungan',
  surat_tugas: 'Surat Tugas',
  surat_persetujuan: 'Surat Persetujuan',
  surat_reschedule: 'Surat Penjadwalan Ulang',
};

function isArchiveAttachment(attachment: Attachment) {
  return attachment.attachment_type === 'images' || attachment.attachment_type === 'daftar_absen';
}

function EmptyAttachmentState({
  icon,
  title,
  description,
}: {
  icon: 'images' | 'clipboard';
  title: string;
  description: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon === 'images' ? <Images /> : <ClipboardList />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function SuratPermohonanCard({
  generating,
  onGeneratePdf,
}: {
  generating: boolean;
  onGeneratePdf: () => void;
}) {
  return (
    <section className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="text-sm font-extrabold text-civic-dark">Surat Permohonan</h3>
      </div>

      <div className="space-y-2">
        <div className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3">
          <div className="mr-2 min-w-0 truncate">
            <p className="text-2xs font-extrabold tracking-wider text-civic-muted uppercase">
              Surat Permohonan
            </p>
            <p className="truncate text-xs font-bold text-civic-dark">Unduh Surat Permohonan</p>
          </div>
          <button
            type="button"
            onClick={onGeneratePdf}
            disabled={generating}
            aria-label="Unduh Surat Permohonan"
            title="Unduh Berkas"
            className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function AttachedDocumentsCard({
  attachments,
  onPreview,
}: {
  attachments: Attachment[];
  onPreview: (attachment: Attachment) => void;
}) {
  return (
    <section className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Paperclip className="h-4 w-4 text-civic-muted" />
          <span>Dokumen Terlampir</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">{attachments.length} berkas</span>
      </div>

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="py-3 text-center text-xs text-civic-muted">Tidak ada berkas terlampir.</p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={`${attachment.id}-${attachment.attachment_type}`}
              className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3"
            >
              <div className="mr-2 min-w-0 truncate">
                <p className="text-2xs font-extrabold tracking-wider text-civic-muted uppercase">
                  {attachmentLabels[
                    attachment.attachment_type as Exclude<
                      Attachment['attachment_type'],
                      'images' | 'daftar_absen'
                    >
                  ] || attachment.attachment_type}
                </p>
                <p className="truncate text-xs font-bold text-civic-dark">
                  {attachment.original_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPreview(attachment)}
                aria-label={`Lihat ${attachment.original_name}`}
                title="Lihat Berkas"
                className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DocumentationCard({
  images,
  onPreview,
}: {
  images: Attachment[];
  onPreview: (attachment: Attachment) => void;
}) {
  return (
    <section className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Images className="h-4 w-4 text-civic-muted" />
          <span>Dokumentasi</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">{images.length} berkas</span>
      </div>

      {images.length === 0 ? (
        <EmptyAttachmentState
          icon="images"
          title="Belum ada dokumentasi"
          description="Dokumentasi kunjungan belum tersedia."
        />
      ) : (
        <div className="space-y-2">
          {images.map((image) => (
            <div
              key={`${image.id}-${image.attachment_type}`}
              className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3"
            >
              <div className="mr-2 flex min-w-0 items-center gap-2">
                <Images className="h-4 w-4 shrink-0 text-civic-muted" />
                <span className="truncate text-xs font-bold text-civic-dark">
                  {image.original_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onPreview(image)}
                aria-label={`Lihat ${image.original_name}`}
                title="Lihat Berkas"
                className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AttendanceCard({
  attachment,
  onPreview,
}: {
  attachment?: Attachment;
  onPreview: (attachment: Attachment) => void;
}) {
  return (
    <section className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <ClipboardList className="h-4 w-4 text-civic-muted" />
          <span>Daftar Absen</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">
          {attachment ? '1 berkas' : '0 berkas'}
        </span>
      </div>

      {attachment ? (
        <div className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3.5">
          <div className="mr-2 flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-civic-dark">
              <FileText className="h-5 w-5" />
            </div>
            <span className="truncate text-xs font-bold text-civic-dark">
              {attachment.original_name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onPreview(attachment)}
            aria-label={`Lihat ${attachment.original_name}`}
            title="Lihat Berkas"
            className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <EmptyAttachmentState
          icon="clipboard"
          title="Belum ada daftar absen"
          description="Daftar absen kunjungan belum tersedia."
        />
      )}
    </section>
  );
}

export default function RequestStatus() {
  const { token } = useParams();
  const [result, setResult] = useState<{
    token: string | null;
    request: VisitRequest | null;
    loading: boolean;
    error: boolean;
  }>({ token: null, request: null, loading: true, error: false });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getRequestByToken(token)
      .then((data) => {
        if (!cancelled) setResult({ token, request: data, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ token, request: null, loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const hasCurrentResult = result.token === token;
  const request = hasCurrentResult ? result.request : null;
  const loading = !hasCurrentResult || result.loading;
  const error = hasCurrentResult && result.error;

  async function previewAttachment(attachment: Attachment) {
    if (!token || attachment.attachment_type === 'surat_reschedule') return;

    try {
      const attachmentId = isArchiveAttachment(attachment) ? attachment.id : undefined;
      const blob = await downloadAttachmentByToken(token, attachment.attachment_type, attachmentId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Gagal membuka berkas.');
    }
  }

  function generatePdf() {
    if (generating || !request) return;
    setGenerating(true);
    try {
      generateVisitRequestPdf(request);
      toast.success('Surat permohonan berhasil diunduh.');
    } catch {
      toast.error('Gagal membuat surat permohonan.');
    } finally {
      setGenerating(false);
    }
  }

  if (!token || error) {
    return <RequestNotFoundState token={token || ''} backToHomeIcon="help-circle" />;
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5 px-margin-mobile py-12 md:px-margin-desktop">
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

  if (!request) {
    return <RequestNotFoundState token={token || ''} backToHomeIcon="help-circle" />;
  }

  const documents = request.attachments.filter(
    (attachment) =>
      attachment.attachment_type === 'surat_kunjungan' ||
      attachment.attachment_type === 'surat_tugas' ||
      attachment.attachment_type === 'surat_persetujuan',
  );
  const documentationImages = request.attachments.filter(
    (attachment) => attachment.attachment_type === 'images',
  );
  const daftarAbsen = request.attachments.find(
    (attachment) => attachment.attachment_type === 'daftar_absen',
  );
  const isApproved = request.status === 'approved';

  return (
    <div className="animate-fade-in mx-auto max-w-container-max space-y-5 px-margin-mobile py-12 md:px-margin-desktop">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold tracking-wider text-civic-muted uppercase">
            Status Permohonan
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-civic-dark sm:text-3xl">
            Permohonan Kunjungan
          </h1>
        </div>
        <span className="bg-civic-neutralFill w-fit rounded-full border border-civic-border/70 px-3 py-1 font-mono text-xs font-extrabold text-civic-dark">
          ID Ref: {request.token}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <RequestSummary request={request} />
          <RequestDetails request={request} />
          <RequestGuests guests={request.guests || []} />
          <RequestAuditHistory events={request.audit_events || []} />
        </div>

        <div className="space-y-5 lg:col-span-4">
          <SuratPermohonanCard generating={generating} onGeneratePdf={generatePdf} />
          <AttachedDocumentsCard
            attachments={documents}
            onPreview={(attachment) => void previewAttachment(attachment)}
          />
          {isApproved && (
            <>
              <DocumentationCard
                images={documentationImages}
                onPreview={(attachment) => void previewAttachment(attachment)}
              />
              <AttendanceCard
                attachment={daftarAbsen}
                onPreview={(attachment) => void previewAttachment(attachment)}
              />
            </>
          )}
        </div>
      </div>

      {generating && <LoadingOverlay />}
    </div>
  );
}
