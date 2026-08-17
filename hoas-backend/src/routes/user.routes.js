import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  listUsers,
  listManagementUsers,
  createManagement,
  createWarden,
  approveUser,
  denyUser,
  setUserStatus,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createManagementSchema = z.object({
  principalName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  collegeName: z.string().min(1).max(150),
  phone: z.string().optional(),
  collegeLogo: z.string().url().nullable().optional(),
});

const createWardenSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  collegeId: objectId,
  hostelBlock: z.string().optional(),
  hostelName: z.string().optional(),
});

const denySchema = z.object({ reason: z.string().max(500).optional() });

router.use(authenticate);

router.get('/', listUsers);
router.get('/management', requireRole('owner'), listManagementUsers);
router.post('/management', requireRole('owner'), validateBody(createManagementSchema), createManagement);
router.post(
  '/warden',
  requireRole('owner', 'management'),
  validateBody(createWardenSchema),
  createWarden
);
router.post('/:id/approve', validateParams(z.object({ id: objectId })), approveUser);
router.post(
  '/:id/deny',
  validateParams(z.object({ id: objectId })),
  validateBody(denySchema),
  denyUser
);
router.patch(
  '/:id/status',
  requireRole('owner', 'admin'),
  validateParams(z.object({ id: objectId })),
  validateBody(z.object({ status: z.enum(['approved', 'suspended']) })),
  setUserStatus
);
router.delete('/:id', validateParams(z.object({ id: objectId })), deleteUser);

export default router;
