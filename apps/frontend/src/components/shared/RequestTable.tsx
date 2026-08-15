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
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-container-low">
            <th className="border-b border-outline-variant px-6 py-4 text-label-md font-semibold text-on-surface-variant">
              Date
            </th>
            <th className="border-b border-outline-variant px-6 py-4 text-label-md font-semibold text-on-surface-variant">
              ID
            </th>
            <th className="border-b border-outline-variant px-6 py-4 text-label-md font-semibold text-on-surface-variant">
              User
            </th>
            <th className="border-b border-outline-variant px-6 py-4 text-label-md font-semibold text-on-surface-variant">
              Status
            </th>
            <th className="border-b border-outline-variant px-6 py-4 text-right text-label-md font-semibold text-on-surface-variant">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {requests.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.id)}
              className="transition-colors hover:bg-surface-bright"
            >
              <td className="px-6 py-4 text-body-md text-on-surface">{row.date}</td>
              <td className="px-6 py-4 text-body-md font-medium text-on-surface-variant">
                {row.id}
              </td>
              <td className="px-6 py-4 text-body-md text-on-surface">{row.user}</td>
              <td className="px-6 py-4">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <button className="rounded-full p-2 transition-colors hover:bg-surface-container">
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
