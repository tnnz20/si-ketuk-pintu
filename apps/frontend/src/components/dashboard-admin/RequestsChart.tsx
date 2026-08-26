import { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ChartItem, ChartPeriod } from '@app-types/dashboard';
import type { GraphPoint } from '@app-types/api';
import {
  DEFAULT_MONTH,
  DEFAULT_YEAR,
  INDO_DAYS,
  INDO_MONTHS,
  INDO_MONTHS_SHORT,
  YEAR_RANGE,
} from '@constants/dashboard';
import Skeleton from '@components/shared/Skeleton';
import { WITA_ZONE } from '@lib/dateTime';
import { getRequestsGraph } from '../../lib/api/requests';
import MonthCalendarPicker from './MonthCalendarPicker';
import ChartBars from './ChartBars';
import ChartSummaryMetrics from './ChartSummaryMetrics';

function buildChartItems(
  period: ChartPeriod,
  year: number,
  month: number,
  points: GraphPoint[],
): ChartItem[] {
  const countMap = new Map(points.map((p) => [p.period, p.count]));

  if (period === 'daily') {
    const daysInMonth =
      DateTime.fromObject({ year, month: month + 1 }, { zone: WITA_ZONE }).daysInMonth ?? 30;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const weekday =
        DateTime.fromObject({ year, month: month + 1, day }, { zone: WITA_ZONE }).weekday % 7;
      return {
        key: dateStr,
        label: `${day}`,
        subLabel: `${INDO_DAYS[weekday]}, ${day} ${INDO_MONTHS[month]} ${year}`,
        count: countMap.get(dateStr) ?? 0,
      };
    });
  }

  if (period === 'monthly') {
    return INDO_MONTHS_SHORT.map((m, idx) => ({
      key: `m-${idx}`,
      label: m,
      subLabel: `${INDO_MONTHS[idx]} ${year}`,
      count: points.reduce(
        (acc, p) =>
          acc + (p.period.startsWith(`${year}-${String(idx + 1).padStart(2, '0')}`) ? p.count : 0),
        0,
      ),
    }));
  }

  return YEAR_RANGE.map((y) => ({
    key: `${y}`,
    label: `${y}`,
    subLabel: `Tahun ${y}${y === DEFAULT_YEAR ? ' (Tahun Berjalan)' : ''}`,
    count: points.reduce((acc, p) => acc + (p.period.startsWith(`${y}`) ? p.count : 0), 0),
  }));
}

function todayBarIndex(month: number, year: number, daysInMonth: number): number {
  const now = DateTime.now().setZone(WITA_ZONE);
  return now.year === year && now.month - 1 === month ? Math.min(now.day - 1, daysInMonth - 1) : 0;
}

function currentWeekOffset(month: number, year: number): number {
  const now = DateTime.now().setZone(WITA_ZONE);
  return now.year === year && now.month - 1 === month ? Math.floor((now.day - 1) / 7) : 0;
}

