import { memo, useState } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Bug,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const BugReportModal = memo(({ userData, onClose }) => {
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: userData?._id || userData?.uid || 'management',
        userName: userData?.fullName || userData?.displayName || 'Management',
        userEmail: userData?.email || 'Unknown',
        userRole: 'management',
        college: userData?.collegeName || '',
        managementId: userData?.managementId || '',
        subject: 'Bug Report',
        description: description.trim(),
        category: 'technical',
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Bug report error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => { if (!submitting) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <Bug className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Report a Bug</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Bug Report Submitted!</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Thank you for helping us improve HOAS. We&apos;ll review your report shortly.</p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Describe the issue you&apos;re experiencing. Include steps to reproduce if possible.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug in detail..."
                rows={5}
                className="w-full rounded-xl border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <div className="flex items-center gap-2 mt-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Your report will include your name ({userData?.displayName || 'N/A'}) and college ({userData?.collegeName || 'N/A'}) for context.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: description.trim() ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-tertiary)',
                boxShadow: description.trim() ? '0 4px 15px rgba(239, 68, 68, 0.3)' : 'none',
                color: description.trim() ? '#fff' : 'var(--text-muted)'
              }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Report</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

BugReportModal.displayName = 'BugReportModal';

export default BugReportModal;
