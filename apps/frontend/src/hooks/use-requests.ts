import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { deleteRequest, getRequests, getStats } from '@/lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '@/types/api';

export type RequestRow = PaginatedRequestsResponse['data'][number];

export function useRequests() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState<PaginatedRequestsResponse['data']>([]);
  const [stats, setStats] = useState<StatsResponse>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const initialSearch = searchParams.get('search') ?? '';
  const initialStatus = searchParams.get('status') ?? '';

  const [search, setSearchState] = useState(initialSearch);
  const [status, setStatusState] = useState(initialStatus);
  const [date, setDateState] = useState('');
  const [loading, setLoading] = useState(true);

  // Load stats once for filter counts
  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    getRequests(page, pageSize, { search, status, date })
      .then((result) => {
        setRequests(result.data);
        setTotalPages(result.total_pages);
        setTotalCount(result.total);
      })
      .catch(() => toast.error('Gagal memuat daftar permohonan.'))
      .finally(() => setLoading(false));
  }, [page, pageSize, search, status, date]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const setSearch = useCallback(
    (val: string) => {
      setSearchState(val);
      setPage(1);
      const newParams = new URLSearchParams(searchParams);
      if (val) newParams.set('search', val);
      else newParams.delete('search');
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const setStatus = useCallback(
    (val: string) => {
      setStatusState(val);
      setPage(1);
      const newParams = new URLSearchParams(searchParams);
      if (val) newParams.set('status', val);
      else newParams.delete('status');
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const setDate = useCallback((val: string) => {
    setDateState(val);
    setPage(1);
  }, []);

  const remove = useCallback(
    async (row: RequestRow): Promise<boolean> => {
      try {
        await deleteRequest(row.id);
        toast.success('Permohonan berhasil dihapus.');
        if (requests.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          load();
        }
        return true;
      } catch {
        toast.error('Aksi gagal diproses.');
        return false;
      }
    },
    [load, page, requests.length],
  );

  return {
    requests,
    stats,
    page,
    pageSize,
    totalPages,
    totalCount,
    search,
    status,
    date,
    loading,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setDate,
    remove,
    refresh: load,
  };
}
