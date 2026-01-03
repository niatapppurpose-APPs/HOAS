/**
 * Firebase Emulator Debugging Utilities
 * 
 * Optional helper functions for debugging Firebase emulator connectivity
 * Import these in components when you need to debug Firebase mode
 */

import { auth, db, functions } from './firebaseConfig';

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
 */
export function logFirebaseMode() {
  const mode = getFirebaseMode();
  
  console.group('🔥 Firebase Connection Mode');
  console.log('Environment:', mode.environment);
  console.log('Emulator Flag:', mode.emulatorFlagEnabled ? 'ENABLED' : 'DISABLED');
  console.log('');
  
  console.log('🔐 Auth:', mode.auth.isUsingEmulator ? '🔧 EMULATOR' : '🌐 PRODUCTION');
  console.log('   Endpoint:', mode.auth.endpoint);
  console.log('');
  
  console.log('📦 Firestore:', mode.firestore.isUsingEmulator ? '🔧 EMULATOR' : '🌐 PRODUCTION');
  console.log('   Endpoint:', mode.firestore.endpoint);
  console.log('');
  
  console.log('⚡ Functions:', mode.functions.isUsingEmulator ? '🔧 EMULATOR' : '🌐 PRODUCTION');
  console.log('   Endpoint:', mode.functions.endpoint);
  
  console.groupEnd();
  
  return mode;
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
 * @returns {Promise<Object>} Health status of all emulators
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
  };

  console.group('🏥 Emulator Health Check');
  console.log('Auth (localhost:9099):', authHealth ? '✅ HEALTHY' : '❌ UNAVAILABLE');
  console.log('Firestore (localhost:8080):', firestoreHealth ? '✅ HEALTHY' : '❌ UNAVAILABLE');
  console.log('Functions (localhost:5001):', functionsHealth ? '✅ HEALTHY' : '❌ UNAVAILABLE');
  console.log('Overall:', health.allHealthy ? '✅ ALL HEALTHY' : '⚠️ SOME UNAVAILABLE');
  console.groupEnd();

  return health;
}

/**
 * Force switch to production Firebase (for debugging)
 * Requires page reload to take effect
 */
export function forceProductionMode() {
  localStorage.setItem('forceProductionFirebase', 'true');
  console.warn('⚠️ Production mode forced. Reload the page to apply.');
  console.log('To restore emulator detection, run: clearProductionMode()');
}

/**
 * Clear forced production mode
 */
export function clearProductionMode() {
  localStorage.removeItem('forceProductionFirebase');
  console.log('✅ Production mode override cleared. Reload to apply.');
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
 */
export function debugFirebaseSetup() {
  console.group('🐛 Firebase Debug Information');
  
  // Environment
  console.log('Environment:', import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION');
  console.log('Mode:', import.meta.env.MODE);
  console.log('');
  
  // Configuration
  console.log('Config:');
  console.log('  API Key:', import.meta.env.VITE_FIREBASE_API_KEY?.slice(0, 10) + '...');
  console.log('  Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  console.log('  Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('  Emulator Flag:', import.meta.env.VITE_USE_FIREBASE_EMULATOR);
  console.log('');
  
  // Current mode
  const mode = getFirebaseMode();
  console.log('Current Mode:');
  console.log('  Auth:', mode.auth.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION', '→', mode.auth.endpoint);
  console.log('  Firestore:', mode.firestore.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION', '→', mode.firestore.endpoint);
  console.log('  Functions:', mode.functions.isUsingEmulator ? 'EMULATOR' : 'PRODUCTION', '→', mode.functions.endpoint);
  console.log('');
  
  // OAuth
  console.log('OAuth Redirect URL:', getOAuthRedirectUrl());
  console.log('');
  
  // Auth state
  console.log('Auth State:');
  console.log('  Current User:', auth.currentUser?.email || 'Not logged in');
  console.log('  Ready:', auth.currentUser !== undefined);
  
  console.groupEnd();
  
  // Return for programmatic access
  return {
    env: {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      emulatorFlag: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    },
    firebase: mode,
    oauth: {
      redirectUrl: getOAuthRedirectUrl(),
    },
    auth: {
      currentUser: auth.currentUser?.email || null,
      isReady: auth.currentUser !== undefined,
    },
  };
}

// Make functions available in browser console for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.firebaseDebug = {
    getMode: getFirebaseMode,
    logMode: logFirebaseMode,
    checkHealth: checkAllEmulatorsHealth,
    debug: debugFirebaseSetup,
    forceProduction: forceProductionMode,
    clearProduction: clearProductionMode,
    getOAuthUrl: getOAuthRedirectUrl,
  };
  
  console.log('💡 Firebase debug tools available via window.firebaseDebug');
  console.log('   Try: firebaseDebug.debug() or firebaseDebug.logMode()');
}
