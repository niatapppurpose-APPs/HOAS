import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { updateProfile } from '../../firebase/cloudFunctions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { KeyRound, Mail, Loader2, CheckCircle, LogOut } from 'lucide-react';

/**
 * ForcePasswordReset Page
 * 
 * Shown when the admin has enabled `forcePasswordReset` in system settings.
 * Users must reset their password before they can continue using the app.
 */
const ForcePasswordReset = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found for your account.');
      return;
    }

    setSending(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      try {
        await updateProfile({ lastPasswordResetAt: new Date().toISOString() });
      } catch (e) {
        console.error('[ForcePasswordReset] Failed to update user doc:', e);
      }
      setSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary, #0f172a)' }}>
      <div className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{
          backgroundColor: 'var(--bg-card, #1e293b)',
          borderColor: 'var(--border-primary, #334155)',
        }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
          <KeyRound className="w-8 h-8 text-amber-500" />
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary, #f8fafc)' }}>
          Password Reset Required
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted, #94a3b8)' }}>
          The system administrator requires all users to reset their password.
          Please reset your password to continue.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-500">Reset email sent!</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted, #94a3b8)' }}>
              Check <strong>{user?.email}</strong> for the reset link. After resetting, log in again.
            </p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors">
              <LogOut className="w-4 h-4" />
              Log Out & Sign In Again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl text-left"
              style={{ backgroundColor: 'var(--bg-tertiary, #0f172a)' }}>
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm truncate" style={{ color: 'var(--text-secondary, #cbd5e1)' }}>
                {user?.email || 'your email'}
              </span>
            </div>

            <button
              onClick={handleSendResetEmail}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><KeyRound className="w-4 h-4" /> Send Password Reset Email</>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary, #0f172a)',
                color: 'var(--text-secondary, #cbd5e1)',
                border: '1px solid var(--border-primary, #334155)',
              }}>
              <LogOut className="w-4 h-4" />
              Log Out Instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForcePasswordReset;
