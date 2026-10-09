/**
 * Client metadata for security emails (Device / Location / IP rows).
 * Best-effort only: anything unknown falls back to null and the template
 * renders its placeholder. Never throws, never blocks the request for long.
 */

const geoCache = new Map(); // ip -> { value, at }
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const GEO_TIMEOUT_MS = 2500;

function isPublicIp(ip = '') {
  const v = String(ip || '').trim();
  if (!v || v === '::1' || v === '::ffff:127.0.0.1') return false;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|169\.254\.|fc00:|fe80:)/i.test(v)) return false;
  return true;
}

export function clientIp(req) {
  try {
    const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    const raw = fwd || req?.ip || req?.socket?.remoteAddress || '';
    return String(raw).replace(/^::ffff:/, '').trim() || null;
  } catch {
    return null;
  }
}

/** "Chrome on Windows" / "Safari on iPhone" style label from User-Agent. */
export function parseDevice(ua = '') {
  try {
    const s = String(ua || '');
    if (!s) return null;
    let browser = null;
    if (/Edg\//i.test(s)) browser = 'Edge';
    else if (/OPR\/|Opera/i.test(s)) browser = 'Opera';
    else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = 'Chrome';
    else if (/Firefox\//i.test(s)) browser = 'Firefox';
    else if (/Safari\//i.test(s) && /Version\//i.test(s)) browser = 'Safari';
    else if (/Chromium/i.test(s)) browser = 'Chromium';
    let os = null;
    if (/Windows NT/i.test(s)) os = 'Windows';
    else if (/Android/i.test(s)) os = /Mobile/i.test(s) ? 'Android phone' : 'Android';
    else if (/iPhone|iPad|iPod/i.test(s)) os = /iPad/i.test(s) ? 'iPad' : 'iPhone';
    else if (/Mac OS X/i.test(s)) os = 'Mac';
    else if (/Linux/i.test(s)) os = 'Linux';
    if (browser && os) return `${browser} on ${os}`;
    return browser || os || null;
  } catch {
    return null;
  }
}

/** "City, Country" via a quick IP lookup (2.5s cap, 24h cache). */
export async function lookupLocation(ip) {
  try {
    if (!isPublicIp(ip)) return null;
    const hit = geoCache.get(ip);
    if (hit && Date.now() - hit.at < GEO_TTL_MS) return hit.value;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS);
    try {
      const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: ctrl.signal });
      if (!res.ok) return null;
      const j = await res.json().catch(() => null);
      const city = j?.city || null;
      const country = j?.country_name || j?.country || null;
      const value = [city, country].filter(Boolean).join(', ') || null;
      if (value) geoCache.set(ip, { value, at: Date.now() });
      return value;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
