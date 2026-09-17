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
    } catch {
      throw new AppError(401, 'INVALID_TOKEN');
    }

    const user = await User.findOne({ uid }).populate('collegeId', 'name logoUrl location _id');
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
      } catch {
        throw new AppError(401, 'INVALID_TOKEN');
      }

      req.auth = { uid, email };
      next();
    } catch (error) {
      next(error);
    }
  })();
}

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
}
