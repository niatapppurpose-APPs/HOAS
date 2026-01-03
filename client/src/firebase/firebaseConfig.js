import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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

// Enable persistence so user stays logged in after page reload
setPersistence(auth, browserLocalPersistence);

/**
 * Detect if Firebase emulators are running and connect automatically
 * Falls back to production if emulators are unavailable
 */
async function detectAndConnectEmulators() {
  // Only attempt in development mode with emulator flag enabled
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') {
    console.log('🌐 Using production Firebase services');
    return;
  }

  const EMULATOR_DETECTION_TIMEOUT = 2000; // 2 seconds
  const AUTH_EMULATOR_URL = 'http://localhost:9099';
  const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
  const FIRESTORE_EMULATOR_PORT = 8080;
  const FUNCTIONS_EMULATOR_HOST = 'localhost';
  const FUNCTIONS_EMULATOR_PORT = 5001;

  try {
    // Test if Auth emulator is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EMULATOR_DETECTION_TIMEOUT);
    
    const response = await fetch(AUTH_EMULATOR_URL, {
      method: 'GET',
      signal: controller.signal,
      mode: 'no-cors', // Avoid CORS issues during detection
    });
    
    clearTimeout(timeoutId);
    
    // If we reach here, emulator is running
    connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
    connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
    connectFunctionsEmulator(functions, FUNCTIONS_EMULATOR_HOST, FUNCTIONS_EMULATOR_PORT);
    
  } catch (error) {
    // Emulator not available - use production
  }
}

// Initialize emulator detection (non-blocking)
detectAndConnectEmulators();

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./debugUtils.js').then((module) => {
    // Log current mode after emulator detection completes
    setTimeout(() => {
      module.logFirebaseMode();
    }, 2500); // Wait for emulator detection to complete
  });
}
