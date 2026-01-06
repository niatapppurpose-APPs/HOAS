// Pie chart: shows per-college share of total users (students + wardens).
import { useState, memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CollegeDistributionChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  // Check if there's any actual user data
  const hasData = data && data.length > 0 && data.some(college => college.total > 0);
  
  // If no users, create placeholder data for visualization
  const chartData = hasData 
    ? data 
    : data.map(college => ({ ...college, total: 1 })); // Give each college value of 1 for display

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6">College-wise User Distribution</h2>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[350px]">
          <p className="text-gray-400 text-center">No colleges registered yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              dataKey="total"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              label={hasData ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : ({ name }) => name}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-lg">
                      <p className="text-white font-semibold">{data.name}</p>
                      <p className="text-blue-400 text-sm">Students: {data.students}</p>
                      <p className="text-green-400 text-sm">Wardens: {data.wardens}</p>
                      <p className="text-gray-300 text-sm">Total: {data.total}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-white">
              {data.length} Colleges
            </text>
            {!hasData && (
              <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-400">
                No users assigned yet
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {data.map((college, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: college.fill }}></div>
            <span className="text-gray-300 text-sm truncate">{college.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(CollegeDistributionChart);
