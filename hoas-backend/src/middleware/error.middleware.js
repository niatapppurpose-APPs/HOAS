import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message || err.code,
    });
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: first ? first.message : err.message });
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: 'DUPLICATE_VALUE', message: `${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid id format' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
}