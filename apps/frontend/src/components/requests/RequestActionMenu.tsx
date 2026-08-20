import { Copy, Trash2 } from 'lucide-react';
import type { PaginatedRequestsResponse } from '@app-types/api';

type RequestRow = PaginatedRequestsResponse['data'][number];

interface RequestActionMenuProps {
  menu: { row: RequestRow; left: number; top: number };
  onClose: () => void;
  onViewDetail: (id: string) => void;
  onCopyToken: (row: RequestRow) => void;
  onDelete: (row: RequestRow) => void;
}

export default function RequestActionMenu({
  menu,
  onClose,
  onViewDetail,
  onCopyToken,
  onDelete,
}: RequestActionMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-44 rounded border border-outline-variant bg-white p-1 text-left shadow-lg"
        style={{ left: menu.left, top: menu.top }}
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface cursor-pointer"
          onClick={() => {
            onClose();
            onViewDetail(menu.row.id);
          }}
        >
          Lihat Detail
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface cursor-pointer"
          onClick={() => onCopyToken(menu.row)}
        >
          <Copy className="h-4 w-4" /> Copy Token
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-error hover:bg-surface cursor-pointer"
          onClick={() => onDelete(menu.row)}
        >
          <Trash2 className="h-4 w-4" /> Hapus
        </button>
      </div>
    </>
  );
}
