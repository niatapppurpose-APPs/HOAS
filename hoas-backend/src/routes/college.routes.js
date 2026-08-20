import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  listColleges,
  createCollege,
  updateCollege,
  getCollegeStats,
  deleteCollege,
} from '../controllers/college.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createCollegeSchema = z.object({
  name: z.string().min(1).max(150),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

router.use(authenticate);

router.get('/', listColleges);
router.post('/', requireRole('owner'), validateBody(createCollegeSchema), createCollege);
router.patch(
  '/:id',
  requireRole('owner', 'management'),
  validateParams(z.object({ id: objectId })),
  updateCollege
);
router.get('/:id/stats', validateParams(z.object({ id: objectId })), getCollegeStats);
router.delete('/:id', requireRole('owner'), validateParams(z.object({ id: objectId })), deleteCollege);

export default router;