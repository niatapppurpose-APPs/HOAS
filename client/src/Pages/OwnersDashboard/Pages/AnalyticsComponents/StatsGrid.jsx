import { memo } from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import StatsCard from './StatsCard';

const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <StatsCard
        title="Registrations"
        value={stats.todayRegistrations}
        subtitle="New users today"
        icon={Users}
        gradient="from-blue-500 to-indigo-600"
      />
      <StatsCard
        title="Growth"
        value={`${stats.weekGrowth}%`}
        subtitle="Compared to last week"
        icon={TrendingUp}
        gradient="from-emerald-500 to-teal-600"
      />
      <StatsCard
        title="Approval Rate"
        value={`${stats.approvalRate}%`}
        subtitle="Processed accounts"
        icon={CheckCircle2}
        gradient="from-purple-500 to-fuchsia-600"
      />
      <StatsCard
        title="Processing"
        value={`${stats.avgApprovalTime}h`}
        subtitle="Average cleanup"
        icon={Clock}
        gradient="from-orange-500 to-amber-600"
      />
    </div>
  );
};

export default memo(StatsGrid);
