import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { firebaseAuth } from '../config/firebase.js';
import { AppError } from '../utils/AppError.js';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const token = extractBearer(req);
    if (!token) throw new AppError(401, 'AUTH_TOKEN_REQUIRED');

    let uid = null;
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch (error) {
      if (!env.firebaseDevMode || !token.startsWith('dev.')) throw new AppError(401, 'INVALID_TOKEN');
      try {
        const payload = jwt.verify(token.slice(4), env.devTokenSecret);
        uid = payload.uid;
      } catch {
        throw new AppError(401, 'INVALID_TOKEN');
      }
    }

    const user = await User.findOne({ uid });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function verifyTokenOnly(req, res, next) {
  (async () => {
    try {
      const token = extractBearer(req);
      if (!token) throw new AppError(401, 'AUTH_TOKEN_REQUIRED');

      let uid = null;
      let email = null;
      try {
        const decoded = await firebaseAuth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email || null;
      } catch (error) {
        if (!env.firebaseDevMode || !token.startsWith('dev.')) throw new AppError(401, 'INVALID_TOKEN');
        try {
          const payload = jwt.verify(token.slice(4), env.devTokenSecret);
          uid = payload.uid;
        } catch {
          throw new AppError(401, 'INVALID_TOKEN');
        }
      }

      req.auth = { uid, email };
      next();
    } catch (error) {
      next(error);
    }
  })();
}

export function mintDevToken(uid) {
  return 'dev.' + jwt.sign({ uid }, env.devTokenSecret, { expiresIn: '12h' });
}

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
}