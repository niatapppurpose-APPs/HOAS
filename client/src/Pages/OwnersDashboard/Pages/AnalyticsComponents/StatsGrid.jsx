// KPI strip: renders top-level analytics numbers.
import { memo } from 'react';
import StatsCard from './StatsCard';

const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Today's Registrations"
        value={stats.todayRegistrations}
        subtitle="New users today"
        gradient="from-blue-600 to-blue-700 border-blue-400/30"
      />
      <StatsCard
        title="Week Growth"
        value={`${stats.weekGrowth > 0 ? '+' : ''}${stats.weekGrowth}%`}
        subtitle="vs last week"
        gradient="from-green-600 to-green-700 border-green-400/30"
      />
      <StatsCard
        title="Approval Rate"
        value={`${stats.approvalRate}%`}
        subtitle="Success rate"
        gradient="from-purple-600 to-purple-700 border-purple-400/30"
      />
      <StatsCard
        title="Avg Approval Time"
        value={`${stats.avgApprovalTime}h`}
        subtitle="Processing time"
        gradient="from-orange-600 to-orange-700 border-orange-400/30"
      />
    </div>
  );
};

export default memo(StatsGrid);
