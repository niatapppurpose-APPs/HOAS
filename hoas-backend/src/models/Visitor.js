import { Schema, model } from 'mongoose';

// Visitor Management — digitized gate register.
// Students pre-register guests (pending → warden approves on arrival).
// Wardens log walk-ins directly (straight to checked-in).
const visitorSchema = new Schema(
  {
    visitorName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    purpose: { type: String, required: true, trim: true, maxlength: 300 },
    meetPersonName: { type: String, trim: true, maxlength: 100 },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    hostelBlock: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'checked-in', 'checked-out', 'denied'],
      default: 'pending',
      index: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkedInAt: Date,
    checkedOutAt: Date,
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

visitorSchema.index({ collegeId: 1, status: 1 });
visitorSchema.index({ studentId: 1 });

const Visitor = model('Visitor', visitorSchema);
export default Visitor;
