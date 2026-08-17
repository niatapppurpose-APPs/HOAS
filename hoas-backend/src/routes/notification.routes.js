import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  listMyNotifications,
  sendCustomNotification,
  listAllNotifications,
} from '../controllers/notification.controller.js';

const router = Router();

const sendSchema = z.object({
  targetRole: z.enum(['owner', 'management', 'warden', 'student']).optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  collegeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

router.use(authenticate);

router.get('/me', listMyNotifications);
router.get('/all', requireRole('owner', 'admin'), listAllNotifications);
router.post('/send', requireRole('owner', 'admin'), validateBody(sendSchema), sendCustomNotification);

export default router;