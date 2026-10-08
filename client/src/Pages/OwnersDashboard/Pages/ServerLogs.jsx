import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { Terminal, RefreshCw, Cpu, Database, Clock, List, SquareTerminal } from 'lucide-react';
import Header from '../../../components/OwnerServices/header';
import SecureGate from '../../../components/SecureGate/SecureGate';
import { useToast } from '../../../components/Toast';
import useSocket from '../../../hooks/useSocket';
import LogTerminal from '../../../components/LogTerminal/LogTerminal';
import { serverEntryToAnsi, serverEntryToText } from '../../../components/LogTerminal/ansi';
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
  useSocket(); // keep shared socket connected; log events arrive as window events
  const [entries, setEntries] = useState([]);
  const [runtime, setRuntime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('all');
  const [filter, setFilter] = useState('');
  const [live, setLive] = useState(true);
  const [view, setView] = useState('terminal'); // 'terminal' | 'list'
  const [tail, setTail] = useState(200);
  const termRef = useRef(null);

  const load = useCallback(async (lv = level, lim = tail) => {
    setLoading(true);
    try {
      const res = await cloudFunctions.getServerLogs({ level: lv === 'all' ? undefined : lv, limit: lim });
      setEntries(res?.entries || []);
      setRuntime(res?.runtime || null);
    } catch (err) {
      toast.error(err?.message || 'Could not load server logs');
    } finally {
      setLoading(false);
    }
  }, [level, tail, toast]);

  useEffect(() => { load(); }, [load]);

  // Live tail: poll every 5s while live
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      cloudFunctions.getServerLogs({ level: level === 'all' ? undefined : level, limit: tail })
        .then((res) => {
          if (res?.entries) setEntries(res.entries);
          if (res?.runtime) setRuntime(res.runtime);
        })
        .catch(() => { /* polling must never toast-spam */ });
    }, 5000);
    return () => clearInterval(t);
  }, [live, level, tail]);

  // Live tail: instant socket push (backend emits `log:new` to admins)
  useEffect(() => {
    const onLog = (e) => {
      if (!live) return;
      const entry = e?.detail?.entry || e?.detail;
      if (!entry || !entry.id) return;
      if (level !== 'all' && entry.level !== level) return;
      setEntries((prev) => [entry, ...prev].slice(0, tail));
    };
    window.addEventListener('hoas:log-new', onLog);
    return () => window.removeEventListener('hoas:log-new', onLog);
  }, [live, level, tail]);

  // Client-side text filter — terminal search highlights without hiding
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.method, e.path, e.message, e.role, e.level, String(e.status)]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [entries, filter]);

  const ansiLines = useMemo(() => filtered.slice().reverse().map(serverEntryToAnsi), [filtered]);
  const plainLines = useMemo(() => filtered.slice().reverse().map(serverEntryToText), [filtered]);

  const doExport = useCallback((format = 'log') => {
    try {
      const body = format === 'json'
        ? JSON.stringify(filtered, null, 2)
        : filtered.slice().reverse().map(serverEntryToText).join('\n');
      const blob = new Blob([body], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hoas-server-logs-${level}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${format === 'json' ? 'json' : 'log'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast.success(`Exported ${filtered.length} entries as .${format === 'json' ? 'json' : 'log'}`);
    } catch {
      toast.error('Export failed');
    }
  }, [filtered, level, toast]);

  // `$` prompt commands wired to page state — all terminal operations
  const handleCommand = useCallback((input, { print, search }) => {
    const [name, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');
    switch (name.toLowerCase()) {
      case 'filter':
        setFilter(arg);
        print(arg ? `filter → “${arg}” (${entries.length} buffered)` : 'filter cleared');
        return true;
      case 'level': {
        const lv = arg.toLowerCase();
        if (['all', 'info', 'warn', 'error'].includes(lv)) {
          setLevel(lv);
          print(`level → ${lv} (reloading…)`);
        } else print('usage: level all|info|warn|error');
        return true;
      }
      case 'tail': {
        const n = Math.max(20, Math.min(500, Number(arg) || 200));
        setTail(n);
        print(`tail → last ${n} entries (reloading…)`);
        return true;
      }
      case 'refresh': load(); print('reloading from server…'); return true;
      case 'pause': setLive(false); print('live tail paused — type "resume" to continue'); return true;
      case 'resume':
      case 'live': setLive(true); print('live tail resumed'); return true;
      case 'view':
        if (arg === 'list' || arg === 'terminal') { setView(arg); print(`view → ${arg}`); }
        else print('usage: view terminal|list');
        return true;
      case 'search': search(arg); print(arg ? `searching for “${arg}”` : 'search cleared'); return true;
      case 'export': doExport(arg === 'json' ? 'json' : 'log'); return true;
      default: return false; // fall through to LogTerminal built-ins (help, clear, copy…)
    }
  }, [entries.length, load, doExport]);

  return (
    <div className="min-h-screen pb-24 force-light" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header title="SERVER LOGS" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-3">
              <Terminal className="w-3 h-3" /> Secure · OTP verified · xterm.js
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Server Logs
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Live backend traffic and errors — newest first. Type <code className="px-1 rounded bg-white/10">help</code> in the terminal for all operations.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
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
            <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                onClick={() => setView('terminal')}
                className="h-10 px-3 flex items-center gap-1.5 text-xs font-bold"
                style={{ backgroundColor: view === 'terminal' ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)', color: view === 'terminal' ? '#818cf8' : 'var(--text-muted)' }}
                title="Terminal view (xterm.js)"
              >
                <SquareTerminal className="w-4 h-4" /> Terminal
              </button>
              <button
                onClick={() => setView('list')}
                className="h-10 px-3 flex items-center gap-1.5 text-xs font-bold"
                style={{ backgroundColor: view === 'list' ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)', color: view === 'list' ? '#818cf8' : 'var(--text-muted)' }}
                title="Classic list view"
              >
                <List className="w-4 h-4" /> List
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter method, path, status… (e.g. GET /api/fees, 500)"
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          />
        </div>

        {runtime && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Clock, label: 'Uptime', value: `${Math.floor((runtime.uptimeSeconds || 0) / 3600)}h ${Math.floor(((runtime.uptimeSeconds || 0) % 3600) / 60)}m` },
              { icon: Cpu, label: 'Node', value: runtime.node || '—' },
              { icon: Database, label: 'Memory RSS', value: `${runtime.rssMB || 0} MB` },
              { icon: Terminal, label: 'Buffered', value: `${entries.length} entries` },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : view === 'terminal' ? (
          <LogTerminal
            ref={termRef}
            lines={ansiLines}
            plainLines={plainLines}
            headerLine={`HOAS · server logs · level=${level} · tail=${tail} · type "help" for commands`}
            placeholder="No log entries yet — use the app and traffic appears here in real time."
            live={live}
            onToggleLive={() => setLive((v) => !v)}
            onRefresh={() => load()}
            refreshing={loading}
            statusText={`${filtered.length}/${entries.length} shown · ${live ? 'live' : 'paused'} · tail ${tail}`}
            onExport={doExport}
            onCommand={handleCommand}
            storageKey="hoas-server-logs"
            height={480}
          />
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-16 text-center" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No log entries yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Use the app — API traffic appears here in real time.</p>
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden font-mono text-[11px] leading-relaxed"
            style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-primary)', color: '#334155' }}
          >
            {filtered.map((e) => (
              <div key={e.id} className="flex items-start gap-2 px-3 py-1.5 border-b border-slate-100 hover:bg-slate-50">
                <span className="text-slate-400 flex-shrink-0">
                  {e.at ? new Date(e.at).toLocaleTimeString('en-IN', { hour12: false }) : '--:--:--'}
                </span>
                <span className={`px-1.5 rounded border text-[9px] font-black uppercase flex-shrink-0 ${levelStyle(e.level)}`}>
                  {e.level || 'info'}
                </span>
                {e.method && <span className="text-sky-700 font-bold flex-shrink-0 w-12">{e.method}</span>}
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
