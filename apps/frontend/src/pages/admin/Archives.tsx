import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import RequestPagination from '@/components/requests/RequestPagination';
import ArchiveTableContent from '@/components/archives/ArchiveTableContent';
import { useArchives } from '@/hooks/use-archives';

export default function Archives() {
  const navigate = useNavigate();
  const {
    archives,
    page,
    pageSize,
    totalPages,
    totalCount,
    search,
    date,
    loading,
    setPage,
    setPageSize,
    setSearch,
    setDate,
  } = useArchives();

  return (
    <div className="animate-fade-in space-y-5">
      <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
        {/* Card Header & Title */}
        <div className="flex flex-col justify-between gap-3 border-b border-civic-border pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-extrabold text-civic-dark sm:text-lg">
              Arsip Permohonan
            </h3>
            <p className="mt-0.5 text-xs font-medium text-civic-muted">
              Daftar permohonan kunjungan yang telah disetujui beserta dokumennya
            </p>
          </div>

          <div className="text-xs font-bold text-civic-muted">
            Total Data: <span className="font-extrabold text-civic-dark">{totalCount}</span>
          </div>
        </div>

        {/* Search & Date Filters */}
        <div className="flex flex-col justify-between gap-3.5 pb-1 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari token atau instansi..."
              aria-label="Cari arsip"
              className="soft-shadow w-full rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
            />
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Filter tanggal kunjungan"
            className="soft-shadow w-full cursor-pointer rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none md:w-auto"
          />
        </div>

        {/* Table Content */}
        <ArchiveTableContent
          archives={archives}
          loading={loading}
          onViewDetail={(id) => navigate(`/dashboard/archives/${id}`)}
          onCopyToken={async (row) => {
            try {
              await navigator.clipboard.writeText(row.token);
              toast.success('Token disalin ke clipboard.');
            } catch {
              toast.error('Gagal menyalin token.');
            }
          }}
        />

        {/* Pagination */}
        <RequestPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(value: number) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
