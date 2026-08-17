import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  uploadFees,
  listManagementFees,
  listWardenFees,
  getStudentFee,
  getStudentFeeByUid,
  getFeeById,
  verifyByManagement,
  verifyByWarden,
  uploadProof,
} from '../controllers/fee.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const uploadSchema = z.object({
  collegeId: objectId,
  records: z.array(z.record(z.any())).min(1).max(2000),
});

const verifySchema = z.object({
  approved: z.boolean(),
  note: z.string().max(500).optional(),
});

const proofSchema = z.object({
  proofImageUrl: z.string().min(1).max(2000),
});

router.use(authenticate);

router.post('/upload', requireRole('owner', 'management'), validateBody(uploadSchema), uploadFees);
router.get('/management', requireRole('owner', 'management'), listManagementFees);
router.get('/warden', requireRole('warden'), listWardenFees);
router.get('/me', requireRole('student'), getStudentFee);
router.get('/student/:studentUid', requireRole('owner', 'management', 'warden'), getStudentFeeByUid);
router.get('/:id', validateParams(z.object({ id: objectId })), getFeeById);
router.post(
  '/:id/verify-management',
  requireRole('owner', 'management'),
  validateParams(z.object({ id: objectId })),
  verifyByManagement
);
router.post(
  '/:id/verify-warden',
  requireRole('warden'),
  validateParams(z.object({ id: objectId })),
  validateBody(verifySchema),
  verifyByWarden
);
router.post('/proof', requireRole('student'), validateBody(proofSchema), uploadProof);

export default router;