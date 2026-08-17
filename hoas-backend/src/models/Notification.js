import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientRole: String,
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: String,
    data: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    readAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const Notification = model('Notification', notificationSchema);
export default Notification;