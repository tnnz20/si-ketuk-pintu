import * as React from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DayPicker,
  labelNext,
  labelPrevious,
  useDayPicker,
  type DayPickerProps,
} from 'react-day-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps & {
  /**
   * In the year view, the number of years to display at once.
   * @default 12
   */
  yearRange?: number;

  /**
   * Whether to show the year switcher in the caption.
   * @default true
   */
  showYearSwitcher?: boolean;

  monthsClassName?: string;
  monthCaptionClassName?: string;
  weekdaysClassName?: string;
  weekdayClassName?: string;
  monthClassName?: string;
  captionClassName?: string;
  captionLabelClassName?: string;
  buttonNextClassName?: string;
  buttonPreviousClassName?: string;
  navClassName?: string;
  monthGridClassName?: string;
  weekClassName?: string;
  dayClassName?: string;
  dayButtonClassName?: string;
  rangeStartClassName?: string;
  rangeEndClassName?: string;
  selectedClassName?: string;
  todayClassName?: string;
  outsideClassName?: string;
  disabledClassName?: string;
  rangeMiddleClassName?: string;
  hiddenClassName?: string;
};

type NavView = 'days' | 'years';

function Calendar({
  className,
  showOutsideDays = true,
  showYearSwitcher = true,
  yearRange = 12,
  numberOfMonths,
  components,
  ...props
}: CalendarProps) {
  const [navView, setNavView] = React.useState<NavView>('days');
  const [displayYears, setDisplayYears] = React.useState<{
    from: number;
    to: number;
  }>(() => {
    const currentYear = new Date().getFullYear();
    return {
      from: currentYear - Math.floor(yearRange / 2 - 1),
      to: currentYear + Math.ceil(yearRange / 2),
    };
  });

  const { onNextClick, onPrevClick, startMonth, endMonth } = props;

  const columnsDisplayed = navView === 'years' ? 1 : numberOfMonths;

  const _monthsClassName = cn('relative flex', props.monthsClassName);
  const _monthCaptionClassName = cn(
    'relative mx-8 flex h-7 items-center justify-center',
    props.monthCaptionClassName,
  );
  const _weekdaysClassName = cn('flex flex-row justify-around', props.weekdaysClassName);
  const _weekdayClassName = cn(
    'w-8 text-center text-2xs font-bold text-civic-muted uppercase',
    props.weekdayClassName,
  );
  const _monthClassName = cn('w-full space-y-3', props.monthClassName);
  const _captionClassName = cn(
    'relative flex items-center justify-center pt-1',
    props.captionClassName,
  );
  const _captionLabelClassName = cn(
    'truncate text-xs font-bold text-civic-dark',
    props.captionLabelClassName,
  );
  const buttonNavClassName = buttonVariants({
    variant: 'outline',
    className:
      'absolute h-7 w-7 rounded-lg border-civic-border bg-transparent p-0 text-civic-muted hover:bg-civic-neutralFill/60 hover:text-civic-dark',
  });
  const _buttonNextClassName = cn(buttonNavClassName, 'right-0', props.buttonNextClassName);
  const _buttonPreviousClassName = cn(buttonNavClassName, 'left-0', props.buttonPreviousClassName);
  const _navClassName = cn('flex items-start', props.navClassName);
  const _monthGridClassName = cn('mx-auto w-full border-collapse', props.monthGridClassName);
  const _weekClassName = cn('mt-1 flex w-full justify-around', props.weekClassName);
  const _dayClassName = cn(
    'flex size-8 flex-1 items-center justify-center p-0 text-xs font-semibold',
    props.dayClassName,
  );
  const _dayButtonClassName = cn(
    'size-8 rounded-xl p-0 text-xs font-semibold text-civic-dark transition-all hover:bg-civic-neutralFill/70 aria-selected:opacity-100',
    props.dayButtonClassName,
  );
  const _rangeStartClassName = cn(
    'rounded-s-xl bg-civic-dark text-white',
    props.rangeStartClassName,
  );
  const _rangeEndClassName = cn('rounded-e-xl bg-civic-dark text-white', props.rangeEndClassName);
  const _rangeMiddleClassName = cn(
    'bg-civic-neutralFill text-civic-dark',
    props.rangeMiddleClassName,
  );
  const _selectedClassName = cn(
    '[&>button]:bg-civic-dark [&>button]:text-white [&>button]:hover:bg-civic-darkHover [&>button]:shadow-sm',
    props.selectedClassName,
  );
  const _todayClassName = cn(
    '[&>button]:border [&>button]:border-civic-dark/30 [&>button]:font-extrabold',
    props.todayClassName,
  );
  const _outsideClassName = cn(
    'day-outside text-civic-muted/40 aria-selected:bg-civic-neutralFill/50 aria-selected:text-civic-muted',
    props.outsideClassName,
  );
  const _disabledClassName = cn(
    'text-civic-muted/30 line-through cursor-not-allowed pointer-events-none',
    props.disabledClassName,
  );
  const _hiddenClassName = cn('invisible flex-1', props.hiddenClassName);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2 text-civic-dark select-none', className)}
      style={{
        width: 256 * (columnsDisplayed ?? 1) + 'px',
      }}
      classNames={{
        months: _monthsClassName,
        month_caption: _monthCaptionClassName,
        weekdays: _weekdaysClassName,
        weekday: _weekdayClassName,
        month: _monthClassName,
        caption: _captionClassName,
        caption_label: _captionLabelClassName,
        button_next: _buttonNextClassName,
        button_previous: _buttonPreviousClassName,
        nav: _navClassName,
        month_grid: _monthGridClassName,
        week: _weekClassName,
        day: _dayClassName,
        day_button: _dayButtonClassName,
        range_start: _rangeStartClassName,
        range_middle: _rangeMiddleClassName,
        range_end: _rangeEndClassName,
        selected: _selectedClassName,
        today: _todayClassName,
        outside: _outsideClassName,
        disabled: _disabledClassName,
        hidden: _hiddenClassName,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
        Nav: ({ className: navCls }) => (
          <Nav
            className={navCls}
            displayYears={displayYears}
            navView={navView}
            setDisplayYears={setDisplayYears}
            startMonth={startMonth}
            endMonth={endMonth}
            onPrevClick={onPrevClick}
            onNextClick={onNextClick}
          />
        ),
        CaptionLabel: (captionProps) => (
          <CaptionLabel
            showYearSwitcher={showYearSwitcher}
            navView={navView}
            setNavView={setNavView}
            displayYears={displayYears}
            {...captionProps}
          />
        ),
        MonthGrid: ({ className: gridCls, children, ...gridProps }) => (
          <MonthGrid
            className={gridCls}
            displayYears={displayYears}
            startMonth={startMonth}
            endMonth={endMonth}
            navView={navView}
            setNavView={setNavView}
            {...gridProps}
          >
            {children}
          </MonthGrid>
        ),
        ...components,
      }}
      numberOfMonths={columnsDisplayed}
      {...props}
    />
  );
}

