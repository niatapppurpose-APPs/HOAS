/**
 * Firebase Mode Indicator Component
 * 
 * Optional component to display current Firebase connection mode
 * Useful during development to verify emulator connectivity
 * 
 * Usage:
 *   import FirebaseModeIndicator from './components/FirebaseModeIndicator';
 *   // Add to your app (dev only):
 *   {import.meta.env.DEV && <FirebaseModeIndicator />}
 */

import { useState, useEffect } from 'react';
import { getFirebaseMode } from '../firebase/debugUtils';

const FirebaseModeIndicator = () => {
  const [mode, setMode] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Wait a bit for emulator detection to complete
    const timer = setTimeout(() => {
      setMode(getFirebaseMode());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!mode) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
        Detecting Firebase mode...
      </div>
    );
  }

  const isUsingEmulator = mode.auth.isUsingEmulator;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${isUsingEmulator ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
          text-white px-4 py-2 rounded-lg shadow-lg transition-all
          flex items-center gap-2 text-sm font-medium
        `}
      >
        <span className="text-lg">
          {isUsingEmulator ? '🔧' : '🌐'}
        </span>
        <span>
          {isUsingEmulator ? 'Emulator' : 'Production'}
        </span>
        <span className="text-xs opacity-75">
          {isOpen ? '▼' : '▲'}
        </span>
      </button>

      {/* Expanded details */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-gray-900 text-white rounded-lg shadow-xl p-4 w-80 text-xs">
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
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                mode.auth.isUsingEmulator 
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
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                mode.firestore.isUsingEmulator 
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
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                mode.functions.isUsingEmulator 
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
          <div className="pt-3 border-t border-gray-700 flex gap-2">
            <button
              onClick={() => {
                import('../firebase/debugUtils').then(m => m.logFirebaseMode());
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-[10px] transition-colors"
            >
              Log Details
            </button>
            <button
              onClick={() => {
                import('../firebase/debugUtils').then(m => m.debugFirebaseSetup());
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-[10px] transition-colors"
            >
              Full Debug
            </button>
          </div>

          {isUsingEmulator && (
            <div className="mt-3 p-2 bg-orange-900 bg-opacity-30 rounded border border-orange-800 text-[10px]">
              <p className="text-orange-200">
                ⚠️ <strong>Emulator Mode Active</strong>
              </p>
              <p className="text-orange-300 mt-1">
                Data is stored locally and will reset when emulator restarts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FirebaseModeIndicator;
