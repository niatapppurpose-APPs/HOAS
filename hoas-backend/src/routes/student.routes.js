import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import { createStudent, bulkCreateStudents, listStudents } from '../controllers/student.controller.js';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  collegeId: objectId,
  studentId: z.string().optional(),
  rollNumber: z.string().optional(),
  idNumber: z.string().optional(),
  hostelBlock: z.string().optional(),
  wardenId: objectId.optional(),
  totalFee: z.number().min(0).optional(),
  paidFee: z.number().min(0).optional(),
});

const bulkCreateSchema = z.object({
  collegeId: objectId,
  students: z.array(createStudentSchema).min(1).max(500),
});

router.use(authenticate);

router.post(
  '/',
  requireRole('owner', 'management'),
  validateBody(createStudentSchema),
  createStudent
);
router.post(
  '/bulk',
  requireRole('owner', 'management'),
  validateBody(bulkCreateSchema),
  bulkCreateStudents
);
router.get('/', requireRole('owner', 'management', 'warden'), listStudents);

export default router;