import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  requestOuting,
  decideOuting,
  markReturn,
  listStudentOutings,
  listWardenOutings,
  getOutingHistory,
} from '../controllers/outing.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const requestSchema = z.object({
  destination: z.string().min(1).max(200),
  reason: z.string().min(3).max(1000),
  outTime: z.string().min(1),
});

const decideSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
  expectedReturnTime: z.string().optional(),
});

router.use(authenticate);

router.post('/', requireRole('student'), validateBody(requestSchema), requestOuting);
router.post(
  '/:id/decide',
  requireRole('owner', 'management', 'warden'),
  validateParams(z.object({ id: objectId })),
  validateBody(decideSchema),
  decideOuting
);
router.post('/:id/return', requireRole('student'), validateParams(z.object({ id: objectId })), markReturn);
router.get('/student', requireRole('student'), listStudentOutings);
router.get('/warden', requireRole('warden'), listWardenOutings);
router.get('/history', requireRole('owner', 'management', 'warden', 'student'), getOutingHistory);

export default router;