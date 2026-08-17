import { useCallback, useEffect, useRef, useState } from 'react';
import { listUsers } from '../../../../../firebase/cloudFunctions';
import {
  calculateStats,
  generateCollegeDistribution,
  generateRolePerformance,
  generateUserTrend,
  normalizeCreatedAt,
} from './analyticsTransforms';

const mapUsers = (users = []) =>
  users
    .map((u) => ({
      id: u._id,
      uid: u.uid,
      ...u,
      createdAt: normalizeCreatedAt(u.createdAt),
    }))
    .filter(u => u.role !== 'admin' && u.role !== 'owner');

// Fetch + compute all Analytics datasets (keeps Analytics.jsx small and UI-only).
export function useAnalyticsData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [userTrendData, setUserTrendData] = useState([]);
  const [collegeDistributionData, setCollegeDistributionData] = useState([]);
  const [rolePerformanceData, setRolePerformanceData] = useState([]);
  const [stats, setStats] = useState({
    todayRegistrations: 0,
    weekGrowth: 0,
    approvalRate: 0,
    avgApprovalTime: 0,
    activeColleges: 0,
    totalColleges: 0,
    pendingReview: 0,
  });

  const isMountedRef = useRef(true);

  const computeAndSet = useCallback((users) => {
    const students = users.filter((u) => u.role === 'student');
    const wardens = users.filter((u) => u.role === 'warden');
    const colleges = users.filter((u) => u.role === 'management');

    const approved = users.filter((u) => u.status === 'approved');
    const pending = users.filter((u) => u.status === 'pending');
    const denied = users.filter((u) => u.status === 'denied');

    setStats(
      calculateStats({
        users,
        students,
        wardens,
        colleges,
        approved,
        denied,
        pending,
      }),
    );

    setUserTrendData(generateUserTrend(users));
    setCollegeDistributionData(generateCollegeDistribution(colleges, students, wardens));
    setRolePerformanceData(generateRolePerformance(students, wardens, colleges));
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const load = async () => {
      try {
        const { users } = await listUsers({});
        if (!isMountedRef.current) return;
        computeAndSet(mapUsers(users));
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Error loading users:', error);
        if (isMountedRef.current) setLoading(false);
      }
    };

    load();

    const interval = setInterval(load, 60000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [computeAndSet]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { users } = await listUsers({});
      computeAndSet(mapUsers(users));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [computeAndSet]);

  return {
    loading,
    refreshing,
    lastUpdated,
    stats,
    userTrendData,
    collegeDistributionData,
    rolePerformanceData,
    handleRefresh,
  };
}
