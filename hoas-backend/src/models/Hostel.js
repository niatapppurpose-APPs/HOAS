import { Schema, model } from 'mongoose';

const hostelSchema = new Schema(
  {
    name: { type: String, required: true },
    block: String,
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    wardenId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    capacity: { type: Number, default: 0 },
    address: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hostelSchema.index({ collegeId: 1, name: 1 }, { unique: true });

const Hostel = model('Hostel', hostelSchema);
export default Hostel;