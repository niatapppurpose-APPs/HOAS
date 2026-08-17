import AuditLog from '../models/AuditLog.js';

export async function recordAudit({ actor, action, targetType, targetId, metadata = {}, ip = '' }) {
  try {
    await AuditLog.create({
      actorId: actor ? actor._id : null,
      actorRole: actor ? actor.role : 'system',
      action,
      targetType,
      targetId,
      timestamp: new Date(),
      ip,
      metadata,
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}