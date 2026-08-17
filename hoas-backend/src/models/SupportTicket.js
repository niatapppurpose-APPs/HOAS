import { Schema, model } from 'mongoose';

const supportTicketSchema = new Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open', index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reporterRole: String,
    collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

const SupportTicket = model('SupportTicket', supportTicketSchema);
export default SupportTicket;