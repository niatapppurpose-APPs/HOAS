// Radial chart: shows approval % for each role (students/wardens/colleges).
import { memo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const RoleApprovalChart = ({ data }) => {
  return (
    <div className="backdrop-blur-sm rounded-xl shadow-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Role Approval Rates</h2>
      <ResponsiveContainer width="100%" height={350}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar minAngle={15} background clockWise dataKey="performance" cornerRadius={10} />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            content={({ payload }) => (
              <div className="flex flex-col gap-3">
                {payload.map((entry, index) => {
                  const roleData = data[index];
                  return (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roleData.fill }}></div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{roleData.name} - {roleData.performance}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="p-3 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data.name}</p>
                    <p className="text-green-400 text-sm">Approved: {data.approved}/{data.total}</p>
                    <p className="text-blue-400 text-sm">Approval Rate: {data.performance}%</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Status: {data.status}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-white">
            Approval
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {data.map((role, index) => (
          <div
            key={index}
            className="p-3 rounded-lg text-center"
            style={{
              backgroundColor: `${role.fill}20`,
              borderWidth: '1px',
              borderColor: `${role.fill}66`
            }}
          >
            <div className="text-2xl font-bold" style={{ color: role.fill }}>
              {role.performance}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{role.name.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(RoleApprovalChart);
