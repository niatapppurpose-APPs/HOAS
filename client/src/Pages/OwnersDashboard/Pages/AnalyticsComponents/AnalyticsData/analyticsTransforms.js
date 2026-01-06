// Pure transform helpers for Analytics page (no React / no Firebase).

export const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b'];

export function normalizeCreatedAt(value) {
  if (!value) return new Date(0);

  // Firestore Timestamp
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  // Date object
  if (value instanceof Date) {
    return value;
  }

  // string/number
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? new Date(0) : asDate;
}

// Creates a 30-day time series grouped by day for students and wardens.
export function generateUserTrend(users, days = 30) {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const students = users.filter((u) => {
      const userDate = u.createdAt;
      return (
        u.role === 'student' &&
        userDate.getDate() === date.getDate() &&
        userDate.getMonth() === date.getMonth() &&
        userDate.getFullYear() === date.getFullYear()
      );
    }).length;

    const wardens = users.filter((u) => {
      const userDate = u.createdAt;
      return (
        u.role === 'warden' &&
        userDate.getDate() === date.getDate() &&
        userDate.getMonth() === date.getMonth() &&
        userDate.getFullYear() === date.getFullYear()
      );
    }).length;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      students,
      wardens,
      total: students + wardens,
    });
  }

  return data;
}

// Builds per-college counts and chart colors.
export function generateCollegeDistribution(colleges, students, wardens) {
  return colleges.map((college, index) => {
    const collegeStudents = students.filter(
      (s) => s.collegeId === college.uid || s.managementUid === college.uid,
    );
    const collegeWardens = wardens.filter(
      (w) => w.collegeId === college.uid || w.managementUid === college.uid,
    );

    return {
      name: college.name || college.email?.split('@')[0] || `College ${index + 1}`,
      students: collegeStudents.length,
      wardens: collegeWardens.length,
      total: collegeStudents.length + collegeWardens.length,
      fill: COLORS[index % COLORS.length],
    };
  });
}

// Creates approval performance dataset for radial chart.
export function generateRolePerformance(students, wardens, colleges) {
  const roles = [
    { name: 'Students', users: students, fill: '#3b82f6' },
    { name: 'Wardens', users: wardens, fill: '#22c55e' },
    { name: 'Colleges', users: colleges, fill: '#f97316' },
  ];

  return roles
    .map((role) => {
      const total = role.users.length;
      const approved = role.users.filter((u) => u.status === 'approved').length;
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
        total,
      };
    })
    .filter((r) => r.total > 0);
}

export function calculateStats({ users, students, wardens, colleges, approved, denied, pending }) {
  // Today registrations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRegistrations = users.filter((u) => {
    const userDate = new Date(u.createdAt);
    userDate.setHours(0, 0, 0, 0);
    return userDate.getTime() === today.getTime();
  }).length;

  // Week growth
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const lastWeekUsers = users.filter((u) => u.createdAt >= weekAgo).length;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const previousWeekUsers = users.filter((u) => u.createdAt >= twoWeeksAgo && u.createdAt < weekAgo).length;

  const weekGrowth =
    previousWeekUsers > 0
      ? Math.round(((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100)
      : lastWeekUsers > 0
        ? 100
        : 0;

  // Approval rate
  const totalProcessed = approved.length + denied.length;
  const approvalRate = totalProcessed > 0 ? Math.round((approved.length / totalProcessed) * 100) : 0;

  // Active colleges
  const activeColleges = colleges.filter((c) => {
    const hasUsers =
      students.some((s) => s.collegeId === c.uid || s.managementUid === c.uid) ||
      wardens.some((w) => w.collegeId === c.uid || w.managementUid === c.uid);
    return hasUsers;
  }).length;

  return {
    todayRegistrations,
    weekGrowth,
    approvalRate,
    // Kept as-is from prior code: placeholder until there is real approval-time tracking.
    avgApprovalTime: Math.floor(Math.random() * 24) + 2,
    activeColleges,
    pendingReview: pending.length,
  };
}
