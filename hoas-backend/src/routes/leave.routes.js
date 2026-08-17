import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  requestLeave,
  listMyLeaves,
  listWardenLeaves,
  listManagementLeaves,
  decideLeave,
} from '../controllers/leave.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const requestSchema = z.object({
  leaveType: z.string().min(1).max(100),
  reason: z.string().min(3).max(1000),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
});

const decideSchema = z.object({
  decision: z.enum(['approve', 'deny']),
  reason: z.string().max(500).optional(),
});

router.use(authenticate);

router.post('/', requireRole('student'), validateBody(requestSchema), requestLeave);
router.get('/my', requireRole('student'), listMyLeaves);
router.get('/warden', requireRole('warden'), listWardenLeaves);
router.get('/management', requireRole('owner', 'management'), listManagementLeaves);
router.post(
  '/:id/decide',
  requireRole('owner', 'management', 'warden'),
  validateParams(z.object({ id: objectId })),
  validateBody(decideSchema),
  decideLeave
);

export default router;