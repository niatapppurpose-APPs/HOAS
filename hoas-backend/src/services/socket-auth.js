import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { firebaseAuth } from '../config/firebase.js';
import User from '../models/User.js';

export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('AUTH_TOKEN_REQUIRED'));

    let uid = null;
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      if (!env.firebaseDevMode || !token.startsWith('dev.')) {
        return next(new Error('INVALID_TOKEN'));
      }
      try {
        uid = jwt.verify(token.slice(4), env.devTokenSecret).uid;
      } catch {
        return next(new Error('INVALID_TOKEN'));
      }
    }

    const user = await User.findOne({ uid });
    if (!user) return next(new Error('USER_NOT_FOUND'));
    socket.data.user = user;
    next();
  } catch {
    next(new Error('AUTH_FAILED'));
  }
}
