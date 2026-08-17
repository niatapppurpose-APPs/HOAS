import { Schema, model } from 'mongoose';

const conversationSchema = new Schema(
  {
    contextType: { type: String, enum: ['complaint', 'leave', 'outing', 'emergency'], required: true },
    contextId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wardenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
    managementId: { type: Schema.Types.ObjectId, ref: 'User' },
    isClosed: { type: Boolean, default: false },
    closedAt: Date,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

conversationSchema.index({ contextType: 1, contextId: 1 }, { unique: true });
conversationSchema.index({ studentId: 1, lastMessageAt: -1 });
conversationSchema.index({ wardenId: 1, lastMessageAt: -1 });

const Conversation = model('Conversation', conversationSchema);
export default Conversation;