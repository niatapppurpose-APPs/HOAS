/**
 * ANSI helpers for rendering log entries inside xterm.js.
 * xterm interprets standard SGR escape codes, so we colorize
 * level badges / timestamps / methods without any HTML.
 */

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// eslint-disable-next-line no-control-regex
export const stripAnsi = (s = '') => String(s).replace(/\x1b\[[0-9;]*m/g, '');

/** "14:02:11" style time for server log entries */
export function formatTime(iso) {
  try {
    if (!iso) return '--:--:--';
    return new Date(iso).toLocaleTimeString('en-IN', { hour12: false });
  } catch {
    return '--:--:--';
  }
}

export function levelBadge(level = 'info') {
  const lv = String(level || 'info').toLowerCase();
  if (lv === 'error') return `${ANSI.bgRed}${ANSI.white} ERROR ${ANSI.reset}`;
  if (lv === 'warn') return `${ANSI.bgYellow}${ANSI.white} WARN  ${ANSI.reset}`;
  return `${ANSI.bgGreen}${ANSI.white} INFO  ${ANSI.reset}`;
}

/** One backend server-log entry -> single ANSI line for the terminal */
export function serverEntryToAnsi(e = {}) {
  const t = `${ANSI.gray}${formatTime(e.at)}${ANSI.reset}`;
  const badge = levelBadge(e.level);
  if (e.kind === 'request') {
    const method = `${ANSI.cyan}${ANSI.bold}${String(e.method || '-').padEnd(6).slice(0, 6)}${ANSI.reset}`;
    const statusColor = e.status >= 500 ? ANSI.red : e.status >= 400 ? ANSI.yellow : ANSI.green;
    const path = `${ANSI.white}${e.path || '/'}${ANSI.reset}`;
    const meta = `${ANSI.gray}→ ${statusColor}${e.status ?? '-'}${ANSI.gray} · ${e.durationMs ?? 0}ms · ${e.role || 'anonymous'}${ANSI.reset}`;
    return `${t} ${badge} ${method} ${path} ${meta}`;
  }
  const msg = e.message || JSON.stringify(e);
  const color = e.level === 'error' ? ANSI.red : e.level === 'warn' ? ANSI.yellow : ANSI.white;
  return `${t} ${badge} ${color}${msg}${ANSI.reset}`;
}

/** One audit-log entry -> single ANSI line for the terminal */export function auditEntryToAnsi(log = {}) {
  const t = log.timestamp ? formatTime(log.timestamp) : '--:--:--';
  const action = `${ANSI.magenta}${ANSI.bold}${String(log.action || 'unknown').replace(/_/g, ' ')}${ANSI.reset}`;
  const target = `${ANSI.blue}[${log.targetType || '-'}]${ANSI.reset}`;
  const actor = log.actorId?.name || log.actorId?.email || 'System';
  const role = log.actorRole || log.actorId?.role || '';
  const changed = log.metadata?.changes ? ` ${ANSI.gray}· ${Object.keys(log.metadata.changes).length} field(s)${ANSI.reset}` : '';
  const date = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '';
  return `${ANSI.gray}${t}${ANSI.reset} ${action} ${target} ${ANSI.cyan}${actor}${ANSI.reset}${role ? `${ANSI.gray} (${role})${ANSI.reset}` : ''}${changed} ${ANSI.gray}${date}${ANSI.reset}`;
}

/** Plain-text (no ANSI) variants used for export / copy */
export function serverEntryToText(e = {}) {
  if (e.kind === 'request') {
    return `${formatTime(e.at)} [${(e.level || 'info').toUpperCase()}] ${e.method || '-'} ${e.path || '/'} -> ${e.status ?? '-'} ${e.durationMs ?? 0}ms ${e.role || ''}`.trim();
  }
  return `${formatTime(e.at)} [${(e.level || 'info').toUpperCase()}] ${e.message || JSON.stringify(e)}`;
}

export function auditEntryToText(log = {}) {
  const actor = log.actorId?.name || log.actorId?.email || 'System';
  const date = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '';
  return `${date} | ${log.action || 'unknown'} | ${log.targetType || '-'} | ${actor} | ${log.actorRole || ''}`.trim();
}

/**
 * Shared WHITE xterm theme — all terminals stay light even in dark mode.
 * The palette remaps ANSI codes so existing log lines stay readable:
 * "white/bright-white" codes render as dark slate text, everything else
 * uses high-contrast light-theme shades.
 */
export const LIGHT_TERM_THEME = {
  background: '#ffffff',
  foreground: '#1e293b',
  cursor: '#6366f1',
  cursorAccent: '#ffffff',
  selectionBackground: 'rgba(99,102,241,0.28)',
  selectionForeground: '#0f172a',
  black: '#f1f5f9',
  red: '#dc2626',
  green: '#15803d',
  yellow: '#b45309',
  blue: '#1d4ed8',
  magenta: '#a21caf',
  cyan: '#0e7490',
  white: '#334155',
  brightBlack: '#64748b',
  brightRed: '#dc2626',
  brightGreen: '#15803d',
  brightYellow: '#b45309',
  brightBlue: '#1d4ed8',
  brightMagenta: '#a21caf',
  brightCyan: '#0e7490',
  brightWhite: '#0f172a',
};
