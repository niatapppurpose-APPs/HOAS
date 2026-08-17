import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
} from '../controllers/announcement.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  priority: z.enum(['urgent', 'important', 'low', 'normal']).optional(),
  collegeId: objectId,
  hostelBlock: z.string().optional(),
  isPinned: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'recurring']).optional(),
  publishAt: z.string().optional(),
  recurrence: z
    .object({
      type: z.enum(['daily', 'weekly', 'monthly']),
      time: z.string().optional(),
      daysOfWeek: z.array(z.number()).optional(),
    })
    .optional(),
  recurrenceEndDate: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.use(authenticate);

router.get('/', requireRole('owner', 'management', 'warden', 'student'), listAnnouncements);
router.post('/', requireRole('owner', 'management', 'warden'), validateBody(createSchema), createAnnouncement);
router.patch(
  '/:id',
  requireRole('owner', 'management', 'warden'),
  validateParams(z.object({ id: objectId })),
  validateBody(updateSchema),
  updateAnnouncement
);
router.delete('/:id', requireRole('owner', 'management', 'warden'), validateParams(z.object({ id: objectId })), deleteAnnouncement);
router.post('/:id/read', requireRole('student'), validateParams(z.object({ id: objectId })), markAnnouncementRead);

export default router;