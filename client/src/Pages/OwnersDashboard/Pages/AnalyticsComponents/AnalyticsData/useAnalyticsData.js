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

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!isMountedRef.current) return;

        const users = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: normalizeCreatedAt(data.createdAt),
            };
          })
          .filter(u => u.role !== 'admin' && u.role !== 'owner');

        computeAndSet(users);
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error listening to users:', error);
        setLoading(false);
      },
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [computeAndSet]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: normalizeCreatedAt(data.createdAt),
          };
        })
        .filter(u => u.role !== 'admin' && u.role !== 'owner');
      computeAndSet(users);
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
