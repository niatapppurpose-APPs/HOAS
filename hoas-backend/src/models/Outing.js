import { Schema, model } from 'mongoose';

const outingSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    wardenId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    outTime: { type: Date, required: true },
    expectedReturnTime: Date,
    actualReturnTime: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    timingStatus: { type: String, enum: ['on-time', 'late', 'very-late', 'unmarked'], default: 'unmarked' },
    rejectionReason: String,
    autoMarkedLate: { type: Boolean, default: false },
    notificationSent: { type: Boolean, default: false },
    conversationClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

outingSchema.index({ wardenId: 1, status: 1 });
outingSchema.index({ studentId: 1, createdAt: -1 });
outingSchema.index({ status: 1, expectedReturnTime: 1 });

const Outing = model('Outing', outingSchema);
export default Outing;