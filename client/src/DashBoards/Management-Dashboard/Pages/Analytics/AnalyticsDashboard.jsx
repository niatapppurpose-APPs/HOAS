import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = ({ role, hostelId }) => {
  const [data, setData] = useState({ totalComplaints: 0, categoryBreakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const { user, userData } = useAuth(); // Extracted from current context setup
  const activeHostelId = hostelId || (userData?.hostelId);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startTimestamp = Timestamp.fromDate(startDate);
        
        const constraints = [
          where("createdAt", ">=", startTimestamp)
        ];
        
        if (role === 'warden' && activeHostelId) {
          constraints.push(where("hostelId", "==", activeHostelId));
        }

        const complaintsQuery = query(collection(db, "complaints"), ...constraints);
        const snapshot = await getDocs(complaintsQuery);

        const categoryCounts = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const category = data.category || 'others';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const categoryBreakdown = Object.keys(categoryCounts)
          .map(key => ({ category: key, count: categoryCounts[key] }))
          .sort((a, b) => b.count - a.count);

        setData({
          totalComplaints: snapshot.size,
          categoryBreakdown
        });

      } catch (err) {
        console.error('Analytics Error:', err);
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (role && (role === 'management' || (role === 'warden' && activeHostelId))) {
      fetchAnalytics();
    }
  }, [role, activeHostelId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/50">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="font-medium text-center">{error}</p>
      </div>
    );
  }

  const topCategory = data.categoryBreakdown.length > 0 
    ? data.categoryBreakdown[0] 
    : { category: 'None', count: 0 };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Complaint Analytics
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {role === 'management' ? 'All Hostels Overview' : 'Assigned Hostel Analytics'}
          </p>
        </div>
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="mt-4 sm:mt-0 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 flex flex-col justify-between relative overflow-hidden group">
          <div className="z-10 relative">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Complaints</h3>
            <p className="text-4xl font-extrabold text-blue-900 dark:text-white mt-2">{data.totalComplaints}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 bg-blue-600 rounded-full w-32 h-32 group-hover:scale-110 transition-transform"></div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between relative overflow-hidden group">
          <div className="z-10 relative">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Top Issue Issue</h3>
            <div className="flex items-end mt-2">
              <p className="text-4xl font-extrabold text-emerald-900 dark:text-white capitalize">{topCategory.category}</p>
              <span className="ml-3 mb-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1"/> {topCategory.count}
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 bg-emerald-600 rounded-full w-32 h-32 group-hover:scale-110 transition-transform"></div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">Issues Breakdown</h4>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                  stroke="none"
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ textTransform: 'capitalize' }}
                />
                <Legend iconType="circle" formatter={(value) => <span className="capitalize text-slate-600 dark:text-slate-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-6 text-center">Categorical Distribution</h4>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.categoryBreakdown}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#64748b' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: '#64748b' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }} 
                />
                <ChartTooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ textTransform: 'capitalize', color: '#1e293b', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="count" 
                  name="Total Cases"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsDashboard;
