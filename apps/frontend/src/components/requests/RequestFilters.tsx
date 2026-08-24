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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-1">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map((tab) => {
          const isActive = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusChange(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-civic-dark text-white shadow-sm'
                  : tab.customClass
                  ? `${tab.customClass} border border-civic-border/70 hover:opacity-90`
                  : 'bg-civic-cardFill text-civic-muted border border-civic-border hover:text-civic-dark hover:bg-civic-neutralFill'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="ml-1.5 opacity-80">({tab.count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search & Date Pickers */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-civic-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari token atau instansi..."
            className="w-full bg-civic-surface text-xs pl-10 pr-8 py-2 rounded-xl border border-civic-border focus:outline-none focus:border-civic-dark soft-shadow transition-all text-civic-dark"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-civic-muted hover:text-civic-dark p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="relative w-full sm:w-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-civic-surface text-xs px-3 py-2 rounded-xl border border-civic-border focus:outline-none focus:border-civic-dark soft-shadow transition-all text-civic-dark cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
