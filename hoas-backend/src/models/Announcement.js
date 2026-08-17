import { Schema, model } from 'mongoose';

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    priority: { type: String, enum: ['urgent', 'important', 'low', 'normal'], default: 'normal' },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    hostelBlock: String,
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creatorRole: String,
    isPinned: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'scheduled', 'recurring', 'expired'], default: 'published' },
    publishAt: Date,
    recurrence: {
      type: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      time: String,
      daysOfWeek: [Number],
    },
    recurrenceEndDate: Date,
    isSent: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

announcementSchema.index({ collegeId: 1, status: 1 });
announcementSchema.index({ status: 1, publishAt: 1 });

const Announcement = model('Announcement', announcementSchema);
export default Announcement;