import { useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';
// AnalyticsComponents/* are UI-only charts/cards (no Firebase logic inside).
import LoadingState from './AnalyticsComponents/LoadingState'; // Loading spinner
import RefreshButton from './AnalyticsComponents/RefreshButton'; // Manual refresh + “last updated” badge
import StatsGrid from './AnalyticsComponents/StatsGrid'; // KPI summary cards
import UserTrendChart from './AnalyticsComponents/UserTrendChart'; // 30-day registration trend
import CollegeDistributionChart from './AnalyticsComponents/CollegeDistributionChart'; // Per-college distribution pie
import RoleApprovalChart from './AnalyticsComponents/RoleApprovalChart'; // Approval % per role
import { useAnalyticsData } from './AnalyticsComponents/AnalyticsData/useAnalyticsData';

const Analytics = () => {
  const { isCollapsed } = useOutletContext();
  const location = useLocation();
  const dateRange = 'Last 30 days';

  const {
    loading,
    refreshing,
    lastUpdated,
    stats,
    userTrendData,
    collegeDistributionData,
    rolePerformanceData,
    handleRefresh,
  } = useAnalyticsData();

  // Restore scroll position when coming back from profile
  useEffect(() => {
    if (location.state?.scrollPosition) {
      setTimeout(() => {
        window.scrollTo(-10, location.state.scrollPosition);
        // Clear the state after restoring
        window.history.replaceState({}, document.title);
      }, 100);
    }
    // Clear sessionStorage after checking
    sessionStorage.removeItem('analyticsPageState');
  }, [location.state]);

  // Save page state before navigating away
  const savePageState = () => {
    const state = {
      scrollPosition: window.scrollY,
      returnPath: '/OwnersDashboard/analytics'
    };
    sessionStorage.setItem('analyticsPageState', JSON.stringify(state));
    return state;
  };

  return (
    <>
      <Header 
        title="HOAS College Analytics Overview" 
        isCollapsed={isCollapsed}
        onProfileClick={savePageState}
      />
      <div className="pt-24 p-6 min-h-screen">
        
        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Refresh Button and Status */}
        {!loading && <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} lastUpdated={lastUpdated} />}

        {/* Real-time Analytics Stats */}
        {!loading && (
          <>
            <StatsGrid stats={stats} />

            {/* User Registration Trend */}
            <UserTrendChart data={userTrendData} dateRange={dateRange} />

            {/* Two Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* College-wise Distribution */}
              <CollegeDistributionChart data={collegeDistributionData} />

              {/* Role Approval Rates */}
              <RoleApprovalChart data={rolePerformanceData} />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Analytics;
