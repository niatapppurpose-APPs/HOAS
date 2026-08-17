import { Schema, model } from 'mongoose';

const locationHistorySchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'EmergencyLocation', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lat: Number,
    lng: Number,
    accuracy: Number,
    action: { type: String, enum: ['share', 'update', 'stop'], default: 'update' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

locationHistorySchema.index({ studentId: 1, createdAt: -1 });

const LocationHistory = model('LocationHistory', locationHistorySchema);
export default LocationHistory;