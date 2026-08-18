import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { authenticateSocket } from './socket-auth.js';
import User from '../models/User.js';

let io = null;

// Track live sockets per user so a reconnect (refresh, tab switch) doesn't
// flicker the presence dot offline.
const activeSockets = new Map(); // userId -> Set<socketId>
const PRESENCE_GRACE_MS = 5000;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('CORS origin not allowed'));
      },
    },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const { user } = socket.data;
    const userId = String(user._id);
    socket.join(`user:${userId}`);
    if (user.collegeId) socket.join(`college:${user.collegeId}`);
    if (user.hostelId) socket.join(`hostel:${user.hostelId}`);
    if (user.role === 'owner' || user.role === 'admin') socket.join('admins');
    socket.emit('connected', { userId, role: user.role });

    if (!activeSockets.has(userId)) activeSockets.set(userId, new Set());
    activeSockets.get(userId).add(socket.id);
    publishPresence(userId, true).catch((err) => {
      console.error('Presence online error:', err.message);
    });

    socket.on('disconnect', () => {
      const sockets = activeSockets.get(userId);
      if (sockets) sockets.delete(socket.id);
      setTimeout(async () => {
        const remaining = activeSockets.get(userId);
        if (!remaining || remaining.size === 0) {
          publishPresence(userId, false).catch((err) => {
            console.error('Presence offline error:', err.message);
          });
        }
      }, PRESENCE_GRACE_MS);
    });
  });

  return io;
}

export function getIo() {
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToCollege(collegeId, event, payload) {
  if (!io) return;
  io.to(`college:${collegeId}`).emit(event, payload);
}

export function emitToHostel(hostelId, event, payload) {
  if (!io) return;
  io.to(`hostel:${hostelId}`).emit(event, payload);
}

export function emitToAdmins(event, payload) {
  if (!io) return;
  io.to('admins').emit(event, payload);
}

async function publishPresence(userId, isOnline) {
  const user = await User.findById(userId);
  if (!user) return;
  user.isOnline = isOnline;
  user.lastActiveAt = new Date();
  await user.save();
  broadcastUserUpdate(user);
}

// Fan a user change out to everyone who watches presence: the college, the
// hostel, and all owner/admin consoles.
export function broadcastUserUpdate(user) {
  if (!io || !user) return;
  const payload = { user: typeof user.toObject === 'function' ? user.toObject() : user };
  if (user.collegeId) io.to(`college:${user.collegeId}`).emit('user:updated', payload);
  if (user.hostelId) io.to(`hostel:${user.hostelId}`).emit('user:updated', payload);
  io.to('admins').emit('user:updated', payload);
}