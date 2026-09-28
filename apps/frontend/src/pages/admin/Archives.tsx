import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import RequestPagination from '@/components/requests/RequestPagination';
import ArchiveTableContent from '@/components/archives/ArchiveTableContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
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
      <Card className="space-y-4 p-5 sm:p-6">
        {/* Card Header & Title */}
        <CardHeader className="flex flex-col justify-between gap-3 border-b border-civic-border p-0 pb-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-base font-extrabold text-civic-dark sm:text-lg">
              Arsip Permohonan
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs font-medium text-civic-muted">
              Daftar permohonan kunjungan yang telah disetujui beserta dokumennya
            </CardDescription>
          </div>

          <div className="text-xs font-bold text-civic-muted">
            Total Data: <span className="font-extrabold text-civic-dark">{totalCount}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          {/* Search & Date Filters */}
          <div className="flex flex-col justify-between gap-3.5 pb-1 md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari token atau instansi..."
                aria-label="Cari arsip"
                className="w-full rounded-xl border border-civic-border bg-civic-surface px-3 py-2 text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
              />
            </div>

            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Filter tanggal kunjungan..."
              aria-label="Filter tanggal kunjungan"
              className="w-full md:w-56"
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
        </CardContent>
      </Card>
    </div>
  );
}
