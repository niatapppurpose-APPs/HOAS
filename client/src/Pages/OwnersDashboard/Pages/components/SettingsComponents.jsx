import React from 'react';
import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import * as cloudFunctions from '../../../../firebase/cloudFunctions';
/* ── Status Badge ── */
export const StatusBadge = React.memo(({ status }) => {
  const cfg = {
    active: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'Active' },
    secured: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'Secured' },
    warning: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Warning' },
    enabled: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'Enabled' },
    disabled: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Disabled' },
    inactive: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280', label: 'Inactive' },
  };
  const c = cfg[status] || cfg.active;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest select-none"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.text}22` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: c.text }} />
      {c.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

// Refresh Button 

export const RefreshButton = ({ onRefresh, loading = false }) => {
  return (
    <button onClick={onRefresh} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-xs font-medium cursor-pointer"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-muted)' }}>
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
}

/* ── Toggle Switch ── */
export const ToggleSwitch = React.memo(({ enabled, onChange, disabled = false, size = 'md' }) => {
  const s = size === 'sm'
    ? { track: 'w-9 h-5', on: 'translate-x-4', off: 'translate-x-0.5', dot: 'w-3.5 h-3.5' }
    : { track: 'w-11 h-6', on: 'translate-x-5', off: 'translate-x-0.5', dot: 'w-4 h-4' };
  return (
    <button type="button" role="switch" aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)} disabled={disabled}
      className={`${s.track} relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ backgroundColor: enabled ? '#6366f1' : 'var(--border-secondary)' }}>
      <span className={`${s.dot} inline-block rounded-full bg-white shadow-md transform transition-transform duration-300 ${enabled ? s.on : s.off}`} />
    </button>
  );
});
ToggleSwitch.displayName = 'ToggleSwitch';

/* ── Section Card (static – no dropdown) ── */
export const SectionCard = React.memo(({ title, icon: Icon, accent = '#6366f1', status, headerExtra, children }) => (
  <div className="rounded-2xl border overflow-hidden transition-shadow duration-300 hover:shadow-lg w-full"
    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    {/* Header bar */}
    <div className="flex flex-row items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b gap-2 sm:gap-0" style={{ borderColor: 'var(--border-primary)', background: `${accent}06` }}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}15` }}>
          <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: accent }} />
        </div>
        <h3 className="font-semibold text-[13px] sm:text-[15px] tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status && <StatusBadge status={status} />}
        {headerExtra}
      </div>
    </div>
    {/* Body */}
    <div className="p-3 sm:p-5">{children}</div>
  </div>
));
SectionCard.displayName = 'SectionCard';

/* ── Setting Row ── */
export const SettingRow = React.memo(({ icon: Icon, title, description, children, warning = false }) => (
  <div className="flex flex-row items-center justify-between py-3 px-3 sm:px-4 rounded-xl gap-3 sm:gap-4"
    style={{
      backgroundColor: warning ? 'rgba(245,158,11,0.05)' : 'var(--bg-tertiary)',
      border: warning ? '1px solid rgba(245,158,11,0.18)' : '1px solid transparent',
    }}>
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {Icon && <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" style={{ color: warning ? '#f59e0b' : 'var(--text-muted)' }} />}
      <div className="min-w-0">
        <p className="font-medium text-[13px] sm:text-sm leading-snug truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {description && <p className="text-[11px] mt-0.5 leading-snug line-clamp-1 sm:line-clamp-2" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
));
SettingRow.displayName = 'SettingRow';
