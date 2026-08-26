import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-civic-surface border border-civic-border rounded-3xl p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
      {/* Popover Header: Year Navigator */}
      <div className="flex items-center justify-between border-b border-civic-border pb-2.5">
        <span className="text-xs font-extrabold text-civic-dark">Pilih Waktu</span>
        <div className="flex items-center gap-1 bg-civic-cardFill px-2 py-0.5 rounded-xl border border-civic-border">
          <button
            type="button"
            onClick={() => onSelectYear(pickerYear - 1)}
            className="p-1 rounded-lg hover:bg-civic-neutral-fill text-civic-dark cursor-pointer transition-colors"
            title="Tahun Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-extrabold text-xs text-civic-dark px-1">{pickerYear}</span>
          <button
            type="button"
            onClick={() => onSelectYear(pickerYear + 1)}
            className="p-1 rounded-lg hover:bg-civic-neutral-fill text-civic-dark cursor-pointer transition-colors"
            title="Tahun Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
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
              className={`py-2 px-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                isSelected
                  ? 'bg-civic-dark text-white shadow-md'
                  : 'bg-civic-cardFill hover:bg-civic-neutral-fill text-civic-dark border border-civic-border/70 hover:border-civic-dark/40'
              }`}
            >
              {monthName}
            </button>
          );
        })}
      </div>

      {/* Quick Shortcut Buttons */}
      <div className="pt-2 border-t border-civic-border flex items-center justify-between gap-2 text-2xs font-extrabold">
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            onSelectYear(now.getFullYear());
            onSelectMonth(now.getMonth());
          }}
          className="px-2.5 py-1 rounded-lg bg-civic-cardFill hover:bg-civic-neutral-fill text-civic-dark border border-civic-border transition-colors cursor-pointer"
        >
          Bulan Ini
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded-lg text-civic-muted hover:text-civic-dark transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
