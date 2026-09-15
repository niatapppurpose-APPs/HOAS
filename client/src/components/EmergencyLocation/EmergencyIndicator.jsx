import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Emergency Indicator Component
 * 
 * Shows an animated emergency indicator button in the header
 * when an emergency is active. Clicking navigates to the emergency page.
 * Animates (pulses) while emergency is active.
 */
export default function EmergencyIndicator({ className = '' }) {
  const { activeAlert, isActive, isMuted, dismissAlert, openAlertPanel } = useEmergency();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Pulse animation while emergency is active
  useEffect(() => {
    if (isActive && !isMuted) {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
    setPulse(false);
  }, [isActive, isMuted]);

  const handleClick = () => {
    openAlertPanel();
    setShowDetails((visible) => !visible);
    // Navigate to the correct emergency page based on user role
    const role = userData?.role;
    if (role === 'management') {
      navigate('/dashboard/management/emergency-location');
    } else if (role === 'warden') {
      navigate('/dashboard/warden/emergency-location');
    } else {
      navigate('/dashboard/management/emergency-location');
    }
  };

  if (!isActive) return null;

  const isMutedState = isMuted;

  return (
    <div className={`relative ${className}`}>
      {/* Main Emergency Button - Pulsing when active */}
      <button
        type="button"
        onClick={handleClick}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm
          transition-all duration-300
          bg-gradient-to-r from-red-600 to-red-700 text-white
          shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/50
          border-2 border-white/20
        
        `}
        title={isMuted ? 'Emergency Active (Muted) - Click to view' : 'Emergency Active - Click to view'}
        aria-label="Active emergency - click to view"
      >
        {/* Pulsing animation ring */}
        {/* <span className={`absolute inset-0 rounded-xl border-2 border-red-400/50 ${pulse && !isMuted ? 'animate-ping' : 'opacity-0'}`} /> */}
        
        {/* Icon */}
        <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </span>
        
        {/* Label */}
        <span className="hidden sm:inline font-bold tracking-wider">
          {isMuted ? 'EMERGENCY (MUTED)' : 'EMERGENCY ACTIVE'}
        </span>
        
        {/* Pulse indicator */}
        {!isMuted && (
          <span className="relative w-2 h-2 bg-red-300 rounded-full animate-ping" />
        )}
      </button>

      {/* Dropdown with details */}
      {showDetails && (
      <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-red-200 dark:border-red-800 py-2 shadow-[0_20px_40px_rgba(220,38,38,0.3)] z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-3 border-b border-red-100 dark:border-red-900">
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>EMERGENCY ACTIVE</span>
          </div>
        </div>
        
        <div className="p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            A student has activated emergency location sharing.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              isMuted 
                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' 
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }`}>
              SOUND: {isMuted ? 'MUTED' : 'RINGING'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                const role = userData?.role;
                if (role === 'management') {
                  navigate('/dashboard/management/emergency-location');
                } else if (role === 'warden') {
                  navigate('/dashboard/warden/emergency-location');
                } else {
                  navigate('/dashboard/management/emergency-location');
                }
                setShowDetails(false);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
            >
              Open Live Map
            </button>
            <button
              onClick={() => {
                dismissAlert();
                setShowDetails(false);
              }}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}