import '../src/config/env.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';
import { sendMail } from '../src/services/email.service.js';
import { generateResetLink } from '../src/services/user.service.js';

const email = (process.argv[2] || '').toLowerCase();
if (!email) {
  console.error('Usage: node scripts/resend-one-welcome.js <email>');
  process.exit(1);
}

await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
const u = await User.findOne({ email });
if (!u) {
  console.error('NOT_FOUND:', email);
  await mongoose.disconnect();
  process.exit(1);
}

const resetLink = await generateResetLink(u.email).catch(() => null);
try {
  const result = await sendMail({
    to: u.email,
    type: 'account_created',
    data: {
      userName: u.name,
      email: u.email,
      role: u.role,
      collegeName: u.collegeName || 'your institution',
      loginUrl: env.appUrl,
      appUrl: env.appUrl,
      studentId: u.studentId || '-',
      resetLink: resetLink || undefined,
    },
  });
  console.log(`SENT to=${u.email} name=${u.name} studentId=${u.studentId} via=${result?.via} subject=${result?.subject}`);
} catch (err) {
  console.error(`FAILED to=${u.email}:`, err.message);
}
await mongoose.disconnect();
