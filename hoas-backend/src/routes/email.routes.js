import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { testEmail } from '../controllers/email.controller.js';

const router = Router();

router.use(authenticate);

router.post('/test', requireRole('owner', 'management'), testEmail);

export default router;
