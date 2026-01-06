import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../../firebase/firebaseConfig';
import {
  calculateStats,
  generateCollegeDistribution,
  generateRolePerformance,
  generateUserTrend,
  normalizeCreatedAt,
} from './analyticsTransforms';

// Fetch + compute all Analytics datasets (keeps Analytics.jsx small and UI-only).
export function useAnalyticsData({ autoRefreshMs = 30000, realtimeDebounceMs = 500 } = {}) {
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
    pendingReview: 0,
  });

  const isMountedRef = useRef(true);
  const updateTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

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

  const fetchAnalyticsData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isMountedRef.current) return;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: normalizeCreatedAt(data.createdAt),
          };
        });

        if (!isMountedRef.current) return;

        computeAndSet(users);
        setLastUpdated(new Date());
      } catch (error) {
        // Keep UI stable; log for debugging.
        console.error('Error fetching analytics data:', error);
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [computeAndSet],
  );

  const handleRefresh = useCallback(() => {
    fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial load
    fetchAnalyticsData(false);

    // Realtime updates (debounced)
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          // Snapshot.size is useful to verify listener is active.
          // eslint-disable-next-line no-console
          console.log('Analytics realtime update:', snapshot.size);
          fetchAnalyticsData(true);
        }, realtimeDebounceMs);
      },
      (error) => {
        console.error('Error listening to users:', error);
      },
    );

    // Auto refresh (kept because you asked)
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      fetchAnalyticsData(true);
    }, autoRefreshMs);

    return () => {
      isMountedRef.current = false;

      unsubscribe();

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshMs, fetchAnalyticsData, realtimeDebounceMs]);

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
