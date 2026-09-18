import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { firebaseAuth } from '../src/config/firebase.js';
import User from '../src/models/User.js';

// One-time repair: suspended users must be able to LOG IN and land on the
// /suspended page. An older build set Firebase `disabled:true` on suspend,
// which blocks sign-in entirely (auth/user-disabled). New code never disables
// Firebase; this script re-enables anyone still locked out.
// Usage: node scripts/reenable-suspended.js [email ...]
//   No args → re-enable ALL users with status === 'suspended'.

const identifiers = process.argv.slice(2);

await connectDatabase();

let targets;
if (identifiers.length > 0) {
  targets = await User.find({
    $or: [
      { email: { $in: identifiers.map((e) => String(e).toLowerCase()) } },
      { uid: { $in: identifiers } },
    ],
  });
} else {
  targets = await User.find({ status: 'suspended' });
}

if (targets.length === 0) {
  console.log('No matching users found. Nothing to do.');
} else {
  for (const user of targets) {
    try {
      await firebaseAuth.updateUser(user.uid, { disabled: false });
      console.log(`Re-enabled Firebase login: ${user.email} (status=${user.status})`);
    } catch (err) {
      console.log(`FAILED ${user.email}: ${err.message}`);
    }
  }
  console.log(`Done. ${targets.length} user(s) processed.`);
}

await disconnectDatabase();
process.exit(0);
