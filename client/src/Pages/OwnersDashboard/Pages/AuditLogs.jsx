import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { ScrollText, RefreshCw, User, Clock, List, SquareTerminal } from 'lucide-react';
import Header from '../../../components/OwnerServices/header';
import SecureGate from '../../../components/SecureGate/SecureGate';
import { useToast } from '../../../components/Toast';
import useSocket from '../../../hooks/useSocket';
import LogTerminal from '../../../components/LogTerminal/LogTerminal';
import { auditEntryToAnsi, auditEntryToText } from '../../../components/LogTerminal/ansi';
import * as cloudFunctions from '../../../firebase/cloudFunctions';

const AuditLogs = () => {
  return (
    <SecureGate
      purpose="audit-logs"
      title="Audit Logs"
      description="Every admin action is recorded here. Verify a one-time code sent to your email to open this secure log."
    >
      <AuditLogsBody />
    </SecureGate>
  );
};

const AuditLogsBody = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();
  useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [live, setLive] = useState(true);
  const [view, setView] = useState('terminal'); // 'terminal' | 'list'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cloudFunctions.getSettingsAuditLogs();
      setLogs(res?.logs || []);
    } catch (err) {
      toast.error(err?.message || 'Could not load audit logs');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Live tail: instant socket push (backend emits `audit:new` to admins)
  useEffect(() => {
    const onAudit = (e) => {
      if (!live) return;
      const entry = e?.detail?.entry || e?.detail?.log || e?.detail;
      if (!entry || (!entry._id && !entry.action)) return;
      setLogs((prev) => {
        if (entry._id && prev.some((l) => l._id === entry._id)) return prev;
        return [entry, ...prev].slice(0, 500);
      });
    };
    window.addEventListener('hoas:audit-new', onAudit);
    return () => window.removeEventListener('hoas:audit-new', onAudit);
  }, [live]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.action, l.targetType, l.actorRole, l.actorId?.email, l.actorId?.name]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [logs, filter]);

  const ansiLines = useMemo(() => visible.slice().reverse().map(auditEntryToAnsi), [visible]);
  const plainLines = useMemo(() => visible.slice().reverse().map(auditEntryToText), [visible]);

  const doExport = useCallback((format = 'log') => {
    try {
      const body = format === 'json'
        ? JSON.stringify(visible, null, 2)
        : visible.slice().reverse().map(auditEntryToText).join('\n');
      const blob = new Blob([body], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hoas-audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${format === 'json' ? 'json' : 'log'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast.success(`Exported ${visible.length} entries as .${format === 'json' ? 'json' : 'log'}`);
    } catch {
      toast.error('Export failed');
    }
  }, [visible, toast]);

  // `$` prompt commands wired to page state
  const handleCommand = useCallback((input, { print, search }) => {
    const [name, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');
    switch (name.toLowerCase()) {
      case 'filter':
        setFilter(arg);
        print(arg ? `filter → “${arg}”` : 'filter cleared');
        return true;
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
      default: return false;
    }
  }, [load, doExport]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header title="AUDIT LOGS" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-3">
              <ScrollText className="w-3 h-3" /> Secure · OTP verified · xterm.js
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Audit Logs
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Who changed what, and when — approvals, settings, roles and more. Type <code className="px-1 rounded bg-white/10">help</code> in the terminal for all operations.
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search action, actor…"
              className="h-10 px-3 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={load}
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

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : view === 'terminal' ? (
          <LogTerminal
            lines={ansiLines}
            plainLines={plainLines}
            headerLine={`HOAS · audit trail · ${visible.length}/${logs.length} shown · type "help" for commands`}
            placeholder="No audit entries found — admin actions will appear here."
            live={live}
            onToggleLive={() => setLive((v) => !v)}
            onRefresh={load}
            refreshing={loading}
            statusText={`${visible.length}/${logs.length} shown · ${live ? 'live' : 'paused'}`}
            onExport={doExport}
            onCommand={handleCommand}
            storageKey="hoas-audit-logs"
            height={480}
          />
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-16 text-center" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No audit entries found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Admin actions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((log) => (
              <div
                key={log._id || `${log.timestamp}-${log.action}`}
                className="flex items-start gap-3 p-3.5 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {log.action?.replace(/_/g, ' ')}
                    <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">
                      {log.targetType || '—'}
                    </span>
                  </p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {log.actorId?.name || log.actorId?.email || 'System'}
                    {log.actorId?.role ? ` · ${log.actorId.role}` : ''}
                    {log.metadata?.changes ? ` · ${Object.keys(log.metadata.changes).length} field(s) changed` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3 h-3" />
                  {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditLogs;
