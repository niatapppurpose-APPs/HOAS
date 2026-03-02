/* ── Warden Complaints – Constants & Helpers ── */

export const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'warden-status-pending' },
  'in-progress': { label: 'In Progress', className: 'warden-status-in-progress' },
  'warden-resolved': { label: 'Awaiting Student Review', className: 'warden-status-warden-resolved' },
  resolved: { label: 'Resolved', className: 'warden-status-resolved' },
  rejected: { label: 'Rejected', className: 'warden-status-rejected' },
  disputed: { label: 'DISPUTED', className: 'warden-status-disputed' },
  escalated: { label: 'Escalated to Management', className: 'warden-status-escalated' },
};

export const CATEGORIES = [
  { value: 'maintenance', label: '🔧 Maintenance & Repairs' },
  { value: 'cleanliness', label: '🧹 Cleanliness & Hygiene' },
  { value: 'electrical', label: '⚡ Electrical Issues' },
  { value: 'plumbing', label: '🚿 Plumbing & Water' },
  { value: 'food', label: '🍽️ Food & Mess' },
  { value: 'security', label: '🔒 Security Concerns' },
  { value: 'noise', label: '🔊 Noise Disturbance' },
  { value: 'internet', label: '📶 Internet & WiFi' },
  { value: 'furniture', label: '🪑 Furniture Issues' },
  { value: 'other', label: '📌 Other' },
];

export const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'disputed', label: '🚩 Disputed' },
  { value: 'warden-resolved', label: 'Awaiting Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'rejected', label: 'Rejected' },
];

export const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getCategoryLabel = (value) => {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
};
