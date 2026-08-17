import { Schema, model } from 'mongoose';

const leaveRequestSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    wardenId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    leaveType: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    denialReason: String,
    approvedAt: Date,
    returnedAt: Date,
    conversationClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ wardenId: 1, status: 1 });
leaveRequestSchema.index({ studentId: 1, createdAt: -1 });

const LeaveRequest = model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;