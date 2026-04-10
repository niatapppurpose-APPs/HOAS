/**
 * Outing Utilities - Helper functions and configs
 */

export const outingStatusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: '⏳',
    color: 'yellow',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '✅',
    color: 'blue',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: '❌',
    color: 'red',
  },
  completed: {
    label: 'Completed',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: '📋',
    color: 'gray',
  },
};

export const timingStatusConfig = {
  'on-time': {
    label: 'On Time ✅',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
    color: 'green',
    severity: 'success',
  },
  late: {
    label: 'Late ⚠️',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    color: 'orange',
    severity: 'warning',
  },
  'very-late': {
    label: 'Very Late 🚨',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    color: 'red',
    severity: 'critical',
  },
};

/**
 * Format date for display
 */
export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(time) {
  if (!time) return '';
  const d = time instanceof Date ? time : new Date(time);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(datetime) {
  if (!datetime) return '';
  const d = datetime instanceof Date ? datetime : new Date(datetime);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time difference (duration)
 */
export function formatDuration(start, end) {
  if (!start || !end) return '';

  const startTime = start instanceof Date ? start : new Date(start);
  const endTime = end instanceof Date ? end : new Date(end);

  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate timing status based on actual vs expected return time
 */
export function calculateTimingStatus(expectedReturnTime, actualReturnTime) {
  if (!actualReturnTime) return null;

  const expected = new Date(expectedReturnTime).getTime();
  const actual = new Date(actualReturnTime).getTime();

  if (actual <= expected) {
    return 'on-time';
  }

  const lateMs = actual - expected;
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (lateMs <= twoHoursMs) {
    return 'late';
  }

  return 'very-late';
}

/**
 * Check if an outing is currently overdue
 */
export function isOutingOverdue(expectedReturnTime) {
  if (!expectedReturnTime) return false;
  return new Date() > new Date(expectedReturnTime);
}

/**
 * Check if an outing is very late (more than 2 hours)
 */
export function isOutingVeryLate(expectedReturnTime) {
  if (!expectedReturnTime) return false;
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const diffMs = new Date().getTime() - new Date(expectedReturnTime).getTime();
  return diffMs > twoHoursMs;
}

/**
 * Get time until outing should return
 */
export function getTimeUntilReturn(expectedReturnTime) {
  if (!expectedReturnTime) return '';

  const expected = new Date(expectedReturnTime);
  const now = new Date();
  const diffMs = expected.getTime() - now.getTime();

  if (diffMs < 0) {
    return 'Overdue';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m remaining`;
  if (minutes === 0) return `${hours}h remaining`;
  return `${hours}h ${minutes}m remaining`;
}

/**
 * Get time late
 */
export function getTimeLate(expectedReturnTime) {
  if (!expectedReturnTime) return '';

  const expected = new Date(expectedReturnTime);
  const now = new Date();
  const diffMs = now.getTime() - expected.getTime();

  if (diffMs < 0) {
    return '';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m late`;
  if (minutes === 0) return `${hours}h late`;
  return `${hours}h ${minutes}m late`;
}

/**
 * Format outing details for display
 */
export function formatOutingDetails(outing) {
  return {
    destination: outing.destination || 'Unknown',
    reason: outing.reason || 'No reason provided',
    outTime: formatDateTime(outing.outTime),
    expectedReturnTime: formatDateTime(outing.expectedReturnTime),
    actualReturnTime: formatDateTime(outing.actualReturnTime),
    status: outing.status,
    timingStatus: outing.timingStatus,
  };
}

/**
 * Get status badge config
 */
export function getStatusConfig(status, type = 'status') {
  if (type === 'timing') {
    return timingStatusConfig[status] || timingStatusConfig['on-time'];
  }
  return outingStatusConfig[status] || outingStatusConfig.pending;
}

/**
 * Validate outing form data
 */
export function validateOutingForm(formData) {
  const errors = [];

  if (!formData.destination || formData.destination.trim().length === 0) {
    errors.push('Destination is required');
  }

  if (!formData.reason || formData.reason.trim().length === 0) {
    errors.push('Reason is required');
  }

  if (!formData.outTime) {
    errors.push('Out time is required');
  } else {
    const outTime = new Date(formData.outTime);
    if (isNaN(outTime.getTime())) {
      errors.push('Invalid out time format');
    } else if (outTime < new Date()) {
      errors.push('Out time cannot be in the past');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate approval form data
 */
export function validateApprovalForm(expectedReturnTime, outTime) {
  const errors = [];

  if (!expectedReturnTime) {
    errors.push('Expected return time is required');
  } else {
    const returnTime = new Date(expectedReturnTime);
    if (isNaN(returnTime.getTime())) {
      errors.push('Invalid return time format');
    } else {
      const out = new Date(outTime);
      if (returnTime <= out) {
        errors.push('Expected return time must be after out time');
      }

      // Check within 24 hours
      const maxReturnTime = out.getTime() + 24 * 60 * 60 * 1000;
      if (returnTime.getTime() > maxReturnTime) {
        errors.push('Expected return time must be within 24 hours of out time');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Group outings by status
 */
export function groupOutingsByStatus(outings) {
  return {
    pending: outings.filter(o => o.status === 'pending'),
    approved: outings.filter(o => o.status === 'approved'),
    completed: outings.filter(o => o.status === 'completed'),
    rejected: outings.filter(o => o.status === 'rejected'),
  };
}

/**
 * Calculate late entry statistics
 */
export function calculateLateStatistics(outings) {
  const completed = outings.filter(o => o.status === 'completed');

  if (completed.length === 0) {
    return {
      total: 0,
      onTime: 0,
      late: 0,
      veryLate: 0,
      onTimePercent: 0,
      latePercent: 0,
      veryLatePercent: 0,
    };
  }

  const onTime = completed.filter(o => o.timingStatus === 'on-time').length;
  const late = completed.filter(o => o.timingStatus === 'late').length;
  const veryLate = completed.filter(o => o.timingStatus === 'very-late').length;

  return {
    total: completed.length,
    onTime,
    late,
    veryLate,
    onTimePercent: ((onTime / completed.length) * 100).toFixed(1),
    latePercent: ((late / completed.length) * 100).toFixed(1),
    veryLatePercent: ((veryLate / completed.length) * 100).toFixed(1),
  };
}

/**
 * Find active outing (pending or approved)
 */
export function getActiveOuting(outings) {
  return outings.find(o => o.status === 'pending' || o.status === 'approved');
}

/**
 * Sort outings by date (newest first)
 */
export function sortOutingsByDate(outings) {
  return [...outings].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}

/**
 * Convert datetime-local input format to ISO string
 */
export function datetimeLocalToISO(datetimeLocal) {
  if (!datetimeLocal) return null;
  return new Date(datetimeLocal).toISOString();
}

/**
 * Convert ISO string to datetime-local input format
 */
export function ISOToDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${date}T${hours}:${minutes}`;
}

/**
 * Get minimum datetime for out time (now)
 */
export function getMinOutTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${date}T${hours}:${minutes}`;
}

/**
 * Get maximum datetime for expected return time (24 hours from out time)
 */
export function getMaxReturnTime(outTime) {
  if (!outTime) return '';
  const out = new Date(outTime);
  const max = new Date(out.getTime() + 24 * 60 * 60 * 1000);
  const year = max.getFullYear();
  const month = String(max.getMonth() + 1).padStart(2, '0');
  const date = String(max.getDate()).padStart(2, '0');
  const hours = String(max.getHours()).padStart(2, '0');
  const minutes = String(max.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${date}T${hours}:${minutes}`;
}
