import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Mail, Loader2, RefreshCw, Lock, Timer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import * as cloudFunctions from '../../firebase/cloudFunctions';
import { useToast } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ThemeToggle';

/**
 * SecureGate — step-up authentication for sensitive Owner pages.
 * Even a signed-in owner must verify a 6-digit OTP emailed to them before
 * the wrapped page renders. Unlock lasts 15 minutes per purpose (session).
 *
 * - 10-minute OTP countdown (rolling digits) survives page reload via
 *   sessionStorage, so an accidental refresh never loses the timer.
 * - `?purpose=<p>&code=<6-digit>` deep-links (from the mail button)
 *   prefill the code automatically.
 *
 * Usage: <SecureGate purpose="audit-logs" title="Audit Logs">{...}</SecureGate>
 */
const UNLOCK_TTL_MS = 15 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

const unlockKey = (purpose) => `hoas-secure-unlock:${purpose}`;
const expiryKey = (purpose) => `hoas-otp-expires:${purpose}`;

export const isSecureUnlocked = (purpose) => {
  try {
    const raw = sessionStorage.getItem(unlockKey(purpose));
    if (!raw) return false;
    return Date.now() - Number(raw) < UNLOCK_TTL_MS;
  } catch {
    return false;
  }
};

const markSecureUnlocked = (purpose) => {
  try {
    sessionStorage.setItem(unlockKey(purpose), String(Date.now()));
  } catch {
    // ignore storage errors — gate just re-locks next mount
  }
};

export const SECURE_LOCK_EVENT = 'hoas:secure-lock';

/**
 * End a secure session from anywhere (e.g. an "End session" button on the
 * unlocked page). Clears the unlock + OTP window and tells the mounted
 * <SecureGate> for that purpose to show the lock screen again.
 */
export const lockSecurePage = (purpose) => {
  try {
    sessionStorage.removeItem(unlockKey(purpose));
    sessionStorage.removeItem(expiryKey(purpose));
  } catch { /* noop */ }
  try {
    window.dispatchEvent(new CustomEvent(SECURE_LOCK_EVENT, { detail: { purpose } }));
  } catch { /* noop */ }
};

const readExpiry = (purpose) => {
  try {
    const raw = sessionStorage.getItem(expiryKey(purpose));
    const ts = Number(raw);
    return Number.isFinite(ts) && ts > 0 ? ts : 0;
  } catch {
    return 0;
  }
};

