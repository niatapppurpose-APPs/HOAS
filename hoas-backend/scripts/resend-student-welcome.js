import '../src/config/env.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';
import { sendMail } from '../src/services/email.service.js';
import { generateResetLink } from '../src/services/user.service.js';

async function main() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });

  const students = await User.find({ role: 'student' })
    .sort({ createdAt: -1 })
    .limit(2)
    .select('name email studentId collegeName');

  if (students.length === 0) {
    console.log('No students found.');
    await mongoose.disconnect();
    return;
  }

  for (const s of students) {
    const resetLink = await generateResetLink(s.email).catch(() => null);
    try {
      const result = await sendMail({
        to: s.email,
        type: 'account_created',
        data: {
          userName: s.name,
          email: s.email,
          role: 'student',
          collegeName: s.collegeName || 'your institution',
          loginUrl: env.appUrl,
          appUrl: env.appUrl,
          studentId: s.studentId || '-',
          resetLink: resetLink || undefined,
        },
      });
      console.log(`SENT to=${s.email} name=${s.name} via=${result?.via} subject=${result?.subject}`);
    } catch (err) {
      console.error(`FAILED to=${s.email}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
