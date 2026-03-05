import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import Toast from './Toast';
import ConfirmToast from './ConfirmToast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmToast, setConfirmToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Show confirmation toast
  const showConfirm = useCallback((message, onConfirm, options = {}) => {
    return new Promise((resolve) => {
      setConfirmToast({
        message,
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          setConfirmToast(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmToast(null);
          resolve(false);
        }
      });
    });
  }, []);

  // Convenience methods — memoized so consumers don't get a new reference on every render
  const toast = useMemo(() => ({
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    confirm: showConfirm,
  }), [showToast, showConfirm]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(({ id, message, type, duration }) => (
          <Toast
            key={id}
            message={message}
            type={type}
            duration={duration}
            position={position}
            onClose={() => removeToast(id)}
          />
        ))}
        {confirmToast && (
          <ConfirmToast
            message={confirmToast.message}
            confirmText={confirmToast.confirmText}
            cancelText={confirmToast.cancelText}
            onConfirm={confirmToast.onConfirm}
            onCancel={confirmToast.onCancel}
            position={position}
          />
        )}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
