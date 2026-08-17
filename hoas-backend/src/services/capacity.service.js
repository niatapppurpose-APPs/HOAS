import User from '../models/User.js';
import Hostel from '../models/Hostel.js';
import College from '../models/College.js';
import SystemSetting from '../models/SystemSetting.js';
import { canManageCollege } from '../utils/scope.js';
import { AppError } from '../utils/AppError.js';

export async function getSettingsOrDefaults() {
  let settings = await SystemSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await SystemSetting.create({ key: 'global' });
  }
  return settings;
}

export async function checkCollegeCapacity(user, collegeId, entityType = 'student') {
  const settings = await getSettingsOrDefaults();
  const college = await College.findById(collegeId);
  if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND');
  if (!canManageCollege(user, collegeId) && user.role !== 'warden' && !String(user.collegeId) === String(collegeId)) {
    throw new AppError(403, 'FORBIDDEN');
  }

  const maxByType = {
    student: settings.limits.maxStudentsPerCollege,
    warden: settings.limits.maxWardensPerCollege,
    hostel: settings.limits.maxHostelsPerCollege,
  };

  const countByType = {
    student: await User.countDocuments({ collegeId, role: 'student' }),
    warden: await User.countDocuments({ collegeId, role: 'warden' }),
    hostel: await Hostel.countDocuments({ collegeId }),
  };

  const max = maxByType[entityType];
  const count = countByType[entityType];
  const allowed = count < max;

  return {
    allowed,
    count,
    max,
    remaining: Math.max(0, max - count),
    message: allowed ? '' : `${entityType} limit reached for this college (${max})`,
  };
}