import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';
import { INDO_MONTHS_SHORT } from '@constants/dashboard';

interface MonthCalendarPickerProps {
  selectedMonth: number;
  selectedYear: number;
  pickerYear: number;
  isOpen: boolean;
  onSelectMonth: (monthIndex: number) => void;
  onSelectYear: (year: number) => void;
  onClose: () => void;
}

export default function MonthCalendarPicker({
  selectedMonth,
  selectedYear,
  pickerYear,
  isOpen,
  onSelectMonth,
  onSelectYear,
  onClose,
}: MonthCalendarPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-50 mt-2 w-72 space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-4 shadow-2xl duration-150">
      {/* Popover Header: Year Navigator */}
      <div className="flex items-center justify-between border-b border-civic-border pb-2.5">
        <span className="text-xs font-extrabold text-civic-dark">Pilih Waktu</span>
        <div className="bg-civic-cardFill flex items-center gap-1 rounded-xl border border-civic-border px-2 py-0.5">
          <button
            type="button"
            onClick={() => onSelectYear(pickerYear - 1)}
            className="cursor-pointer rounded-lg p-1 text-civic-dark transition-colors hover:bg-civic-neutral-fill"
            title="Tahun Sebelumnya"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-1 text-xs font-extrabold text-civic-dark">{pickerYear}</span>
          <button
            type="button"
            onClick={() => onSelectYear(pickerYear + 1)}
            className="cursor-pointer rounded-lg p-1 text-civic-dark transition-colors hover:bg-civic-neutral-fill"
            title="Tahun Berikutnya"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 12-Month Grid (3 cols x 4 rows) */}
      <div className="grid grid-cols-3 gap-1.5">
        {INDO_MONTHS_SHORT.map((monthName, idx) => {
          const isSelected = idx === selectedMonth && pickerYear === selectedYear;

          return (
            <button
              key={monthName}
              type="button"
              onClick={() => onSelectMonth(idx)}
              className={`cursor-pointer rounded-xl px-1 py-2 text-center text-xs font-extrabold transition-all ${
                isSelected
                  ? 'bg-civic-dark text-white shadow-md'
                  : 'bg-civic-cardFill border border-civic-border/70 text-civic-dark hover:border-civic-dark/40 hover:bg-civic-neutral-fill'
              }`}
            >
              {monthName}
            </button>
          );
        })}
      </div>

      {/* Quick Shortcut Buttons */}
      <div className="flex items-center justify-between gap-2 border-t border-civic-border pt-2 text-2xs font-extrabold">
        <button
          type="button"
          onClick={() => {
            const now = DateTime.now();
            onSelectYear(now.year);
            onSelectMonth(now.month - 1);
          }}
          className="bg-civic-cardFill cursor-pointer rounded-lg border border-civic-border px-2.5 py-1 text-civic-dark transition-colors hover:bg-civic-neutral-fill"
        >
          Bulan Ini
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg px-2.5 py-1 text-civic-muted transition-colors hover:text-civic-dark"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
