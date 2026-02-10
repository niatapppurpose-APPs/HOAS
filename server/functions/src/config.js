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
// Note: Mobile apps send requests without origin headers, which are handled separately
export const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://hoas-65dee.web.app',
  'https://hoas-65dee.firebaseapp.com',
  // Allow any localhost port for development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  // Allow local network IPs for mobile testing
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
];

// CORS options for v2 callable functions
// Using 'true' allows all origins - Firebase callable functions handle auth via tokens, not CORS
// This is safe because authentication is verified via Firebase Auth tokens, not origin
export const corsOptions = {
  cors: true,  // Allow all origins for callable functions - auth is handled via tokens
};

// Set global options for v2 functions
// Using 'true' for CORS to allow mobile apps which don't send origin headers
setGlobalOptions({
  region: 'us-central1',
  cors: true,  // Allow all origins - mobile apps don't send origin headers
});

export const db = getFirestore();
export const auth = getAuth();

// Check if running in emulator — MUST be defined before corsHandler references it
export const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

// Configure CORS handler for Express middleware
export const corsHandler = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In emulator mode, allow all origins for testing
    if (isEmulator) return callback(null, true);

    // Check if the origin matches any allowed origin (supports both strings and regex)
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⛔ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
});

console.log('🚀 Functions initialized. Emulator mode:', isEmulator);
