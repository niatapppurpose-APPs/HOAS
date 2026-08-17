import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { env } from './env.js';

const require = createRequire(import.meta.url);

function createFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  if (existsSync(env.firebaseServiceAccountPath)) {
    return initializeApp({ credential: cert(require(env.firebaseServiceAccountPath)) });
  }
  return initializeApp();
}

export const firebaseApp = createFirebaseApp();
export const firebaseAuth = getAuth(firebaseApp);