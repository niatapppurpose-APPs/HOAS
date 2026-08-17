import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import { createTicket, listTickets, updateTicketStatus, deleteTicket } from '../controllers/support.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(3).max(2000),
  category: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const updateSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  resolution: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

router.use(authenticate);

router.post('/', validateBody(createSchema), createTicket);
router.get('/', listTickets);
router.patch(
  '/:id',
  validateParams(z.object({ id: objectId })),
  validateBody(updateSchema),
  updateTicketStatus
);
router.delete('/:id', validateParams(z.object({ id: objectId })), deleteTicket);

export default router;