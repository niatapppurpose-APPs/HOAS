import '../src/config/env.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

const email = process.argv[2] || 'atthulurihemanthramasai@gmail.com';

await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
const u = await User.findOne({ email: email.toLowerCase() })
  .select('name email role studentId collegeName status createdAt');
if (!u) {
  console.log('NOT_FOUND:', email);
} else {
  console.log('FOUND:', JSON.stringify({
    name: u.name,
    email: u.email,
    role: u.role,
    studentId: u.studentId,
    collegeName: u.collegeName,
    status: u.status,
    createdAt: u.createdAt,
  }, null, 2));
}
await mongoose.disconnect();
