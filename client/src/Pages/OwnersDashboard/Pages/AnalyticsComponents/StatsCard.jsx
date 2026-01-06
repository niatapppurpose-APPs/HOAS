const StatsCard = ({ title, value, subtitle, gradient }) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 shadow-lg border border-opacity-30`}>
      <div className="text-xs font-medium mb-1 opacity-90">{title}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs mt-1 opacity-80">{subtitle}</div>
    </div>
  );
};

export default StatsCard;
