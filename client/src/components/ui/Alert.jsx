import { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const VARIANT_CONFIG = {
  info: {
    icon: Info,
    container: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-300',
    closeColor: 'text-blue-400 hover:text-blue-200 hover:bg-blue-500/20',
  },
  success: {
    icon: CheckCircle2,
    container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-300',
    closeColor: 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20',
  },
  warning: {
    icon: AlertTriangle,
    container: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-300',
    closeColor: 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/20',
  },
  error: {
    icon: AlertCircle,
    container: 'bg-red-500/10 border-red-500/30 text-red-400',
    iconColor: 'text-red-500',
    titleColor: 'text-red-300',
    closeColor: 'text-red-400 hover:text-red-200 hover:bg-red-500/20',
  },
};

export default function Alert({
  variant = 'info',
  title,
  description,
  children,
  dismissible = false,
  onDismiss,
  primaryAction,
  secondaryAction,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;
  const IconComp = cfg.icon;

  if (dismissed) return null;

  const handleClose = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-md transition-all duration-200 ${cfg.container} ${className}`}
    >
      <div className={`p-1.5 rounded-xl bg-white/10 flex-shrink-0 ${cfg.iconColor}`}>
        <IconComp className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && <h3 className={`text-sm font-bold tracking-tight ${cfg.titleColor}`}>{title}</h3>}
        {description && (
          <div className="text-xs mt-1 leading-relaxed opacity-90 text-slate-300">{description}</div>
        )}
        {children && <div className="mt-2 text-xs">{children}</div>}

        {/* Action Buttons */}
        {(primaryAction || secondaryAction) && (
          <div className="mt-3 flex items-center gap-2.5">
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow-sm"
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs text-white transition"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss alert"
          className={`p-1 rounded-lg transition -mr-1 -mt-1 ${cfg.closeColor}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
