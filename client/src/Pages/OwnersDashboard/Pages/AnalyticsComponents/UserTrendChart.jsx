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
      <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-lg">
        <p className="text-white font-semibold">{payload[0].payload.date}</p>
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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">User Registration Trend (Last 30 Days)</h2>
        <div className="bg-gray-700 px-4 py-2 rounded-lg">
          <span className="text-white text-sm">{dateRange}</span>
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
