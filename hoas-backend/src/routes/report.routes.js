import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { getReportData, downloadReportJson, downloadReportPdf } from '../controllers/report.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('owner', 'management'), getReportData);
router.get('/json', requireRole('owner', 'management'), downloadReportJson);
router.get('/pdf', requireRole('owner', 'management'), downloadReportPdf);

export default router;