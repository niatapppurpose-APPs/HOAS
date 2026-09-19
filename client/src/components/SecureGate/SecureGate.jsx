import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Mail, Loader2, RefreshCw, Lock } from 'lucide-react';
import * as cloudFunctions from '../../firebase/cloudFunctions';
import { useToast } from '../Toast';
import { useAuth } from '../../context/AuthContext';

/**
 * SecureGate — step-up authentication for sensitive Owner pages.
 * Even a signed-in owner must verify a 6-digit OTP emailed to them before
 * the wrapped page renders. Unlock lasts 15 minutes per purpose (session).
 *
 * Usage: <SecureGate purpose="audit-logs" title="Audit Logs">{...}</SecureGate>
 */
const UNLOCK_TTL_MS = 15 * 60 * 1000;

const unlockKey = (purpose) => `hoas-secure-unlock:${purpose}`;

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

const SecureGate = ({ purpose, title, description, children }) => {
  const toast = useToast();
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(() => isSecureUnlocked(purpose));
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = useCallback(async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    try {
      const res = await cloudFunctions.requestSecureOtp(purpose);
      setSentTo(res?.sentTo || user?.email || 'your email');
      setCodeSent(true);
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
        className="w-full max-w-md rounded-3xl border p-8 text-center"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
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
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Code sent to <span className="font-bold">{sentTo}</span>
            </p>
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
