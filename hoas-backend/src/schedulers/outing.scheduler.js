import { schedule } from './runner.js';
import Outing from '../models/Outing.js';
import User from '../models/User.js';
import { notifyUser } from '../services/notification.service.js';
import { emitToCollege } from '../services/socket.service.js';

export async function autoMarkLateOutings() {
  const now = new Date();
  const lateOutings = await Outing.find({
    status: 'approved',
    expectedReturnTime: { $lt: now },
    notificationSent: false,
  });

  for (const outing of lateOutings) {
    const hoursLate = (now - outing.expectedReturnTime) / (60 * 60 * 1000);
    outing.status = 'completed';
    outing.actualReturnTime = now;
    outing.timingStatus = hoursLate > 2 ? 'very-late' : 'late';
    outing.autoMarkedLate = true;
    outing.notificationSent = true;
    await outing.save();

    const warden = await User.findById(outing.wardenId);
    if (warden) {
      await notifyUser(warden, {
        type: 'outing_late',
        title: outing.timingStatus === 'very-late' ? 'Student very late' : 'Student late',
        body: `Outing to "${outing.destination}" auto-marked ${outing.timingStatus}`,
        data: { outingId: String(outing._id) },
      });
    }
    emitToCollege(outing.collegeId, 'outing:updated', outing.toJSON());
  }

  return { processed: lateOutings.length };
}

export function startOutingScheduler() {
  schedule(10 * 60 * 1000, async () => {
    const result = await autoMarkLateOutings();
    if (result.processed > 0) console.log('Auto-marked late outings:', result);
  });
}

export function stopOutingScheduler() {}