import { uploadBuffer, uploadDataUri } from '../services/upload.service.js';
import { recordAudit } from '../services/audit.service.js';
import { AppError } from '../utils/AppError.js';

export async function uploadFile(req, res, next) {
  try {
    const purpose = req.body.purpose;
    if (!req.file) throw new AppError(400, 'NO_FILE_PROVIDED', 'Attach a file to upload');

    const result = await uploadBuffer(req.file.buffer, purpose, req.file.originalname);
    await recordAudit({
      actor: req.user,
      action: 'FILE_UPLOADED',
      targetType: 'Upload',
      metadata: { purpose, url: result.url },
    });

    res.status(201).json({ ...result, purpose });
  } catch (error) {
    next(error);
  }
}

export async function uploadDataUriController(req, res, next) {
  try {
    const { purpose, dataUri } = req.body;
    if (!dataUri) throw new AppError(400, 'NO_DATA_URI_PROVIDED', 'Provide a dataUri to upload');

    const result = await uploadDataUri(dataUri, purpose);
    await recordAudit({
      actor: req.user,
      action: 'FILE_UPLOADED',
      targetType: 'Upload',
      metadata: { purpose, url: result.url },
    });

    res.status(201).json({ ...result, purpose });
  } catch (error) {
    next(error);
  }
}