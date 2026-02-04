import { useState, useEffect } from 'react';
import { getFirebaseMode } from '../firebase/debugUtils';

const FirebaseModeIndicator = () => {
  const [mode, setMode] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [debugOutput, setDebugOutput] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMode(getFirebaseMode());
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogDetails = () => {
    import('../firebase/debugUtils').then(m => {
      const data = m.logFirebaseMode();
      setDebugOutput({ type: 'mode', data });
    });
  };

  const handleFullDebug = () => {
    import('../firebase/debugUtils').then(m => {
      const data = m.debugFirebaseSetup();
      setDebugOutput({ type: 'full', data });
    });
  };

  const handleToggleMode = () => {
    setIsToggling(true);

    // Check the CURRENT running mode (not just localStorage)
    const currentMode = getFirebaseMode();
    const isCurrentlyUsingEmulator = currentMode.auth.isUsingEmulator;

    // Toggle to the OPPOSITE mode
    const newValue = isCurrentlyUsingEmulator ? 'false' : 'true';

    console.log(`🔄 Toggling Firebase mode from ${isCurrentlyUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} to ${isCurrentlyUsingEmulator ? 'PRODUCTION' : 'EMULATOR'}`);

    // Update localStorage
    localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', newValue);

    // Show a notification and reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!mode) {
    return (
      <div className="fixed bottom-20 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs z-[9998]">
        Detecting Firebase mode...
      </div>
    );
  }

  const isUsingEmulator = mode.auth.isUsingEmulator;

  return (
    <div className="fixed bottom-5 right-4 z-[9998]">
      {/* Collapsed indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isToggling}
        className={`
          ${isUsingEmulator ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
          text-white px-4 py-2 rounded-lg shadow-lg transition-all
          flex items-center gap-2 text-sm font-medium
          ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="text-lg">
          {isToggling ? '🔄' : isUsingEmulator ? '🔧' : '🌐'}
        </span>
        <span>
          {isToggling ? 'Switching...' : isUsingEmulator ? 'Emulator' : 'Production'}
        </span>
        <span className="text-xs opacity-75">
          {isOpen ? '▼' : '▲'}
        </span>
      </button>

      {/* Expanded details */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-gray-900 text-white rounded-lg shadow-xl p-4 w-80 text-xs max-h-[80vh] overflow-y-auto">
          <div className="mb-3 pb-3 border-b border-gray-700">
            <h3 className="font-bold text-sm mb-1">🔥 Firebase Mode</h3>
            <p className="text-gray-400">
              Environment: <span className="text-white">{mode.environment}</span>
            </p>
          </div>

          {/* Auth */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">🔐 Authentication</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${mode.auth.isUsingEmulator
                ? 'bg-orange-900 text-orange-200'
                : 'bg-green-900 text-green-200'
                }`}>
                {mode.auth.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'}
              </span>
            </div>
            <p className="text-gray-400 text-[10px] font-mono break-all">
              {mode.auth.endpoint}
            </p>
          </div>

          {/* Firestore */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">📦 Firestore</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${mode.firestore.isUsingEmulator
                ? 'bg-orange-900 text-orange-200'
                : 'bg-green-900 text-green-200'
                }`}>
                {mode.firestore.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'}
              </span>
            </div>
            <p className="text-gray-400 text-[10px] font-mono">
              {mode.firestore.endpoint}
            </p>
          </div>

          {/* Functions */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">⚡ Functions</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${mode.functions.isUsingEmulator
                ? 'bg-orange-900 text-orange-200'
                : 'bg-green-900 text-green-200'
                }`}>
                {mode.functions.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'}
              </span>
            </div>
            <p className="text-gray-400 text-[10px] font-mono">
              {mode.functions.endpoint}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-700 space-y-2">
            {/* Toggle Mode Button */}
            <button
              onClick={handleToggleMode}
              disabled={isToggling}
              className={`
                w-full py-2 px-3 rounded text-sm font-semibold transition-all
                ${isUsingEmulator
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                }
                ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
                flex items-center justify-center gap-2
              `}
            >
              <span>{isUsingEmulator ? '🌐' : '🔧'}</span>
              <span>
                {isToggling
                  ? 'Switching...'
                  : `Switch to ${isUsingEmulator ? 'Production' : 'Emulator'}`
                }
              </span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleLogDetails}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-[10px] transition-colors"
              >
                Log Details
              </button>
              <button
                onClick={handleFullDebug}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-[10px] transition-colors"
              >
                Full Debug
              </button>
            </div>
          </div>

          {/* Debug Output Display */}
          {debugOutput && (
            <div className="mt-3 p-3 bg-black bg-opacity-50 rounded border border-gray-700 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 font-semibold text-[10px]">
                  {debugOutput.type === 'mode' ? '📋 Mode Details' : '🐛 Full Debug'}
                </span>
                <button
                  onClick={() => setDebugOutput(null)}
                  className="text-gray-400 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
              <pre className="text-[9px] text-green-400 font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(debugOutput.data, null, 2)}
              </pre>
            </div>
          )}

          {isUsingEmulator && (
            <div className="mt-3 p-2 bg-orange-900 bg-opacity-30 rounded border border-orange-800 text-[10px]">
              <p className="text-orange-200">
                ⚠️ <strong>Emulator Mode Active</strong>
              </p>
              <p className="text-orange-300 mt-1">
                Data is stored locally and will reset when emulator restarts.
              </p>
              <p className="text-orange-300 mt-1 text-[9px]">
                💡 Use the toggle button above to switch to production mode.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FirebaseModeIndicator;