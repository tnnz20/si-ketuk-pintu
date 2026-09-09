import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AttendanceCard from '@components/requests/AttendanceCard';
import AttachedDocumentsCard from '@components/requests/AttachedDocumentsCard';
import DocumentationCard from '@components/requests/DocumentationCard';
import RequestAuditHistory from '@components/requests/RequestDetailAuditHistory';
import RequestDetails from '@components/requests/RequestDetailDetails';
import RequestGuests from '@components/requests/RequestDetailGuests';
import RequestNotFoundState from '@components/requests/RequestNotFoundState';
import RequestSummary from '@components/requests/RequestDetailSummary';
import SuratPermohonanCard from '@components/requests/SuratPermohonanCard';
import Dialog from '@components/shared/Dialog';
import LoadingOverlay from '@components/shared/LoadingOverlay';
import Skeleton from '@components/shared/Skeleton';
import type { Attachment, VisitLetterAttachment, VisitRequest } from '@app-types/api';
import { ApiError } from '@lib/api/client';
import { downloadAttachmentByToken, getRequestByToken } from '@lib/api/requests';
import { generateVisitRequestPdf } from '@lib/pdf/visitRequestPdf';

function isArchiveAttachment(attachment: Attachment) {
  return attachment.attachment_type === 'images' || attachment.attachment_type === 'daftar_absen';
}

export default function RequestStatus() {
  const { token } = useParams();
  const [result, setResult] = useState<{
    token: string | null;
    request: VisitRequest | null;
    loading: boolean;
    error: 'not-found' | 'network' | null;
  }>({ token: null, request: null, loading: true, error: null });
  const [generating, setGenerating] = useState(false);
  const [retry, setRetry] = useState(0);
  const [imagePreview, setImagePreview] = useState<{ attachment: Attachment; url: string }>();
  const previewUrls = useRef<Set<string>>(new Set());

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getRequestByToken(token)
      .then((data) => {
        if (!cancelled) setResult({ token, request: data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            token,
            request: null,
            loading: false,
            error: error instanceof ApiError && error.status === 404 ? 'not-found' : 'network',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, retry]);

  const hasCurrentResult = result.token === token;
  const request = hasCurrentResult ? result.request : null;
  const loading = !hasCurrentResult || result.loading;
  const error = hasCurrentResult && result.error;

  async function previewAttachment(attachment: Attachment) {
    if (!token || attachment.attachment_type === 'surat_reschedule') return;

    if (attachment.attachment_type === 'images') {
      try {
        const blob = await downloadAttachmentByToken(token, 'images', attachment.id);
        const url = URL.createObjectURL(blob);
        previewUrls.current.add(url);
        setImagePreview({ attachment, url });
      } catch {
        toast.error('Gagal membuka berkas.');
      }
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      toast.error('Izinkan popup untuk membuka berkas.');
      return;
    }

    let url: string | undefined;
    try {
      const attachmentId = isArchiveAttachment(attachment) ? attachment.id : undefined;
      const blob = await downloadAttachmentByToken(token, attachment.attachment_type, attachmentId);
      url = URL.createObjectURL(blob);
      previewUrls.current.add(url);
      previewWindow.location.href = url;
    } catch {
      if (url) URL.revokeObjectURL(url);
      previewWindow.close();
      toast.error('Gagal membuka berkas.');
    }
  }

  function closeImagePreview() {
    if (!imagePreview) return;
    previewUrls.current.delete(imagePreview.url);
    URL.revokeObjectURL(imagePreview.url);
    setImagePreview(undefined);
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

  if (!token || error === 'not-found') {
    return <RequestNotFoundState token={token || ''} backToHomeIcon="help-circle" />;
  }

  if (error === 'network') {
    return (
      <div className="mx-auto max-w-container-max px-margin-mobile py-20 text-center md:px-margin-desktop">
        <p className="text-sm font-bold text-civic-dark">
          Terjadi kesalahan saat memuat status permohonan.
        </p>
        <button
          type="button"
          onClick={() => {
            setResult({ token, request: null, loading: true, error: null });
            setRetry((value) => value + 1);
          }}
          className="mt-4 rounded-xl bg-civic-dark px-4 py-2 text-sm font-bold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
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
    (attachment): attachment is VisitLetterAttachment =>
      attachment.attachment_type === 'surat_kunjungan' ||
      attachment.attachment_type === 'surat_tugas',
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

      {imagePreview && (
        <Dialog
          open
          title="Pratinjau Dokumentasi"
          description={imagePreview.attachment.original_name}
          onClose={closeImagePreview}
          footer={
            <a
              href={imagePreview.url}
              download={imagePreview.attachment.original_name}
              className="hover:bg-civic-darkHover cursor-pointer rounded-xl bg-civic-dark px-4 py-2 text-xs font-extrabold text-white transition-all"
            >
              Unduh
            </a>
          }
        >
          <img
            src={imagePreview.url}
            alt={`Pratinjau ${imagePreview.attachment.original_name}`}
            className="max-h-96 w-full rounded-xl border border-civic-border object-contain"
          />
        </Dialog>
      )}

      {generating && <LoadingOverlay />}
    </div>
  );
}
