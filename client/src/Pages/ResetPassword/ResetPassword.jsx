import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import Applogo from '../../assets/Applogo.webp';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const toast = useToast();

  const oobCode = searchParams.get('oobCode') || '';

  const [phase, setPhase] = useState(oobCode ? 'verifying' : 'invalid'); // verifying | form | success | invalid
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Validate the reset code with Firebase
  useEffect(() => {
    if (!oobCode) return;
    let cancelled = false;
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        if (cancelled) return;
        setEmail(verifiedEmail);
        setPhase('form');
      })
      .catch(() => {
        if (cancelled) return;
        setPhase('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setPhase('success');
      toast.success('Password updated successfully!');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
      } else if (code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or has already been used.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError('Could not reset your password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 font-sans"
      style={{ backgroundColor: isDark ? '#020617' : '#F8FAFC', color: isDark ? '#f1f5f9' : '#0f172a' }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={Applogo} alt="HOAS" className="h-14 w-auto mb-3" />
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            Hostel Operations Accountability System
          </p>
        </div>

        <div
          className="rounded-3xl border p-6 sm:p-8 shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          {phase === 'verifying' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Verifying your reset link…
              </p>
            </div>
          )}

          {phase === 'invalid' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                Link invalid or expired
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {!oobCode
                  ? 'This page needs a valid password-reset link. Please use the link from your email.'
                  : 'This reset link has expired or was already used. Ask your administrator for a new one.'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              >
                Back to Login
              </button>
            </div>
          )}

          {phase === 'form' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    Set new password
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {email || 'Your HOAS account'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      minLength={6}
                      required
                      disabled={submitting}
                      className="w-full h-11 pl-10 pr-12 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      minLength={6}
                      required
                      disabled={submitting}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {phase === 'success' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                Password updated
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
