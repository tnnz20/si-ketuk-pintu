import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getRequests, getStats } from '@/lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '@/types/api';

export type RequestItem = PaginatedRequestsResponse['data'][number];

export function useDashboard() {
  const [stats, setStats] = useState<StatsResponse>();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getStats(), getRequests(1, 20)])
      .then(([statsRes, requestsRes]) => {
        if (!isMounted) return;
        setStats(statsRes);
        setRequests(requestsRes.data);
      })
      .catch(() => {
        if (isMounted) toast.error('Gagal memuat data dashboard.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    stats,
    requests,
    loading,
  };
}
