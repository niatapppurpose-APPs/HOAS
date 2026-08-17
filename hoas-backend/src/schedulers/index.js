import { stopAll } from './runner.js';
import { startComplaintScheduler } from './complaint.scheduler.js';
import { startOutingScheduler } from './outing.scheduler.js';
import { startReminderScheduler } from './reminder.scheduler.js';
import { startAnnouncementScheduler } from './announcement.scheduler.js';
import { startFeeScheduler } from './fee.scheduler.js';
import { startEmergencyScheduler } from './emergency.scheduler.js';
import { startRenderKeeperScheduler } from './render-keeper.scheduler.js';

export function startSchedulers() {
  startComplaintScheduler();
  startOutingScheduler();
  startReminderScheduler();
  startAnnouncementScheduler();
  startFeeScheduler();
  startEmergencyScheduler();
  startRenderKeeperScheduler();
}

export function stopSchedulers() {
  stopAll();
}