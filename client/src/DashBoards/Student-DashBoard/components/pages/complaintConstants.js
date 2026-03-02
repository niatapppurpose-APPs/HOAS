import {
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    ShieldAlert,
} from 'lucide-react';

// ── Complaint Categories ─────────────────────────────────────
export const CATEGORIES = [
    { value: '', label: 'Select a category…' },
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

export const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        className: 'complaint-status-pending',
        icon: Clock,
    },
    'in-progress': {
        label: 'In Progress',
        className: 'complaint-status-in-progress',
        icon: Loader2,
    },
    'warden-resolved': {
        label: 'Review Required',
        className: 'complaint-status-review',
        icon: AlertTriangle,
    },
    resolved: {
        label: 'Resolved',
        className: 'complaint-status-resolved',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        className: 'complaint-status-rejected',
        icon: XCircle,
    },
    disputed: {
        label: 'Disputed',
        className: 'complaint-status-disputed',
        icon: ShieldAlert,
    },
    escalated: {
        label: 'Escalated to Management',
        className: 'complaint-status-escalated',
        icon: AlertTriangle,
    },
};

export const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'warden-resolved', label: 'Review Required' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'rejected', label: 'Rejected' },
];

// ── Helpers ──────────────────────────────────────────────────
export const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const getCategoryLabel = (value) => {
    const cat = CATEGORIES.find((c) => c.value === value);
    return cat ? cat.label : value;
};
