import { Schema, model } from 'mongoose';

// Weekly hostel mess menu, published by management.
// Students view the current week and rate each day (1–5).
const dayMenuSchema = new Schema(
  {
    day: { type: String, required: true },
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    snacks: { type: String, default: '' },
    dinner: { type: String, default: '' },
  },
  { _id: false }
);

const ratingSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true },
    score: { type: Number, min: 1, max: 5, required: true },
  },
  { _id: false }
);

const messMenuSchema = new Schema(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    weekStart: { type: Date, required: true },
    days: { type: [dayMenuSchema], default: [] },
    published: { type: Boolean, default: false },
    ratings: { type: [ratingSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

messMenuSchema.index({ collegeId: 1, weekStart: -1 });

const MessMenu = model('MessMenu', messMenuSchema);
export default MessMenu;
