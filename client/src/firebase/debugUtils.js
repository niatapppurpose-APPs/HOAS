/**
 * Firebase Emulator Debugging Utilities
 * 
 * Optional helper functions for debugging Firebase emulator connectivity
 * Import these in components when you need to debug Firebase mode
 */

import { auth, db, functions } from './firebaseConfig';

// Debug configuration
const DEBUG_CONFIG = {
  enabled: import.meta.env.DEV, // Only enable in development
  silent: false, // Set to true to disable all output
};

/**
 * Custom logger that can be controlled
 */
const debugLogger = {
  log: (message, data = null) => {
    if (DEBUG_CONFIG.enabled && !DEBUG_CONFIG.silent) {
      if (data) {
        return { message, data, timestamp: new Date().toISOString() };
      }
      return { message, timestamp: new Date().toISOString() };
    }
    return null;
  },
  group: (title) => {
    if (DEBUG_CONFIG.enabled && !DEBUG_CONFIG.silent) {
      return { type: 'group', title, timestamp: new Date().toISOString() };
    }
    return null;
  },
  warn: (message) => {
    if (DEBUG_CONFIG.enabled && !DEBUG_CONFIG.silent) {
      return { type: 'warning', message, timestamp: new Date().toISOString() };
    }
    return null;
  },
  error: (message, error = null) => {
    if (DEBUG_CONFIG.enabled && !DEBUG_CONFIG.silent) {
      return { type: 'error', message, error: error?.message, timestamp: new Date().toISOString() };
    }
    return null;
  }
};

/**
 * Get current Firebase connection mode
 * @returns {Object} Firebase mode information
 */
export function getFirebaseMode() {
  const mode = {
    environment: import.meta.env.DEV ? 'development' : 'production',
    emulatorFlagEnabled: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
    auth: {
      isUsingEmulator: false,
      endpoint: 'production',
    },
    firestore: {
      isUsingEmulator: false,
      endpoint: 'production',
    },
    functions: {
      isUsingEmulator: false,
      endpoint: 'production',
    },
  };

  // Check Auth emulator
  try {
    // @ts-ignore - accessing internal config
    const authConfig = auth.config;
    if (authConfig.emulator) {
      mode.auth.isUsingEmulator = true;
      mode.auth.endpoint = authConfig.emulator.url || 'http://localhost:9099';
    }
  } catch (e) {
    // Ignore - means no emulator
  }

  // Check Firestore emulator
  try {
    // @ts-ignore - accessing internal settings
    const firestoreSettings = db._settings;
    if (firestoreSettings.host && firestoreSettings.host.includes('localhost')) {
      mode.firestore.isUsingEmulator = true;
      mode.firestore.endpoint = firestoreSettings.host;
    }
  } catch (e) {
    // Ignore - means no emulator
  }

  // Check Functions emulator
  try {
    // @ts-ignore - accessing internal settings
    if (functions.customDomain && functions.customDomain.includes('localhost')) {
      mode.functions.isUsingEmulator = true;
      mode.functions.endpoint = functions.customDomain;
    }
  } catch (e) {
    // Ignore - means no emulator
  }

  return mode;
}

/**
 * Log current Firebase mode to console (formatted)
 * @returns {Object} Firebase mode information with debug data
 */
export function logFirebaseMode() {
  const mode = getFirebaseMode();
  
  const debugInfo = {
    mode,
    logs: [
      debugLogger.group('🔥 Firebase Connection Mode'),
      debugLogger.log('Environment', mode.environment),
      debugLogger.log('Emulator Flag Enabled', mode.emulatorFlagEnabled),
      debugLogger.log('Auth', `${mode.auth.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} (${mode.auth.endpoint})`),
      debugLogger.log('Firestore', `${mode.firestore.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} (${mode.firestore.endpoint})`),
      debugLogger.log('Functions', `${mode.functions.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} (${mode.functions.endpoint})`)
    ].filter(Boolean)
  };
  
  return debugInfo;
}

/**
 * Check if specific emulator is reachable
 * @param {string} service - 'auth', 'firestore', or 'functions'
 * @returns {Promise<boolean>} Whether emulator is reachable
 */
