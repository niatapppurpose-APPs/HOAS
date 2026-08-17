import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: String,
    action: { type: String, required: true, index: true },
    targetType: String,
    targetId: Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now, index: true },
    ip: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
);

auditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });

const AuditLog = model('AuditLog', auditLogSchema);
export default AuditLog;