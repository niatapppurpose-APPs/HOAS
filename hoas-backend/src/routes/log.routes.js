import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { getServerLogSnapshot } from '../services/serverLog.service.js';

const router = Router();

router.use(authenticate);

// Owner-only: live server request/error log + runtime stats.
router.get('/server', requireRole('owner', 'admin'), (req, res) => {
  const { level, limit, search, q } = req.query;
  res.json(getServerLogSnapshot({ level, limit: Number(limit) || 200, search: search || q || '' }));
});

export default router;
