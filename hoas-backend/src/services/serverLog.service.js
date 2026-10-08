/**
 * Lightweight in-memory server log ring buffer for the Owner "Server Logs"
 * secure page. Captures API request lines (method, path, status, duration,
 * role) plus backend error events. Last 500 entries kept; nothing sensitive
 * (no tokens, no bodies) is stored.
 */

const MAX_ENTRIES = 500;
const buffer = [];
const bootTime = Date.now();

// Lazy socket emit (avoids circular imports at module load): every new
// server-log line is pushed to owner/admin consoles for live xterm tail.
function emitLive(entry) {
  try {
    // socket.service owns the `io` instance; dynamic import keeps this
    // logger safe to import from app.js before sockets initialize.
    import('./socket.service.js').then(({ getIo }) => {
      const io = getIo?.();
      if (io) io.to('admins').emit('log:new', { entry });
    }).catch(() => { /* live tail is best-effort */ });
  } catch { /* never break logging */ }
}

export function pushServerLog(entry) {
  const full = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  };
  buffer.push(full);
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
  emitLive(full);
}

export function logServerError(message, context = {}) {
  pushServerLog({ level: 'error', kind: 'error', message: String(message || 'Unknown error').slice(0, 500), ...context });
}

// Express middleware: logs every /api request line with status + duration.
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    try {
      const url = String(req.originalUrl || req.url || '').split('?')[0];
      if (!url.startsWith('/api')) return;
      // Skip high-frequency noise; the page itself polling would flood the log.
      if (url.startsWith('/api/logs/server')) return;
      pushServerLog({
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        kind: 'request',
        method: req.method,
        path: url,
        status: res.statusCode,
        durationMs: Date.now() - start,
        role: req.user?.role || 'anonymous',
      });
    } catch {
      // Logging must never break responses.
    }
  });
  next();
}

export function getServerLogSnapshot({ level, limit = 200, search = '' } = {}) {
  const q = String(search || '').trim().toLowerCase();
  let entries = level && level !== 'all'
    ? buffer.filter((e) => e.level === level)
    : buffer.slice();
  if (q) {
    entries = entries.filter((e) =>
      [e.method, e.path, e.message, e.role, e.level, String(e.status ?? '')]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }
  entries = entries.slice(-Math.min(Math.max(Number(limit) || 200, 1), MAX_ENTRIES)).reverse();
  const mem = process.memoryUsage();
  return {
    entries,
    totalBuffered: buffer.length,
    runtime: {
      uptimeSeconds: Math.round((Date.now() - bootTime) / 1000),
      node: process.version,
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    },
  };
}
