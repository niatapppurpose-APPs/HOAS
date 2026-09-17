import { schedule } from './runner.js';
import { autoEscalateComplaints } from '../services/complaint.service.js';

export function startComplaintScheduler() {
  schedule(60 * 60 * 1000, async () => {
    await autoEscalateComplaints();
  });
}

export function stopComplaintScheduler() {}