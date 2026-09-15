/**
 * Search Data & Scopes for HOAS Dashboards
 * Dedicated search scopes for Student, Warden, Management, Principal, and Owner portals.
 */

export const SEARCH_SCOPES = {
  student: {
    name: 'Student Portal',
    badge: 'Student',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    placeholder: 'Search fees, complaints, leave, SOS, rooms, FAQs...',
    categories: ['All', 'Navigation', 'Actions', 'Help', 'Safety'],
    quickActions: [
      { id: 'act-complaint', label: 'File a Complaint', desc: 'Report maintenance, electrical or mess issues', path: '/dashboard/student/complaints', actionType: 'navigate', icon: 'AlertCircle', category: 'Actions' },
      { id: 'act-leave', label: 'Request Leave / Outing', desc: 'Apply for weekend pass or emergency leave', path: '/dashboard/student/leave', actionType: 'navigate', icon: 'Calendar', category: 'Actions' },
      { id: 'act-fees', label: 'Upload Fee Payment Proof', desc: 'Submit bank transfer or UPI receipt', path: '/dashboard/student/fees', actionType: 'navigate', icon: 'Receipt', category: 'Actions' },
      { id: 'act-sos', label: 'Trigger Emergency SOS', desc: 'Broadcast live coordinates to hostel wardens', path: '/dashboard/student/emergency-location', actionType: 'navigate', icon: 'ShieldAlert', category: 'Safety' },
    ],
    items: [
      { id: 'p-dash', title: 'Student Dashboard', subtitle: 'Overview, attendance, and recent updates', path: '/dashboard/student', category: 'Navigation', icon: 'LayoutDashboard' },
      { id: 'p-fees', title: 'Fee Overview & Receipts', subtitle: 'Hostel dues, fee structures, and verified receipts', path: '/dashboard/student/fees', category: 'Navigation', icon: 'CreditCard' },
      { id: 'p-complaints', title: 'Complaints Status', subtitle: 'Track submitted issues and warden resolutions', path: '/dashboard/student/complaints', category: 'Navigation', icon: 'MessageSquare' },
      { id: 'p-leave', title: 'Leave & Gate Pass', subtitle: 'Leave application history and approval status', path: '/dashboard/student/leave', category: 'Navigation', icon: 'CalendarCheck' },
      { id: 'p-emergency', title: 'Emergency SOS Broadcast', subtitle: 'Real-time GPS emergency location sharing', path: '/dashboard/student/emergency-location', category: 'Safety', icon: 'ShieldAlert' },
      { id: 'p-profile', title: 'My Student Profile', subtitle: 'Room number, block, contact info, and guardian details', path: '/dashboard/student/profile', category: 'Navigation', icon: 'User' },
      { id: 'p-settings', title: 'Account Settings', subtitle: 'Security, notification preferences, and password', path: '/dashboard/student/settings', category: 'Navigation', icon: 'Settings' },
      { id: 'p-help', title: 'Help & Support / FAQs', subtitle: 'Frequently asked questions and support tickets', path: '/dashboard/student/help', category: 'Help', icon: 'HelpCircle' },
      { id: 'f-mess', title: 'Mess Menu & Food Feedback', subtitle: 'Check weekly meal schedule and raise food issues', path: '/dashboard/student/complaints', category: 'Navigation', icon: 'Utensils' },
      { id: 'f-faq-leave', title: 'FAQ: How long does leave approval take?', subtitle: 'Typically approved within 2-4 hours by your block warden', path: '/dashboard/student/help', category: 'Help', icon: 'HelpCircle' },
      { id: 'f-faq-wifi', title: 'FAQ: Campus Wi-Fi & Maintenance issues', subtitle: 'Raise an urgent maintenance ticket under Complaints', path: '/dashboard/student/help', category: 'Help', icon: 'HelpCircle' },
    ],
  },

  warden: {
    name: 'Warden Portal',
    badge: 'Warden',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    placeholder: 'Search students, leave approvals, complaints, emergency map...',
    categories: ['All', 'Navigation', 'Actions', 'Records', 'Emergency'],
    quickActions: [
      { id: 'act-approve-leave', label: 'Review Leave Requests', desc: 'Inspect and approve student gate passes', path: '/dashboard/warden/leave-requests', actionType: 'navigate', icon: 'CalendarCheck', category: 'Actions' },
      { id: 'act-view-complaints', label: 'Pending Complaints Queue', desc: 'Resolve open hostel maintenance issues', path: '/dashboard/warden/complaints', actionType: 'navigate', icon: 'AlertTriangle', category: 'Actions' },
      { id: 'act-sos-monitor', label: 'Open Live Emergency Map', desc: 'Track active SOS locations and student beacons', path: '/dashboard/warden/emergency-location', actionType: 'navigate', icon: 'Radio', category: 'Emergency' },
      { id: 'act-verify-fees', label: 'Verify Fee Submissions', desc: 'Review student payment proofs for your block', path: '/dashboard/warden/fees', actionType: 'navigate', icon: 'CheckCircle2', category: 'Actions' },
    ],
    items: [
      { id: 'w-dash', title: 'Warden Dashboard', subtitle: 'Occupancy overview, daily alerts, and quick stats', path: '/dashboard/warden', category: 'Navigation', icon: 'LayoutDashboard' },
      { id: 'w-students', title: 'Student Directory', subtitle: 'Filter by block, room, year, and search roster', path: '/dashboard/warden/students', category: 'Records', icon: 'Users' },
      { id: 'w-leave', title: 'Leave & Gate Pass Management', subtitle: 'Approve, reject, or extend student leaves', path: '/dashboard/warden/leave-requests', category: 'Records', icon: 'Calendar' },
      { id: 'w-complaints', title: 'Hostel Complaints Resolution', subtitle: 'Assign technicians and mark issues resolved', path: '/dashboard/warden/complaints', category: 'Records', icon: 'MessageSquare' },
      { id: 'w-fees', title: 'Fee Verification Desk', subtitle: 'Confirm bank transactions and validate receipts', path: '/dashboard/warden/fees', category: 'Records', icon: 'Receipt' },
      { id: 'w-emergency', title: 'Live Emergency Monitor', subtitle: 'Real-time GPS tracker with siren controls', path: '/dashboard/warden/emergency-location', category: 'Emergency', icon: 'ShieldAlert' },
      { id: 'w-rooms', title: 'Room Allotment & Beds', subtitle: 'Block vacancy and bed allocation matrix', path: '/dashboard/warden/rooms', category: 'Records', icon: 'Home' },
      { id: 'w-profile', title: 'Warden Profile', subtitle: 'Assigned blocks, phone number, and duty hours', path: '/dashboard/warden/profile', category: 'Navigation', icon: 'User' },
      { id: 'w-help', title: 'Warden Help & Guidelines', subtitle: 'Hostel standard operating procedures and support', path: '/dashboard/warden/help', category: 'Navigation', icon: 'HelpCircle' },
    ],
  },

  management: {
    name: 'Management Portal',
    badge: 'Management',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    placeholder: 'Search hostels, wardens, financial reports, fees, analytics...',
    categories: ['All', 'Navigation', 'Actions', 'Reports', 'Settings'],
    quickActions: [
      { id: 'act-add-hostel', label: 'Add New Hostel / Block', desc: 'Create hostel structure, floors, and rooms', path: '/dashboard/management/hostels', actionType: 'navigate', icon: 'Building2', category: 'Actions' },
      { id: 'act-fee-report', label: 'Generate Fee Audit Report', desc: 'Download collection breakdown and dues in PDF/Excel', path: '/dashboard/management/reports', actionType: 'navigate', icon: 'FileSpreadsheet', category: 'Reports' },
      { id: 'act-manage-wardens', label: 'Warden Roster & Allocation', desc: 'Assign wardens to blocks and update credentials', path: '/dashboard/management/wardens', actionType: 'navigate', icon: 'UserCheck', category: 'Actions' },
      { id: 'act-emergency-audit', label: 'Emergency Response Logs', desc: 'Audit incident response times and coordinates', path: '/dashboard/management/emergency-location', actionType: 'navigate', icon: 'Shield', category: 'Navigation' },
    ],
    items: [
      { id: 'm-dash', title: 'Management Overview', subtitle: 'High-level KPIs, revenue collection, and capacity', path: '/dashboard/management', category: 'Navigation', icon: 'LayoutDashboard' },
      { id: 'm-hostels', title: 'Hostels & Room Management', subtitle: 'Configure blocks, room types, amenities, and fees', path: '/dashboard/management/hostels', category: 'Navigation', icon: 'Building2' },
      { id: 'm-students', title: 'Master Student Registry', subtitle: 'All college residents, fee balances, and records', path: '/dashboard/management/students', category: 'Navigation', icon: 'GraduationCap' },
      { id: 'm-wardens', title: 'Warden Management', subtitle: 'Approve, assign, or reallocate warden staff', path: '/dashboard/management/wardens', category: 'Navigation', icon: 'ShieldCheck' },
      { id: 'm-fees', title: 'Fee Management & Collections', subtitle: 'Set tariffs, track pending dues, and verify audits', path: '/dashboard/management/reports', category: 'Navigation', icon: 'CreditCard' },
      { id: 'm-reports', title: 'Financial & Occupancy Reports', subtitle: 'Export analytical summaries and monthly balance sheets', path: '/dashboard/management/reports', category: 'Reports', icon: 'BarChart3' },
      { id: 'm-emergency', title: 'Emergency Response Center', subtitle: 'Campus-wide distress monitoring and warden logs', path: '/dashboard/management/emergency-location', category: 'Navigation', icon: 'Radio' },
      { id: 'm-settings', title: 'Campus Configuration & Settings', subtitle: 'College branding, email templates, and integrations', path: '/dashboard/management/settings', category: 'Settings', icon: 'Sliders' },
      { id: 'm-help', title: 'Help & Knowledge Base', subtitle: 'Management user guides and technical contact', path: '/dashboard/management/help', category: 'Navigation', icon: 'HelpCircle' },
    ],
  },

  principal: {
    name: 'Principal Portal',
    badge: 'Principal',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    placeholder: 'Search institutional KPIs, occupancy, discipline, audits...',
    categories: ['All', 'Navigation', 'Actions', 'Audits', 'Analytics'],
    quickActions: [
      { id: 'act-occupancy', label: 'View Campus Occupancy KPIs', desc: 'Check block-by-block density and vacancies', path: '/dashboard', actionType: 'navigate', icon: 'TrendingUp', category: 'Analytics' },
      { id: 'act-escalations', label: 'Discipline & Escalated Complaints', desc: 'Inspect serious incidents and warden escalation notes', path: '/dashboard', actionType: 'navigate', icon: 'AlertTriangle', category: 'Audits' },
      { id: 'act-audit-download', label: 'Export Executive Audit', desc: 'Download complete college hostel executive summary', path: '/dashboard', actionType: 'navigate', icon: 'Download', category: 'Actions' },
    ],
    items: [
      { id: 'pr-dash', title: 'Executive Overview', subtitle: 'Campus occupancy, active wardens, and overall metrics', path: '/dashboard', category: 'Navigation', icon: 'Crown' },
      { id: 'pr-wardens', title: 'Chief Warden & Staff Directory', subtitle: 'Inspect active hostel supervisory personnel', path: '/dashboard', category: 'Navigation', icon: 'Shield' },
      { id: 'pr-students', title: 'Student Population Registry', subtitle: 'Institutional enrollment by department and block', path: '/dashboard', category: 'Navigation', icon: 'GraduationCap' },
      { id: 'pr-emergency', title: 'Safety & Incident Logs', subtitle: 'Review historical emergency records and response times', path: '/dashboard', category: 'Audits', icon: 'ShieldAlert' },
    ],
  },

  owner: {
    name: 'Owner Super-Admin Portal',
    badge: 'Super Owner',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    placeholder: 'Search colleges, multi-campus metrics, provisioning, security...',
    categories: ['All', 'Navigation', 'Actions', 'System', 'Colleges'],
    quickActions: [
      { id: 'act-add-college', label: 'Register New College / Institution', desc: 'Provision new university tenant and assign initial admin', path: '/OwnersDashboard/access-requests', actionType: 'navigate', icon: 'PlusCircle', category: 'Actions' },
      { id: 'act-sys-health', label: 'Cloud Functions & Server Health', desc: 'Inspect database latency, email function, and sockets', path: '/OwnersDashboard/settings', actionType: 'navigate', icon: 'Activity', category: 'System' },
      { id: 'act-audit-logs', label: 'Global Audit Trail', desc: 'Inspect cross-institution security events and logins', path: '/OwnersDashboard/reports', actionType: 'navigate', icon: 'FileText', category: 'System' },
    ],
    items: [
      { id: 'o-dash', title: 'Owner Central Command', subtitle: 'Multi-campus health, total revenue, and server heartbeat', path: '/OwnersDashboard', category: 'Navigation', icon: 'Crown' },
      { id: 'o-colleges', title: 'Colleges & Institutions', subtitle: 'Manage registered tenant colleges and admin accounts', path: '/OwnersDashboard/access-requests', category: 'Colleges', icon: 'Building' },
      { id: 'o-analytics', title: 'Global Platform Analytics', subtitle: 'Cross-college growth, occupancy patterns, and traffic', path: '/OwnersDashboard/analytics', category: 'Navigation', icon: 'LineChart' },
      { id: 'o-system', title: 'System Infrastructure', subtitle: 'Edge functions status, SMTP gateway, and push services', path: '/OwnersDashboard/settings', category: 'System', icon: 'Server' },
      { id: 'o-audit', title: 'Security & Audit Logs', subtitle: 'Super-admin activity logs and security alerts', path: '/OwnersDashboard/reports', category: 'System', icon: 'Lock' },
      { id: 'o-profile', title: 'Owner Profile & Master Key', subtitle: 'Security credentials and global notifications', path: '/OwnersDashboard/profile', category: 'Navigation', icon: 'UserCog' },
    ],
  },
};
