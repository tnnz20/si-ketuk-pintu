import { Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import type { Status } from '@app-types/status';

interface RequestRow {
  date: string;
  id: string;
  user: string;
  status: Status;
}

interface RequestTableProps {
  requests: RequestRow[];
  onViewDetail: (id: string) => void;
}

export default function RequestTable({ requests, onViewDetail }: RequestTableProps) {
  const [menu, setMenu] = useState<{ row: RequestRow; left: number; top: number }>();

  function openMenu(event: React.MouseEvent, row: RequestRow) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({ row, left: Math.min(rect.right, window.innerWidth - 176), top: rect.bottom + 8 });
  }

  return (
    <>
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
              <tr key={row.id} className="transition-colors hover:bg-surface-bright">
                <td className="px-6 py-4 text-body-md text-on-surface">{row.date}</td>
                <td className="px-6 py-4 text-body-md font-medium text-on-surface-variant">
                  {row.id}
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface">{row.user}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    aria-label="Aksi permohonan"
                    onClick={(event) => openMenu(event, row)}
                    className="inline-flex rounded-full p-2 transition-colors hover:bg-surface-container"
                  >
                    <MoreHorizontal className="h-5 w-5 text-on-surface-variant" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(undefined)} />
          <div
            className="fixed z-50 w-44 rounded border border-outline-variant bg-white p-1 text-left shadow-lg"
            style={{ left: menu.left, top: menu.top }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface"
              onClick={() => {
                setMenu(undefined);
                onViewDetail(menu.row.id);
              }}
            >
              <Eye className="h-4 w-4" /> Lihat Detail
            </button>
          </div>
        </>
      )}
    </>
  );
}
