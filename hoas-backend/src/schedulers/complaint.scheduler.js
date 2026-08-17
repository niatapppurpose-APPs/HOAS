import { schedule } from './runner.js';
import { autoEscalateComplaints } from '../services/complaint.service.js';

export function startComplaintScheduler() {
  schedule(60 * 60 * 1000, async () => {
    const result = await autoEscalateComplaints();
    if (result.escalated > 0 || result.overdue > 0) {
      console.log('Complaint auto-escalation:', result);
    }
  });
}

export function stopComplaintScheduler() {}