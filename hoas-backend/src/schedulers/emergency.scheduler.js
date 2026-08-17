import { schedule } from './runner.js';
import EmergencyLocation from '../models/EmergencyLocation.js';
import LocationHistory from '../models/LocationHistory.js';

export async function cleanupEmergencyLocations() {
  const staleCutoff = new Date(Date.now() - 120 * 60 * 1000);
  const historyCutoff = new Date(Date.now() - 180 * 60 * 1000);

  const staleSessions = await EmergencyLocation.find({
    isActive: true,
    lastUpdateAt: { $lt: staleCutoff },
  });
  for (const session of staleSessions) {
    session.isActive = false;
    session.stoppedAt = new Date();
    await session.save();
  }

  const deletedHistory = await LocationHistory.deleteMany({ createdAt: { $lt: historyCutoff } });

  return { deactivated: staleSessions.length, deletedHistory: deletedHistory.deletedCount };
}

export function startEmergencyScheduler() {
  schedule(30 * 60 * 1000, async () => {
    const result = await cleanupEmergencyLocations();
    if (result.deactivated > 0) console.log('Emergency location cleanup:', result);
  });
}

export function stopEmergencyScheduler() {}