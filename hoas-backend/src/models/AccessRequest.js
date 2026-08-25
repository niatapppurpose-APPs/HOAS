import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema(
  {
    orgName: { type: String, required: true, trim: true, maxlength: 200 },
    contactPerson: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 100 },
    studentCount: { type: Number, min: 0, max: 1000000 },
    hostelCount: { type: Number, min: 0, max: 10000 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'account_created'],
      default: 'pending',
    },
    reviewNotes: { type: String, trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    createdUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  },
  { timestamps: true }
);

accessRequestSchema.index({ status: 1, createdAt: -1 });
accessRequestSchema.index({ email: 1 });

export default mongoose.model('AccessRequest', accessRequestSchema);
