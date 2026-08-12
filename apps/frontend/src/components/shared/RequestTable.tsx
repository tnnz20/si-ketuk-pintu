import { MoreHorizontal } from 'lucide-react';
import StatusBadge, { type Status } from './StatusBadge';

interface RequestRow {
  date: string;
  id: string;
  user: string;
  status: Status;
}

interface RequestTableProps {
  requests: RequestRow[];
  onRowClick?: (id: string) => void;
}

export default function RequestTable({ requests, onRowClick }: RequestTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low">
            <th className="px-6 py-4 text-on-surface-variant text-label-md font-semibold border-b border-outline-variant">Date</th>
            <th className="px-6 py-4 text-on-surface-variant text-label-md font-semibold border-b border-outline-variant">ID</th>
            <th className="px-6 py-4 text-on-surface-variant text-label-md font-semibold border-b border-outline-variant">User</th>
            <th className="px-6 py-4 text-on-surface-variant text-label-md font-semibold border-b border-outline-variant">Status</th>
            <th className="px-6 py-4 text-on-surface-variant text-label-md font-semibold border-b border-outline-variant text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {requests.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row.id)} className="hover:bg-surface-bright transition-colors">
              <td className="px-6 py-4 text-on-surface text-body-md">{row.date}</td>
              <td className="px-6 py-4 text-on-surface-variant text-body-md font-medium">{row.id}</td>
              <td className="px-6 py-4 text-on-surface text-body-md">{row.user}</td>
              <td className="px-6 py-4">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <MoreHorizontal className="h-5 w-5 text-on-surface-variant" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
