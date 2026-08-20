import multer from 'multer';
import { cloudinary, isConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';

export const UPLOAD_PURPOSES = {
  avatar: { folder: 'hoas/avatars', maxSize: 2 * 1024 * 1024, allowed: ['image/jpeg', 'image/png', 'image/webp'] },
  'fee-proof': { folder: 'hoas/fee-proofs', maxSize: 5 * 1024 * 1024, allowed: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
  logo: { folder: 'hoas/logos', maxSize: 2 * 1024 * 1024, allowed: ['image/jpeg', 'image/png', 'image/webp'] },
  complaint: { folder: 'hoas/complaints', maxSize: 2 * 1024 * 1024, allowed: ['image/jpeg', 'image/png', 'image/webp'] },
};

function resolvePurpose(purpose) {
  const key = String(purpose || '').toLowerCase();
  const config = UPLOAD_PURPOSES[key];
  if (!config) throw new AppError(400, 'INVALID_UPLOAD_PURPOSE', `Unsupported upload purpose: ${purpose}`);
  return { key, ...config };
}

const multerStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const { allowed } = resolvePurpose(req.body.purpose);
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new AppError(400, 'INVALID_FILE_TYPE', `Only ${allowed.join(', ')} are allowed`));
};

export const uploadMiddleware = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

function buildOptions({ key, folder }, originalName) {
  const options = { folder, resource_type: 'auto' };
  if (originalName) {
    options.public_id = `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return options;
}

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) return reject(new AppError(502, 'CLOUDINARY_UPLOAD_FAILED', error.message));
        resolve(result);
      })
      .end(buffer);
  });
}

export async function uploadBuffer(buffer, purpose, originalName = '') {
  if (!isConfigured) throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary is not configured');
  const config = resolvePurpose(purpose);
  if (buffer.length > config.maxSize) {
    throw new AppError(413, 'FILE_TOO_LARGE', `File exceeds ${Math.round(config.maxSize / 1024 / 1024)}MB limit`);
  }
  const result = await uploadToCloudinary(buffer, buildOptions(config, originalName));
  return { url: result.secure_url, publicId: result.public_id };
}

export async function uploadDataUri(dataUri, purpose, originalName = '') {
  if (!isConfigured) throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary is not configured');
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
    throw new AppError(400, 'INVALID_DATA_URI', 'Expected a base64 data URI');
  }
  const config = resolvePurpose(purpose);
  const result = await cloudinary.uploader.upload(dataUri, buildOptions(config, originalName));
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteUpload(publicId) {
  if (!isConfigured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary destroy failed:', error.message);
  }
}

export function isCloudinaryUrl(url = '') {
  if (!url) return false;
  return /^https?:\/\/res\.cloudinary\.com\//.test(url);
}