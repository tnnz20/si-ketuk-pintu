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
        <div className="flex w-9 shrink-0 flex-col items-end justify-between pr-3 pb-7 text-label-sm font-bold text-civic-muted/80 select-none">
          {yTicks.map((val, idx) => (
            <span key={idx}>{val}</span>
          ))}
        </div>

        {/* Chart Grid + Bars Area */}
        <div className="relative scrollbar-none flex min-w-0 flex-1 flex-col justify-between overflow-x-auto pb-7">
          {/* Horizontal Guide Lines */}
          <div className="pointer-events-none absolute inset-0 bottom-7 flex flex-col justify-between">
            <div className="border-b border-dashed border-civic-border" />
            <div className="border-b border-dashed border-civic-border" />
            <div className="border-b border-dashed border-civic-border" />
            <div className="border-b border-dashed border-civic-border" />
            <div className="border-b border-dashed border-civic-border" />
          </div>

          {/* Bars Container */}
          <div
            className={`relative z-10 flex h-full items-end justify-between gap-1 px-1 sm:gap-2 ${
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
                  className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                >
                  {/* Always Legible Count Value Tag */}
                  <div
                    className={`mb-1.5 ${
                      isAllMonth ? 'px-1 py-0 text-3xs' : 'px-1.5 py-0.5 text-2xs sm:text-xs'
                    } rounded-lg font-extrabold transition-all duration-200 ${
                      isActive
                        ? 'scale-105 bg-civic-dark text-white shadow-md'
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
                    } bg-civic-cardFill/80 flex h-36 items-end overflow-hidden rounded-2xl border border-civic-border/70 p-0.5 transition-colors group-hover:border-civic-dark/40 sm:p-1`}
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
                  <div className="mt-1.5 w-full truncate text-center select-none">
                    <p
                      className={`${
                        isAllMonth ? 'text-2xs' : 'text-xs'
                      } truncate font-extrabold transition-colors ${
                        isActive
                          ? 'text-civic-dark'
                          : 'text-civic-muted group-hover:text-civic-dark'
                      }`}
                    >
                      {item.label}
                    </p>
                    {period === 'daily' && dailyViewRange === '7_days' && (
                      <p className="hidden text-3xs font-medium whitespace-nowrap text-civic-muted/80 sm:block">
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
