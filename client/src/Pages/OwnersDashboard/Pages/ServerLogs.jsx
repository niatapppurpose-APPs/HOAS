import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { Terminal, RefreshCw, Cpu, Database, Clock } from 'lucide-react';
import Header from '../../../components/OwnerServices/header';
import SecureGate from '../../../components/SecureGate/SecureGate';
import { useToast } from '../../../components/Toast';
import * as cloudFunctions from '../../../firebase/cloudFunctions';

const LEVELS = [
  { key: 'all', label: 'All' },
  { key: 'info', label: 'Info' },
  { key: 'warn', label: 'Warnings' },
  { key: 'error', label: 'Errors' },
];

const levelStyle = (level) => {
  if (level === 'error') return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (level === 'warn') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

const ServerLogs = () => {
  return (
    <SecureGate
      purpose="server-logs"
      title="Server Logs"
      description="Live backend request and error log. Verify a one-time code sent to your email to open this secure page."
    >
      <ServerLogsBody />
    </SecureGate>
  );
};

const ServerLogsBody = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [runtime, setRuntime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('all');

  const load = useCallback(async (lv = level) => {
    setLoading(true);
    try {
      const res = await cloudFunctions.getServerLogs({ level: lv === 'all' ? undefined : lv, limit: 200 });
      setEntries(res?.entries || []);
      setRuntime(res?.runtime || null);
    } catch (err) {
      toast.error(err?.message || 'Could not load server logs');
    } finally {
      setLoading(false);
    }
  }, [level, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header title="SERVER LOGS" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-3">
              <Terminal className="w-3 h-3" /> Secure · OTP verified
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Server Logs
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Live backend traffic and errors — newest first.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                onClick={() => { setLevel(l.key); }}
                className="h-10 px-3.5 rounded-xl border text-xs font-bold transition-all"
                style={{
                  backgroundColor: level === l.key ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                  borderColor: level === l.key ? 'rgba(99,102,241,0.5)' : 'var(--border-primary)',
                  color: level === l.key ? '#818cf8' : 'var(--text-muted)',
                }}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => load()}
              className="h-10 w-10 rounded-xl border flex items-center justify-center hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {runtime && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Clock, label: 'Uptime', value: `${Math.floor((runtime.uptimeSeconds || 0) / 3600)}h ${Math.floor(((runtime.uptimeSeconds || 0) % 3600) / 60)}m` },
              { icon: Cpu, label: 'Node', value: runtime.node || '—' },
              { icon: Database, label: 'Memory RSS', value: `${runtime.rssMB || 0} MB` },
              { icon: Terminal, label: 'Buffered', value: `${entries.length} entries` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-16 text-center" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No log entries yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Use the app — API traffic appears here in real time.</p>
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden font-mono text-[11px] leading-relaxed"
            style={{ backgroundColor: '#0b1020', borderColor: 'var(--border-primary)', color: '#c7d2fe' }}
          >
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-2 px-3 py-1.5 border-b border-white/5 hover:bg-white/5">
                <span className="text-slate-500 flex-shrink-0">
                  {e.at ? new Date(e.at).toLocaleTimeString('en-IN', { hour12: false }) : '--:--:--'}
                </span>
                <span className={`px-1.5 rounded border text-[9px] font-black uppercase flex-shrink-0 ${levelStyle(e.level)}`}>
                  {e.level || 'info'}
                </span>
                {e.method && <span className="text-sky-300 font-bold flex-shrink-0 w-12">{e.method}</span>}
                <span className="break-all flex-1">
                  {e.kind === 'request' ? `${e.path} → ${e.status} · ${e.durationMs}ms · ${e.role}` : (e.message || JSON.stringify(e))}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServerLogs;
