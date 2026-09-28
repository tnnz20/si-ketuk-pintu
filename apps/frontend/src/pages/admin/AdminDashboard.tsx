import SummaryCards from '@/components/dashboard-admin/SummaryCards';
import TodaySchedule from '@/components/dashboard-admin/TodaySchedule';
import RecentRequests from '@/components/dashboard-admin/RecentRequests';
import RequestsChart from '@/components/dashboard-admin/RequestsChart';
import { useDashboard } from '@/hooks/use-dashboard';

export default function AdminDashboard() {
  const { stats, requests, loading } = useDashboard();

  return (
    <div className="animate-fade-in space-y-5">
      <SummaryCards stats={stats} requests={requests} loading={loading} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <RequestsChart />
        <TodaySchedule requests={requests} />
      </div>
      <RecentRequests requests={requests} loading={loading} />
    </div>
  );
}
