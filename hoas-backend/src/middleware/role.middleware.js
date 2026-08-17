import { AppError } from '../utils/AppError.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'UNAUTHORIZED'));
    if (roles.includes('owner') && (req.user.role === 'owner' || req.user.role === 'admin')) return next();
    if (roles.includes(req.user.role)) return next();
    return next(new AppError(403, 'FORBIDDEN'));
  };
}

export function requireApproved(req, res, next) {
  if (req.user && req.user.status === 'approved') return next();
  return next(new AppError(403, 'ACCOUNT_NOT_APPROVED'));
}

export function isAdminOrOwner(user) {
  return user && (user.role === 'owner' || user.role === 'admin');
}