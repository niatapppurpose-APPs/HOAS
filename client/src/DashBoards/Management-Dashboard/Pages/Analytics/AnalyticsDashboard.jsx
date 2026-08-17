import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Loader2, TrendingUp, AlertCircle, Users, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import * as cloudFunctions from '../../../../firebase/cloudFunctions';
import { useOutletContext } from 'react-router-dom';

import ManagementHeader from '../../components/layout/ManagementHeader';
import WardenHeader from '../../../Warden-Dashboard/components/layout/WardenHeader';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatsCard = ({ title, value, subtitle, gradient, icon: Icon }) => (
  <div 
    className="relative group overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] border border-white/10"
    style={{
      background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-primary) 100%)',
    }}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-slate-400 group-hover:text-white group-hover:scale-110 transition-all">
          {Icon && <Icon size={18} />}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 m-0">{title}</span>
        </div>
      </div>
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </h2>
        <p className="text-[10px] font-bold flex items-center gap-1 opacity-70" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient} transition-all duration-500 w-0 group-hover:w-full`} />
    </div>
  </div>
);

const AnalyticsDashboard = ({ role }) => {
  const [data, setData] = useState({ totalComplaints: 0, resolved: 0, pending: 0, categoryBreakdown: [], trendData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const { user, userData, logout } = useAuth();
  
  const outletContext = useOutletContext();
  const isCollapsed = outletContext?.isCollapsed;
  const setIsCollapsed = outletContext?.setIsCollapsed;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const complaints = role === 'management'
          ? (await cloudFunctions.getManagementComplaints()).complaints || []
          : (await cloudFunctions.getWardenComplaints()).complaints || [];

        const categoryCounts = {};
        const dailyTrends = {};
        let resolvedCount = 0;
        let pendingCount = 0;
        let totalCount = 0;

        complaints.forEach((docData) => {
          const createdAt = docData.createdAt ? new Date(docData.createdAt) : null;
          if (createdAt && createdAt < startDate) return;
          totalCount++;
          
          // Categorization
          const category = docData.category || 'others';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          
          // Status tracking
          if (docData.status === 'resolved' || docData.status === 'warden-resolved') {
              resolvedCount++;
          }
          if (docData.status === 'pending') {
              pendingCount++;
          }

          // Trend tracking (grouping by date)
          if (createdAt) {
            const dateKey = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyTrends[dateKey]) dailyTrends[dateKey] = { name: dateKey, total: 0, resolved: 0 };
            dailyTrends[dateKey].total++;
            if (docData.status === 'resolved' || docData.status === 'warden-resolved') {
              dailyTrends[dateKey].resolved++;
            }
          }
        });

        const categoryBreakdown = Object.keys(categoryCounts)
          .map(key => ({ category: key, count: categoryCounts[key] }))
          .sort((a, b) => b.count - a.count);

        // Sort dates chronologically or just keep them ordered if sequential map
        // For accurate sorting we might need real dates, but maps keep insertion order usually for strings
        // Just extract values for chart
        const trendData = Object.values(dailyTrends);

        setData({
          totalComplaints: totalCount,
          resolved: resolvedCount,
          pending: pendingCount,
          categoryBreakdown,
          trendData: trendData.length ? trendData : [{ name: 'No Data', total: 0, resolved: 0 }]
        });

      } catch (err) {
        console.error('Analytics Error:', err);
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (userData !== undefined) {
      fetchAnalytics();
    }
  }, [role, userData, user, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-200 m-6 mt-24">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="font-medium text-center">{error}</p>
      </div>
    );
  }

  const topCategory = data.categoryBreakdown.length > 0 
    ? data.categoryBreakdown[0] 
    : { category: 'None', count: 0 };

  const approvalRate = data.totalComplaints > 0 
    ? Math.round((data.resolved / data.totalComplaints) * 100) 
    : 0;

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Dynamic Headers based on Role */}
      {role === 'management' && (
        <ManagementHeader
          title="Management Analytics Overview"
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      )}
      {role === 'warden' && (
        <WardenHeader
          title="Warden Analytics Overview"
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          handleLogout={logout}
        />
      )}

      {/* Main Content constraints */}
      <div className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Complaint Analytics Trends
            </h2>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
              Data insights over the last {days} days
            </p>
          </div>
          <select 
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-4 sm:mt-0 shadow-lg text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block p-3 transition-colors outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatsCard
            title="Total Issues"
            value={data.totalComplaints}
            subtitle={`Over last ${days} days`}
            icon={AlertCircle}
            gradient="from-blue-500 to-indigo-600"
          />
          <StatsCard
            title="Top Category"
            value={topCategory.category}
            subtitle={`${topCategory.count} cases reported`}
            icon={TrendingUp}
            gradient="from-emerald-500 to-teal-600"
          />
          <StatsCard
            title="Resolution Rate"
            value={`${approvalRate}%`}
            subtitle={`${data.resolved} resolved cases`}
            icon={CheckCircle2}
            gradient="from-purple-500 to-fuchsia-600"
          />
          <StatsCard
            title="Pending Queue"
            value={data.pending}
            subtitle="Requires attention"
            icon={Clock}
            gradient="from-orange-500 to-amber-600"
          />
        </div>

        {/* Timeline LineChart Section */}
        <div className="mb-8 p-6 rounded-[1.5rem] border shadow-xl transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <h4 className="text-base font-black mb-6" style={{ color: 'var(--text-primary)' }}>Caseload Trends</h4>
          <div className="w-full h-72 sm:h-80 md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border-primary)' }}
                />
                <YAxis 
                  tick={{ fill: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border-primary)' }} 
                  allowDecimals={false}
                />
                <ChartTooltip 
                  cursor={{ stroke: 'var(--border-primary)' }}
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: '1px solid var(--border-primary)', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    backgroundColor: 'var(--bg-primary)', 
                    color: 'var(--text-primary)' 
                  }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{value}</span>} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Created"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: 'var(--bg-card)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, stroke: 'var(--bg-card)', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: 'var(--bg-card)', strokeWidth: 2, r: 4 }}
                  activeDot={{ stroke: 'var(--bg-card)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Existing Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="p-6 rounded-[1.5rem] border shadow-xl transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <h4 className="text-base font-black mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Issues Breakdown</h4>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
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
                    contentStyle={{ borderRadius: '1rem', border: '1px solid var(--border-primary)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                    itemStyle={{ textTransform: 'capitalize' }}
                  />
                  <Legend iconType="circle" formatter={(value) => <span className="capitalize" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="p-6 rounded-[1.5rem] border shadow-xl transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <h4 className="text-base font-black mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Categorical Distribution</h4>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.categoryBreakdown}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={{ stroke: 'var(--border-primary)' }}
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={{ stroke: 'var(--border-primary)' }} 
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }} 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid var(--border-primary)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    labelStyle={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Total Cases"
                    radius={[8, 8, 0, 0]}
                    barSize={45}
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
    </div>
  );
};

export default AnalyticsDashboard;
