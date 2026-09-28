import * as React from 'react';
import { format, isValid, parse, startOfToday } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Matcher } from 'react-day-picker';

export interface DatePickerProps {
  /**
   * Selected date value either as 'YYYY-MM-DD' string or Date object.
   */
  value?: string | Date;

  /**
   * Callback invoked when a date is selected or cleared.
   * Emits 'YYYY-MM-DD' string format, or empty string '' when cleared.
   */
  onChange?: (dateString: string, dateObj?: Date) => void;

  /**
   * Placeholder text when no date is selected.
   * @default 'Pilih tanggal'
   */
  placeholder?: string;

  /**
   * Disable past dates before today.
   * @default false
   */
  disablePastDates?: boolean;

  /**
   * Custom disabled matchers passed to react-day-picker.
   */
  disabled?: Matcher | Matcher[];

  /**
   * Allow user to clear selected date.
   * @default true
   */
  clearable?: boolean;

  /**
   * Custom class names for the trigger button.
   */
  className?: string;

  /**
   * Whether the date picker trigger is disabled.
   */
  disabledTrigger?: boolean;

  /**
   * HTML id or aria-label for accessibility.
   */
  id?: string;
  'aria-label'?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  disablePastDates = false,
  disabled,
  clearable = true,
  className,
  disabledTrigger = false,
  id,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse value to Date
  const selectedDate = React.useMemo<Date | undefined>(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    if (typeof value === 'string') {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      return isValid(parsed) ? parsed : undefined;
    }
    return undefined;
  }, [value]);

  // Combine disabled matchers: if disablePastDates is true, add { before: startOfToday() }
  const disabledMatchers = React.useMemo<Matcher | Matcher[] | undefined>(() => {
    const list: Matcher[] = [];
    if (disablePastDates) {
      list.push({ before: startOfToday() });
    }
    if (disabled) {
      if (Array.isArray(disabled)) {
        list.push(...disabled);
      } else {
        list.push(disabled);
      }
    }
    return list.length > 0 ? list : undefined;
  }, [disablePastDates, disabled]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      onChange?.(dateString, date);
    } else {
      onChange?.('', undefined);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('', undefined);
  };

  const formattedDisplay = React.useMemo(() => {
    if (!selectedDate) return null;
    return format(selectedDate, 'dd MMMM yyyy', { locale: localeId });
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabledTrigger}
        className={cn(
          'soft-shadow group hover:bg-civic-neutralFill/40 inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs font-medium text-civic-dark transition-all focus:border-civic-dark focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          !selectedDate && 'text-civic-muted',
          className,
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="size-4 shrink-0 text-civic-muted transition-colors group-hover:text-civic-dark" />
          <span className="truncate">{formattedDisplay ?? placeholder}</span>
        </span>

        {clearable && selectedDate && !disabledTrigger && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Hapus tanggal"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClear(e as unknown as React.MouseEvent);
              }
            }}
            className="hover:bg-civic-neutralFill rounded-md p-0.5 text-civic-muted/70 hover:text-civic-dark"
          >
            <X className="size-3.5" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto border border-civic-border bg-civic-surface p-1 shadow-2xl"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabledMatchers}
          autoFocus
          showOutsideDays
          showYearSwitcher
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