export default function RequestsChart() {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('daily');
  const [chart, setChart] = useState<{ key: string; data: ChartItem[] }>({ key: '', data: [] });

  // Daily View Filter States (Date flexibility)
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(DEFAULT_MONTH); // 0-indexed: 7 = Agustus
  const [dailyViewRange, setDailyViewRange] = useState<'all_month' | '7_days'>('all_month');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activeBarIndex, setActiveBarIndex] = useState<number>(() =>
    todayBarIndex(
      DEFAULT_MONTH,
      DEFAULT_YEAR,
      DateTime.fromObject({ year: DEFAULT_YEAR, month: DEFAULT_MONTH + 1 }, { zone: WITA_ZONE })
        .daysInMonth ?? 30,
    ),
  );

  // Calendar Picker Popup State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(DEFAULT_YEAR);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  // Close calendar popover on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  const requestKey = `${chartPeriod}-${selectedYear}-${selectedMonth}`;
  const chartLoading = chart.key !== requestKey;
  const chartData = chart.data;

  useEffect(() => {
    let mounted = true;
    getRequestsGraph({
      period: chartPeriod,
      year: selectedYear,
      month: chartPeriod === 'daily' ? selectedMonth + 1 : undefined,
    })
      .then((res) => {
        if (mounted)
          setChart({
            key: requestKey,
            data: buildChartItems(chartPeriod, selectedYear, selectedMonth, res.data),
          });
      })
      .catch(() => {
        if (mounted) {
          toast.error('Gagal memuat grafik permohonan.');
          setChart({
            key: requestKey,
            data: buildChartItems(chartPeriod, selectedYear, selectedMonth, []),
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [chartPeriod, selectedYear, selectedMonth, requestKey]);

  const currentChartData =
    chartPeriod === 'daily' && dailyViewRange === '7_days'
      ? chartData.slice(weekOffset * 7, weekOffset * 7 + 7)
      : chartData;

  // Safe active index handling
  const safeActiveIndex =
    activeBarIndex >= 0 && activeBarIndex < currentChartData.length
      ? activeBarIndex
      : currentChartData.length > 0
        ? currentChartData.length - 1
        : 0;

  // Compute metrics for current chart
  const maxCount = Math.max(...currentChartData.map((d) => d.count), 1);
  const totalPeriodCount = currentChartData.reduce((acc, curr) => acc + curr.count, 0);
  const averageCount = (totalPeriodCount / (currentChartData.length || 1)).toFixed(1);
  const peakItem = currentChartData.reduce(
    (prev, curr) => (curr.count > prev.count ? curr : prev),
    currentChartData[0] || { key: '-', label: '-', count: 0, subLabel: '-' },
  );

  const periodUnit =
    chartPeriod === 'daily' ? 'hari' : chartPeriod === 'monthly' ? 'bulan' : 'tahun';

  const daysInMonth =
    DateTime.fromObject({ year: selectedYear, month: selectedMonth + 1 }, { zone: WITA_ZONE })
      .daysInMonth ?? 30;
  const maxWeekOffset = Math.floor((daysInMonth - 1) / 7);

  const handlePeriodChange = (period: ChartPeriod) => {
    setChartPeriod(period);
    setIsCalendarOpen(false);
    if (period === 'daily') {
      const todayIdx = todayBarIndex(selectedMonth, selectedYear, daysInMonth);
      const offset = currentWeekOffset(selectedMonth, selectedYear);
      setActiveBarIndex(dailyViewRange === '7_days' ? todayIdx - offset * 7 : todayIdx);
    } else if (period === 'monthly') setActiveBarIndex(selectedMonth);
    else setActiveBarIndex(YEAR_RANGE.length - 1);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
      setPickerYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setWeekOffset(0);
    setActiveBarIndex(0);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
      setPickerYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setWeekOffset(0);
    setActiveBarIndex(0);
  };

  const handleSelectMonthFromPicker = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setSelectedYear(pickerYear);
    setWeekOffset(0);
    setActiveBarIndex(0);
    setIsCalendarOpen(false);
    toast.success(`Menampilkan data ${INDO_MONTHS[monthIndex]} ${pickerYear}`);
  };

  return (
    <div className="soft-shadow relative space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6 lg:col-span-8">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-3.5 border-b border-civic-border pb-4 md:flex-row md:items-center">
        {/* Title & Description */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-civic-neutral-fill text-civic-dark">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-extrabold text-civic-dark">Grafik Permohonan Masuk</h3>
          </div>
          <p className="mt-1 text-xs font-medium text-civic-muted">
            Tren permohonan kunjungan instansi
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:flex-nowrap md:self-auto">
          {/* Total Count Badge */}
          <div className="bg-civic-cardFill rounded-xl border border-civic-border px-3 py-1.5 text-xs font-bold whitespace-nowrap text-civic-dark">
            Total:{' '}
            <span className="font-extrabold text-civic-dark">
              {totalPeriodCount.toLocaleString('id-ID')} Permohonan
            </span>
          </div>

          {/* 3-Option Filter Pill Toggle */}
          <div className="bg-civic-cardFill grid w-64 shrink-0 grid-cols-3 rounded-xl border border-civic-border p-0.5">
            <button
              type="button"
              onClick={() => handlePeriodChange('daily')}
              className={`cursor-pointer rounded-lg py-1 text-center text-xs font-extrabold transition-all ${
                chartPeriod === 'daily'
                  ? 'bg-civic-dark text-white shadow-sm'
                  : 'text-civic-muted hover:text-civic-dark'
              }`}
            >
              Per Hari
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('monthly')}
              className={`cursor-pointer rounded-lg py-1 text-center text-xs font-extrabold transition-all ${
                chartPeriod === 'monthly'
                  ? 'bg-civic-dark text-white shadow-sm'
                  : 'text-civic-muted hover:text-civic-dark'
              }`}
            >
              Per Bulan
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('yearly')}
              className={`cursor-pointer rounded-lg py-1 text-center text-xs font-extrabold transition-all ${
                chartPeriod === 'yearly'
                  ? 'bg-civic-dark text-white shadow-sm'
                  : 'text-civic-muted hover:text-civic-dark'
              }`}
            >
              Per Tahun
            </button>
          </div>
        </div>
      </div>

      {/* ================= DATE & MONTH NAVIGATOR (FOR PER HARI & PER BULAN) ================= */}
      <div className="bg-civic-cardFill/80 relative flex flex-col justify-between gap-2.5 rounded-2xl border border-civic-border p-2.5 text-xs sm:flex-row sm:items-center">
        {chartPeriod === 'daily' ? (
          <>
            {/* Month Navigator Controls with Interactive Popover Button */}
            <div className="relative flex items-center gap-2" ref={calendarRef}>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Bulan Sebelumnya"
                className="cursor-pointer rounded-xl border border-civic-border bg-civic-surface p-1.5 text-civic-dark shadow-2xs transition-colors hover:bg-civic-neutral-fill"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Interactive Calendar Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setPickerYear(selectedYear);
                  setIsCalendarOpen((prev) => !prev);
                }}
                className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-civic-border bg-civic-surface px-3 py-1 font-extrabold text-civic-dark shadow-2xs transition-all hover:bg-civic-neutral-fill/70"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-civic-muted transition-colors group-hover:text-civic-dark" />
                <span>
                  {INDO_MONTHS[selectedMonth]} {selectedYear}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-civic-muted transition-transform duration-200 ${
                    isCalendarOpen ? 'rotate-180 text-civic-dark' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Bulan Berikutnya"
                className="cursor-pointer rounded-xl border border-civic-border bg-civic-surface p-1.5 text-civic-dark shadow-2xs transition-colors hover:bg-civic-neutral-fill"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* ================= CALENDAR & MONTH-YEAR PICKER POPOVER ================= */}
              <MonthCalendarPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                pickerYear={pickerYear}
                isOpen={isCalendarOpen}
                onSelectMonth={handleSelectMonthFromPicker}
                onSelectYear={setPickerYear}
                onClose={() => setIsCalendarOpen(false)}
              />
            </div>

            {/* Range Toggle: Semua Hari (1-31) vs 7 Hari */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-civic-border bg-civic-surface p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setDailyViewRange('all_month');
                    setWeekOffset(0);
                    setActiveBarIndex(todayBarIndex(selectedMonth, selectedYear, daysInMonth));
                  }}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-label-sm font-extrabold transition-all ${
                    dailyViewRange === 'all_month'
                      ? 'bg-civic-dark text-white shadow-sm'
                      : 'text-civic-muted hover:text-civic-dark'
                  }`}
                >
                  Semua Tanggal (1–{daysInMonth})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const todayIdx = todayBarIndex(selectedMonth, selectedYear, daysInMonth);
                    const offset = currentWeekOffset(selectedMonth, selectedYear);
                    setDailyViewRange('7_days');
                    setWeekOffset(offset);
                    setActiveBarIndex(todayIdx - offset * 7);
                  }}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-label-sm font-extrabold transition-all ${
                    dailyViewRange === '7_days'
                      ? 'bg-civic-dark text-white shadow-sm'
                      : 'text-civic-muted hover:text-civic-dark'
                  }`}
                >
                  7 Hari
                </button>
              </div>

              {/* Week Navigator if in 7_days mode */}
              {dailyViewRange === '7_days' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                    disabled={weekOffset === 0}
                    title="Minggu Sebelumnya"
                    className="cursor-pointer rounded-lg border border-civic-border bg-civic-surface p-1 text-civic-dark hover:bg-civic-neutral-fill disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => Math.min(maxWeekOffset, prev + 1))}
                    disabled={weekOffset >= maxWeekOffset}
                    title="Minggu Berikutnya"
                    className="cursor-pointer rounded-lg border border-civic-border bg-civic-surface p-1 text-civic-dark hover:bg-civic-neutral-fill disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : chartPeriod === 'monthly' ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="cursor-pointer rounded-xl border border-civic-border bg-civic-surface p-1.5 text-civic-dark transition-colors hover:bg-civic-neutral-fill"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="rounded-xl border border-civic-border bg-civic-surface px-3 py-1 font-extrabold text-civic-dark">
                Tahun {selectedYear}
              </div>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="cursor-pointer rounded-xl border border-civic-border bg-civic-surface p-1.5 text-civic-dark transition-colors hover:bg-civic-neutral-fill"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs font-medium text-civic-muted">
              Menampilkan 12 bulan kalender tahun {selectedYear}
            </span>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-extrabold text-civic-dark">
              Tren Akumulasi Tahunan (2022–2026)
            </span>
            <span className="text-xs font-medium text-civic-muted">
              Rata-rata kenaikan volume +28% / tahun
            </span>
          </div>
        )}
      </div>

      {/* Interactive Chart with Scrollable / Flexible Bar Canvas */}
      {chartLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <ChartBars
          data={currentChartData}
          maxCount={maxCount}
          activeIndex={safeActiveIndex}
          onSelect={setActiveBarIndex}
          period={chartPeriod}
          dailyViewRange={dailyViewRange}
        />
      )}

      {/* Quick Metrics Summary Footer */}
      <ChartSummaryMetrics
        peakItem={peakItem}
        averageCount={averageCount}
        periodUnit={periodUnit}
        activeSubLabel={currentChartData[safeActiveIndex]?.subLabel || 'Pilih Batang'}
      />
    </div>
  );
}
