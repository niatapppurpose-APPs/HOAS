import { RefreshCw } from 'lucide-react';

const RefreshButton = ({ onRefresh, refreshing, lastUpdated }) => {
  const getTimeAgo = () => {
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex flex-row-reverse justify-between items-center mb-4">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all ${
            refreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Last updated: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{getTimeAgo()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg border border-green-500/40">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-green-400 text-sm">Live Updates Active</span>
      </div>
    </div>
  );
};

export default RefreshButton;
