import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Skeleton from '@components/shared/Skeleton';
import StatusBadge from '@components/shared/StatusBadge';
import { getRequests, getStats } from '../../lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '@app-types/api';

type RequestItem = PaginatedRequestsResponse['data'][number];
type ChartPeriod = 'daily' | 'monthly' | 'yearly';

interface ChartItem {
  key: string;
  label: string;
  subLabel: string;
  count: number;
}

const INDO_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const INDO_MONTHS = [
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

const INDO_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse>();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('daily');

  // Daily View Filter States (Date flexibility)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 0-indexed: 7 = Agustus
  const [dailyViewRange, setDailyViewRange] = useState<'all_month' | '7_days'>('all_month');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activeBarIndex, setActiveBarIndex] = useState<number>(17); // 18th day default (0-indexed)

  // Calendar Picker Popup State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(2026);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getStats(), getRequests(1, 20)])
      .then(([statsRes, requestsRes]) => {
        if (!isMounted) return;
        setStats(statsRes);
        setRequests(requestsRes.data);
      })
      .catch(() => {
        if (isMounted) toast.error('Gagal memuat data dashboard.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Filter items by status for sample stat card teasers
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const latestPending = pendingRequests[0];
  const latestApproved = approvedRequests[0];
  const latestRejected = rejectedRequests[0];

  // Schedule for today / upcoming items
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySchedule = requests.filter((r) => r.tanggal_kunjungan === todayDateStr);
  const displaySchedule = todaySchedule.length > 0 ? todaySchedule : requests.slice(0, 3);

  // Request frequency map by date
  const requestCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach((req) => {
      if (req.tanggal_kunjungan) {
        map[req.tanggal_kunjungan] = (map[req.tanggal_kunjungan] || 0) + 1;
      }
    });
    return map;
  }, [requests]);

  // 1. GENERATE DYNAMIC DAILY DATA (Bisa lihat semua hari dalam bulan atau per 7 hari)
  const dailyData: ChartItem[] = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const allDays: ChartItem[] = [];

    // Seeded random / real counts for each day of the selected month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(selectedYear, selectedMonth, day);
      const dayName = INDO_DAYS[dateObj.getDay()];
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`;

      // Base count pattern or real request match
      const realCount = requestCountMap[dateStr];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const pseudoCount = isWeekend
        ? (day % 3)
        : (day * 3 + selectedMonth * 2) % 9 + 1;

      const finalCount = realCount !== undefined ? realCount : pseudoCount;

      allDays.push({
        key: dateStr,
        label: `${day}`,
        subLabel: `${dayName}, ${day} ${INDO_MONTHS[selectedMonth]} ${selectedYear}`,
        count: finalCount,
      });
    }

    if (dailyViewRange === '7_days') {
      const startIndex = Math.max(0, Math.min(weekOffset * 7, allDays.length - 7));
      return allDays.slice(startIndex, startIndex + 7);
    }

    return allDays;
  }, [selectedYear, selectedMonth, dailyViewRange, weekOffset, requestCountMap]);

  // 2. DATA BULANAN (12 Bulan dalam Tahun Terpilih)
  const monthlyData: ChartItem[] = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const baseDistribution = [14, 18, 22, 19, 26, 31, 28, 35, 24, 29, 33, 40];

    return months.map((m, idx) => ({
      key: `m-${idx}`,
      label: m,
      subLabel: `${INDO_MONTHS[idx]} ${selectedYear}`,
      count: baseDistribution[idx] || 20,
    }));
  }, [selectedYear]);

  // 3. DATA TAHUNAN (Tren multi-tahun)
  const yearlyData: ChartItem[] = useMemo(() => {
    return [
      { key: '2022', label: '2022', subLabel: 'Tahun 2022', count: 142 },
      { key: '2023', label: '2023', subLabel: 'Tahun 2023', count: 185 },
      { key: '2024', label: '2024', subLabel: 'Tahun 2024', count: 240 },
      { key: '2025', label: '2025', subLabel: 'Tahun 2025', count: 312 },
      { key: '2026', label: '2026', subLabel: 'Tahun 2026 (Tahun Berjalan)', count: 368 },
    ];
  }, []);

  const currentChartData =
    chartPeriod === 'daily'
      ? dailyData
      : chartPeriod === 'monthly'
      ? monthlyData
      : yearlyData;

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
    currentChartData[0] || { label: '-', count: 0, subLabel: '-' },
  );

  // Generate 5 Y-axis scale ticks
  const yTicks = [
    maxCount,
    Math.round(maxCount * 0.75),
    Math.round(maxCount * 0.5),
    Math.round(maxCount * 0.25),
    0,
  ];

  const handlePeriodChange = (period: ChartPeriod) => {
    setChartPeriod(period);
    setIsCalendarOpen(false);
    if (period === 'daily') setActiveBarIndex(17);
    else if (period === 'monthly') setActiveBarIndex(selectedMonth);
    else setActiveBarIndex(yearlyData.length - 1);
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

  const periodUnit =
    chartPeriod === 'daily' ? 'hari' : chartPeriod === 'monthly' ? 'bulan' : 'tahun';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ================= SECTION 1: RINGKASAN PERMOHONAN ================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-extrabold text-base text-civic-dark">Ringkasan Permohonan</h3>
          <button
            type="button"
            onClick={() => navigate('/dashboard/requests')}
            className="text-xs font-bold text-civic-muted hover:text-civic-dark transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Pending */}
          <div
            onClick={() => navigate('/dashboard/requests?status=pending')}
            className="bg-civic-surface p-4 rounded-3xl border border-civic-border soft-shadow space-y-3 cursor-pointer card-hover"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-civic-pendingBg text-civic-pendingText flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              {loading ? (
                <Skeleton className="h-5 w-20 rounded-full" />
              ) : (
                <span className="text-xs font-extrabold text-civic-pendingText bg-civic-pendingBg px-2.5 py-0.5 rounded-full border border-civic-border/70">
                  {stats?.pending_approval ?? pendingRequests.length} Pending
                </span>
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-civic-dark truncate">
                {latestPending ? latestPending.nama_instansi : 'Menunggu Verifikasi'}
              </h4>
              <p className="text-label-sm text-civic-muted mt-0.5 truncate">
                {latestPending
                  ? `Pimpinan: ${latestPending.pimpinan_rombongan}`
                  : 'Tidak ada permohonan pending'}
              </p>
            </div>
            <div className="pt-2 border-t border-civic-border flex items-center justify-between text-label-sm">
              <span className="text-civic-muted font-medium truncate max-w-35">
                {latestPending ? latestPending.token : 'Si Ketuk Pintu'}
              </span>
              <StatusBadge status="pending" />
            </div>
          </div>

          {/* Card 2: Disetujui */}
          <div
            onClick={() => navigate('/dashboard/requests?status=approved')}
            className="bg-civic-surface p-4 rounded-3xl border border-civic-border soft-shadow space-y-3 cursor-pointer card-hover"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-civic-approvedBg text-civic-approvedText flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              {loading ? (
                <Skeleton className="h-5 w-20 rounded-full" />
              ) : (
                <span className="text-xs font-extrabold text-civic-approvedText bg-civic-approvedBg px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  {approvedRequests.length} Disetujui
                </span>
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-civic-dark truncate">
                {latestApproved ? latestApproved.nama_instansi : 'Kunjungan Terjadwal'}
              </h4>
              <p className="text-label-sm text-civic-muted mt-0.5 truncate">
                {latestApproved
                  ? `Tgl: ${latestApproved.tanggal_kunjungan}`
                  : 'Belum ada kunjungan disetujui'}
              </p>
            </div>
            <div className="pt-2 border-t border-civic-border flex items-center justify-between text-label-sm">
              <span className="text-civic-muted font-medium truncate max-w-35">
                {latestApproved ? latestApproved.token : 'Si Ketuk Pintu'}
              </span>
              <StatusBadge status="approved" />
            </div>
          </div>

          {/* Card 3: Ditolak / Total */}
          <div
            onClick={() => navigate('/dashboard/requests')}
            className="bg-civic-surface p-4 rounded-3xl border border-civic-border soft-shadow space-y-3 cursor-pointer card-hover"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-civic-neutralFill text-civic-dark flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              {loading ? (
                <Skeleton className="h-5 w-20 rounded-full" />
              ) : (
                <span className="text-xs font-extrabold text-civic-dark bg-civic-neutralFill px-2.5 py-0.5 rounded-full border border-civic-border/70">
                  {stats?.total_requests ?? requests.length} Total
                </span>
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-civic-dark truncate">
                {latestRejected ? latestRejected.nama_instansi : 'Total Permohonan Masuk'}
              </h4>
              <p className="text-label-sm text-civic-muted mt-0.5 truncate">
                {rejectedRequests.length > 0
                  ? `${rejectedRequests.length} permohonan ditolak`
                  : 'Semua berkas termonitor'}
              </p>
            </div>
            <div className="pt-2 border-t border-civic-border flex items-center justify-between text-label-sm">
              <span className="text-civic-muted font-medium">Hari Ini: {stats?.today_requests ?? 0}</span>
              <span className="font-extrabold text-civic-dark">Si Ketuk Pintu</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: CHART & TODAY SCHEDULE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Activity Bar Chart Card (Span 8) */}
        <div className="lg:col-span-8 bg-civic-surface p-5 sm:p-6 rounded-3xl border border-civic-border soft-shadow space-y-4 relative">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-civic-border pb-4">
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-civic-neutralFill text-civic-dark flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-civic-dark">
                  Grafik Permohonan Masuk
                </h3>
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
                    className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer shadow-2xs"
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
                    className="flex items-center gap-1.5 px-3 py-1 bg-civic-surface hover:bg-civic-neutralFill/70 border border-civic-border rounded-xl font-extrabold text-civic-dark cursor-pointer transition-all shadow-2xs group"
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
                    className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer shadow-2xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* ================= CALENDAR & MONTH-YEAR PICKER POPOVER ================= */}
                  {isCalendarOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-civic-surface border border-civic-border rounded-3xl p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                      {/* Popover Header: Year Navigator */}
                      <div className="flex items-center justify-between border-b border-civic-border pb-2.5">
                        <span className="text-xs font-extrabold text-civic-dark">Pilih Waktu</span>
                        <div className="flex items-center gap-1 bg-civic-cardFill px-2 py-0.5 rounded-xl border border-civic-border">
                          <button
                            type="button"
                            onClick={() => setPickerYear((y) => y - 1)}
                            className="p-1 rounded-lg hover:bg-civic-neutralFill text-civic-dark cursor-pointer transition-colors"
                            title="Tahun Sebelumnya"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-xs text-civic-dark px-1">
                            {pickerYear}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPickerYear((y) => y + 1)}
                            className="p-1 rounded-lg hover:bg-civic-neutralFill text-civic-dark cursor-pointer transition-colors"
                            title="Tahun Berikutnya"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 12-Month Grid (3 cols x 4 rows) */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {INDO_MONTHS_SHORT.map((monthName, idx) => {
                          const isSelected =
                            idx === selectedMonth && pickerYear === selectedYear;

                          return (
                            <button
                              key={monthName}
                              type="button"
                              onClick={() => handleSelectMonthFromPicker(idx)}
                              className={`py-2 px-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-civic-dark text-white shadow-md'
                                  : 'bg-civic-cardFill hover:bg-civic-neutralFill text-civic-dark border border-civic-border/70 hover:border-civic-dark/40'
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
                            setPickerYear(now.getFullYear());
                            handleSelectMonthFromPicker(now.getMonth());
                          }}
                          className="px-2.5 py-1 rounded-lg bg-civic-cardFill hover:bg-civic-neutralFill text-civic-dark border border-civic-border transition-colors cursor-pointer"
                        >
                          Bulan Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="px-2.5 py-1 rounded-lg text-civic-muted hover:text-civic-dark transition-colors cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Range Toggle: Semua Hari (1-31) vs 7 Hari */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-civic-surface p-0.5 rounded-xl border border-civic-border">
                    <button
                      type="button"
                      onClick={() => {
                        setDailyViewRange('all_month');
                        setWeekOffset(0);
                      }}
                      className={`px-2.5 py-1 text-label-sm font-extrabold rounded-lg transition-all cursor-pointer ${
                        dailyViewRange === 'all_month'
                          ? 'bg-civic-dark text-white shadow-sm'
                          : 'text-civic-muted hover:text-civic-dark'
                      }`}
                    >
                      Semua Tanggal (1–{new Date(selectedYear, selectedMonth + 1, 0).getDate()})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDailyViewRange('7_days');
                        setWeekOffset(2); // Mid-month default
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
                        className="p-1 rounded-lg bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutralFill disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeekOffset((prev) => Math.min(3, prev + 1))}
                        disabled={weekOffset >= 3}
                        title="Minggu Berikutnya"
                        className="p-1 rounded-lg bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutralFill disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                    className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-3 py-1 bg-civic-surface border border-civic-border rounded-xl font-extrabold text-civic-dark">
                    Tahun {selectedYear}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedYear((y) => y + 1)}
                    className="p-1.5 rounded-xl bg-civic-surface border border-civic-border text-civic-dark hover:bg-civic-neutralFill transition-colors cursor-pointer"
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
          <div className="relative pt-2 pb-1">
            <div className="flex h-56 w-full">
              {/* Left Y-Axis Numeric Labels */}
              <div className="flex flex-col justify-between items-end pr-3 pb-7 select-none text-label-sm font-bold text-civic-muted/80 w-9 shrink-0">
                {yTicks.map((val, idx) => (
                  <span key={idx}>{val}</span>
                ))}
              </div>

              {/* Chart Grid + Bars Area */}
              <div className="relative flex-1 flex flex-col justify-between pb-7 min-w-0 overflow-x-auto">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-0 bottom-7 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-dashed border-civic-border" />
                  <div className="border-b border-dashed border-civic-border" />
                  <div className="border-b border-dashed border-civic-border" />
                  <div className="border-b border-dashed border-civic-border" />
                  <div className="border-b border-dashed border-civic-border" />
                </div>

                {/* Bars Container */}
                <div
                  className={`relative z-10 h-full flex items-end justify-between gap-1 sm:gap-2 px-1 ${
                    chartPeriod === 'daily' && dailyViewRange === 'all_month'
                      ? 'min-w-170'
                      : 'min-w-full'
                  }`}
                >
                  {currentChartData.map((item, index) => {
                    const isActive = safeActiveIndex === index;
                    const fillPercentage = Math.max(Math.round((item.count / maxCount) * 100), 10);
                    const isAllMonth = chartPeriod === 'daily' && dailyViewRange === 'all_month';

                    return (
                      <div
                        key={item.key}
                        onClick={() => setActiveBarIndex(index)}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                      >
                        {/* Always Legible Count Value Tag */}
                        <div
                          className={`mb-1.5 ${
                            isAllMonth ? 'text-3xs px-1 py-0' : 'text-2xs sm:text-xs px-1.5 py-0.5'
                          } font-extrabold rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-civic-dark text-white shadow-md scale-105'
                              : 'bg-civic-cardFill border border-civic-border text-civic-dark group-hover:border-civic-dark group-hover:bg-white'
                          }`}
                        >
                          {item.count}
                        </div>

                        {/* Bar Track Capsule */}
                        <div
                          className={`w-full ${
                            chartPeriod === 'yearly'
                              ? 'max-w-13.5'
                              : isAllMonth
                              ? 'max-w-4.5 sm:max-w-5.5'
                              : 'max-w-9 sm:max-w-11'
                          } bg-civic-cardFill/80 rounded-2xl overflow-hidden h-36 flex items-end border border-civic-border/70 p-0.5 sm:p-1 group-hover:border-civic-dark/40 transition-colors`}
                        >
                          <div
                            style={{ height: `${fillPercentage}%` }}
                            className={`w-full rounded-xl transition-all duration-300 ${
                              isActive
                                ? 'bg-civic-dark shadow-sm'
                                : 'bg-[#D1CDC2] group-hover:bg-civic-dark/70'
                            }`}
                          />
                        </div>

                        {/* X-Axis Label */}
                        <div className="mt-1.5 text-center select-none truncate w-full">
                          <p
                            className={`${
                              isAllMonth ? 'text-2xs' : 'text-xs'
                            } font-extrabold transition-colors truncate ${
                              isActive ? 'text-civic-dark' : 'text-civic-muted group-hover:text-civic-dark'
                            }`}
                          >
                            {item.label}
                          </p>
                          {chartPeriod === 'daily' && dailyViewRange === '7_days' && (
                            <p className="text-3xs text-civic-muted/80 font-medium whitespace-nowrap hidden sm:block">
                              {item.subLabel.split(',')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary Footer */}
          <div className="pt-3 border-t border-civic-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-civic-cardFill border border-civic-border">
              <TrendingUp className="w-4 h-4 text-civic-dark shrink-0" />
              <div className="min-w-0">
                <span className="text-2xs text-civic-muted block font-medium">Puncak Tertinggi</span>
                <span className="font-extrabold text-civic-dark text-xs truncate block">
                  {peakItem.count.toLocaleString('id-ID')} Dokumen ({peakItem.label})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-civic-cardFill border border-civic-border">
              <BarChart3 className="w-4 h-4 text-civic-dark shrink-0" />
              <div className="min-w-0">
                <span className="text-2xs text-civic-muted block font-medium">Rata-rata Volume</span>
                <span className="font-extrabold text-civic-dark text-xs truncate block">
                  {Number(averageCount).toLocaleString('id-ID')} / {periodUnit}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-civic-cardFill border border-civic-border">
              <CalendarIcon className="w-4 h-4 text-civic-dark shrink-0" />
              <div className="min-w-0">
                <span className="text-2xs text-civic-muted block font-medium">Hari / Periode Terpilih</span>
                <span className="font-extrabold text-civic-dark text-xs truncate block">
                  {currentChartData[safeActiveIndex]?.subLabel || 'Pilih Batang'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Card (Span 4) */}
        <div className="lg:col-span-4 bg-civic-surface p-5 rounded-3xl border border-civic-border soft-shadow space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-civic-border pb-3 mb-3">
              <h3 className="font-extrabold text-base text-civic-dark flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-civic-muted" />
                <span>Jadwal Terdekat</span>
              </h3>
              <span className="text-2xs font-extrabold bg-civic-neutralFill px-2.5 py-0.5 rounded-full text-civic-dark">
                {displaySchedule.length} Agenda
              </span>
            </div>

            <div className="space-y-2.5">
              {displaySchedule.length === 0 ? (
                <div className="p-6 text-center text-xs text-civic-muted rounded-2xl bg-civic-cardFill border border-civic-border">
                  Belum ada agenda kunjungan hari ini.
                </div>
              ) : (
                displaySchedule.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/dashboard/requests/${item.id}`)}
                    className="p-3 bg-civic-cardFill hover:bg-civic-neutralFill/60 rounded-2xl border border-civic-border flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-civic-dark text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-extrabold text-civic-dark truncate">
                          {item.nama_instansi}
                        </h4>
                        <p className="text-2xs text-civic-muted truncate">
                          {item.tanggal_kunjungan} • {item.jumlah_tamu} Tamu
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-civic-muted group-hover:text-civic-dark group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/requests')}
            className="w-full mt-3 bg-civic-cardFill hover:bg-civic-neutralFill border border-civic-border text-civic-dark font-extrabold text-xs py-2.5 rounded-2xl transition-colors text-center cursor-pointer"
          >
            Lihat Semua Jadwal
          </button>
        </div>
      </div>

      {/* ================= SECTION 3: PERMOHONAN TERBARU ================= */}
      <div className="bg-civic-surface p-5 sm:p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-civic-border pb-3">
          <div>
            <h3 className="font-extrabold text-base text-civic-dark flex items-center gap-2">
              <FileText className="w-4 h-4 text-civic-muted" />
              <span>Permohonan Terbaru</span>
            </h3>
            <p className="text-xs text-civic-muted mt-0.5">Daftar permohonan yang baru saja masuk</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/requests')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-dark hover:opacity-80 bg-civic-cardFill px-3 py-1.5 rounded-xl border border-civic-border transition-all cursor-pointer"
          >
            <span>Semua Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-civic-border text-civic-muted font-bold uppercase tracking-wider text-2xs">
                <th className="py-3 px-4">No. Ref</th>
                <th className="py-3 px-4">Pengirim / Instansi</th>
                <th className="py-3 px-4">Tanggal Kunjungan</th>
                <th className="py-3 px-4">Pimpinan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-civic-border text-civic-dark font-medium">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-3.5 px-4">
                        <Skeleton className="h-6 w-full rounded-xl" />
                      </td>
                    </tr>
                  ))
                : requests.slice(0, 5).map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-civic-cardFill transition-colors group cursor-pointer"
                      onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                    >
                      <td className="py-3.5 px-4 font-bold text-civic-dark whitespace-nowrap">
                        <span className="bg-civic-cardFill px-2.5 py-1 rounded-lg border border-civic-border/70 font-mono text-label-sm">
                          {request.token}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-civic-dark truncate max-w-50">
                          {request.nama_instansi}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                        {request.tanggal_kunjungan}
                      </td>
                      <td className="py-3.5 px-4 text-civic-muted truncate max-w-40">
                        {request.pimpinan_rombongan}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/requests/${request.id}`);
                          }}
                          className="bg-civic-dark hover:bg-civic-darkHover text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
