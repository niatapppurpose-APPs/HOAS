/**
 * Lightweight in-memory server log ring buffer for the Owner "Server Logs"
 * secure page. Captures API request lines (method, path, status, duration,
 * role) plus backend error events. Last 500 entries kept; nothing sensitive
 * (no tokens, no bodies) is stored.
 */

const MAX_ENTRIES = 500;
const buffer = [];
const bootTime = Date.now();

export function pushServerLog(entry) {
  buffer.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  });
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
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

export function getServerLogSnapshot({ level, limit = 200 } = {}) {
  const entries = (level && level !== 'all'
    ? buffer.filter((e) => e.level === level)
    : buffer
  ).slice(-Math.min(Math.max(Number(limit) || 200, 1), MAX_ENTRIES)).reverse();
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
