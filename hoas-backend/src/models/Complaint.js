import { Schema, model } from 'mongoose';

const complaintSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    assignedWardenId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, default: 'other' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'warden-resolved', 'disputed', 'resolved', 'escalated', 'rejected'],
      default: 'pending',
      index: true,
    },
    studentReviewStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    studentDisputeReason: String,
    imageUrl: String,
    rejectionReason: String,
    isOverdue: { type: Boolean, default: false },
    disputeCount: { type: Number, default: 0 },
    slaDeadline: Date,
    history: [
      {
        action: String,
        reason: String,
        previousStatus: String,
        newStatus: String,
        actorId: Schema.Types.ObjectId,
        actorRole: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    reminders: {
      enabled: { type: Boolean, default: true },
      sentCount: { type: Number, default: 0 },
      nextDueAt: Date,
    },
    studentViewed: { type: Boolean, default: false },
    viewedAt: Date,
  },
  { timestamps: true }
);

complaintSchema.index({ collegeId: 1, status: 1, createdAt: -1 });
complaintSchema.index({ assignedWardenId: 1, status: 1 });
complaintSchema.index({ studentId: 1, createdAt: -1 });

const Complaint = model('Complaint', complaintSchema);
export default Complaint;