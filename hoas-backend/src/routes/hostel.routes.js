import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import { listHostels, createHostel, updateHostel, deleteHostel } from '../controllers/hostel.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createHostelSchema = z.object({
  name: z.string().min(1).max(150),
  block: z.string().optional(),
  collegeId: objectId,
  wardenId: objectId.optional(),
  capacity: z.number().min(0).optional(),
  address: z.string().optional(),
  wardens: z.array(objectId).optional(),
  students: z.array(objectId).optional(),
});

const updateHostelSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  block: z.string().optional(),
  wardenId: objectId.optional(),
  capacity: z.number().min(0).nullable().optional(),
  address: z.string().optional(),
  active: z.boolean().optional(),
  wardens: z.array(objectId).optional(),
  students: z.array(objectId).optional(),
});

router.use(authenticate);

router.get('/', requireRole('owner', 'management', 'warden'), listHostels);
router.post('/', requireRole('owner', 'management'), validateBody(createHostelSchema), createHostel);
router.patch(
  '/:id',
  requireRole('owner', 'management'),
  validateParams(z.object({ id: objectId })),
  validateBody(updateHostelSchema),
  updateHostel
);
router.delete('/:id', requireRole('owner', 'management'), validateParams(z.object({ id: objectId })), deleteHostel);

export default router;