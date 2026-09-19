import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  createVisitor,
  listVisitors,
  decideVisitor,
  checkoutVisitor,
} from '../controllers/visitor.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createSchema = z.object({
  visitorName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  purpose: z.string().min(1).max(300),
  meetPersonName: z.string().max(100).optional(),
  studentId: objectId.optional(),
  collegeId: objectId.optional(),
  hostelBlock: z.string().max(50).optional(),
  remarks: z.string().max(500).optional(),
});

router.use(authenticate);

router.post(
  '/',
  requireRole('student', 'warden', 'management', 'owner', 'admin'),
  validateBody(createSchema),
  createVisitor
);
router.get(
  '/',
  requireRole('student', 'warden', 'management', 'owner', 'admin'),
  listVisitors
);
router.patch(
  '/:id/decision',
  requireRole('warden', 'management', 'owner', 'admin'),
  validateParams(z.object({ id: objectId })),
  validateBody(z.object({
    decision: z.enum(['approve', 'deny']),
    remarks: z.string().max(500).optional(),
  })),
  decideVisitor
);
router.patch(
  '/:id/checkout',
  requireRole('warden', 'management', 'owner', 'admin'),
  validateParams(z.object({ id: objectId })),
  checkoutVisitor
);

export default router;
