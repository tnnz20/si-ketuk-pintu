import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SummaryCards from '@components/dashboard-admin/SummaryCards';
import TodaySchedule from '@components/dashboard-admin/TodaySchedule';
import RecentRequests from '@components/dashboard-admin/RecentRequests';
import RequestsChart from '@components/dashboard-admin/RequestsChart';
import { getRequests, getStats } from '../../lib/api/requests';
import type { PaginatedRequestsResponse, StatsResponse } from '@app-types/api';

type RequestItem = PaginatedRequestsResponse['data'][number];

export default function AdminDashboard() {
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

  return (
    <div className="space-y-5 animate-fade-in">
      <SummaryCards stats={stats} requests={requests} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <RequestsChart />
        <TodaySchedule requests={requests} />
      </div>
      <RecentRequests requests={requests} loading={loading} />
    </div>
  );
}
