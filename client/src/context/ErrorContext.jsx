import React, { createContext, useContext, useState } from 'react';

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

  // NOTE: Global window 'error' / 'unhandledrejection' listeners were removed
  // so the ErrorModal only appears for React component crashes caught by
  // ErrorBoundary (scoped to the current page), not for every transient JS
  // error across all dashboards.

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorContext;
