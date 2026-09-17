import '../src/config/env.js';
import { firebaseAuth } from '../src/config/firebase.js';

const email = (process.argv[2] || '').toLowerCase();
if (!email) {
  console.error('Usage: node scripts/check-auth-user.js <email>');
  process.exit(1);
}

try {
  const u = await firebaseAuth.getUserByEmail(email);
  console.log('FIREBASE_AUTH_FOUND:', JSON.stringify({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    disabled: u.disabled,
    creationTime: u.metadata?.creationTime,
    lastSignInTime: u.metadata?.lastSignInTime,
  }, null, 2));
} catch (err) {
  console.log('FIREBASE_AUTH_MISSING:', err.code || err.message);
}
process.exit(0);
