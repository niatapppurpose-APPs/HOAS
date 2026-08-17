import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { authenticateSocket } from './socket-auth.js';

let io = null;

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
    socket.join(`user:${user._id}`);
    if (user.collegeId) socket.join(`college:${user.collegeId}`);
    if (user.hostelId) socket.join(`hostel:${user.hostelId}`);
    if (user.role === 'owner' || user.role === 'admin') socket.join('admins');
    socket.emit('connected', { userId: String(user._id), role: user.role });
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