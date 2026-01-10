// Line chart: shows daily registrations for students and wardens (last 30 days).
import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{payload[0].payload.date}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const UserTrendChart = ({ data, dateRange }) => {
  return (
    <div className="backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>User Registration Trend (Last 30 Days)</h2>
        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{dateRange}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#fff' }} iconType="line" />
          <Line
            type="monotone"
            dataKey="students"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Students Registered"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="wardens"
            stroke="#22c55e"
            strokeWidth={2}
            name="Wardens Registered"
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(UserTrendChart);
