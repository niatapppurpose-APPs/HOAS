import { AppError } from '../utils/AppError.js';
import { sendMail } from '../services/email.service.js';
import { env } from '../config/env.js';

// POST /api/emails/test { to }
// Owner/management only. Awaits actual delivery and returns the result,
// so email problems are visible instead of failing silently in background.
export async function testEmail(req, res, next) {
  try {
    const to = String(req.body?.to || '').trim().toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new AppError(400, 'INVALID_EMAIL');
    }

    const startedAt = Date.now();
    const result = await sendMail({
      to,
      type: 'account_created',
      data: {
        userName: req.user?.name || 'HOAS Admin',
        email: to,
        role: req.user?.role || 'management',
        collegeName: req.user?.collegeName || 'HOAS',
        loginUrl: env.appUrl,
        appUrl: env.appUrl,
      },
    });

    res.json({
      ok: true,
      to,
      via: result?.via || 'unknown',
      subject: result?.subject || null,
      attempts: result?.attempts || null,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    next(error);
  }
}
