import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  shareLocation,
  updateLocation,
  stopSharing,
  getMySession,
  listActiveSessions,
  getLocationHistory,
} from '../controllers/emergency.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const shareSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  durationMinutes: z.number().min(5).max(60).optional(),
});

const updateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
});

router.use(authenticate);

router.post('/share', requireRole('student'), validateBody(shareSchema), shareLocation);
router.post('/update', requireRole('student'), validateBody(updateSchema), updateLocation);
router.post('/stop', requireRole('student'), stopSharing);
router.get('/session', requireRole('student'), getMySession);
router.get('/active', requireRole('owner', 'management', 'warden'), listActiveSessions);
router.get(
  '/history/:studentId',
  requireRole('owner', 'management', 'warden', 'student'),
  validateParams(z.object({ studentId: z.string().min(1) })),
  getLocationHistory
);

export default router;