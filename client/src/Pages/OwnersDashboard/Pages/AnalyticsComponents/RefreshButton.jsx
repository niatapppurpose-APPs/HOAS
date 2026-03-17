import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
      {/* Live Status Indicator */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 leading-none">Live Sync Active</span>
          <span className="text-[9px] text-muted-foreground mt-0.5 opacity-60">Last sync: {getTimeAgo()}</span>
        </div>
      </div>

      {/* Manual Refresh Action */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">System Heartbeat</span>
          <span className="text-[9px] text-muted-foreground tabular-nums">{lastUpdated.toLocaleTimeString()}</span>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:grayscale cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <div className="relative z-10 flex items-center gap-2 text-white group-hover:text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Force Sync'}</span>
          </div>
          {/* Hover background effect */}
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(RefreshButton);
