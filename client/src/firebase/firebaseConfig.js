import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');
export const storage = getStorage(app);

// Initialize Cloud Messaging (only if supported by browser)
let messaging = null;
const messagingReady = (async () => {
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
    }
  } catch (err) {
    console.warn('⚠️ Firebase Messaging not supported in this browser:', err);
  }
})();
export { messaging, messagingReady };
// Track emulator status for other modules
// Default to false to avoid accidentally using emulators in production
export let isEmulatorConnected = false;

// Enable persistence so user stays logged in after page reload
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    console.warn('⚠️ Failed to set auth persistence:', err);
  }
})();

// Check for emulator mode from localStorage (user toggle) or environment variable
const localStorageEmulatorFlag = localStorage.getItem('VITE_USE_FIREBASE_EMULATOR');
const requestedEmulatorMode = localStorageEmulatorFlag !== null
  ? localStorageEmulatorFlag === 'true'
  : import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// When sharing the app through tunnels (ngrok/localtunnel), remote users cannot access
// localhost emulators. Force production Firebase in that scenario to avoid login/network errors.
const isTunnelHost = typeof window !== 'undefined' && /(?:^|\.)((ngrok-free\.dev)|(ngrok\.io)|(loca\.lt)|(localhost\.run))$/i.test(window.location.hostname);
const useEmulator = requestedEmulatorMode && !isTunnelHost;

// Check for a debug override (e.g., via debugUtils.forceProductionMode())
const forceProd = (typeof window !== 'undefined') && localStorage.getItem('forceProductionFirebase') === 'true';

// Track the last Firebase mode so we can detect emulator→production switches
const LAST_MODE_KEY = 'HOAS_LAST_FIREBASE_MODE';
const currentMode = (forceProd || !useEmulator || !import.meta.env.DEV) ? 'production' : 'emulator';
const lastMode = localStorage.getItem(LAST_MODE_KEY);

// Connect to emulators when explicitly requested and not forced into production
if (forceProd) {
  console.log('🔒 Production mode forced via localStorage (forceProductionFirebase=true) - skipping emulator connections');
  isEmulatorConnected = false;
} else if (isTunnelHost && requestedEmulatorMode) {
  console.log('🌐 Tunnel host detected; skipping localhost Firebase emulators and using production services');
  isEmulatorConnected = false;
} else if (import.meta.env.DEV && useEmulator) {
  try {
    console.log(`🔧 Connecting to Firebase Emulators (${localStorageEmulatorFlag !== null ? 'localStorage' : 'VITE_USE_FIREBASE_EMULATOR'}=true)`);
    // Force-connect to configured emulator endpoints. These calls do not throw if the service is down,
    // which prevents flipping back to production unexpectedly and causing sign-out.
    // Use VITE_EMULATOR_HOST environment variable for mobile access, fallback to localhost
    const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || 'localhost';
    // Auth emulator MUST use localhost/127.0.0.1 for OAuth redirects to work properly
    connectAuthEmulator(auth, `http://127.0.0.1:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    connectStorageEmulator(storage, emulatorHost, 9199);
    isEmulatorConnected = true;
    console.log(`🔧 Emulator connections configured (Auth: 127.0.0.1, Others: ${emulatorHost})`);
  } catch (e) {
    // If we fail to connect to emulators, fall back to production mode to avoid breaking users
    console.warn('⚠️ Error while configuring emulators - falling back to production mode:', e);
    isEmulatorConnected = false;
  }
} else {
  console.log('🌐 Using production Firebase services');
  isEmulatorConnected = false;
}

// Detect emulator→production switch and clear stale auth state.
// ONLY do this in DEV mode — in production there are no emulators, so a
// stale 'emulator' flag in localStorage (left over from local dev) must
// NOT sign production users out automatically.
if (import.meta.env.DEV && lastMode === 'emulator' && currentMode === 'production') {
  console.warn('🔄 [DEV] Detected switch from EMULATOR → PRODUCTION. Clearing stale auth session...');
  try {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    console.log('✅ Stale emulator session cleared. You can now log in with production credentials.');
  } catch (err) {
    console.warn('⚠️ Failed to clear stale session (may already be signed out):', err);
  }
} else if (!import.meta.env.DEV && lastMode === 'emulator') {
  // In production, silently correct any stale localStorage emulator flag
  // so it never triggers a false signOut on next load.
  localStorage.setItem(LAST_MODE_KEY, 'production');
  console.log('🔒 Production: corrected stale emulator mode flag in localStorage.');
}

// Persist the current mode for next reload
localStorage.setItem(LAST_MODE_KEY, currentMode);

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./debugUtils.js').then((module) => {
    module.logFirebaseMode();
  });
}

