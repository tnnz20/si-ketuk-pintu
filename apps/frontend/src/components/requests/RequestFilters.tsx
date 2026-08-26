import { Search, X } from 'lucide-react';

interface RequestFiltersProps {
  search: string;
  status: string;
  date: string;
  counts?: { total: number; pending: number; approved?: number; rejected?: number };
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export default function RequestFilters({
  search,
  status,
  date,
  counts,
  onSearchChange,
  onStatusChange,
  onDateChange,
}: RequestFiltersProps) {
  const statusTabs = [
    { key: '', label: 'Semua', count: counts?.total },
    {
      key: 'pending',
      label: 'Pending',
      count: counts?.pending,
      customClass: 'bg-civic-pendingBg text-civic-pendingText',
    },
    {
      key: 'approved',
      label: 'Disetujui',
      count: counts?.approved,
      customClass: 'bg-civic-approvedBg text-civic-approvedText',
    },
    {
      key: 'rejected',
      label: 'Ditolak',
      count: counts?.rejected,
      customClass: 'bg-civic-rejectedBg text-civic-rejectedText',
    },
  ];

  return (
    <div className="flex flex-col justify-between gap-3.5 pb-1 md:flex-row md:items-center">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map((tab) => {
          const isActive = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusChange(tab.key)}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-civic-dark text-white shadow-sm'
                  : tab.customClass
                    ? `${tab.customClass} border border-civic-border/70 hover:opacity-90`
                    : 'bg-civic-cardFill hover:bg-civic-neutralFill border border-civic-border text-civic-muted hover:text-civic-dark'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="ml-1.5 opacity-80">({tab.count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search & Date Pickers */}
      <div className="flex flex-col items-center gap-2.5 sm:flex-row">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-civic-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari token atau instansi..."
            className="soft-shadow w-full rounded-xl border border-civic-border bg-civic-surface py-2 pr-8 pl-10 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-0.5 text-civic-muted hover:text-civic-dark"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="relative w-full sm:w-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="soft-shadow w-full cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
