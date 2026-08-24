import { Copy, Eye, Trash2 } from 'lucide-react';
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
        className="fixed z-50 w-44 rounded-2xl border border-civic-border bg-civic-surface p-1.5 text-left soft-shadow space-y-0.5 animate-fade-in shadow-xl"
        style={{ left: menu.left, top: menu.top }}
      >
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-civic-dark hover:bg-civic-cardFill transition-colors cursor-pointer"
          onClick={() => {
            onClose();
            onViewDetail(menu.row.id);
          }}
        >
          <Eye className="h-3.5 w-3.5 text-civic-muted" />
          <span>Lihat Detail</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-civic-dark hover:bg-civic-cardFill transition-colors cursor-pointer"
          onClick={() => onCopyToken(menu.row)}
        >
          <Copy className="h-3.5 w-3.5 text-civic-muted" />
          <span>Salin Token</span>
        </button>
        <div className="my-1 border-t border-civic-border" />
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-civic-rejectedText hover:bg-civic-rejectedBg transition-colors cursor-pointer"
          onClick={() => onDelete(menu.row)}
        >
          <Trash2 className="h-3.5 w-3.5 text-civic-rejectedText" />
          <span>Hapus</span>
        </button>
      </div>
    </>
  );
}
