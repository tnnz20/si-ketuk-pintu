import { useEffect, useRef, useState } from 'react';
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
import { DEFAULT_MONTH, DEFAULT_YEAR, INDO_DAYS, INDO_MONTHS, INDO_MONTHS_SHORT, YEAR_RANGE } from '@constants/dashboard';
import Skeleton from '@components/shared/Skeleton';
import { getRequestsGraph } from '../../lib/api/requests';
import MonthCalendarPicker from './MonthCalendarPicker';
import ChartBars from './ChartBars';
import ChartSummaryMetrics from './ChartSummaryMetrics';

function buildChartItems(period: ChartPeriod, year: number, month: number, points: GraphPoint[]): ChartItem[] {
  const countMap = new Map(points.map((p) => [p.period, p.count]));

  if (period === 'daily') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        key: dateStr,
        label: `${day}`,
        subLabel: `${INDO_DAYS[new Date(year, month, day).getDay()]}, ${day} ${INDO_MONTHS[month]} ${year}`,
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
        (acc, p) => acc + (p.period.startsWith(`${year}-${String(idx + 1).padStart(2, '0')}`) ? p.count : 0),
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
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month
    ? Math.min(now.getDate() - 1, daysInMonth - 1)
    : 0;
}

function currentWeekOffset(month: number, year: number): number {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month
    ? Math.floor((now.getDate() - 1) / 7)
    : 0;
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
    todayBarIndex(DEFAULT_MONTH, DEFAULT_YEAR, new Date(DEFAULT_YEAR, DEFAULT_MONTH + 1, 0).getDate()),
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
        if (mounted) setChart({ key: requestKey, data: buildChartItems(chartPeriod, selectedYear, selectedMonth, res.data) });
      })
      .catch(() => {
        if (mounted) {
          toast.error('Gagal memuat grafik permohonan.');
          setChart({ key: requestKey, data: buildChartItems(chartPeriod, selectedYear, selectedMonth, []) });
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

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
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
    <div className="lg:col-span-8 bg-civic-surface p-5 sm:p-6 rounded-3xl border border-civic-border soft-shadow space-y-4 relative">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-civic-border pb-4">
        {/* Title & Description */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-civic-neutral-fill text-civic-dark flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-civic-dark">Grafik Permohonan Masuk</h3>
          </div>
          <p className="text-xs text-civic-muted mt-1 font-medium">
            Tren permohonan kunjungan instansi
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap sm:flex-nowrap">
          {/* Total Count Badge */}
          <div className="bg-civic-cardFill border border-civic-border px-3 py-1.5 rounded-xl text-xs font-bold text-civic-dark whitespace-nowrap">
            Total:{' '}
            <span className="font-extrabold text-civic-dark">
              {totalPeriodCount.toLocaleString('id-ID')} Permohonan
            </span>
          </div>

          {/* 3-Option Filter Pill Toggle */}
          <div className="grid grid-cols-3 bg-civic-cardFill p-0.5 rounded-xl border border-civic-border w-64 shrink-0">
            <button
              type="button"
              onClick={() => handlePeriodChange('daily')}
              className={`py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${
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
              className={`py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${
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
              className={`py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${
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
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-civic-cardFill/80 p-2.5 rounded-2xl border border-civic-border text-xs">
        {chartPeriod === 'daily' ? (
          <>
            {/* Month Navigator Controls with Interactive Popover Button */}
            <div className="relative flex items-center gap-2" ref={calendarRef}>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Bulan Sebelumnya"
                className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutral-fill transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Interactive Calendar Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setPickerYear(selectedYear);
                  setIsCalendarOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-civic-surface hover:bg-civic-neutral-fill/70 border border-civic-border rounded-xl font-extrabold text-civic-dark cursor-pointer transition-all shadow-2xs group"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-civic-muted group-hover:text-civic-dark transition-colors" />
                <span>
                  {INDO_MONTHS[selectedMonth]} {selectedYear}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-civic-muted transition-transform duration-200 ${
                    isCalendarOpen ? 'rotate-180 text-civic-dark' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Bulan Berikutnya"
                className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutral-fill transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
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
              <div className="flex bg-civic-surface p-0.5 rounded-xl border border-civic-border">
                <button
                  type="button"
                  onClick={() => {
                    setDailyViewRange('all_month');
                    setWeekOffset(0);
                    setActiveBarIndex(todayBarIndex(selectedMonth, selectedYear, daysInMonth));
                  }}
                  className={`px-2.5 py-1 text-label-sm font-extrabold rounded-lg transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 text-label-sm font-extrabold rounded-lg transition-all cursor-pointer ${
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
                    className="p-1 rounded-lg bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutral-fill disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => Math.min(maxWeekOffset, prev + 1))}
                    disabled={weekOffset >= maxWeekOffset}
                    title="Minggu Berikutnya"
                    className="p-1 rounded-lg bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutral-fill disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : chartPeriod === 'monthly' ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutral-fill transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 bg-civic-surface border border-civic-border rounded-xl font-extrabold text-civic-dark">
                Tahun {selectedYear}
              </div>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutral-fill transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-civic-muted font-medium">
              Menampilkan 12 bulan kalender tahun {selectedYear}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-extrabold text-civic-dark">
              Tren Akumulasi Tahunan (2022–2026)
            </span>
            <span className="text-xs text-civic-muted font-medium">
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
