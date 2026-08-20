import { Select } from '@components/shared/Select';

interface RequestFiltersProps {
  search: string;
  status: string;
  date: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export default function RequestFilters({
  search,
  status,
  date,
  onSearchChange,
  onStatusChange,
  onDateChange,
}: RequestFiltersProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Cari permohonan berdasarkan token"
        className="rounded border border-surface-alt bg-white p-3"
      />
      <Select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="rounded border border-surface-alt bg-white p-3"
      >
        <option value="">Semua Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </Select>
      <input
        value={date}
        onChange={(event) => onDateChange(event.target.value)}
        type="date"
        className="rounded border border-surface-alt bg-white p-3"
      />
    </div>
  );
}
