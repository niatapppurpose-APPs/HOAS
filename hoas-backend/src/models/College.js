import { Schema, model } from 'mongoose';

const collegeSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    location: { lat: Number, lng: Number },
    address: String,
    logoUrl: String,
    managementId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'approved' },
  },
  { timestamps: true }
);

const College = model('College', collegeSchema);
export default College;