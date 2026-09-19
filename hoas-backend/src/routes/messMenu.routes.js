import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  getCurrentMenu,
  listMenus,
  saveMenu,
  publishMenu,
  rateMeal,
} from '../controllers/messMenu.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const daySchema = z.object({
  day: z.string(),
  breakfast: z.string().max(300).optional(),
  lunch: z.string().max(300).optional(),
  snacks: z.string().max(300).optional(),
  dinner: z.string().max(300).optional(),
});

router.use(authenticate);

router.get(
  '/',
  requireRole('student', 'warden', 'management', 'owner', 'admin'),
  getCurrentMenu
);
router.get(
  '/all',
  requireRole('management', 'owner', 'admin'),
  listMenus
);
router.post(
  '/',
  requireRole('management', 'owner', 'admin'),
  validateBody(z.object({
    collegeId: objectId,
    weekStart: z.string().min(1),
    days: z.array(daySchema).max(7).optional(),
  })),
  saveMenu
);
router.patch(
  '/:id/publish',
  requireRole('management', 'owner', 'admin'),
  validateParams(z.object({ id: objectId })),
  publishMenu
);
router.post(
  '/:id/rate',
  requireRole('student'),
  validateParams(z.object({ id: objectId })),
  validateBody(z.object({
    day: z.string().min(1),
    score: z.number().int().min(1).max(5),
  })),
  rateMeal
);

export default router;
