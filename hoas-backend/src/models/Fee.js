import { Schema, model } from 'mongoose';

const feeSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    managementId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    wardenId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'partially_paid', 'fully_paid'], default: 'pending', index: true },
    isVerifiedByManagement: { type: Boolean, default: false },
    isVerifiedByWarden: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    proofImageUrl: String,
    semester: String,
    history: [
      {
        action: { type: String, enum: ['upload', 'management_verify', 'warden_verify', 'warden_reject', 'upload_proof'] },
        actorId: Schema.Types.ObjectId,
        actorRole: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

feeSchema.index({ collegeId: 1, status: 1 });
feeSchema.index({ wardenId: 1, isVerifiedByManagement: 1 });

const Fee = model('Fee', feeSchema);
export default Fee;