/** Single rolling digit (0-9 reel slides vertically on change). */
const RollDigit = ({ digit }) => {
  const d = Math.max(0, Math.min(9, Number(digit) || 0));
  return (
    <span className="otp-digit" aria-hidden="true">
      <span className="otp-digit-reel" style={{ transform: `translateY(${-d * 1.2}em)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
};

/** MM:SS countdown with rolling digits. Calls onExpire once at zero. */
const OtpCountdown = ({ expiresAt, onExpire }) => {
  const [now, setNow] = useState(() => Date.now());
  const expired = expiresAt > 0 && now >= expiresAt;

  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [expiresAt]);

  useEffect(() => {
    if (expired) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (!expiresAt) return null;
  const ms = Math.max(0, expiresAt - now);
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const urgent = ms < 60000;
  const digits = `${String(mm).padStart(2, '0')}${String(ss).padStart(2, '0')}`;

  return (
    <span
      className={`otp-timer ${urgent ? 'otp-timer-urgent' : ''}`}
      role="timer"
      aria-label={`Code expires in ${mm} minutes ${ss} seconds`}
    >
      <Timer className="w-3 h-3 mr-1" />
      <RollDigit digit={digits[0]} />
      <RollDigit digit={digits[1]} />
      <span className="otp-colon">:</span>
      <RollDigit digit={digits[2]} />
      <RollDigit digit={digits[3]} />
    </span>
  );
};

const SecureGate = ({ purpose, title, description, children }) => {
  const toast = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [unlocked, setUnlocked] = useState(() => isSecureUnlocked(purpose));
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  // If a valid OTP window already exists (e.g. page reloaded after the mail
  // arrived), show the code form straight away with the remaining time.
  const [codeSent, setCodeSent] = useState(() => readExpiry(purpose) > Date.now());
  const [expiresAt, setExpiresAt] = useState(() => readExpiry(purpose));
  const [expired, setExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Deep-link from the mail button: ?purpose=<p>&code=<6 digits> prefills.
  // The code is scrubbed from the URL right after reading it.
  useEffect(() => {
    const qPurpose = searchParams.get('purpose');
    const qCode = (searchParams.get('code') || '').replace(/\D/g, '');
    if (qPurpose === purpose && /^\d{6}$/.test(qCode)) {
      setCode(qCode);
      setCodeSent(true);
      toast.success('Code from your email loaded — tap Unlock page');
      const next = new URLSearchParams(searchParams);
      next.delete('code');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Re-lock when an "End session" button fires lockSecurePage(purpose):
  // drop back to the lock screen with a fresh (empty) form.
  useEffect(() => {
    const onLock = (e) => {
      if (e?.detail?.purpose !== purpose) return;
      setUnlocked(false);
      setCode('');
      setCodeSent(false);
      setSentTo('');
      setExpiresAt(0);
      setExpired(false);
    };
    window.addEventListener(SECURE_LOCK_EVENT, onLock);
    return () => window.removeEventListener(SECURE_LOCK_EVENT, onLock);
  }, [purpose]);

  const sendCode = useCallback(async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    try {
      const res = await cloudFunctions.requestSecureOtp(purpose);
      setSentTo(res?.sentTo || user?.email || 'your email');
      setCodeSent(true);
      setExpired(false);
      const ttl = (Number(res?.expiresInSeconds) || OTP_TTL_MS / 1000) * 1000;
      const exp = Date.now() + ttl;
      setExpiresAt(exp);
      try {
        sessionStorage.setItem(expiryKey(purpose), String(exp));
      } catch { /* timer persistence is best-effort */ }
      setCooldown(60);
      toast.success(`Security code sent to ${res?.sentTo || 'your email'}`);
    } catch (err) {
      toast.error(err?.message || 'Could not send code. Try again.');
    } finally {
      setSending(false);
    }
  }, [sending, cooldown, purpose, toast, user?.email]);

  const verifyCode = useCallback(async (e) => {
    e?.preventDefault?.();
    const clean = code.replace(/\D/g, '');
    if (clean.length !== 6) {
      toast.warning('Enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    try {
      await cloudFunctions.verifySecureOtp(purpose, clean);
      markSecureUnlocked(purpose);
      try {
        sessionStorage.removeItem(expiryKey(purpose));
      } catch { /* noop */ }
      setUnlocked(true);
      toast.success(`${title} unlocked for 15 minutes`);
    } catch (err) {
      toast.error(err?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }, [code, purpose, title, toast]);

  if (unlocked) return children;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div
        className="relative w-full max-w-md rounded-3xl border p-8 text-center"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
        {/* Theme toggle on the lock screen */}
        <div className="absolute top-4 right-4">
          <ThemeToggle size="sm" />
        </div>

        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
          {title} — Locked
        </h2>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {description || 'This page is extra secure. Verify a one-time code sent to your email to open it.'}
        </p>

        {!codeSent ? (
          <button
            onClick={sendCode}
            disabled={sending}
            className="mt-6 w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sending ? 'Sending code…' : 'Send code to my email'}
          </button>
        ) : (
          <form onSubmit={verifyCode} className="mt-6 space-y-3">
            {sentTo ? (
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Code sent to <span className="font-bold">{sentTo}</span>
              </p>
            ) : (
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Enter the code from your email
              </p>
            )}
            {/* 10-minute countdown — survives reloads */}
            <div className="flex items-center justify-center">
              {expired ? (
                <span className="text-[11px] font-bold text-red-500">
                  Code expired — tap Resend below
                </span>
              ) : (
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Expires in <OtpCountdown expiresAt={expiresAt} onExpire={() => setExpired(true)} />
                </span>
              )}
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className="w-full h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/30"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {verifying ? 'Verifying…' : 'Unlock page'}
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={sending || cooldown > 0}
              className="w-full text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw className={`w-3 h-3 ${sending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SecureGate;