function Nav({
  className,
  navView,
  startMonth,
  endMonth,
  displayYears,
  setDisplayYears,
  onPrevClick,
  onNextClick,
}: {
  className?: string;
  navView: NavView;
  startMonth?: Date;
  endMonth?: Date;
  displayYears: { from: number; to: number };
  setDisplayYears: React.Dispatch<React.SetStateAction<{ from: number; to: number }>>;
  onPrevClick?: (date: Date) => void;
  onNextClick?: (date: Date) => void;
}) {
  const { nextMonth, previousMonth, goToMonth } = useDayPicker();

  const isPreviousDisabled = (() => {
    if (navView === 'years') {
      return (
        (startMonth &&
          differenceInCalendarDays(new Date(displayYears.from - 1, 0, 1), startMonth) < 0) ||
        (endMonth && differenceInCalendarDays(new Date(displayYears.from - 1, 0, 1), endMonth) > 0)
      );
    }
    return !previousMonth;
  })();

  const isNextDisabled = (() => {
    if (navView === 'years') {
      return (
        (startMonth &&
          differenceInCalendarDays(new Date(displayYears.to + 1, 0, 1), startMonth) < 0) ||
        (endMonth && differenceInCalendarDays(new Date(displayYears.to + 1, 0, 1), endMonth) > 0)
      );
    }
    return !nextMonth;
  })();

  const handlePreviousClick = React.useCallback(() => {
    if (navView === 'years') {
      setDisplayYears((prev) => ({
        from: prev.from - (prev.to - prev.from + 1),
        to: prev.to - (prev.to - prev.from + 1),
      }));
      onPrevClick?.(new Date(displayYears.from - (displayYears.to - displayYears.from), 0, 1));
      return;
    }
    if (!previousMonth) return;
    goToMonth(previousMonth);
    onPrevClick?.(previousMonth);
  }, [navView, previousMonth, goToMonth, onPrevClick, setDisplayYears, displayYears]);

  const handleNextClick = React.useCallback(() => {
    if (navView === 'years') {
      setDisplayYears((prev) => ({
        from: prev.from + (prev.to - prev.from + 1),
        to: prev.to + (prev.to - prev.from + 1),
      }));
      onNextClick?.(new Date(displayYears.from + (displayYears.to - displayYears.from), 0, 1));
      return;
    }
    if (!nextMonth) return;
    goToMonth(nextMonth);
    onNextClick?.(nextMonth);
  }, [navView, nextMonth, goToMonth, onNextClick, setDisplayYears, displayYears]);

  return (
    <nav className={cn('flex items-center', className)}>
      <Button
        variant="outline"
        size="icon-xs"
        className="hover:bg-civic-neutralFill/60 absolute left-0 h-7 w-7 rounded-lg border-civic-border bg-transparent p-0 text-civic-muted hover:text-civic-dark"
        type="button"
        tabIndex={isPreviousDisabled ? -1 : 0}
        disabled={isPreviousDisabled}
        aria-label={
          navView === 'years'
            ? `Pindah ke ${displayYears.to - displayYears.from + 1} tahun sebelumnya`
            : previousMonth
              ? labelPrevious(previousMonth)
              : 'Sebelumnya'
        }
        onClick={handlePreviousClick}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon-xs"
        className="hover:bg-civic-neutralFill/60 absolute right-0 h-7 w-7 rounded-lg border-civic-border bg-transparent p-0 text-civic-muted hover:text-civic-dark"
        type="button"
        tabIndex={isNextDisabled ? -1 : 0}
        disabled={isNextDisabled}
        aria-label={
          navView === 'years'
            ? `Pindah ke ${displayYears.to - displayYears.from + 1} tahun berikutnya`
            : nextMonth
              ? labelNext(nextMonth)
              : 'Berikutnya'
        }
        onClick={handleNextClick}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

function CaptionLabel({
  children,
  showYearSwitcher,
  navView,
  setNavView,
  displayYears,
  ...props
}: {
  showYearSwitcher?: boolean;
  navView: NavView;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
  displayYears: { from: number; to: number };
} & React.HTMLAttributes<HTMLSpanElement>) {
  if (!showYearSwitcher) return <span {...props}>{children}</span>;
  return (
    <Button
      className="hover:bg-civic-neutralFill/70 h-7 w-auto rounded-lg px-2 text-xs font-bold text-civic-dark"
      variant="ghost"
      size="xs"
      type="button"
      onClick={() => setNavView((prev) => (prev === 'days' ? 'years' : 'days'))}
    >
      {navView === 'days' ? children : `${displayYears.from} - ${displayYears.to}`}
    </Button>
  );
}

function MonthGrid({
  className,
  children,
  displayYears,
  startMonth,
  endMonth,
  navView,
  setNavView,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  displayYears: { from: number; to: number };
  startMonth?: Date;
  endMonth?: Date;
  navView: NavView;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
} & React.TableHTMLAttributes<HTMLTableElement>) {
  if (navView === 'years') {
    return (
      <YearGrid
        displayYears={displayYears}
        startMonth={startMonth}
        endMonth={endMonth}
        setNavView={setNavView}
        navView={navView}
        className={className}
        {...props}
      />
    );
  }
  return (
    <table className={className} {...props}>
      {children}
    </table>
  );
}

function YearGrid({
  className,
  displayYears,
  startMonth,
  endMonth,
  setNavView,
  ...props
}: {
  className?: string;
  displayYears: { from: number; to: number };
  startMonth?: Date;
  endMonth?: Date;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
  navView: NavView;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { goToMonth, selected } = useDayPicker();

  return (
    <div className={cn('grid grid-cols-3 gap-2 py-2', className)} {...props}>
      {Array.from({ length: displayYears.to - displayYears.from + 1 }, (_, i) => {
        const yearNumber = displayYears.from + i;
        const isBefore =
          startMonth && differenceInCalendarDays(new Date(yearNumber, 11, 31), startMonth) < 0;
        const isAfter =
          endMonth && differenceInCalendarDays(new Date(yearNumber, 0, 1), endMonth) > 0;
        const isDisabled = isBefore || isAfter;

        const isCurrentYear = yearNumber === new Date().getFullYear();

        return (
          <Button
            key={yearNumber}
            type="button"
            className={cn(
              'h-8 w-full rounded-xl text-xs font-semibold text-civic-dark transition-all',
              isCurrentYear
                ? 'hover:bg-civic-darkHover bg-civic-dark text-white'
                : 'hover:bg-civic-neutralFill/70',
            )}
            variant="ghost"
            onClick={() => {
              setNavView('days');
              const targetDate =
                selected && typeof selected === 'object' && 'getMonth' in selected
                  ? (selected as unknown as Date)
                  : null;
              goToMonth(new Date(yearNumber, targetDate ? targetDate.getMonth() : 0));
            }}
            disabled={isDisabled}
          >
            {yearNumber}
          </Button>
        );
      })}
    </div>
  );
}

export { Calendar };
