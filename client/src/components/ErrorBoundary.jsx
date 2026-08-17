import React, { useState } from 'react';
import ErrorContext, { useError } from '../context/ErrorContext';
import { useAuth } from '../context/AuthContext';
import { createSupportTicket } from '../firebase/cloudFunctions';
import { AlertCircle, RefreshCw, Send, CheckCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const ApplicationErrorView = ({ error, clearError }) => {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
      await createSupportTicket({
        subject: 'Bug Report: ' + (error?.message || 'Unknown error'),
        description: [
          'Type: bug_report',
          'Error: ' + (error?.message || 'Unknown error'),
          'Stack: ' + (error?.stack || 'No stack trace'),
          'Page: ' + window.location.href,
          'Info: ' + (additionalInfo || 'none'),
        ].join('\n'),
        category: 'technical',
        priority: 'high',
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmailLink = () => {
    const body = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 HOAS APPLICATION BUG REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date & Time: ${new Date().toLocaleString()}
🌐 Browser: ${navigator.userAgent}
📍 Page URL: ${window.location.href}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 ERROR DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Error Message: ${error?.message || 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 STACK TRACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${error?.stack || 'No stack trace available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com&su=${encodeURIComponent(`[HOAS Bug Report] - ${error?.message?.substring(0, 50)}`)}&body=${encodeURIComponent(body)}`;
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 font-outfit">
        <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Report Received!</h3>
          <p className="text-gray-500">Thank you. Our team has been notified.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-100 transition-all"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] flex items-center justify-center p-4 md:p-8 font-outfit relative">
      {/* Mobile Reload Button - Now fixed outside the card */}
      <div className="fixed top-6 right-6 z-[110] md:hidden">
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => window.location.reload()}
              className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-2xl shadow-red-200 flex items-center justify-center group"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </Tooltip.Trigger>

          <AnimatePresence>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                align="end"
                sideOffset={12}
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="z-[200] md:hidden bg-gray-900 text-white text-[11px] font-black px-4 py-2.5 rounded-xl shadow-2xl border border-gray-800 pointer-events-none"
                >
                  Reload Page
                  <Tooltip.Arrow className="fill-gray-900" />
                </motion.div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </AnimatePresence>
        </Tooltip.Root>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl max-w-xl w-full text-center animate-in slide-in-from-bottom-8 duration-500">
        {/* Centered Alert Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 tracking-tight">Application Error</h2>
        <p className="text-base text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
          We've encountered a technical issue. Please help us by describing what happened.
        </p>

        <div className="mb-6 text-left">
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">What happened?</label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="E.g. Error appeared when clicking save..."
            className="text-black w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none resize-none shadow-inner"
            rows={3}
          />
        </div>

        <div className="mb-6 flex justify-center">
          <a
            href={getEmailLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2 transition-all"
          >
            Report via Email instead
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleSubmitReport}
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Sending...' : <><Send className="w-4 h-4" /> Submit Report</>}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="hidden md:block w-full sm:flex-1 group py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-100 flex items-center justify-center"
          >
            <span className="ml-2">Reload App</span>
          </button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const ctx = this.props.context || this.context;
    if (ctx && ctx.showError) {
      try {
        ctx.showError({ message: error.message || String(error), stack: error.stack });
      } catch (e) {
        console.error('Error while reporting to ErrorContext:', e);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return <ApplicationErrorView error={this.state.error} />;
    }
    return this.props.children;
  }
}

ErrorBoundary.contextType = ErrorContext;

export default function ErrorBoundaryWithContext(props) {
  const ErrorCtx = useError();
  return <ErrorBoundary {...props} context={ErrorCtx} />;
}
