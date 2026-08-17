import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'management', 'warden', 'student', 'unknown'], required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'suspended'],
      default: 'pending',
      index: true,
    },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', index: true },
    hostelBlock: String,
    collegeName: String,
    studentId: String,
    rollNumber: String,
    idNumber: String,
    wardenId: { type: Schema.Types.ObjectId, ref: 'User' },
    phone: String,
    address: String,
    avatarUrl: String,
    logoUrl: String,
    location: { lat: Number, lng: Number },
    feeDetails: {
      totalFee: { type: Number, default: 0 },
      paidFee: { type: Number, default: 0 },
      pendingFee: { type: Number, default: 0 },
    },
    fcmToken: String,
    notificationPrefs: { type: Schema.Types.Mixed, default: {} },
    approvedAt: Date,
    approvedBy: String,
    approverRole: String,
    deniedAt: Date,
    deniedBy: String,
    denialReason: String,
    lastPasswordResetAt: Date,
    bulkUploaded: { type: Boolean, default: false },
    managementVerification: { type: String, enum: ['Verify', 'Verified', 'Not Verified'], default: 'Not Verified' },
    wardenVerification: { type: String, enum: ['Verify', 'Verified', 'Not Verified'], default: 'Not Verified' },
    unverifyReason: String,
    paymentProofUrl: String,
    pwaUpdateMode: String,
    tourCompleted: Boolean,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ collegeId: 1, role: 1 });
userSchema.index({ hostelId: 1, role: 1 });

const User = model('User', userSchema);
export default User;
