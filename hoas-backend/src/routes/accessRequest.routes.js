import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  createAccessRequest,
  listAccessRequests,
  reviewAccessRequest,
  createAccountFromRequest,
} from '../controllers/accessRequest.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const numberField = z.coerce.number().min(0).max(1000000).optional();

const createSchema = z.object({
  orgName: z.string().min(2).max(200),
  contactPerson: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(20),
  address: z.string().min(4).max(500),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  studentCount: numberField,
  hostelCount: z.coerce.number().min(0).max(10000).optional(),
  message: z.string().max(2000).optional(),
});

const reviewSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected']),
  notes: z.string().max(1000).optional(),
});

// Public — submitted from the marketing landing page (no auth).
router.post('/', validateBody(createSchema), createAccessRequest);

// Owner-only management endpoints.
router.use(authenticate);
router.get('/', requireRole('owner'), listAccessRequests);
router.patch(
  '/:id/review',
  requireRole('owner'),
  validateParams(z.object({ id: objectId })),
  validateBody(reviewSchema),
  reviewAccessRequest
);
router.post(
  '/:id/create-account',
  requireRole('owner'),
  validateParams(z.object({ id: objectId })),
  createAccountFromRequest
);

export default router;
