import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  getSettings,
  updateSettings,
  getCollegeCapacity,
  listAuditLogs,
} from '../controllers/setting.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const updateSchema = z.object({
  registrationEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(500).optional(),
  approvalsEnabled: z.boolean().optional(),
  forcePasswordReset: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  complaintSlaHours: z.number().min(1).optional(),
  overdueThresholdHours: z.number().min(1).optional(),
  autoEscalation: z.boolean().optional(),
  escalateToOwner: z.boolean().optional(),
  emailEscalationAlerts: z.boolean().optional(),
  smsEscalationAlerts: z.boolean().optional(),
  notifications: z.record(z.any()).optional(),
  features: z.record(z.any()).optional(),
  limits: z.record(z.number()).optional(),
});

router.use(authenticate);

router.get('/', getSettings);
router.patch('/', requireRole('owner', 'admin'), validateBody(updateSchema), updateSettings);
router.get(
  '/capacity/:collegeId',
  requireRole('owner', 'management', 'warden'),
  validateParams(z.object({ collegeId: objectId })),
  getCollegeCapacity
);
router.get('/audit', requireRole('owner', 'admin'), listAuditLogs);

export default router;