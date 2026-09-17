import crypto from 'crypto';
import { firebaseAuth } from '../config/firebase.js';
import { env } from '../config/env.js';

export async function createAuthUser({ email, password, name }) {
  try {
    const authUser = await firebaseAuth.createUser({ email, password, displayName: name });
    return { uid: authUser.uid, external: true };
  } catch (error) {
    if (env.firebaseDevMode) {
      const uid = 'dev_' + crypto.randomBytes(12).toString('hex');
      console.warn(`Firebase unavailable, using local dev uid ${uid}: ${error.message}`);
      return { uid, external: false };
    }
    throw error;
  }
}

export async function deleteAuthUser(uid) {
  try {
    await firebaseAuth.deleteUser(uid);
  } catch {
    if (env.firebaseDevMode) return;
    throw error;
  }
}

// Convert a Firebase email-action link into a branded HOAS reset URL:
//   <appUrl>/reset-password?oobCode=...
// Falls back to the raw Firebase link if parsing fails, so emails never break.
export function toAppResetUrl(firebaseLink) {
  try {
    const appBase = (env.appUrl || '').replace(/\/$/, '');
    if (!appBase || !firebaseLink) return firebaseLink;
    const parsed = new URL(firebaseLink);
    const oobCode = parsed.searchParams.get('oobCode');
    if (!oobCode) return firebaseLink;
    return `${appBase}/reset-password?oobCode=${encodeURIComponent(oobCode)}`;
  } catch {
    return firebaseLink;
  }
}

export async function generateResetLink(email) {
  try {
    const link = await firebaseAuth.generatePasswordResetLink(email);
    return toAppResetUrl(link);
  } catch (err) {
    if (env.firebaseDevMode) return null;
    throw err;
  }
}