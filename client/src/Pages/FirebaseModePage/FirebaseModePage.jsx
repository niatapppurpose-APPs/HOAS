import { useState, useEffect } from 'react';
import { getFirebaseMode } from '../../firebase/debugUtils';
import { useNavigate } from 'react-router-dom';

const FirebaseModePage = () => {
  const [mode, setMode] = useState(null);
  const [debugOutput, setDebugOutput] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMode(getFirebaseMode());
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogDetails = () => {
    import('../../firebase/debugUtils').then(m => {
      const data = m.logFirebaseMode();
      setDebugOutput({ type: 'mode', data });
    });
  };

  const handleFullDebug = () => {
    import('../../firebase/debugUtils').then(m => {
      const data = m.debugFirebaseSetup();
      setDebugOutput({ type: 'full', data });
    });
  };

  const handleToggleMode = () => {
    setIsToggling(true);
    const currentMode = getFirebaseMode();
    const isCurrentlyUsingEmulator = currentMode.auth.isUsingEmulator;
    const newValue = isCurrentlyUsingEmulator ? 'false' : 'true';
    localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', newValue);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Detecting Firebase mode...</p>
        </div>
      </div>
    );
  }

  const isUsingEmulator = mode.auth.isUsingEmulator;

  const services = [
    { name: 'Authentication', icon: '🔐', data: mode.auth },
    { name: 'Firestore', icon: '📦', data: mode.firestore },
    { name: 'Functions', icon: '⚡', data: mode.functions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
        >
          <span>←</span> Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isUsingEmulator ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
            <span className="text-3xl">{isUsingEmulator ? '🔧' : '🌐'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Firebase Mode</h1>
          <p className="text-slate-400 text-sm">
            Currently running in{' '}
            <span className={`font-semibold ${isUsingEmulator ? 'text-orange-400' : 'text-green-400'}`}>
              {isUsingEmulator ? 'Emulator' : 'Production'}
            </span>{' '}
            mode
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Environment: {mode.environment}
          </p>
        </div>

        {/* Services status cards */}
        <div className="space-y-3 mb-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{service.icon}</span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{service.name}</p>
                  <p className="text-slate-500 text-[11px] font-mono truncate">{service.data.endpoint}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${
                service.data.isUsingEmulator
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {service.data.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'}
              </span>
            </div>
          ))}
        </div>

        {/* Toggle button */}
        <button
          onClick={handleToggleMode}
          disabled={isToggling}
          className={`
            w-full py-3.5 px-4 rounded-xl text-base font-semibold transition-all
            flex items-center justify-center gap-3
            ${isUsingEmulator
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30'
              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/30'
            }
            ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className="text-xl">{isToggling ? '🔄' : isUsingEmulator ? '🌐' : '🔧'}</span>
          <span>
            {isToggling
              ? 'Switching...'
              : `Switch to ${isUsingEmulator ? 'Production' : 'Emulator'} Mode`
            }
          </span>
        </button>

        {/* Debug buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleLogDetails}
            className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors"
          >
            📋 Log Details
          </button>
          <button
            onClick={handleFullDebug}
            className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors"
          >
            🐛 Full Debug
          </button>
        </div>

        {/* Debug output */}
        {debugOutput && (
          <div className="mt-4 p-4 bg-black/40 rounded-xl border border-slate-700/50 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-yellow-400 font-semibold text-xs">
                {debugOutput.type === 'mode' ? '📋 Mode Details' : '🐛 Full Debug'}
              </span>
              <button
                onClick={() => setDebugOutput(null)}
                className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
              {JSON.stringify(debugOutput.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Emulator warning */}
        {isUsingEmulator && (
          <div className="mt-4 p-4 bg-orange-900/20 rounded-xl border border-orange-700/40">
            <p className="text-orange-300 text-sm font-medium mb-1">
              ⚠️ Emulator Mode Active
            </p>
            <p className="text-orange-400/70 text-xs">
              Data is stored locally and will reset when the emulator restarts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseModePage;
