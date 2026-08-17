import { schedule } from './runner.js';
import User from '../models/User.js';
import { notifyUser } from '../services/notification.service.js';
import { sendMail } from '../services/email.service.js';
import { getSettingsOrDefaults } from '../services/capacity.service.js';

export async function autoVerifyFees() {
  const settings = await getSettingsOrDefaults();
  if (!settings.features?.feesAutoVerify) return { warned: 0, autoVerified: 0 };

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const warningCutoff = new Date(Date.now() - 23 * 60 * 60 * 1000);

  const candidates = await User.find({
    role: 'student',
    status: 'approved',
    'feeDetails.paidFee': { $gt: 0 },
    unverifyReason: { $exists: false },
  });

  let warned = 0;
  let autoVerified = 0;

  for (const student of candidates) {
    const pendingManagement = student.managementVerification !== 'Verified';
    const pendingWarden = student.wardenVerification !== 'Verified';
    if (!pendingManagement && !pendingWarden) continue;

    const updatedAt = student.updatedAt || student.createdAt;
    if (pendingManagement && updatedAt < cutoff) {
      student.managementVerification = 'Verified';
      student.wardenVerification = 'Verified';
      await student.save();
      autoVerified++;
    } else if (pendingManagement && updatedAt < warningCutoff) {
      const management = await User.findOne({ role: 'management', collegeId: student.collegeId });
      if (management) {
        await notifyUser(management, {
          type: 'fee_verify_reminder',
          title: 'Student fees pending verification',
          body: `${student.name} has paid fees awaiting verification for 23+ hours`,
          data: { studentId: String(student._id) },
        });
        if (management.email) {
          await sendMail({
            to: management.email,
            subject: 'HOAS — Fee verification pending',
            html: `<p>Fees for <strong>${student.name}</strong> (${student.studentId || student.email}) are awaiting verification for over 23 hours.</p>`,
          }).catch(() => {});
        }
        warned++;
      }
    }
  }

  return { warned, autoVerified };
}

export function startFeeScheduler() {
  schedule(60 * 60 * 1000, async () => {
    const result = await autoVerifyFees();
    if (result.autoVerified > 0 || result.warned > 0) console.log('Fee auto-verification:', result);
  });
}

export function stopFeeScheduler() {}