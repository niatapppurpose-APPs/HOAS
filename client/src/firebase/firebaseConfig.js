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
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Initialize Cloud Messaging (only if supported by browser)
let messaging = null;
try {
  if (await isSupported()) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn('⚠️ Firebase Messaging not supported in this browser:', err);
}
export { messaging };
// Track emulator status for other modules
// Default to false to avoid accidentally using emulators in production
export let isEmulatorConnected = false;

// Enable persistence so user stays logged in after page reload
try {
  // Await persistence so it's applied before auth state is restored
  await setPersistence(auth, browserLocalPersistence);
} catch (err) {
  console.warn('⚠️ Failed to set auth persistence:', err);
}

// Check for emulator mode from localStorage (user toggle) or environment variable
const localStorageEmulatorFlag = localStorage.getItem('VITE_USE_FIREBASE_EMULATOR');
const useEmulator = localStorageEmulatorFlag !== null
  ? localStorageEmulatorFlag === 'true'
  : import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Check for a debug override (e.g., via debugUtils.forceProductionMode())
const forceProd = (typeof window !== 'undefined') && localStorage.getItem('forceProductionFirebase') === 'true';

// Connect to emulators when explicitly requested and not forced into production
if (forceProd) {
  console.log('🔒 Production mode forced via localStorage (forceProductionFirebase=true) - skipping emulator connections');
  isEmulatorConnected = false;
} else if (import.meta.env.DEV && useEmulator) {
  try {
    console.log(`🔧 Connecting to Firebase Emulators (${localStorageEmulatorFlag !== null ? 'localStorage' : 'VITE_USE_FIREBASE_EMULATOR'}=true)`);
    // Force-connect to configured emulator endpoints. These calls do not throw if the service is down,
    // which prevents flipping back to production unexpectedly and causing sign-out.
    // Use VITE_EMULATOR_HOST environment variable for mobile access, fallback to localhost
    const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || 'localhost';
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    connectStorageEmulator(storage, emulatorHost, 9199);
    isEmulatorConnected = true;
    console.log(`🔧 Emulator connections configured at ${emulatorHost} (note: ensure emulators are started)`);
  } catch (e) {
    // If we fail to connect to emulators, fall back to production mode to avoid breaking users
    console.warn('⚠️ Error while configuring emulators - falling back to production mode:', e);
    isEmulatorConnected = false;
  }
} else {
  console.log('🌐 Using production Firebase services');
  isEmulatorConnected = false;
}

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./debugUtils.js').then((module) => {
    module.logFirebaseMode();
  });
}
