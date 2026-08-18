import 'dotenv/config';
import mongoose from 'mongoose';
import { io } from 'socket.io-client';

const base = 'http://localhost:4001';
const uid = process.argv[2];
const token = process.argv[3];

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

const readPresence = async () => {
  const u = await User.findOne({ uid }).lean();
  return { isOnline: u.isOnline, lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null };
};

console.log('BEFORE:', JSON.stringify(await readPresence()));

const socket = io(base, { auth: { token }, transports: ['websocket'] });

await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('connect timeout')), 10000);
  socket.on('connect', () => { clearTimeout(t); resolve(); });
  socket.on('connect_error', (e) => { clearTimeout(t); reject(new Error('connect_error: ' + e.message)); });
});

await new Promise((r) => setTimeout(r, 2000));
console.log('AFTER CONNECT:', JSON.stringify(await readPresence()));

socket.disconnect();
await new Promise((r) => setTimeout(r, 7000));
console.log('AFTER DISCONNECT (7s):', JSON.stringify(await readPresence()));

await mongoose.disconnect();
process.exit(0);