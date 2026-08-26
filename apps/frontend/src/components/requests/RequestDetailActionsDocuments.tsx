import { useState } from 'react';
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
  const visitDate = request.tanggal_kunjungan ? new Date(request.tanggal_kunjungan) : new Date();
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const displayedDate = new Date(
    visitDate.getFullYear(),
    visitDate.getMonth() + calendarMonthOffset,
    1,
  );

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const currentMonthName = monthNames[displayedDate.getMonth()];
  const currentYear = displayedDate.getFullYear();

  // Calculate calendar grid days
  const startDayOfWeek = displayedDate.getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, displayedDate.getMonth() + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, displayedDate.getMonth(), 0).getDate();

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
    displayedDate.getMonth() === visitDate.getMonth() &&
    displayedDate.getFullYear() === visitDate.getFullYear();

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isVisitDay: isSameMonthAsVisit && i === visitDate.getDate(),
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
    (doc) =>
      doc.attachment_type !== 'surat_persetujuan' && doc.attachment_type !== 'surat_reschedule',
  );

  return (
    <div className="space-y-5">
      {/* ================= 1. PANEL AKSI ADMIN ================= */}
      <div className="bg-civic-surface p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-civic-border pb-3">
          <KeyRound className="w-4 h-4 text-civic-dark" />
          <h3 className="font-extrabold text-base text-civic-dark">Aksi Admin</h3>
        </div>

        {/* Current Status Box */}
        <div className="bg-civic-cardFill p-3.5 rounded-2xl border border-civic-border flex items-center justify-between">
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
                className="w-full bg-civic-dark hover:bg-civic-darkHover text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Setujui Permohonan</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange('rejected')}
                disabled={approvalBusy}
                className="w-full bg-civic-surface hover:bg-civic-rejectedBg border border-civic-border hover:border-rose-300 text-civic-rejectedText font-bold text-xs py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Tolak Permohonan</span>
              </button>

              {/* Reschedule Button */}
              {hasRescheduleLetter ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onRescheduleDownload}
                    disabled={approvalBusy}
                    className="flex-1 bg-civic-surface hover:bg-civic-cardFill border border-civic-border text-civic-dark font-bold text-xs py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-civic-muted" />
                    <span>Surat Reschedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRescheduleDelete}
                    disabled={approvalBusy}
                    className="p-2.5 rounded-2xl border border-rose-200 bg-civic-rejectedBg text-civic-rejectedText hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                    title="Hapus surat reschedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRescheduleGenerate}
                  disabled={approvalBusy}
                  className="w-full bg-civic-surface hover:bg-civic-cardFill border border-civic-border text-civic-dark font-bold text-xs py-2.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-4 h-4 text-civic-muted" />
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
                    className="flex-1 bg-civic-dark hover:bg-civic-darkHover text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Surat Persetujuan</span>
                  </button>
                  <button
                    type="button"
                    onClick={onApprovalDelete}
                    disabled={approvalBusy}
                    className="p-3 rounded-2xl border border-rose-200 bg-civic-rejectedBg text-civic-rejectedText hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                    title="Hapus surat persetujuan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onApprovalGenerate}
                  disabled={approvalBusy}
                  className="w-full bg-civic-dark hover:bg-civic-darkHover text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
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
            className="w-full bg-civic-surface hover:bg-civic-cardFill border border-civic-border text-civic-dark font-bold text-xs py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-civic-muted" />
            <span>Unduh Surat Permohonan</span>
          </button>
        </div>
      </div>

      {/* ================= 2. DOKUMEN TERLAMPIR ================= */}
      <div className="bg-civic-surface p-6 rounded-3xl border border-civic-border soft-shadow space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-civic-border pb-3">
          <h3 className="font-extrabold text-sm text-civic-dark flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-civic-muted" />
            <span>Dokumen Terlampir</span>
          </h3>
          <span className="text-xs text-civic-muted font-medium">
            {mainAttachments.length} File
          </span>
        </div>

        {/* Document Items */}
        <div className="space-y-2">
          {mainAttachments.length === 0 ? (
            <p className="text-xs text-civic-muted text-center py-3">Tidak ada file terlampir.</p>
          ) : (
            mainAttachments.map((doc) => (
              <div
                key={doc.attachment_type}
                className="p-3 bg-civic-cardFill hover:bg-civic-neutralFill/50 rounded-2xl border border-civic-border flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <FileText className="w-4 h-4 text-civic-muted shrink-0" />
                  <span className="text-xs font-bold text-civic-dark truncate">
                    {doc.original_name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreview(doc.attachment_type, doc.original_name)}
                    className="p-1.5 text-civic-muted hover:text-civic-dark hover:bg-white rounded-xl transition-colors cursor-pointer"
                    title="Lihat Dokumen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= 3. MINI CALENDAR WIDGET ================= */}
      <div className="bg-civic-surface p-5 rounded-3xl border border-civic-border soft-shadow space-y-3.5">
        {/* Calendar Month Header */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
            aria-label="Bulan sebelumnya"
            className="p-1 hover:bg-civic-cardFill rounded-lg text-civic-dark transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="font-extrabold text-xs text-civic-dark flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-civic-muted" />
            <span>
              {currentMonthName}, {currentYear}
            </span>
          </h4>
          <button
            type="button"
            onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
            aria-label="Bulan berikutnya"
            className="p-1 hover:bg-civic-cardFill rounded-lg text-civic-dark transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
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
            <div key={idx} className="h-7 flex items-center justify-center">
              {item.isVisitDay ? (
                <span
                  className="w-6 h-6 rounded-full bg-civic-dark text-white font-extrabold flex items-center justify-center text-xs shadow-sm ring-2 ring-civic-dark/20"
                  title="Tanggal Kunjungan"
                >
                  {item.day}
                </span>
              ) : (
                <span
                  className={`text-xs ${
                    item.isCurrentMonth
                      ? 'text-civic-dark hover:bg-civic-cardFill rounded-md w-6 h-6 flex items-center justify-center'
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
