import React, { createContext, useContext, useState, useEffect } from 'react';

const ErrorContext = createContext();

export const useError = () => useContext(ErrorContext);

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = (err) => {
    // Normalize error object
    const normalized = {
      message: err?.message || (typeof err === 'string' ? err : 'An unexpected error occurred'),
      stack: err?.stack || (err?.reason && err.reason.stack) || null,
      extra: err?.extra || null,
      time: new Date().toISOString()
    };
    setError(normalized);
    // Also log to console for developers
    console.error('Global error captured:', normalized);
  };

  const clearError = () => setError(null);

  useEffect(() => {
    const onError = (event) => {
      // event: ErrorEvent
      showError({ message: event.message, stack: event.error?.stack || null, extra: { filename: event.filename, lineno: event.lineno, colno: event.colno } });
    };
    const onUnhandledRejection = (event) => {
      // event: PromiseRejectionEvent
      showError({ message: event.reason?.message || String(event.reason), stack: event.reason?.stack || null, extra: { reason: event.reason } });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorContext;
