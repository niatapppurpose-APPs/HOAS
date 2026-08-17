import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import { sendMessage, getConversation, closeConversation } from '../controllers/chat.controller.js';

const router = Router();

const sendSchema = z.object({
  contextType: z.enum(['complaint', 'leave', 'outing', 'emergency']),
  contextId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  text: z.string().min(1).max(500),
});

router.use(authenticate);

router.post('/send', requireRole('student', 'warden'), validateBody(sendSchema), sendMessage);
router.get('/:contextType/:contextId', getConversation);
router.post('/:contextType/:contextId/close', requireRole('owner', 'management', 'warden'), closeConversation);

export default router;