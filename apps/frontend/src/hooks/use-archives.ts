import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getArchives } from '@/lib/api/archives';
import type { PaginatedRequestsResponse } from '@/types/api';

export type ArchiveRow = PaginatedRequestsResponse['data'][number];

export function useArchives() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [archives, setArchives] = useState<PaginatedRequestsResponse['data']>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const initialSearch = searchParams.get('search') ?? '';

  const [search, setSearchState] = useState(initialSearch);
  const [date, setDateState] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getArchives(page, pageSize, { search, date })
      .then((result) => {
        setArchives(result.data);
        setTotalPages(result.total_pages);
        setTotalCount(result.total);
      })
      .catch(() => {
        setArchives([]);
        setTotalPages(1);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, date]);

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

  const setDate = useCallback((val: string) => {
    setDateState(val);
    setPage(1);
  }, []);

  return {
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
    refresh: load,
  };
}
