import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Initialize Firebase Admin
try {
  // Try to load service account key if available
  const serviceAccount = require('../serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('🔑 Initialized with serviceAccountKey.json');
} catch (error) {
  console.log('⚠️ serviceAccountKey.json not found or invalid, using default credentials');
  initializeApp();
}

// Allowed origins for CORS
export const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://hoas-65dee.web.app',
  'https://hoas-65dee.firebaseapp.com'
];

// CORS options for v2 callable functions - use true for SDK calls
// Callable functions have built-in auth, so CORS=true is safe
export const corsOptions = {
  cors: true
};

// Set global options for v2 functions
setGlobalOptions({
  region: 'us-central1',
  cors: true
});

export const db = getFirestore();
export const auth = getAuth();

// Configure CORS handler for Express middleware
export const corsHandler = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (isEmulator) {
      // In emulator mode, allow all origins for testing
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
});

// Check if running in emulator
export const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

console.log('🚀 Functions initialized. Emulator mode:', isEmulator);
