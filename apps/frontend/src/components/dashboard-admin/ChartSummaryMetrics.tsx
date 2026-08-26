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
            {activeSubLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
