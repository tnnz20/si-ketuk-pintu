import { BarChart3, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import type { ChartItem } from '@app-types/dashboard';

interface ChartSummaryMetricsProps {
  peakItem: ChartItem;
  averageCount: string;
  periodUnit: 'hari' | 'bulan' | 'tahun';
  activeSubLabel: string;
}

export default function ChartSummaryMetrics({
  peakItem,
  averageCount,
  periodUnit,
  activeSubLabel,
}: ChartSummaryMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-civic-border pt-3 text-xs sm:grid-cols-3">
      <div className="bg-civic-cardFill flex items-center gap-2 rounded-2xl border border-civic-border p-2.5">
        <TrendingUp className="h-4 w-4 shrink-0 text-civic-dark" />
        <div className="min-w-0">
          <span className="block text-2xs font-medium text-civic-muted">Puncak Tertinggi</span>
          <span className="block truncate text-xs font-extrabold text-civic-dark">
            {peakItem.count.toLocaleString('id-ID')} Dokumen ({peakItem.label})
          </span>
        </div>
      </div>

      <div className="bg-civic-cardFill flex items-center gap-2 rounded-2xl border border-civic-border p-2.5">
        <BarChart3 className="h-4 w-4 shrink-0 text-civic-dark" />
        <div className="min-w-0">
          <span className="block text-2xs font-medium text-civic-muted">Rata-rata Volume</span>
          <span className="block truncate text-xs font-extrabold text-civic-dark">
            {Number(averageCount).toLocaleString('id-ID')} / {periodUnit}
          </span>
        </div>
      </div>

      <div className="bg-civic-cardFill flex items-center gap-2 rounded-2xl border border-civic-border p-2.5">
        <CalendarIcon className="h-4 w-4 shrink-0 text-civic-dark" />
        <div className="min-w-0">
          <span className="block text-2xs font-medium text-civic-muted">
            Hari / Periode Terpilih
          </span>
          <span className="block truncate text-xs font-extrabold text-civic-dark">
            {activeSubLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
