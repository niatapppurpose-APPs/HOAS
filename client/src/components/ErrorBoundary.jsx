import React from 'react';
import ErrorContext, { useError } from '../context/ErrorContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Prefer a context passed via props (wrapper) but fall back to class context
    const ctx = this.props.context || this.context;
    if (ctx && ctx.showError) {
      try {
        ctx.showError({ message: error.message || String(error), stack: error.stack });
      } catch (e) {
        // Ensure we don't throw from the catch handler
        console.error('Error while reporting to ErrorContext:', e);
      }
    } else {
      console.error('Unhandled error in boundary:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      // When an error occurs, render a small fallback with actions. The ErrorModal (outside this boundary) will also show detailed info.
      const ctx = this.props.context || this.context;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-md max-w-md w-full text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">An unexpected error occurred. You can dismiss the error or reload the page.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  try {
                    if (ctx && ctx.clearError) ctx.clearError();
                  } catch (e) {
                    console.error('Failed to clear ErrorContext:', e);
                  }
                  try {
                    this.setState({ hasError: false, error: null });
                  } catch (e) {
                    console.error('Failed to reset ErrorBoundary state:', e);
                  }
                }}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Dismiss
              </button>
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded bg-red-600 text-white">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// Use the real ErrorContext so `this.context` is available when ErrorProvider wraps the tree
ErrorBoundary.contextType = ErrorContext;

export default function ErrorBoundaryWithContext(props) {
  const ErrorCtx = useError();
  return <ErrorBoundary {...props} context={ErrorCtx} />;
}
