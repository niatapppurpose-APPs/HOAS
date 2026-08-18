import { Router } from 'express';
import { authenticate, verifyTokenOnly } from '../middleware/auth.middleware.js';
import {
  getMe,
  updateMe,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  changePassword,
  registerRequest,
  resolveStudentLogin,
} from '../controllers/auth.controller.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['student', 'warden', 'management', 'unknown']).optional(),
});

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  notificationPrefs: z.record(z.any()).optional(),
  fcmToken: z.string().optional(),
  pwaUpdateMode: z.string().optional(),
  tourCompleted: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6).max(128),
});

router.post('/register', verifyTokenOnly, validateBody(registerSchema), registerRequest);
router.get('/resolve-student', resolveStudentLogin);

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', validateBody(updateMeSchema), updateMe);
router.get('/me/notifications', getMyNotifications);
router.patch('/me/notifications/read-all', markAllNotificationsRead);
router.patch(
  '/me/notifications/:id/read',
  validateParams(z.object({ id: z.string() })),
  markNotificationRead
);
router.post('/me/change-password', validateBody(changePasswordSchema), changePassword);

export default router;
