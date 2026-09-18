import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { emitToCollege, emitToHostel, emitToUser } from './socket.service.js';
import { notifyUser } from './notification.service.js';
import { getSettingsOrDefaults } from './capacity.service.js';

export async function computeSlaDeadline() {
  const settings = await getSettingsOrDefaults();
  return new Date(Date.now() + settings.complaintSlaHours * 60 * 60 * 1000);
}

export async function notifyComplaintCreated(complaint) {
  const wardens = await User.find({
    role: 'warden',
    collegeId: complaint.collegeId,
    $or: [{ hostelId: complaint.hostelId }, { _id: complaint.assignedWardenId }],
  });
  for (const warden of wardens) {
    await notifyUser(warden, {
      type: 'complaint_new',
      title: 'New complaint received',
      body: complaint.title,
      data: { complaintId: String(complaint._id) },
    });
  }
  emitToCollege(complaint.collegeId, 'complaint:new', complaint.toJSON());
  emitToHostel(complaint.hostelId, 'complaint:new', complaint.toJSON());
}

export async function notifyComplaintStatusChange(complaint, student, previousStatus) {
  const payload = complaint.toJSON();
  emitToUser(student._id, 'complaint:updated', payload);
  emitToCollege(complaint.collegeId, 'complaint:updated', payload);

  const studentMessage = {
    type: 'complaint_status',
    title: 'Complaint update',
    body: `Your complaint "${complaint.title}" is now ${complaint.status}`,
    data: { complaintId: String(complaint._id), status: complaint.status },
  };

  if (complaint.status === 'warden-resolved') {
    studentMessage.title = 'Complaint resolved — please review';
    studentMessage.body = `Warden resolved "${complaint.title}". Confirm or dispute within 48 hours.`;
  }
  if (complaint.status === 'disputed') {
    const wardens = await User.find({ role: 'warden', collegeId: complaint.collegeId });
    for (const warden of wardens) {
      await notifyUser(warden, {
        type: 'complaint_disputed',
        title: 'Complaint disputed',
        body: `${student.name} disputed "${complaint.title}"`,
        data: { complaintId: String(complaint._id) },
      });
    }
    emitToCollege(complaint.collegeId, 'complaint:disputed', payload);
  }
  if (complaint.status === 'escalated') {
    const management = await User.find({ role: 'management', collegeId: complaint.collegeId });
    for (const manager of management) {
      await notifyUser(manager, {
        type: 'complaint_escalated',
        title: 'Complaint escalated',
        body: complaint.title,
        data: { complaintId: String(complaint._id) },
      });
    }
    emitToCollege(complaint.collegeId, 'complaint:escalated', payload);
  }

  await notifyUser(student, studentMessage);
}

export function appendHistory(complaint, { action, reason = '', previousStatus, newStatus, actor }) {
  complaint.history.push({
    action,
    reason,
    previousStatus,
    newStatus,
    actorId: actor ? actor._id : null,
    actorRole: actor ? actor.role : 'system',
    timestamp: new Date(),
  });
}

export async function autoEscalateComplaints() {
  const settings = await getSettingsOrDefaults();
  if (!settings.autoEscalation) return { escalated: 0, overdue: 0 };

  const slaMs = settings.complaintSlaHours * 60 * 60 * 1000;
  const overdueMs = settings.overdueThresholdHours * 60 * 60 * 1000;
  const now = Date.now();

  let escalated = 0;
  let overdue = 0;

  const stalePending = await Complaint.find({
    status: 'pending',
    createdAt: { $lt: new Date(now - slaMs) },
  });
  for (const complaint of stalePending) {
    await escalate(complaint, 'SLA_EXCEEDED', settings);
    escalated++;
  }

  const staleInProgress = await Complaint.find({
    status: 'in-progress',
    updatedAt: { $lt: new Date(now - slaMs) },
  });
  for (const complaint of staleInProgress) {
    await escalate(complaint, 'SLA_EXCEEDED', settings);
    escalated++;
  }

  const staleDisputed = await Complaint.find({
    status: 'disputed',
    updatedAt: { $lt: new Date(now - slaMs) },
  });
  for (const complaint of staleDisputed) {
    const newStatus = settings.escalateToOwner ? 'escalated' : 'escalated';
    complaint.status = newStatus;
    complaint.studentReviewStatus = 'pending';
    appendHistory(complaint, {
      action: 'AUTO_ESCALATE',
      reason: 'Disputed and warden did not respond within SLA',
      previousStatus: 'disputed',
      newStatus,
    });
    await complaint.save();
    escalated++;
  }

  const openComplaints = await Complaint.find({
    status: { $in: ['pending', 'in-progress', 'warden-resolved', 'disputed'] },
    isOverdue: false,
    createdAt: { $lt: new Date(now - overdueMs) },
  });
  for (const complaint of openComplaints) {
    complaint.isOverdue = true;
    await complaint.save();
    overdue++;
  }

  return { escalated, overdue };
}

async function escalate(complaint, reason, settings) {
  const previousStatus = complaint.status;
  complaint.status = 'escalated';
  appendHistory(complaint, {
    action: 'AUTO_ESCALATE',
    reason,
    previousStatus,
    newStatus: 'escalated',
  });
  await complaint.save();
  const s = typeof settings?.toJSON === 'function' ? settings.toJSON() : settings || {};
  const emailMaster = s.notifications?.email ?? s.emailNotifications ?? true;
  const smsMaster = s.notifications?.sms ?? s.smsNotifications ?? false;
  const emailEsc = s.emailEscalationAlerts ?? true;
  const smsEsc = s.smsEscalationAlerts ?? false;

  const targets = [];
  if (s.escalateToOwner) {
    const owners = await User.find({ role: { $in: ['owner', 'admin'] } });
    targets.push(...owners);
  } else {
    const management = await User.find({ role: 'management', collegeId: complaint.collegeId });
    targets.push(...management);
  }
  for (const target of targets) {
    await notifyUser(target, {
      type: 'complaint_escalated',
      title: s.escalateToOwner ? 'Complaint escalated to you' : 'Complaint escalated',
      body: complaint.title,
      data: { complaintId: String(complaint._id) },
    });
    // Owner → Settings → Complaint & Escalation → Email/SMS Escalation Alerts
    // + Notifications master switches gate these side-channels.
    if (emailEsc && emailMaster && target.email) {
      try {
        const { sendMailAsync } = await import('./email.service.js');
        sendMailAsync({
          to: target.email,
          type: 'complaint_escalated',
          data: {
            userName: target.name || 'Manager',
            complaintTitle: complaint.title,
            complaintId: String(complaint._id),
          },
          subject: `HOAS — Complaint escalated: ${complaint.title}`,
        });
      } catch (err) {
        console.error('[escalation-email-failed]', err.message);
      }
    }
    if (smsEsc && smsMaster && target.phone) {
      // No SMS provider configured — log intent so the toggle is observable.
      console.log(`[sms-escalation] to=${target.phone} complaint=${complaint._id} title=${complaint.title}`);
    }
  }
}