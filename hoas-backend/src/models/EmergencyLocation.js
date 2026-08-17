import { Schema, model } from 'mongoose';

const emergencyLocationSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', index: true },
    managementId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    visibleTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    accuracy: Number,
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    stoppedAt: Date,
    lastUpdateAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

emergencyLocationSchema.index({ studentId: 1, isActive: 1 });
emergencyLocationSchema.index({ visibleTo: 1, isActive: 1, expiresAt: 1 });

const EmergencyLocation = model('EmergencyLocation', emergencyLocationSchema);
export default EmergencyLocation;