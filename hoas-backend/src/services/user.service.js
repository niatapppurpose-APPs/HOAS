import { firebaseAuth } from '../config/firebase.js';
import { env } from '../config/env.js';

export async function createAuthUser({ email, password, name }) {
  const authUser = await firebaseAuth.createUser({ email, password, displayName: name });
  return { uid: authUser.uid, external: true };
}

export async function deleteAuthUser(uid) {
  await firebaseAuth.deleteUser(uid);
}

// Public web-app URL for links inside emails. Never emit localhost:
// if HOAS_APP_URL is unset or localhost, fall back to production.
function publicAppUrl() {
  const raw = env.appUrl || '';
  if (raw && !raw.includes('localhost')) return raw.replace(/\/$/, '');
  return 'https://hoas-client-4n13.vercel.app';
}

// Convert a Firebase email-action link into a branded HOAS reset URL:
//   <appUrl>/reset-password?oobCode=...
// Falls back to the raw Firebase link if parsing fails, so emails never break.
export function toAppResetUrl(firebaseLink) {
  try {
    if (!firebaseLink) return firebaseLink;
    const parsed = new URL(firebaseLink);
    const oobCode = parsed.searchParams.get('oobCode');
    if (!oobCode) return firebaseLink;
    return `${publicAppUrl()}/reset-password?oobCode=${encodeURIComponent(oobCode)}`;
  } catch {
    return firebaseLink;
  }
}

export async function generateResetLink(email) {
  const link = await firebaseAuth.generatePasswordResetLink(email);
  return toAppResetUrl(link);
}
