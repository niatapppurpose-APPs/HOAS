import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  createComplaint,
  listMyComplaints,
  listWardenComplaints,
  listManagementComplaints,
  getAllComplaints,
  getComplaint,
  updateComplaintStatus,
  reviewComplaint,
  markComplaintViewed,
} from '../controllers/complaint.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(2000),
  category: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  imageUrl: z.string().min(1).max(2000).optional(),
});

const statusSchema = z.object({
  status: z.enum(['in-progress', 'warden-resolved', 'resolved', 'escalated', 'rejected']),
  reason: z.string().max(500).optional(),
});

const reviewSchema = z.object({
  decision: z.enum(['accept', 'dispute']),
  reason: z.string().max(500).optional(),
});

router.use(authenticate);

router.post('/', requireRole('student'), validateBody(createSchema), createComplaint);
router.get('/my', requireRole('student'), listMyComplaints);
router.get('/warden', requireRole('warden'), listWardenComplaints);
router.get('/management', requireRole('owner', 'management'), listManagementComplaints);
router.get('/all', requireRole('owner', 'admin'), getAllComplaints);
router.get('/:id', validateParams(z.object({ id: objectId })), getComplaint);
router.patch(
  '/:id/status',
  requireRole('owner', 'management', 'warden'),
  validateParams(z.object({ id: objectId })),
  validateBody(statusSchema),
  updateComplaintStatus
);
router.post(
  '/:id/review',
  requireRole('student'),
  validateParams(z.object({ id: objectId })),
  validateBody(reviewSchema),
  reviewComplaint
);
router.post('/:id/viewed', requireRole('student'), validateParams(z.object({ id: objectId })), markComplaintViewed);

export default router;