import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { ScrollText, RefreshCw, User, Clock } from 'lucide-react';
import Header from '../../../components/OwnerServices/header';
import SecureGate from '../../../components/SecureGate/SecureGate';
import { useToast } from '../../../components/Toast';
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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

  const visible = filter.trim()
    ? logs.filter((l) => {
        const q = filter.toLowerCase();
        return [l.action, l.targetType, l.actorId?.email, l.actorId?.name]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
      })
    : logs;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header title="AUDIT LOGS" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-3">
              <ScrollText className="w-3 h-3" /> Secure · OTP verified
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Audit Logs
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Who changed what, and when — approvals, settings, roles and more.
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <HashLoader color="#6366F1" size={44} />
          </div>
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
