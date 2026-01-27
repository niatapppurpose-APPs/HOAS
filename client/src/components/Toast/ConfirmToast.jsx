import { X } from 'lucide-react';
import './ConfirmToast.css';

const ConfirmToast = ({ 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  position = 'top-right' 
}) => {
  return (
    <div className={`confirm-toast confirm-toast-${position}`}>
      <div className="confirm-toast-content">
        <span className="confirm-toast-message">{message}</span>
      </div>
      <div className="confirm-toast-actions">
        <button 
          className="confirm-toast-btn confirm-toast-btn-cancel" 
          onClick={onCancel}
        >
          {cancelText}
        </button>
        <button 
          className="confirm-toast-btn confirm-toast-btn-confirm" 
          onClick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
      <button 
        className="confirm-toast-close" 
        onClick={onCancel}
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ConfirmToast;
