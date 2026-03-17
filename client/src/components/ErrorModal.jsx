import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { useError } from '../context/ErrorContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ErrorModal = () => {
  const { error, clearError } = useError();
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');

  if (!error) return null;

  // Extract file name and line number from stack trace
  const extractFileInfo = (stack) => {
    if (!stack) return { fileName: null, lineNumber: null };

    // Match patterns like "at Component (file.jsx:123:45)" or "file.jsx?t=123:45:67"
    const match = stack.match(/([^/\\]+\.(jsx|js|tsx|ts))[\?:].*?:(\d+)/);
    if (match) {
      return {
        fileName: match[1],
        lineNumber: match[3]
      };
    }
    return { fileName: null, lineNumber: null };
  };

  // Get browser name from user agent
  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Unknown Browser';
  };

  const { fileName, lineNumber } = extractFileInfo(error.stack);
  const browserName = getBrowserName();

  const getEmailLink = () => {
    const body = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 HOAS APPLICATION BUG REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date & Time: ${new Date().toLocaleString()}
🌐 Browser: ${browserName}
📍 Page URL: ${window.location.href}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 ERROR DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 File: ${fileName || 'Unknown'}
📍 Line Number: ${lineNumber || 'Unknown'}
❌ Error Message: ${error.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 STACK TRACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${error.stack || 'No stack trace available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com&su=${encodeURIComponent(`[HOAS Bug Report] ${fileName || 'App'} - ${error.message?.substring(0, 50)}`)}&body=${encodeURIComponent(body)}`;
  };

  // Submit report to Firestore
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        type: 'bug_report',
        status: 'open',
        priority: 'high',
        errorMessage: error.message || 'Unknown error',
        fileName: fileName || 'Unknown',
        lineNumber: lineNumber || 'Unknown',
        stackTrace: error.stack || 'No stack trace',
        pageUrl: window.location.href,
        browser: browserName,
        additionalInfo: additionalInfo || '',
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || userData?.email || 'anonymous',
        userName: user?.displayName || userData?.fullName || 'Anonymous User',
        userRole: userData?.role || 'unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setAdditionalInfo('');
        clearError();
      }, 2500);
    } catch (err) {
      console.error('Failed to submit report:', err);
      // Fallback to email if Firestore fails
      window.open(getEmailLink(), '_blank');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state UI
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative max-w-md w-full bg-white rounded-3xl p-8 sm:p-12 shadow-2xl text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">Report Received!</h3>
          <p className="text-base sm:text-lg text-gray-500">Thank you for helping us improve HOAS. Our engineers are on it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto ">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md " onClick={clearError} />
      <div className="relative max-w-4xl w-full bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in duration-500 my-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          <div className="p-3 rounded-xl bg-red-100 text-red-600 shadow-sm shrink-0">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Application Error</h3>
                <p className="text-base sm:text-lg text-gray-500 mt-1">We've captured a technical issue for our engineering team.</p>
              </div>
              <button
                className="hidden sm:block p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 transform hover:rotate-90"
                onClick={clearError}
              >
                <X className="w-8 h-8" />
              </button>
            </div>





            {/* User Commentary */}
            <div className="mb-6 sm:mb-8 text-left">
              <label className="block text-base font-black text-gray-700 mb-2 sm:mb-3">
                What happened?
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="E.g. Error appeared when clicking 'Save Student'..."
                className="text-black w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-[1.5rem] text-sm sm:text-base focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none resize-none shadow-inner"
                rows={3}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t pt-6 sm:pt-8">
              <a
                href={getEmailLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-black text-red-600 hover:text-red-700 underline underline-offset-8 decoration-2 transition-all"
              >
                Report via Email instead
              </a>

              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={clearError}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold transition-all"
                >
                  Ignore
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-red-600 text-white font-extrabold hover:bg-red-700 shadow-xl shadow-red-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          className="sm:hidden absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
          onClick={clearError}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
