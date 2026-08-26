import { Copy, Eye, Trash2 } from 'lucide-react';
import type { PaginatedRequestsResponse } from '@app-types/api';

type RequestRow = PaginatedRequestsResponse['data'][number];

interface RequestActionMenuProps {
  menu: { row: RequestRow; left: number; top: number };
  onClose: () => void;
  onViewDetail: (id: string) => void;
  onCopyToken: (row: RequestRow) => void;
  onDelete?: (row: RequestRow) => void;
  showDelete?: boolean;
}

export default function RequestActionMenu({
  menu,
  onClose,
  onViewDetail,
  onCopyToken,
  onDelete,
  showDelete = true,
}: RequestActionMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="soft-shadow animate-fade-in fixed z-50 w-44 space-y-0.5 rounded-2xl border border-civic-border bg-civic-surface p-1.5 text-left shadow-xl"
        style={{ left: menu.left, top: menu.top }}
      >
        <button
          type="button"
          className="hover:bg-civic-cardFill flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-civic-dark transition-colors"
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
          className="hover:bg-civic-cardFill flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-civic-dark transition-colors"
          onClick={() => onCopyToken(menu.row)}
        >
          <Copy className="h-3.5 w-3.5 text-civic-muted" />
          <span>Salin Token</span>
        </button>
        {showDelete && onDelete && (
          <>
            <div className="my-1 border-t border-civic-border" />
            <button
              type="button"
              className="text-civic-rejectedText hover:bg-civic-rejectedBg flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
              onClick={() => onDelete(menu.row)}
            >
              <Trash2 className="text-civic-rejectedText h-3.5 w-3.5" />
              <span>Hapus</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}
