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
    socket.join(`user:${roomId(userId)}`);
    if (user.collegeId) socket.join(`college:${roomId(user.collegeId)}`);
    if (user.hostelId) socket.join(`hostel:${roomId(user.hostelId)}`);
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

// Normalize any id-like value (populated doc, ObjectId, string) so socket
// rooms always match: `college:[object Object]` !== `college:<hex>` was
// silently dropping realtime updates for approvals, fees and emergencies.
function roomId(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id !== undefined && value._id !== null) return String(value._id);
    if (typeof value.toHexString === 'function') return value.toHexString();
  }
  return String(value);
}

export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${roomId(userId)}`).emit(event, payload);
}

export function emitToCollege(collegeId, event, payload) {
  if (!io) return;
  io.to(`college:${roomId(collegeId)}`).emit(event, payload);
}

export function emitToHostel(hostelId, event, payload) {
  if (!io) return;
  io.to(`hostel:${roomId(hostelId)}`).emit(event, payload);
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
  if (user.collegeId) io.to(`college:${roomId(user.collegeId)}`).emit('user:updated', payload);
  if (user.hostelId) io.to(`hostel:${roomId(user.hostelId)}`).emit('user:updated', payload);
  io.to('admins').emit('user:updated', payload);
}

// Push fresh system settings to EVERY connected client the instant the Owner
// saves — toggles apply in a fraction of a second, no refresh needed.
export function broadcastSettingsUpdate(settings) {
  if (!io || !settings) return;
  const payload = {
    settings: typeof settings.toObject === 'function' ? settings.toObject() : settings,
  };
  io.emit('settings:updated', payload);
}