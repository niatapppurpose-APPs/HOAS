import AuditLog from '../models/AuditLog.js';

export async function recordAudit({ actor, action, targetType, targetId, metadata = {}, ip = '' }) {
  try {
    const created = await AuditLog.create({
      actorId: actor ? actor._id : null,
      actorRole: actor ? actor.role : 'system',
      action,
      targetType,
      targetId,
      timestamp: new Date(),
      ip,
      metadata,
    });
    // Live tail for the Owner Audit Logs xterm terminal (best-effort).
    try {
      const populated = await created.populate('actorId', 'name email role');
      const { getIo } = await import('./socket.service.js');
      getIo?.()?.to('admins').emit('audit:new', { entry: populated });
    } catch { /* live tail must never break audit writes */ }
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}