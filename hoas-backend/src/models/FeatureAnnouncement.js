import { Schema, model } from 'mongoose';

// One record per announced feature id — the detector skips anything listed
// here, so each "What's new" mail goes out exactly once.
const featureAnnouncementSchema = new Schema(
  {
    featureId: { type: String, required: true, unique: true, index: true },
    title: String,
    audience: { type: String, enum: ['owners', 'everyone'], default: 'owners' },
    announcedAt: { type: Date, default: Date.now, index: true },
    recipientCount: { type: Number, default: 0 },
    triggeredBy: { type: String, default: 'auto' },
  },
  { timestamps: false }
);

const FeatureAnnouncement = model('FeatureAnnouncement', featureAnnouncementSchema);
export default FeatureAnnouncement;
