import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../services/upload.service.js';
import { uploadFile, uploadDataUriController } from '../controllers/upload.controller.js';

const router = Router();

router.use(authenticate);

// Multipart file upload (avatar, fee-proof, logo, complaint)
router.post('/file', uploadMiddleware.single('file'), uploadFile);

// Base64 data-URI upload (compressed images, e.g. logos and complaint photos)
router.post('/', uploadDataUriController);

export default router;