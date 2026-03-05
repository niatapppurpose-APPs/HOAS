const StatusVisualization = ({ wardens, students }) => {
  const calculatePercentage = (active, total) => {
    if (total === 0) return 0;
    return Math.round((active / total) * 100);
  };

  const wardensPercentage = calculatePercentage(wardens.active, wardens.total);
  const studentsPercentage = calculatePercentage(students.active, students.total);

  const CircularProgress = ({ percentage, color, label, active, pending }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center p-4">
        <svg width="180" height="180" viewBox="0 0 200 200" className="sm:w-[200px] sm:h-[200px]">
          {/* Background Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-primary)"
            strokeWidth="12"
          />
          {/* Progress Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 uppercase tracking-widest">{label}</div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-emerald-400">{active}</span>
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide">Active</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-amber-400">{pending}</span>
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide">Pending</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-around items-center gap-6 sm:gap-8 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl p-6 shadow-lg mb-6 sm:mb-8">
      <CircularProgress
        percentage={wardensPercentage}
        color="#8B5CF6"
        label="Wardens"
        active={wardens.active}
        pending={wardens.pending}
      />
      <CircularProgress
        percentage={studentsPercentage}
        color="#3B82F6"
        label="Students"
        active={students.active}
        pending={students.pending}
      />
    </div>
  );
};

export default StatusVisualization;
