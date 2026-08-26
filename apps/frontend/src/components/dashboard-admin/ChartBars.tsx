import type { ChartItem, ChartPeriod } from '@app-types/dashboard';

interface ChartBarsProps {
  data: ChartItem[];
  maxCount: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  period: ChartPeriod;
  dailyViewRange: 'all_month' | '7_days';
}

export default function ChartBars({
  data,
  maxCount,
  activeIndex,
  onSelect,
  period,
  dailyViewRange,
}: ChartBarsProps) {
  const yTicks = [
    maxCount,
    Math.round(maxCount * 0.75),
    Math.round(maxCount * 0.5),
    Math.round(maxCount * 0.25),
    0,
  ];

  return (
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
              period === 'daily' && dailyViewRange === 'all_month' ? 'min-w-170' : 'min-w-full'
            }`}
          >
            {data.map((item, index) => {
              const isActive = activeIndex === index;
              const fillPercentage = Math.max(Math.round((item.count / maxCount) * 100), 10);
              const isAllMonth = period === 'daily' && dailyViewRange === 'all_month';

              return (
                <div
                  key={item.key}
                  onClick={() => onSelect(index)}
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
                      period === 'yearly'
                        ? 'max-w-13.5'
                        : isAllMonth
                        ? 'max-w-4.5 sm:max-w-5.5'
                        : 'max-w-9 sm:max-w-11'
                    } bg-civic-cardFill/80 rounded-2xl overflow-hidden h-36 flex items-end border border-civic-border/70 p-0.5 sm:p-1 group-hover:border-civic-dark/40 transition-colors`}
                  >
                    <div
                      style={{ height: `${fillPercentage}%` }}
                      className={`w-full rounded-xl transition-all duration-300 ${
                        isActive ? 'bg-civic-dark shadow-sm' : 'bg-[#D1CDC2] group-hover:bg-civic-dark/70'
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
                    {period === 'daily' && dailyViewRange === '7_days' && (
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
  );
}
