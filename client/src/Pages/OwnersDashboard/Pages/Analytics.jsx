import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import Header from '../../../components/OwnerServices/header';
import LoadingState from './AnalyticsComponents/LoadingState';
import RefreshButton from './AnalyticsComponents/RefreshButton';
import StatsGrid from './AnalyticsComponents/StatsGrid';
import UserTrendChart from './AnalyticsComponents/UserTrendChart';
import CollegeDistributionChart from './AnalyticsComponents/CollegeDistributionChart';
import RoleApprovalChart from './AnalyticsComponents/RoleApprovalChart';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('Jan 01 - Jan 30');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Real-time data states
  const [userTrendData, setUserTrendData] = useState([]);
  const [collegeDistributionData, setCollegeDistributionData] = useState([]);
  const [rolePerformanceData, setRolePerformanceData] = useState([]);
  const [stats, setStats] = useState({ 
    todayRegistrations: 0,
    weekGrowth: 0,
    approvalRate: 0,
    avgApprovalTime: 0,
    activeColleges: 0,
    pendingReview: 0
  });

  // Fetch real-time data from Firebase
  useEffect(() => {
    const fetchAnalyticsData = async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          let createdAt = new Date();
          
          if (data.createdAt) {
            // Handle Firestore Timestamp
            if (typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            }
            // Handle Date object
            else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            }
            // Handle string or number
            else {
              createdAt = new Date(data.createdAt);
            }
          }
          
          return { 
            id: doc.id, 
            ...data,
            createdAt
          };
        });

        // Filter by roles
        const students = users.filter(u => u.role === 'student');
        const wardens = users.filter(u => u.role === 'warden');
        const colleges = users.filter(u => u.role === 'management');

        // Filter by status
        const approved = users.filter(u => u.status === 'approved');
        const pending = users.filter(u => u.status === 'pending');
        const denied = users.filter(u => u.status === 'denied');

        // Calculate analytics stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRegistrations = users.filter(u => {
          const userDate = new Date(u.createdAt);
          userDate.setHours(0, 0, 0, 0);
          return userDate.getTime() === today.getTime();
        }).length;

        // Week growth calculation
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const lastWeekUsers = users.filter(u => u.createdAt >= weekAgo).length;
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const previousWeekUsers = users.filter(u => u.createdAt >= twoWeeksAgo && u.createdAt < weekAgo).length;
        const weekGrowth = previousWeekUsers > 0 
          ? Math.round(((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100)
          : lastWeekUsers > 0 ? 100 : 0;

        // Approval rate
        const totalProcessed = approved.length + denied.length;
        const approvalRate = totalProcessed > 0 
          ? Math.round((approved.length / totalProcessed) * 100)
          : 0;

        // Active colleges (with at least 1 student or warden)
        const activeColleges = colleges.filter(c => {
          const hasUsers = students.some(s => s.collegeId === c.uid || s.managementUid === c.uid) || 
                          wardens.some(w => w.collegeId === c.uid || w.managementUid === c.uid);
          return hasUsers;
        }).length;

        // Set statistics
        setStats({
          todayRegistrations,
          weekGrowth,
          approvalRate,
          avgApprovalTime: Math.floor(Math.random() * 24) + 2, // Placeholder for now
          activeColleges,
          pendingReview: pending.length
        });
 
        // Generate user registration trend
        const trendData = generateUserTrend(users);
        setUserTrendData(trendData);

        // College-wise distribution
        const collegeData = generateCollegeDistribution(colleges, students, wardens);
        setCollegeDistributionData(collegeData);

        // Generate role performance
        const rolePerf = generateRolePerformance(students, wardens, colleges);
        setRolePerformanceData(rolePerf);

        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    // Initial fetch
    fetchAnalyticsData();

    // Real-time listener for immediate updates
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        console.log('Real-time update detected:', snapshot.size, 'users');
        console.log('Snapshot changes:', snapshot.docChanges().map(c => ({ type: c.type, id: c.doc.id, data: c.doc.data() })));
        fetchAnalyticsData(true);
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing analytics...');
      fetchAnalyticsData(true);
    }, 30000); // 30 seconds

    return () => {
      unsubscribe();
      clearInterval(autoRefreshInterval);
    };
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          let createdAt = new Date();
          
          if (data.createdAt) {
            // Handle Firestore Timestamp
            if (typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            }
            // Handle Date object
            else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            }
            // Handle string or number
            else {
              createdAt = new Date(data.createdAt);
            }
          }
          
          return { 
            id: doc.id, 
            ...data,
            createdAt
          };
        });

        const students = users.filter(u => u.role === 'student');
        const wardens = users.filter(u => u.role === 'warden');
        const colleges = users.filter(u => u.role === 'management');
        const approved = users.filter(u => u.status === 'approved');
        const pending = users.filter(u => u.status === 'pending');
        const denied = users.filter(u => u.status === 'denied');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRegistrations = users.filter(u => {
          const userDate = new Date(u.createdAt);
          userDate.setHours(0, 0, 0, 0);
          return userDate.getTime() === today.getTime();
        }).length;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const lastWeekUsers = users.filter(u => u.createdAt >= weekAgo).length;
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const previousWeekUsers = users.filter(u => u.createdAt >= twoWeeksAgo && u.createdAt < weekAgo).length;
        const weekGrowth = previousWeekUsers > 0 
          ? Math.round(((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100)
          : lastWeekUsers > 0 ? 100 : 0;

        const totalProcessed = approved.length + denied.length;
        const approvalRate = totalProcessed > 0 ? Math.round((approved.length / totalProcessed) * 100) : 0;

        const activeColleges = colleges.filter(c => {
          const hasUsers = students.some(s => s.collegeId === c.uid || s.managementUid === c.uid) || 
                          wardens.some(w => w.collegeId === c.uid || w.managementUid === c.uid);
          return hasUsers;
        }).length;

        setStats({
          todayRegistrations,
          weekGrowth,
          approvalRate,
          avgApprovalTime: Math.floor(Math.random() * 24) + 2,
          activeColleges,
          pendingReview: pending.length
        });

        const trendData = generateUserTrend(users);
        setUserTrendData(trendData);

        const collegeData = generateCollegeDistribution(colleges, students, wardens);
        setCollegeDistributionData(collegeData);

        const rolePerf = generateRolePerformance(students, wardens, colleges);
        setRolePerformanceData(rolePerf);

        setLastUpdated(new Date());
        setRefreshing(false);
      } catch (error) {
        console.error('Error refreshing:', error);
        setRefreshing(false);
      }
    };
    fetchData();
  };

  // Generate user registration trend (30 days)
  const generateUserTrend = (users) => {
    const days = 30;
    const data = [];
    const today = new Date(2026, 0, 6);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayNum = date.getDate();
      
      const students = users.filter(u => {
        const userDate = u.createdAt;
        return u.role === 'student' && 
               userDate.getDate() === date.getDate() &&
               userDate.getMonth() === date.getMonth() &&
               userDate.getFullYear() === date.getFullYear();
      }).length;

      const wardens = users.filter(u => {
        const userDate = u.createdAt;
        return u.role === 'warden' && 
               userDate.getDate() === date.getDate() &&
               userDate.getMonth() === date.getMonth() &&
               userDate.getFullYear() === date.getFullYear();
      }).length;

      data.push({
        date: `Jan ${dayNum.toString().padStart(2, '0')}`,
        students,
        wardens,
        total: students + wardens
      });
    }
    return data;
  };

  // Generate college distribution
  const generateCollegeDistribution = (colleges, students, wardens) => {
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b'];
    
    return colleges.map((college, index) => {
      const collegeStudents = students.filter(s => s.collegeId === college.uid || s.managementUid === college.uid);
      const collegeWardens = wardens.filter(w => w.collegeId === college.uid || w.managementUid === college.uid);
      
      return {
        name: college.name || college.email?.split('@')[0] || `College ${index + 1}`,
        students: collegeStudents.length,
        wardens: collegeWardens.length,
        total: collegeStudents.length + collegeWardens.length,
        fill: colors[index % colors.length]
      };
    });
  };

  // Generate role performance
  const generateRolePerformance = (students, wardens, colleges) => {
    const roles = [
      { name: 'Students', users: students, fill: '#3b82f6' },
      { name: 'Wardens', users: wardens, fill: '#22c55e' },
      { name: 'Colleges', users: colleges, fill: '#f97316' }
    ];

    return roles.map(role => {
      const total = role.users.length;
      const approved = role.users.filter(u => u.status === 'approved').length;
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      
      let status = 'Excellent';
      if (approvalRate < 60) status = 'Low Approval';
      else if (approvalRate < 80) status = 'Good';

      return {
        name: `${role.name} (${total})`,
        performance: approvalRate,
        fill: role.fill,
        status,
        approved,
        total
      };
    }).filter(r => r.total > 0);
  };

  return (
    <>
      <Header title="HOAS College Analytics Overview" />
      <div className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
        
        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Refresh Button and Status */}
        {!loading && (
          <RefreshButton 
            onRefresh={handleRefresh} 
            refreshing={refreshing} 
            lastUpdated={lastUpdated} 
          />
        )}

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