export async function checkEmulatorHealth(service = 'auth') {
  const ports = {
    auth: 9099,
    firestore: 8080,
    functions: 5001,
  };

  const port = ports[service];
  if (!port) {
    throw new Error(`Unknown service: ${service}. Use 'auth', 'firestore', or 'functions'`);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    await fetch(`http://localhost:${port}`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'no-cors',
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Run health check on all emulators
 * @returns {Promise<Object>} Health status of all emulators with debug info
 */
export async function checkAllEmulatorsHealth() {
  const [authHealth, firestoreHealth, functionsHealth] = await Promise.all([
    checkEmulatorHealth('auth'),
    checkEmulatorHealth('firestore'),
    checkEmulatorHealth('functions'),
  ]);

  const health = {
    auth: authHealth,
    firestore: firestoreHealth,
    functions: functionsHealth,
    allHealthy: authHealth && firestoreHealth && functionsHealth,
    debugInfo: {
      timestamp: new Date().toISOString(),
      logs: [
        debugLogger.group('🏥 Emulator Health Check'),
        debugLogger.log('Auth (localhost:9099)', authHealth ? '✅ HEALTHY' : '❌ UNAVAILABLE'),
        debugLogger.log('Firestore (localhost:8080)', firestoreHealth ? '✅ HEALTHY' : '❌ UNAVAILABLE'),
        debugLogger.log('Functions (localhost:5001)', functionsHealth ? '✅ HEALTHY' : '❌ UNAVAILABLE'),
        debugLogger.log('Overall', health.allHealthy ? '✅ ALL HEALTHY' : '⚠️ SOME UNAVAILABLE')
      ].filter(Boolean)
    }
  };

  return health;
}

/**
 * Force switch to production Firebase (for debugging)
 * Requires page reload to take effect
 * @returns {Object} Operation result with instructions
 */
export function forceProductionMode() {
  localStorage.setItem('forceProductionFirebase', 'true');
  
  return {
    success: true,
    message: 'Production mode forced. Reload the page to apply.',
    instructions: 'To restore emulator detection, run: clearProductionMode()',
    warning: debugLogger.warn('⚠️ Production mode forced. Reload the page to apply.')
  };
}

/**
 * Clear forced production mode
 * @returns {Object} Operation result
 */
export function clearProductionMode() {
  localStorage.removeItem('forceProductionFirebase');
  
  return {
    success: true,
    message: 'Production mode override cleared. Reload to apply.',
    log: debugLogger.log('✅ Production mode override cleared. Reload to apply.')
  };
}

/**
 * Get OAuth redirect URL that will be used
 * @returns {string} The OAuth redirect URL
 */
export function getOAuthRedirectUrl() {
  const mode = getFirebaseMode();
  
  if (mode.auth.isUsingEmulator) {
    return 'http://localhost:9099/__/auth/handler';
  }
  
  // Production uses authDomain from config
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  return `https://${authDomain}/__/auth/handler`;
}

/**
 * Display comprehensive Firebase debug info
 * Useful to call when troubleshooting OAuth issues
 * @returns {Object} Complete debug information
 */
export function debugFirebaseSetup() {
  const mode = getFirebaseMode();
  const oauthUrl = getOAuthRedirectUrl();
  
  const debugData = {
    timestamp: new Date().toISOString(),
    environment: {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      emulatorFlag: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
    },
    config: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.slice(0, 10) + '...',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    },
    firebase: mode,
    oauth: {
      redirectUrl: oauthUrl,
    },
    auth: {
      currentUser: auth.currentUser?.email || null,
      isReady: auth.currentUser !== undefined,
    },
    debugLogs: [
      debugLogger.group('🐛 Firebase Debug Information'),
      debugLogger.log('Environment', import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION'),
      debugLogger.log('Mode', import.meta.env.MODE),
      debugLogger.log('API Key', import.meta.env.VITE_FIREBASE_API_KEY?.slice(0, 10) + '...'),
      debugLogger.log('Auth Domain', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
      debugLogger.log('Project ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
      debugLogger.log('Emulator Flag', import.meta.env.VITE_USE_FIREBASE_EMULATOR),
      debugLogger.log('Current Mode - Auth', `${mode.auth.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} → ${mode.auth.endpoint}`),
      debugLogger.log('Current Mode - Firestore', `${mode.firestore.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} → ${mode.firestore.endpoint}`),
      debugLogger.log('Current Mode - Functions', `${mode.functions.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION'} → ${mode.functions.endpoint}`),
      debugLogger.log('OAuth Redirect URL', oauthUrl),
      debugLogger.log('Current User', auth.currentUser?.email || 'Not logged in'),
      debugLogger.log('Auth Ready', auth.currentUser !== undefined)
    ].filter(Boolean)
  };
  
  return debugData;
}

/**
 * Configure debug settings
 * @param {Object} config - Debug configuration
 * @param {boolean} config.enabled - Enable/disable debug mode
 * @param {boolean} config.silent - Disable all output
 */
export function setDebugConfig(config = {}) {
  Object.assign(DEBUG_CONFIG, config);
  return DEBUG_CONFIG;
}

/**
 * Get current debug configuration
 */
export function getDebugConfig() {
  return { ...DEBUG_CONFIG };
}

// Make functions available in browser console for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const debugTools = {
    getMode: getFirebaseMode,
    logMode: logFirebaseMode,
    checkHealth: checkAllEmulatorsHealth,
    debug: debugFirebaseSetup,
    forceProduction: forceProductionMode,
    clearProduction: clearProductionMode,
    getOAuthUrl: getOAuthRedirectUrl,
    configure: setDebugConfig,
    getConfig: getDebugConfig,
  };
  
  window.firebaseDebug = debugTools;
  
  // Store initialization info instead of logging
  window.firebaseDebug._initInfo = {
    message: '💡 Firebase debug tools available via window.firebaseDebug',
    suggestion: 'Try: firebaseDebug.debug() or firebaseDebug.logMode()',
    timestamp: new Date().toISOString()
  };
}
