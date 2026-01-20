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
      <div className="circular-progress">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
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
            className="progress-circle"
          />
        </svg>
        <div className="progress-content">
          <div className="progress-label">{label}</div>
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-value">{active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="status-visualization-section">
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
