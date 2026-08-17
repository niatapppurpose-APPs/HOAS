import React, { useState, useCallback } from 'react';
import * as cloudFunctions from '../../../../firebase/cloudFunctions';
import { useToast } from '../../../../components/Toast';
import {
  RefreshCw,
  Loader2,
  ScrollText,
  Settings,
  X,
} from 'lucide-react';

const AccessLogsModal = React.memo(({ onClose }) => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { logs } = await cloudFunctions.getSettingsAuditLogs();
      setLogs((logs || []).map(l => ({
        id: l._id,
        action: l.action,
        performedAt: l.timestamp,
        performedBy: l.actorId?.name || l.actorId?.email || '',
        changes: l.metadata || {},
        previousVersion: l.metadata?.previousVersion,
        newVersion: l.metadata?.newVersion,
      })));
    } catch (err) {
      console.error('Failed to fetch access logs:', err);
      toast.error('Failed to load access logs');
    } finally {
      setLogsLoading(false);
    }
  }, [toast]);

  // Fetch on mount
  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <ScrollText className="w-[18px] h-[18px]" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Access Logs</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Recent settings changes &amp; audit trail</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchLogs} disabled={logsLoading}
              className="p-2 rounded-lg border transition hover:scale-105 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
              <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-lg border transition hover:scale-105 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {logsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6366f1' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading logs…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ScrollText className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No access logs yet</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Logs will appear when settings are changed</p>
            </div>
          ) : (
            logs.map((log) => {
              const date = log.performedAt ? new Date(log.performedAt) : null;
              const changedKeys = log.changes ? Object.keys(log.changes).filter(k => !['updatedAt', 'updatedBy', 'version'].includes(k)) : [];
              return (
                <div key={log.id} className="p-4 rounded-xl border transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                        <Settings className="w-4 h-4" style={{ color: '#6366f1' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {log.action === 'UPDATE_SETTINGS' ? 'Settings Updated' : log.action || 'Change'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          v{log.previousVersion || '?'} → v{log.newVersion || '?'}
                          {log.performedBy && <span> · by <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{log.performedBy.substring(0, 8)}…</span></span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {date && (
                        <>
                          <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{date.toLocaleDateString()}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{date.toLocaleTimeString()}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {changedKeys.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {changedKeys.slice(0, 6).map(k => (
                        <span key={k} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}>
                          {k}
                        </span>
                      ))}
                      {changedKeys.length > 6 && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                          +{changedKeys.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{logs.length} log{logs.length !== 1 ? 's' : ''} · Last 50 entries</p>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

AccessLogsModal.displayName = 'AccessLogsModal';

export default AccessLogsModal;
