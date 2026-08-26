import { useState } from 'react';
import { DateTime } from 'luxon';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  KeyRound,
  Paperclip,
  Trash2,
  XCircle,
} from 'lucide-react';
import StatusBadge from '@components/shared/StatusBadge';
import type { Attachment, VisitRequest } from '@app-types/api';
import { INDO_MONTHS } from '@constants/dashboard';
import { WITA_ZONE } from '@lib/dateTime';

type OriginalAttachmentType = Extract<
  Attachment['attachment_type'],
  'surat_kunjungan' | 'surat_tugas' | 'surat_persetujuan' | 'surat_reschedule'
>;

interface RequestActionsDocumentsProps {
  request: VisitRequest;
  onStatusChange: (status: 'approved' | 'rejected') => void;
  onPreview: (type: OriginalAttachmentType, filename: string) => void;
  onGeneratePdf: () => void;
  onApprovalGenerate: () => void;
  onApprovalDownload: () => void;
  onApprovalDelete: () => void;
  onRescheduleGenerate: () => void;
  onRescheduleDownload: () => void;
  onRescheduleDelete: () => void;
  generating: boolean;
  approvalBusy: boolean;
}

export default function RequestDetailActionsDocuments({
  request,
  onStatusChange,
  onPreview,
  onGeneratePdf,
  onApprovalGenerate,
  onApprovalDownload,
  onApprovalDelete,
  onRescheduleGenerate,
  onRescheduleDownload,
  onRescheduleDelete,
  generating,
  approvalBusy,
}: RequestActionsDocumentsProps) {
  // Parse visit date for calendar widget
  const visitDate = request.tanggal_kunjungan
    ? DateTime.fromISO(request.tanggal_kunjungan, { zone: WITA_ZONE })
    : DateTime.now().setZone(WITA_ZONE);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const displayedDate = visitDate.plus({ months: calendarMonthOffset }).startOf('month');

  const currentMonthName = INDO_MONTHS[displayedDate.month - 1];
  const currentYear = displayedDate.year;

  // Calculate calendar grid days
  const startDayOfWeek = displayedDate.weekday % 7; // 0 = Sunday
  const daysInMonth = displayedDate.daysInMonth ?? 30;
  const daysInPrevMonth = displayedDate.minus({ months: 1 }).daysInMonth ?? 31;

  const calendarDays: { day: number; isCurrentMonth: boolean; isVisitDay: boolean }[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isVisitDay: false,
    });
  }

  // Current month days
  const isSameMonthAsVisit =
    displayedDate.month === visitDate.month && displayedDate.year === visitDate.year;

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isVisitDay: isSameMonthAsVisit && i === visitDate.day,
    });
  }

  // Next month leading days to complete grid (42 cells max)
  const remainingCells = 35 - calendarDays.length;
  if (remainingCells > 0) {
    for (let i = 1; i <= remainingCells; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: false,
        isVisitDay: false,
      });
    }
  }

  const hasApprovalLetter = request.attachments?.some(
    (a) => a.attachment_type === 'surat_persetujuan',
  );
  const hasRescheduleLetter = request.attachments?.some(
    (a) => a.attachment_type === 'surat_reschedule',
  );

  const mainAttachments = (request.attachments || []).filter(
    (doc): doc is Attachment & { attachment_type: OriginalAttachmentType } =>
      doc.attachment_type === 'surat_kunjungan' || doc.attachment_type === 'surat_tugas',
  );

  return (
    <div className="space-y-5">
      {/* ================= 1. PANEL AKSI ADMIN ================= */}
      <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-civic-border pb-3">
          <KeyRound className="h-4 w-4 text-civic-dark" />
          <h3 className="text-base font-extrabold text-civic-dark">Aksi Admin</h3>
        </div>

        {/* Current Status Box */}
        <div className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3.5">
          <span className="text-xs font-bold text-civic-muted">Status Saat Ini</span>
          <StatusBadge status={request.status} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {request.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange('approved')}
                disabled={approvalBusy}
                className="hover:bg-civic-darkHover flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-civic-dark px-4 py-3 text-xs font-extrabold text-white shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Setujui Permohonan</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('rejected')}
                disabled={approvalBusy}
                className="hover:bg-civic-rejectedBg text-civic-rejectedText flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-civic-border bg-civic-surface px-4 py-3 text-xs font-bold transition-all hover:border-rose-300 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Tolak Permohonan</span>
              </button>

              {/* Reschedule Button */}
              {hasRescheduleLetter ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onRescheduleDownload}
                    disabled={approvalBusy}
                    className="hover:bg-civic-cardFill flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-civic-border bg-civic-surface px-3 py-2.5 text-xs font-bold text-civic-dark transition-all disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5 text-civic-muted" />
                    <span>Surat Reschedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRescheduleDelete}
                    disabled={approvalBusy}
                    className="bg-civic-rejectedBg text-civic-rejectedText cursor-pointer rounded-2xl border border-rose-200 p-2.5 transition-colors hover:bg-rose-100 disabled:opacity-50"
                    title="Hapus surat reschedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRescheduleGenerate}
                  disabled={approvalBusy}
                  className="hover:bg-civic-cardFill flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-civic-border bg-civic-surface px-4 py-2.5 text-xs font-bold text-civic-dark transition-all disabled:opacity-50"
                >
                  <Clock className="h-4 w-4 text-civic-muted" />
                  <span>Jadwalkan Ulang</span>
                </button>
              )}
            </>
          )}

          {/* Approved Specific Action */}
          {request.status === 'approved' && (
            <div>
              {hasApprovalLetter ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onApprovalDownload}
                    disabled={approvalBusy}
                    className="hover:bg-civic-darkHover flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-civic-dark px-4 py-3 text-xs font-extrabold text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh Surat Persetujuan</span>
                  </button>
                  <button
                    type="button"
                    onClick={onApprovalDelete}
                    disabled={approvalBusy}
                    className="bg-civic-rejectedBg text-civic-rejectedText cursor-pointer rounded-2xl border border-rose-200 p-3 transition-colors hover:bg-rose-100 disabled:opacity-50"
                    title="Hapus surat persetujuan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onApprovalGenerate}
                  disabled={approvalBusy}
                  className="hover:bg-civic-darkHover flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-civic-dark px-4 py-3 text-xs font-extrabold text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>Buat Surat Persetujuan</span>
                </button>
              )}
            </div>
          )}

          {/* Download PDF Surat Permohonan */}
          <button
            type="button"
            onClick={onGeneratePdf}
            disabled={generating}
            className="hover:bg-civic-cardFill flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-civic-border bg-civic-surface px-4 py-3 text-xs font-bold text-civic-dark transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-civic-muted" />
            <span>Unduh Surat Permohonan</span>
          </button>
        </div>
      </div>

      {/* ================= 2. DOKUMEN TERLAMPIR ================= */}
      <div className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-civic-border pb-3">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
            <Paperclip className="h-4 w-4 text-civic-muted" />
            <span>Dokumen Terlampir</span>
          </h3>
          <span className="text-xs font-medium text-civic-muted">
            {mainAttachments.length} File
          </span>
        </div>

        {/* Document Items */}
        <div className="space-y-2">
          {mainAttachments.length === 0 ? (
            <p className="py-3 text-center text-xs text-civic-muted">Tidak ada file terlampir.</p>
          ) : (
            mainAttachments.map((doc) => (
              <div
                key={doc.attachment_type}
                className="bg-civic-cardFill hover:bg-civic-neutralFill/50 group flex items-center justify-between rounded-2xl border border-civic-border p-3 transition-colors"
              >
                <div className="mr-2 flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 shrink-0 text-civic-muted" />
                  <span className="truncate text-xs font-bold text-civic-dark">
                    {doc.original_name}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onPreview(doc.attachment_type, doc.original_name)}
                    className="cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark"
                    title="Lihat Dokumen"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= 3. MINI CALENDAR WIDGET ================= */}
      <div className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-5">
        {/* Calendar Month Header */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
            aria-label="Bulan sebelumnya"
            className="hover:bg-civic-cardFill cursor-pointer rounded-lg p-1 text-civic-dark transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-civic-dark">
            <CalendarIcon className="h-3.5 w-3.5 text-civic-muted" />
            <span>
              {currentMonthName}, {currentYear}
            </span>
          </h4>
          <button
            type="button"
            onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
            aria-label="Bulan berikutnya"
            className="hover:bg-civic-cardFill cursor-pointer rounded-lg p-1 text-civic-dark transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-2xs font-extrabold text-civic-muted uppercase">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-civic-dark">
          {calendarDays.map((item, idx) => (
            <div key={idx} className="flex h-7 items-center justify-center">
              {item.isVisitDay ? (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-civic-dark text-xs font-extrabold text-white shadow-sm ring-2 ring-civic-dark/20"
                  title="Tanggal Kunjungan"
                >
                  {item.day}
                </span>
              ) : (
                <span
                  className={`text-xs ${
                    item.isCurrentMonth
                      ? 'hover:bg-civic-cardFill flex h-6 w-6 items-center justify-center rounded-md text-civic-dark'
                      : 'text-civic-muted/40'
                  }`}
                >
                  {item.day}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
